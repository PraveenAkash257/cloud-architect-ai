/**
 * Converts the app's architecture representation (either raw React Flow
 * nodes/edges from the canvas, or the canonical { nodes, edges } shape from
 * utils/architecture.js) into a small, AWS-scope-aware object safe to send
 * to an LLM.
 *
 * This is the ONLY place that decides "does this node's AZ matter?" for
 * prompt purposes — every prompt builder in promptTemplates.js should route
 * through here instead of re-deriving region/AZ text itself, so region/AZ
 * semantics can't drift between features.
 *
 * Never send raw React Flow node objects (position, style, drag state,
 * container visuals, etc.) to the LLM — only the fields below.
 */

import { getServiceKnowledge, isAzMeaningful } from "../data/awsServiceKnowledge";

const NON_ARCHITECTURAL_TYPES = new Set(["container", "regionGroup"]);

/**
 * Normalizes one node, whichever shape it arrives in:
 *  - React Flow node: { id, type, parentId, data: { label, componentType, region, az } }
 *  - Canonical node:  { id, type, label, region, az, parentId }  (type === componentType)
 */
function normalizeNode(n) {
  const componentType = n.data?.componentType || n.type;
  return {
    id: n.id,
    type: componentType,
    label: n.data?.label || n.label || n.id,
    region: n.data?.region ?? n.region,
    az: n.data?.az ?? n.az,
    parentId: n.parentId,
  };
}

/**
 * Builds the compact context object. Accepts either raw canvas nodes/edges
 * or the canonical architecture shape.
 *
 * @returns {{ region: string, entryPoint: string|null, nodes: object[], edges: object[] }}
 */
export function buildCompactArchitectureContext({ nodes = [], edges = [], entryPoint = null, region } = {}) {
  const normalized = nodes
    .filter((n) => !NON_ARCHITECTURAL_TYPES.has(n.type))
    .map(normalizeNode);

  const knownIds = new Set(normalized.map((n) => n.id));

  const compactNodes = normalized.map((n) => {
    const knowledge = getServiceKnowledge(n.type);
    const node = {
      id: n.id,
      service: knowledge?.service || n.label,
      type: n.type,
      scope: knowledge?.scope || "UNKNOWN",
    };
    // Only include AZ when it's actually meaningful for this service AND
    // an AZ was explicitly represented on the node — never invent one.
    if (n.az && isAzMeaningful(n.type)) {
      node.az = n.az;
    }
    if (n.parentId && knownIds.has(n.parentId)) {
      node.parentId = n.parentId;
    }
    return node;
  });

  const compactEdges = edges
    .filter((e) => e && knownIds.has(e.source) && knownIds.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // Fall back to the first meaningfully-scoped node's region, then any node.
  const inferredRegion =
    region || normalized.find((n) => n.region)?.region || "ap-south-1";

  return {
    region: inferredRegion,
    entryPoint: entryPoint || null,
    nodes: compactNodes,
    edges: compactEdges,
  };
}

/** Compact, deterministic facts about a failure simulation — no free text. */
export function buildCompactSimulationFacts(simResult) {
  if (!simResult) return null;
  return {
    failedNodeId: simResult.failedNodeId,
    singlePointOfFailure: Boolean(simResult.singlePointOfFailure),
    resilience: simResult.resilience,
    newlyUnreachable: simResult.newlyUnreachable || [],
    reachableCount: simResult.reachableCount,
    unreachableCount: simResult.unreachableCount,
  };
}
