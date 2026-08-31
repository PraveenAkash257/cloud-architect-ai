/**
 * Helpers for converting between the React Flow node/edge representation
 * used by the canvas and the canonical architecture JSON (Section 7) that
 * the simulation engine and AI layer consume.
 *
 * The canvas remains the source of truth for visual state (position,
 * selection, simulation styling). This module distills that down to the
 * canonical { entryPoint, nodes, edges } shape whenever it's needed.
 */

export function toCanonicalArchitecture(nodes, edges, entryPointId) {
  return {
    entryPoint: entryPointId || null,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.componentType,
      label: n.data.label,
    })),
    edges: edges.map((e) => ({ source: e.source, target: e.target })),
  };
}
