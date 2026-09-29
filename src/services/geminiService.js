/**
 * Google Gemini API Integration Service (Free Tier)
 *
 * Uses Google AI Studio's free tier (gemini-2.5-flash / gemini-1.5-flash).
 * Free API keys: https://aistudio.google.com/app/apikey (no credit card).
 *
 * All prompt content lives in promptTemplates.js and is shared with
 * groqService.js, so both providers are asked the same question the same
 * way — only the HTTP transport and model differ here.
 */

import {
  buildFailureExplanationPrompt,
  buildArchitectureGenerationPrompt,
  buildCopilotChatPrompt,
  buildWellArchitectedAuditPrompt,
  sanitizeGeneratedArchitecture,
} from "./promptTemplates";

const GEMINI_LOCAL_STORAGE_KEY = "GEMINI_API_KEY";
const PRIMARY_MODEL = "gemini-3.7-flash";
const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];

export function getGeminiApiKey() {
  const localKey = typeof window !== "undefined" ? localStorage.getItem(GEMINI_LOCAL_STORAGE_KEY) : null;
  if (localKey && localKey.trim()) return localKey.trim();
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && !envKey.startsWith("your_")) return envKey.trim();
  return "";
}

export function setGeminiApiKey(key) {
  if (typeof window !== "undefined") {
    if (key && key.trim()) localStorage.setItem(GEMINI_LOCAL_STORAGE_KEY, key.trim());
    else localStorage.removeItem(GEMINI_LOCAL_STORAGE_KEY);
  }
}

export function hasGeminiApiKey() {
  return getGeminiApiKey().length > 0;
}

async function callGeminiApi({ prompt, systemInstruction = "", responseFormat = "text", temperature = 0.4 }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Google Gemini API key is not configured. Please enter your free API key in settings.");
  }

  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
      };

      if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      if (responseFormat === "json") {
        requestBody.generationConfig.responseMimeType = "application/json";
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        const isRetryable =
          [404, 429, 503].includes(response.status) ||
          /not found|high demand|overloaded|unavailable|resource_exhausted/i.test(errMsg);
        if (isRetryable) {
          lastError = new Error(`Model ${model} unavailable: ${errMsg}`);
          continue;
        }
        throw new Error(`Gemini API Error (${model}): ${errMsg}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error("Gemini returned an empty response.");

      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (err.message.includes("404") || err.message.includes("unavailable")) continue;
      throw err;
    }
  }

  throw lastError || new Error("Failed to communicate with Google Gemini API.");
}

export async function testGeminiApiKey(testKey) {
  const key = (testKey || getGeminiApiKey() || "").trim();
  if (!key) return { ok: false, error: "Please enter an API key." };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond only with: OK" }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { ok: false, error: err.error?.message || `API rejected key with HTTP status ${response.status}.` };
    }
    return { ok: true, message: "Connected successfully to Google Gemini Free Tier!" };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to reach Google Gemini API." };
  }
}

export async function explainSimulationFailure(architecture, simResult) {
  if (!hasGeminiApiKey()) {
    return { available: false, reason: "No Gemini API key configured." };
  }
  const { systemInstruction, prompt } = buildFailureExplanationPrompt(architecture, simResult);
  try {
    const { text, modelUsed } = await callGeminiApi({ prompt, systemInstruction, responseFormat: "json", temperature: 0.2 });
    const parsed = JSON.parse(text);
    return {
      available: true,
      modelUsed,
      data: {
        summary: parsed.summary,
        failureCause: parsed.failureCause,
        dependencyChain: parsed.dependencyChain || [],
        singlePointOfFailure: Boolean(parsed.singlePointOfFailure),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        securityAndCostImpact: parsed.securityAndCostImpact || "",
      },
    };
  } catch (err) {
    console.warn("Gemini failure explanation error:", err);
    return { available: false, reason: err.message };
  }
}

export async function generateArchitectureFromPrompt(promptText, options = {}) {
  const { systemInstruction, prompt } = buildArchitectureGenerationPrompt(promptText, options);
  const { text } = await callGeminiApi({ prompt, systemInstruction, responseFormat: "json", temperature: 0.3 });
  const parsed = JSON.parse(text);
  return sanitizeGeneratedArchitecture(parsed, options);
}

export async function chatWithCloudArchitect(messages, architectureContext = {}) {
  const { systemInstruction, prompt } = buildCopilotChatPrompt(messages, architectureContext);
  const { text, modelUsed } = await callGeminiApi({ prompt, systemInstruction, temperature: 0.5 });
  return { text, modelUsed };
}

export async function auditWellArchitected(architecture) {
  const { systemInstruction, prompt } = buildWellArchitectedAuditPrompt(architecture);
  const { text, modelUsed } = await callGeminiApi({ prompt, systemInstruction, responseFormat: "json", temperature: 0.3 });
  return { data: JSON.parse(text), modelUsed };
}
