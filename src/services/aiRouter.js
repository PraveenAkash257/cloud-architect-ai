/**
 * Routes every AI call to whichever provider the user has selected,
 * so components never import Gemini or Groq directly. Falls back to
 * whichever provider actually has a key configured if the preferred one
 * doesn't (so switching never silently breaks a working setup).
 */

import * as gemini from "./geminiService";
import * as groq from "./groqService";

const PROVIDER_KEY = "AI_PROVIDER";
export const PROVIDERS = { GEMINI: "gemini", GROQ: "groq" };

const IMPLS = {
  [PROVIDERS.GEMINI]: gemini,
  [PROVIDERS.GROQ]: groq,
};

export function getActiveProvider() {
  const stored = typeof window !== "undefined" ? localStorage.getItem(PROVIDER_KEY) : null;
  return stored === PROVIDERS.GROQ || stored === PROVIDERS.GEMINI ? stored : PROVIDERS.GEMINI;
}

export function setActiveProvider(provider) {
  if (typeof window !== "undefined" && (provider === PROVIDERS.GEMINI || provider === PROVIDERS.GROQ)) {
    localStorage.setItem(PROVIDER_KEY, provider);
  }
}

export function hasKeyFor(provider) {
  return provider === PROVIDERS.GROQ ? groq.hasGroqApiKey() : gemini.hasGeminiApiKey();
}

export function hasAnyApiKey() {
  return gemini.hasGeminiApiKey() || groq.hasGroqApiKey();
}

export function getApiKey(provider) {
  return provider === PROVIDERS.GROQ ? groq.getGroqApiKey() : gemini.getGeminiApiKey();
}

export function setApiKey(provider, key) {
  return provider === PROVIDERS.GROQ ? groq.setGroqApiKey(key) : gemini.setGeminiApiKey(key);
}

export function testApiKey(provider, key) {
  return provider === PROVIDERS.GROQ ? groq.testGroqApiKey(key) : gemini.testGeminiApiKey(key);
}

// Resolves which provider implementation to actually use for a call: the
// user's chosen provider if it has a key, otherwise whichever provider DOES
// have one configured (so the app keeps working after hitting one
// provider's free-tier limit, without the user needing to switch manually).
function resolveImpl() {
  const preferred = getActiveProvider();
  if (hasKeyFor(preferred)) return IMPLS[preferred];
  const other = preferred === PROVIDERS.GEMINI ? PROVIDERS.GROQ : PROVIDERS.GEMINI;
  if (hasKeyFor(other)) return IMPLS[other];
  return IMPLS[preferred];
}

function otherProviderImpl(provider) {
  const other = provider === PROVIDERS.GEMINI ? PROVIDERS.GROQ : PROVIDERS.GEMINI;
  return hasKeyFor(other) ? IMPLS[other] : null;
}

function isRateLimitOrQuotaError(err) {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("truncated")
  );
}

// Runs fn against the resolved provider; on a rate-limit/quota error, retries
// once against whichever OTHER provider has a key configured. This is what
// lets the app keep working across both free tiers' combined daily limits
// instead of stopping the moment one provider is exhausted.
async function withFailover(fn) {
  const primary = getActiveProvider();
  const impl = hasKeyFor(primary) ? IMPLS[primary] : resolveImpl();
  try {
    return await fn(impl);
  } catch (err) {
    if (!isRateLimitOrQuotaError(err)) throw err;
    const fallback = otherProviderImpl(impl === gemini ? PROVIDERS.GEMINI : PROVIDERS.GROQ);
    if (!fallback) throw err;
    return fn(fallback);
  }
}

export async function explainSimulationFailure(architecture, simResult) {
  const primary = getActiveProvider();
  const impl = hasKeyFor(primary) ? IMPLS[primary] : IMPLS[hasKeyFor(PROVIDERS.GEMINI) ? PROVIDERS.GEMINI : PROVIDERS.GROQ];
  const result = await impl.explainSimulationFailure(architecture, simResult);
  if (result.available === false && isRateLimitOrQuotaError({ message: result.reason || "" })) {
    const fallback = otherProviderImpl(impl === gemini ? PROVIDERS.GEMINI : PROVIDERS.GROQ);
    if (fallback) return fallback.explainSimulationFailure(architecture, simResult);
  }
  return result;
}

export async function generateArchitectureFromPrompt(promptText, options = {}) {
  return withFailover((impl) => impl.generateArchitectureFromPrompt(promptText, options));
}

export async function chatWithCloudArchitect(messages, architectureContext = {}) {
  return withFailover((impl) => impl.chatWithCloudArchitect(messages, architectureContext));
}

export async function auditWellArchitected(architecture) {
  return withFailover((impl) => impl.auditWellArchitected(architecture));
}
