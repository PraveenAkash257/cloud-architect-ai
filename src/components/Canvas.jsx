import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CloudNode from "./CloudNode";
import RegionGroupNode from "./RegionGroupNode";
import AnalysisPanel from "./AnalysisPanel";
import { getComponentMeta } from "../data/componentTypes";
import { simulateFailure, detectFailurePoints, SIM_STATE } from "../utils/simulateFailure";
import { toCanonicalArchitecture } from "../utils/architecture";
import { buildFallbackExplanation, requestAiExplanation, validateAiExplanation } from "../utils/aiExplain";

const nodeTypes = { cloudNode: CloudNode, regionGroup: RegionGroupNode };
let idCounter = 1;
const getId = () => `node_${idCounter++}`;

// Rough footprint of a CloudNode used only to size the region/AZ grouping
// boxes drawn behind components. Not related to graph traversal in any way.
const NODE_WIDTH = 190;
const NODE_HEIGHT = 100;
const GROUP_PADDING = 34;

/**
 * Derives non-canonical, purely visual "region group" boxes from the
 * current node positions. Grouped by AZ when a node has one set, otherwise
 * by region. Recomputed on every render — never stored as graph state, so
 * it can never affect (or be affected by) the failure simulation.
 */
function computeRegionGroups(nodes) {
  const groups = new Map();
  for (const n of nodes) {
    const region = n.data?.region;
    if (!region) continue;
    const az = n.data?.az;
    const key = az || `${region}::region-only`;
    if (!groups.has(key)) {
      groups.set(key, { key, region, az, minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    }
    const g = groups.get(key);
    g.minX = Math.min(g.minX, n.position.x);
    g.minY = Math.min(g.minY, n.position.y);
    g.maxX = Math.max(g.maxX, n.position.x + NODE_WIDTH);
    g.maxY = Math.max(g.maxY, n.position.y + NODE_HEIGHT);
  }

  return [...groups.values()].map((g) => ({
    id: `group_${g.key}`,
    type: "regionGroup",
    position: { x: g.minX - GROUP_PADDING, y: g.minY - GROUP_PADDING },
    draggable: false,
    selectable: false,
    connectable: false,
    zIndex: -1,
    data: {
      region: g.region,
      label: g.az || g.region,
      width: g.maxX - g.minX + GROUP_PADDING * 2,
      height: g.maxY - g.minY + GROUP_PADDING * 2,
    },
  }));
}

function CanvasInner({ onExport }) {
  const wrapperRef = useRef(null);
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const [entryPointId, setEntryPointId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [validationMessage, setValidationMessage] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [riskScan, setRiskScan] = useState(null);
  const [riskScanMessage, setRiskScanMessage] = useState(null);

  // A stable click handler stored on every node's data. It never closes
  // over nodes/edges/entryPoint, so it never needs to be recreated or
  // reference itself while being declared.
  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
  }, []);

  const applyNodeMeta = useCallback(
    (nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, nodeId: n.id, onNodeClick: handleNodeClick },
      })),
    [handleNodeClick]
  );

  const clearSimulationStyling = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: undefined } })));
    setEdges((eds) => eds.map((e) => ({ ...e, style: undefined, animated: true })));
  }, [setNodes, setEdges]);

  const resetSimulation = useCallback(() => {
    setSimResult(null);
    setValidationMessage(null);
    setExplanation(null);
    clearSimulationStyling();
  }, [clearSimulationStyling]);

  // Section 18: any topology edit (new/removed node or edge) or entry-point
  // change, made while a simulation is active, clears the now-stale
  // FAILED/UNREACHABLE styling. This runs at the point of mutation rather
  // than in an effect, so it never triggers a cascading render.
  const clearRiskScan = useCallback(() => {
    setRiskScan(null);
    setRiskScanMessage(null);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, atRisk: false } })));
  }, [setNodes]);

  const clearStaleSimIfActive = useCallback(() => {
    if (simResult) resetSimulation();
    if (riskScan) clearRiskScan();
  }, [simResult, resetSimulation, riskScan, clearRiskScan]);

  const onConnect = useCallback(
    (params) => {
      clearStaleSimIfActive();
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges, clearStaleSimIfActive]
  );

  const onNodesChange = useCallback(
    (changes) => {
      if (changes.some((c) => c.type === "remove")) clearStaleSimIfActive();
      onNodesChangeBase(changes);
    },
    [onNodesChangeBase, clearStaleSimIfActive]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      if (changes.some((c) => c.type === "remove")) clearStaleSimIfActive();
      onEdgesChangeBase(changes);
    },
    [onEdgesChangeBase, clearStaleSimIfActive]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type || !rfInstance) return;
      clearStaleSimIfActive();
      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      const meta = getComponentMeta(type);
      const id = getId();
      setNodes((nds) =>
        nds.concat({
          id,
          type: "cloudNode",
          position,
          data: { label: meta?.label || type, componentType: type, nodeId: id, onNodeClick: handleNodeClick },
        })
      );
    },
    [rfInstance, setNodes, handleNodeClick, clearStaleSimIfActive]
  );

  const setEntryPoint = useCallback(
    (nodeId) => {
      clearStaleSimIfActive();
      setEntryPointId(nodeId);
    },
    [clearStaleSimIfActive]
  );

  const runSimulation = useCallback(
    async (failedNodeId) => {
      const architecture = toCanonicalArchitecture(nodes, edges, entryPointId);
      const result = simulateFailure(architecture, entryPointId, failedNodeId);

      if (!result.valid) {
        setValidationMessage(result.message);
        setSimResult(null);
        setExplanation(null);
        return;
      }

      setValidationMessage(null);

      const nodesById = new Map(architecture.nodes.map((n) => [n.id, n]));
      const displayResult = {
        ...result,
        failedLabel: nodesById.get(failedNodeId)?.label || failedNodeId,
      };
      setSimResult(displayResult);

      // Apply visual state to nodes and edges from the deterministic result only.
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, status: result.states.get(n.id) || SIM_STATE.HEALTHY },
        }))
      );
      setEdges((eds) =>
        eds.map((e) => {
          const sourceState = result.states.get(e.source);
          const targetState = result.states.get(e.target);
          const affected =
            sourceState === SIM_STATE.FAILED ||
            targetState === SIM_STATE.FAILED ||
            targetState === SIM_STATE.UNREACHABLE ||
            sourceState === SIM_STATE.UNREACHABLE;
          return {
            ...e,
            animated: !affected,
            style: affected ? { stroke: "#ff3b3b", strokeDasharray: "4 3", opacity: 0.6 } : undefined,
          };
        })
      );

      // AI explanation layer: request it, validate it, fall back to the
      // deterministic explanation if unavailable or invalid (Sections 25, 27).
      const aiResponse = await requestAiExplanation({ architecture, simResult: result });
      if (aiResponse?.available && aiResponse.data) {
        const { valid } = validateAiExplanation(aiResponse.data, { architecture, simResult: result });
        if (valid) {
          setExplanation({ ...aiResponse.data, source: "ai" });
          return;
        }
      }
      setExplanation(buildFallbackExplanation({ architecture, simResult: result }));
    },
    [nodes, edges, entryPointId, setNodes, setEdges]
  );

  const setNodeRegion = useCallback(
    (nodeId, region) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, region: region || undefined, az: undefined } } : n))
      );
    },
    [setNodes]
  );

  const setNodeAz = useCallback(
    (nodeId, az) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, az: az || undefined } } : n)));
    },
    [setNodes]
  );

  const runDetectFailurePoints = useCallback(() => {
    const architecture = toCanonicalArchitecture(nodes, edges, entryPointId);
    if (!entryPointId) {
      setRiskScanMessage("Set an entry point before scanning for failure points.");
      setRiskScan(null);
      return;
    }
    if (architecture.nodes.length < 2) {
      setRiskScanMessage("Add and connect a few components before scanning.");
      setRiskScan(null);
      return;
    }
    setRiskScanMessage(null);
    const results = detectFailurePoints(architecture, entryPointId);
    setRiskScan(results);

    // Highlight every SPOF found by the scan directly on the canvas.
    const atRiskIds = new Set(results.filter((r) => r.singlePointOfFailure).map((r) => r.nodeId));
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, atRisk: atRiskIds.has(n.id) } })));
  }, [nodes, edges, entryPointId, setNodes]);

  const exportArchitecture = () => {
    const architecture = toCanonicalArchitecture(nodes, edges, entryPointId);
    console.log("Architecture JSON:", architecture);
    if (onExport) onExport(architecture);
  };

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const displayNodes = useMemo(
    () => applyNodeMeta(nodes).map((n) => ({ ...n, data: { ...n.data, isEntryPoint: n.id === entryPointId } })),
    [nodes, applyNodeMeta, entryPointId]
  );

  const regionGroupNodes = useMemo(() => computeRegionGroups(nodes), [nodes]);
  const flowNodes = useMemo(() => [...regionGroupNodes, ...displayNodes], [regionGroupNodes, displayNodes]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex" }}>
      <div style={{ flex: 1, position: "relative" }} ref={wrapperRef}>
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={exportArchitecture} style={{ padding: "8px 14px" }}>
            Export JSON
          </button>
          {!entryPointId && (
            <span style={{ padding: "8px 14px", color: "#ffb020", fontSize: "13px" }}>
              No entry point set — select a component and click &quot;Set as Entry Point&quot;.
            </span>
          )}
        </div>
        <ReactFlow
          nodes={flowNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <AnalysisPanel
        selectedNode={selectedNode}
        entryPointId={entryPointId}
        simResult={simResult}
        validationMessage={validationMessage}
        explanation={explanation}
        riskScan={riskScan}
        riskScanMessage={riskScanMessage}
        onSetEntryPoint={setEntryPoint}
        onSimulate={runSimulation}
        onReset={resetSimulation}
        onSetRegion={setNodeRegion}
        onSetAz={setNodeAz}
        onDetectFailurePoints={runDetectFailurePoints}
        onClearRiskScan={clearRiskScan}
      />
    </div>
  );
}

export default function Canvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
