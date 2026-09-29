/**
 * Groq API Integration Service (Free Tier, Open-Source Models)
 *
 * Groq's free developer tier requires no credit card and serves genuinely
 * open-weight models (Llama 3.3, GPT-OSS, Qwen) on an OpenAI-compatible
 * endpoint. Free keys: https://console.groq.com/keys
 *
 * Mirrors geminiService.js's exported function signatures exactly, so
 * aiRouter.js can call either provider interchangeably. Prompt content is
 * shared with Gemini via promptTemplates.js.
 */

import {
  buildFailureExplanationPrompt,
  buildArchitectureGenerationPrompt,
  buildCopilotChatPrompt,
  buildWellArchitectedAuditPrompt,
  sanitizeGeneratedArchitecture,
} from "./promptTemplates";
import { validateAndRepairAuditOutput, safeParseAiJson } from "./aiValidator";

const GROQ_LOCAL_STORAGE_KEY = "GROQ_API_KEY";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
// Open-weight models only, in fallback order. Availability/rate limits
// shift over time, so a short fallback chain keeps this resilient.
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODELS = ["llama-3.1-8b-instant", "openai/gpt-oss-120b"];

export function getGroqApiKey() {
  const localKey = typeof window !== "undefined" ? localStorage.getItem(GROQ_LOCAL_STORAGE_KEY) : null;
  if (localKey && localKey.trim()) return localKey.trim();
  const envKey = import.meta.env?.VITE_GROQ_API_KEY;
  if (envKey && envKey.trim() && !envKey.startsWith("your_")) return envKey.trim();
  return "";
}

export function setGroqApiKey(key) {
  if (typeof window !== "undefined") {
    if (key && key.trim()) localStorage.setItem(GROQ_LOCAL_STORAGE_KEY, key.trim());
    else localStorage.removeItem(GROQ_LOCAL_STORAGE_KEY);
  }
}

export function hasGroqApiKey() {
  return getGroqApiKey().length > 0;
}

async function callGroqApi({ prompt, systemInstruction = "", responseFormat = "text", temperature = 0.4, maxOutputTokens = 2048 }) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured. Please enter your free API key in settings.");
  }

  const messages = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: prompt });

  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const requestBody = {
        model,
        messages,
        temperature,
        max_tokens: maxOutputTokens,
      };
      if (responseFormat === "json") {
        requestBody.response_format = { type: "json_object" };
      }

      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        const isRetryable =
          [404, 429, 503].includes(response.status) ||
          /decommissioned|not found|overloaded|unavailable/i.test(errMsg);
        if (isRetryable) {
          lastError = new Error(`Model ${model} unavailable: ${errMsg}`);
          continue;
        }
        throw new Error(`Groq API Error (${model}): ${errMsg}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const text = choice?.message?.content || "";

      // Same reasoning as Gemini: a JSON payload cut off by the token cap is
      // guaranteed to be unparseable. Move to the next fallback model instead
      // of handing truncated JSON to the caller.
      if (responseFormat === "json" && choice?.finish_reason === "length") {
        lastError = new Error(`Model ${model} response was truncated (length) before completing.`);
        continue;
      }

      if (!text) throw new Error("Groq returned an empty response.");

      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (err.message.includes("404") || err.message.includes("unavailable") || err.message.includes("truncated")) continue;
      throw err;
    }
  }

  throw lastError || new Error("Failed to communicate with Groq API.");
}

export async function testGroqApiKey(testKey) {
  const key = (testKey || getGroqApiKey() || "").trim();
  if (!key) return { ok: false, error: "Please enter an API key." };

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [{ role: "user", content: "Respond only with: OK" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { ok: false, error: err.error?.message || `API rejected key with HTTP status ${response.status}.` };
    }
    return { ok: true, message: "Connected successfully to Groq's free tier!" };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to reach Groq API." };
  }
}

export async function explainSimulationFailure(architecture, simResult) {
  if (!hasGroqApiKey()) {
    return { available: false, reason: "No Groq API key configured." };
  }
  const { systemInstruction, prompt } = buildFailureExplanationPrompt(architecture, simResult);
  try {
    const { text, modelUsed } = await callGroqApi({ prompt, systemInstruction, responseFormat: "json", temperature: 0.2 });
    const parsed = safeParseAiJson(text);
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
    console.warn("Groq failure explanation error:", err);
    return { available: false, reason: err.message };
  }
}

export async function generateArchitectureFromPrompt(promptText, options = {}) {
  const { systemInstruction, prompt } = buildArchitectureGenerationPrompt(promptText, options);
  const { text } = await callGroqApi({ prompt, systemInstruction, responseFormat: "json", temperature: 0.3, maxOutputTokens: 4096 });
  const parsed = safeParseAiJson(text);
  return sanitizeGeneratedArchitecture(parsed, options);
}

export async function chatWithCloudArchitect(messages, architectureContext = {}) {
  const { systemInstruction, prompt } = buildCopilotChatPrompt(messages, architectureContext);
  const { text, modelUsed } = await callGroqApi({ prompt, systemInstruction, temperature: 0.5 });
  return { text, modelUsed };
}

export async function auditWellArchitected(architecture) {
  const { systemInstruction, prompt } = buildWellArchitectedAuditPrompt(architecture);
  const { text, modelUsed } = await callGroqApi({ prompt, systemInstruction, responseFormat: "json", temperature: 0.3, maxOutputTokens: 3072 });
  const data = validateAndRepairAuditOutput(safeParseAiJson(text));
  return { data, modelUsed };
}
