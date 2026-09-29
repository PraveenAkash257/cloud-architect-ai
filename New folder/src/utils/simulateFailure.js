/**
 * Deterministic failure-simulation engine.
 *
 * This module is the single source of truth for graph reachability and
 * failure impact. It must never depend on AI, randomness, or any external
 * service. Given the same architecture + entry point + failed node, it must
 * always produce the same result.
 *
 * Canonical architecture shape expected by this module:
 *   nodes: [{ id, type, label }]
 *   edges: [{ source, target }]   // every edge is DIRECTED source -> target
 */

export const SIM_STATE = {
  HEALTHY: "HEALTHY",
  FAILED: "FAILED",
  UNREACHABLE: "UNREACHABLE",
  PRE_EXISTING_DISCONNECTED: "PRE_EXISTING_DISCONNECTED",
};

export const RESILIENCE = {
  CRITICAL: "CRITICAL",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

/**
 * Build an adjacency list from directed edges, restricted to known node ids.
 * Edges referencing unknown nodes are dropped (caller should already have
 * validated, but this keeps traversal safe either way).
 */
function buildAdjacency(nodeIds, edges) {
  const adjacency = new Map();
  for (const id of nodeIds) adjacency.set(id, []);
  for (const edge of edges) {
    if (!edge) continue;
    const { source, target } = edge;
    if (!adjacency.has(source) || !adjacency.has(target)) continue;
    adjacency.get(source).push(target);
  }
  return adjacency;
}

/**
 * Deterministic BFS reachability from a start node, optionally excluding one
 * node entirely from traversal (used to simulate its failure/removal).
 * Terminates safely on cycles via the visited set.
 */
function bfsReachable(adjacency, startId, excludeId = null) {
  const visited = new Set();
  if (startId === excludeId) return visited; // entry point itself failed
  if (!adjacency.has(startId)) return visited;

  const queue = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adjacency.get(current) || [];
    for (const next of neighbors) {
      if (next === excludeId) continue;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }

  return visited;
}

/**
 * Phase A — Validation.
 * Returns { valid: true } or { valid: false, message }.
 */
export function validateSimulationInput(architecture, entryPointId, failedNodeId) {
  const nodes = architecture?.nodes || [];
  const edges = architecture?.edges || [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { valid: false, message: "The architecture has no components yet. Add components before simulating a failure." };
  }

  const nodeIds = new Set(nodes.map((n) => n.id));

  if (nodeIds.size !== nodes.length) {
    return { valid: false, message: "The architecture contains duplicate component IDs. Fix the architecture before simulating." };
  }

  for (const edge of edges) {
    if (!edge || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return { valid: false, message: "The architecture contains a connection that references a missing component. Fix the architecture before simulating." };
    }
  }

  if (!entryPointId) {
    return { valid: false, message: "No entry point is designated. Select a component and set it as the entry point before simulating a failure." };
  }

  if (!nodeIds.has(entryPointId)) {
    return { valid: false, message: "The designated entry point no longer exists in the architecture. Choose a new entry point." };
  }

  if (!failedNodeId) {
    return { valid: false, message: "No component was selected to fail. Select a component to simulate its failure." };
  }

  if (!nodeIds.has(failedNodeId)) {
    return { valid: false, message: "The selected component no longer exists in the architecture." };
  }

  return { valid: true };
}

/**
 * Phase B/C/D — run the full deterministic simulation.
 *
 * Returns:
 * {
 *   valid, message,
 *   entryPointId, failedNodeId,
 *   baselineReachable: Set<string>,
 *   reachableAfterFailure: Set<string>,
 *   states: Map<nodeId, SIM_STATE>,
 *   newlyUnreachable: string[],
 *   preExistingDisconnected: string[],
 *   reachableCount, unreachableCount, preExistingDisconnectedCount,
 *   singlePointOfFailure: boolean,
 *   resilience: RESILIENCE,
 * }
 */
export function simulateFailure(architecture, entryPointId, failedNodeId) {
  const validation = validateSimulationInput(architecture, entryPointId, failedNodeId);
  if (!validation.valid) {
    return { valid: false, message: validation.message };
  }

  const nodes = architecture.nodes;
  const edges = architecture.edges || [];
  const nodeIds = nodes.map((n) => n.id);
  const adjacency = buildAdjacency(nodeIds, edges);

  // Phase B — baseline reachability (before failure).
  const baselineReachable = bfsReachable(adjacency, entryPointId, null);

  // Phase C — reachability after removing the failed node from traversal.
  const reachableAfterFailure = bfsReachable(adjacency, entryPointId, failedNodeId);

  // Phase D — classification.
  const states = new Map();
  const newlyUnreachable = [];
  const preExistingDisconnected = [];

  for (const id of nodeIds) {
    if (id === failedNodeId) {
      states.set(id, SIM_STATE.FAILED);
      continue;
    }
    const wasReachable = baselineReachable.has(id);
    const isReachableNow = reachableAfterFailure.has(id);

    if (wasReachable && !isReachableNow) {
      states.set(id, SIM_STATE.UNREACHABLE);
      newlyUnreachable.push(id);
    } else if (!wasReachable) {
      states.set(id, SIM_STATE.PRE_EXISTING_DISCONNECTED);
      preExistingDisconnected.push(id);
    } else {
      states.set(id, SIM_STATE.HEALTHY);
    }
  }

  const reachableCount = [...reachableAfterFailure].filter((id) => id !== failedNodeId).length;
  const singlePointOfFailure = newlyUnreachable.length > 0;

  const resilience = computeResilience({
    entryPointId,
    failedNodeId,
    baselineReachable,
    newlyUnreachable,
  });

  return {
    valid: true,
    message: null,
    entryPointId,
    failedNodeId,
    baselineReachable,
    reachableAfterFailure,
    states,
    newlyUnreachable,
    preExistingDisconnected,
    reachableCount,
    unreachableCount: newlyUnreachable.length,
    preExistingDisconnectedCount: preExistingDisconnected.length,
    singlePointOfFailure,
    resilience,
  };
}

/**
 * Deterministic resilience classification, derived only from simulation data.
 *
 * CRITICAL — the entry point itself was failed (or every other baseline-
 *            reachable node became unreachable): the whole modeled service
 *            path is gone with no alternate path.
 * LOW      — the failure took out a majority of the previously reachable
 *            nodes (a critical path with no meaningful redundancy).
 * MEDIUM   — some nodes became unreachable, but most of the service graph
 *            still has a path from the entry point.
 * HIGH     — nothing else became unreachable; redundant/alternate paths
 *            preserved connectivity.
 */
function computeResilience({ entryPointId, failedNodeId, baselineReachable, newlyUnreachable }) {
  const otherBaselineNodes = [...baselineReachable].filter((id) => id !== failedNodeId).length;

  if (newlyUnreachable.length === 0) {
    return RESILIENCE.HIGH;
  }

  if (failedNodeId === entryPointId || (otherBaselineNodes > 0 && newlyUnreachable.length === otherBaselineNodes)) {
    return RESILIENCE.CRITICAL;
  }

  const ratio = otherBaselineNodes > 0 ? newlyUnreachable.length / otherBaselineNodes : 1;
  if (ratio >= 0.5) {
    return RESILIENCE.LOW;
  }

  return RESILIENCE.MEDIUM;
}

/**
 * Automatic whole-architecture scan: simulates failing every node in turn
 * (using the same deterministic engine as a single manual simulation) and
 * reports which ones are single points of failure, without requiring the
 * user to select and simulate each node one at a time.
 *
 * Returns an array of:
 *   { nodeId, label, singlePointOfFailure, resilience, newlyUnreachableCount }
 * sorted with the most impactful failures first. The entry point itself is
 * excluded — failing the entry point trivially breaks everything and isn't
 * an interesting "which component is risky" signal.
 */
export function detectFailurePoints(architecture, entryPointId) {
  const nodes = architecture?.nodes || [];
  const results = [];

  for (const node of nodes) {
    if (node.id === entryPointId) continue;
    const result = simulateFailure(architecture, entryPointId, node.id);
    if (!result.valid) continue;
    results.push({
      nodeId: node.id,
      label: node.label,
      singlePointOfFailure: result.singlePointOfFailure,
      resilience: result.resilience,
      newlyUnreachableCount: result.unreachableCount,
    });
  }

  results.sort((a, b) => b.newlyUnreachableCount - a.newlyUnreachableCount);
  return results;
}
