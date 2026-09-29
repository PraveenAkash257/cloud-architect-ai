/**
 * Deterministic validation for whatever JSON an LLM returns.
 *
 * Philosophy: never spend another LLM call to fix a malformed field. Every
 * function here is pure and synchronous — it either drops/repairs the
 * offending piece of data with a safe default, or reports a problem. Used by
 * promptTemplates.js (architecture generation) and by geminiService.js /
 * groqService.js (Well-Architected audits).
 */

import { COMPONENT_TYPES } from "../data/componentTypes";
import { GROUP_TYPES } from "../data/groupTypes";

const VALID_COMPONENT_TYPES = new Set(COMPONENT_TYPES.map((c) => c.type));
const VALID_GROUP_TYPES = new Set(GROUP_TYPES.map((g) => g.type));
const VALID_SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);
const VALID_CATEGORIES = new Set(["RELIABILITY", "SECURITY", "PERFORMANCE", "COST", "OPERATIONS"]);

export function isValidComponentType(type) {
  return VALID_COMPONENT_TYPES.has(type);
}

export function isValidGroupType(type) {
  return VALID_GROUP_TYPES.has(type);
}

/**
 * Parses a JSON response from an LLM, tolerating the handful of small slips
 * that both Gemini and Groq occasionally make even when a strict JSON
 * response format was requested:
 *   - wrapping the object in a ```json ... ``` (or ``` ... ```) code fence
 *   - stray prose before/after the JSON object
 *   - an enum-like value left unquoted, e.g. "groupType": private_subnet
 *     instead of "groupType": "private_subnet"
 *   - a trailing comma before a closing } or ]
 *
 * This never invents data — it only repairs syntax so the object underneath
 * can be read, then hands off to the real structural validation
 * (sanitizeGeneratedArchitecture / validateAndRepairAuditOutput). If the
 * text still isn't parseable JSON after these repairs, the original parse
 * error is thrown so the caller's existing retry/fallback path still fires.
 */
export function safeParseAiJson(rawText) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    throw new Error("AI response was empty.");
  }

  let text = rawText.trim();

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(text);
  } catch (firstError) {
    const repaired = text
      // Quote bare-word values (but leave true/false/null/numbers alone).
      .replace(/:(\s*)([A-Za-z_][A-Za-z0-9_-]*)(\s*[,}\]\n])/g, (match, pre, word, post) => {
        if (word === "true" || word === "false" || word === "null") return match;
        return `:${pre}"${word}"${post}`;
      })
      // Drop trailing commas before a closing brace/bracket.
      .replace(/,(\s*[}\]])/g, "$1");

    try {
      return JSON.parse(repaired);
    } catch {
      throw firstError;
    }
  }
}

/**
 * Drops edges that reference a node id not present in the final node set,
 * and clears parentId/entryPoint references that point at nothing. Applied
 * AFTER node/container sanitization (promptTemplates.sanitizeGeneratedArchitecture)
 * so it only needs the final, already-typo-corrected id set.
 */
export function cleanArchitectureGraph({ nodes, containers, edges, entryPoint }) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const containerIds = new Set(containers.map((c) => c.id));
  const allIds = new Set([...nodeIds, ...containerIds]);

  const cleanedNodes = nodes.map((n) => {
    if (n.parentId && !containerIds.has(n.parentId)) {
      const { parentId, extent, ...rest } = n;
      return rest;
    }
    return n;
  });

  const cleanedEdges = edges.filter((e) => e.source && e.target && allIds.has(e.source) && allIds.has(e.target));

  const cleanedEntryPoint = entryPoint && nodeIds.has(entryPoint) ? entryPoint : nodes[0]?.id || null;

  return { nodes: cleanedNodes, edges: cleanedEdges, entryPoint: cleanedEntryPoint };
}

/**
 * Validates and repairs a Well-Architected audit response in place. Unknown
 * severities/categories are coerced to a safe default rather than dropped,
 * since a slightly-mislabeled real finding is more useful than a silently
 * discarded one. Malformed findings (missing required text fields) ARE
 * dropped — a finding with no evidence/recommendation isn't actionable.
 */
export function validateAndRepairAuditOutput(parsed) {
  const safe = parsed && typeof parsed === "object" ? parsed : {};

  const overallScore = Number.isFinite(safe.overallScore) ? Math.max(0, Math.min(100, safe.overallScore)) : null;

  const findings = Array.isArray(safe.findings)
    ? safe.findings
        .filter((f) => f && typeof f.title === "string" && typeof f.evidence === "string" && typeof f.recommendation === "string")
        .map((f) => ({
          severity: VALID_SEVERITIES.has(f.severity) ? f.severity : "INFO",
          category: VALID_CATEGORIES.has(f.category) ? f.category : "OPERATIONS",
          title: f.title,
          affectedNodes: Array.isArray(f.affectedNodes) ? f.affectedNodes : [],
          evidence: f.evidence,
          impact: typeof f.impact === "string" ? f.impact : "",
          recommendation: f.recommendation,
          tradeoff: typeof f.tradeoff === "string" ? f.tradeoff : "",
        }))
    : [];

  const topPriorityActions = Array.isArray(safe.topPriorityActions)
    ? safe.topPriorityActions
        .filter((a) => a && typeof a.title === "string")
        .map((a) => ({
          title: a.title,
          severity: VALID_SEVERITIES.has(a.severity) ? a.severity : "MEDIUM",
          reason: typeof a.reason === "string" ? a.reason : "",
        }))
    : [];

  return {
    overallScore,
    summary: typeof safe.summary === "string" ? safe.summary : "",
    findings,
    topPriorityActions,
  };
}
