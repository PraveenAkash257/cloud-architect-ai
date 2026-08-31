/**
 * AI explanation/recommendation layer.
 *
 * Strict separation from the simulation engine: this module never computes
 * reachability or resilience itself — it only narrates results that the
 * deterministic engine (simulateFailure.js) already produced, and validates
 * anything it returns against those results before the UI is allowed to show
 * it (Section 25).
 *
 * No LLM endpoint/key is configured in this project (only Supabase auth
 * credentials are present in .env). Rather than fabricate a fake network
 * call, requestAiExplanation() always resolves through the "unavailable"
 * path below and the UI shows a deterministic fallback explanation built
 * only from verified simulation facts. Wiring a real model call later only
 * requires replacing the body of requestAiExplanation — the validation and
 * fallback contract stays the same.
 */

/**
 * Deterministic, template-based explanation built ONLY from verified
 * simulation facts. Used whenever the AI is unavailable, and also serves as
 * the ground truth that any future AI response would be validated against.
 */
export function buildFallbackExplanation({ architecture, simResult }) {
  const nodesById = new Map(architecture.nodes.map((n) => [n.id, n]));
  const failed = nodesById.get(simResult.failedNodeId);
  const unreachable = simResult.newlyUnreachable.map((id) => nodesById.get(id)?.label || id);

  const summary =
    unreachable.length === 0
      ? `${failed?.label || simResult.failedNodeId} failed, but the modeled architecture kept every other component reachable from the entry point.`
      : `${failed?.label || simResult.failedNodeId} failed and ${unreachable.length} component${unreachable.length === 1 ? "" : "s"} lost their only path from the entry point: ${unreachable.join(", ")}.`;

  const failureCause =
    unreachable.length === 0
      ? "Based on the modeled dependency graph, an alternate directed path kept the remaining components connected to the entry point."
      : `Based on the modeled dependency graph, no directed path remains from the entry point to ${unreachable.join(", ")} once ${failed?.label || simResult.failedNodeId} is removed.`;

  return {
    summary,
    failureCause,
    dependencyChain: [architecture.entryPoint, simResult.failedNodeId, ...simResult.newlyUnreachable]
      .filter(Boolean)
      .map((id) => nodesById.get(id)?.label || id),
    singlePointOfFailure: simResult.singlePointOfFailure,
    recommendations: simResult.singlePointOfFailure
      ? [
          {
            title: `Add a redundant path around ${failed?.label || simResult.failedNodeId}`,
            reason: `${unreachable.join(", ") || "Downstream components"} currently depend on a single path through ${failed?.label || simResult.failedNodeId}.`,
            expectedImprovement: "Connectivity from the entry point would be preserved if this component fails again.",
          },
        ]
      : [],
    source: "fallback",
  };
}

/**
 * Validate an AI response against the deterministic simulation result
 * (Section 25). Returns { valid, reasons[] }.
 */
export function validateAiExplanation(aiResponse, { architecture, simResult }) {
  const reasons = [];
  if (!aiResponse || typeof aiResponse !== "object") {
    return { valid: false, reasons: ["AI response was empty or malformed."] };
  }

  const nodeIds = new Set(architecture.nodes.map((n) => n.id));
  const nodeLabels = new Set(architecture.nodes.map((n) => n.label));

  if (typeof aiResponse.singlePointOfFailure === "boolean" && aiResponse.singlePointOfFailure !== simResult.singlePointOfFailure) {
    reasons.push("AI single-point-of-failure claim contradicts the deterministic simulation result.");
  }

  for (const step of aiResponse.dependencyChain || []) {
    if (!nodeIds.has(step) && !nodeLabels.has(step)) {
      reasons.push(`AI referenced a component ("${step}") that does not exist in the architecture.`);
    }
  }

  for (const rec of aiResponse.recommendations || []) {
    if (typeof rec?.title !== "string" || typeof rec?.reason !== "string") {
      reasons.push("AI recommendation is missing required fields.");
    }
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * Requests an AI explanation. Currently always resolves to "unavailable"
 * because no AI endpoint/key is configured for this project — see the
 * module docstring. The deterministic simulator and analysis panel remain
 * fully functional regardless of this result (Section 27).
 */
export async function requestAiExplanation(/* payload */) {
  return { available: false, reason: "AI explanation is not configured for this deployment." };
}
