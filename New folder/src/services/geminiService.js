/**
 * Google Gemini API Integration Service (Free Tier)
 *
 * Uses Google AI Studio's free tier (gemini-2.5-flash / gemini-1.5-flash).
 * API keys can be provided via:
 * 1. localStorage ("GEMINI_API_KEY")
 * 2. import.meta.env.VITE_GEMINI_API_KEY
 *
 * Free API Keys can be obtained in 10 seconds at:
 * https://aistudio.google.com/app/apikey (No credit card required)
 */

import { COMPONENT_TYPES } from "../data/componentTypes";
import { GROUP_TYPES } from "../data/groupTypes";

const GEMINI_LOCAL_STORAGE_KEY = "GEMINI_API_KEY";
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash"];

/**
 * Get configured Gemini API key (localStorage takes precedence over .env)
 */
export function getGeminiApiKey() {
  const localKey = typeof window !== "undefined" ? localStorage.getItem(GEMINI_LOCAL_STORAGE_KEY) : null;
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && !envKey.startsWith("your_")) {
    return envKey.trim();
  }
  return "";
}

/**
 * Persist Gemini API key to localStorage
 */
export function setGeminiApiKey(key) {
  if (typeof window !== "undefined") {
    if (key && key.trim()) {
      localStorage.setItem(GEMINI_LOCAL_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_LOCAL_STORAGE_KEY);
    }
  }
}

/**
 * Check if a Gemini API key is configured
 */
export function hasGeminiApiKey() {
  return getGeminiApiKey().length > 0;
}

/**
 * Low-level call to Google Gemini generateContent REST API with automatic model fallback
 */
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
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      if (responseFormat === "json") {
        requestBody.generationConfig.responseMimeType = "application/json";
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // If model is not found, try the next fallback model in the list
        if (response.status === 404 || errMsg.toLowerCase().includes("not found")) {
          lastError = new Error(`Model ${model} unavailable: ${errMsg}`);
          continue;
        }

        throw new Error(`Gemini API Error (${model}): ${errMsg}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || "";

      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (err.message.includes("404") || err.message.includes("unavailable")) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Failed to communicate with Google Gemini API.");
}

/**
 * Test a Gemini API key with a fast ping prompt
 */
export async function testGeminiApiKey(testKey) {
  const key = (testKey || getGeminiApiKey() || "").trim();
  if (!key) {
    return { ok: false, error: "Please enter an API key." };
  }

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
      return {
        ok: false,
        error: err.error?.message || `API rejected key with HTTP status ${response.status}.`,
      };
    }

    return { ok: true, message: "Connected successfully to Google Gemini Free Tier!" };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to reach Google Gemini API." };
  }
}

/**
 * 1. AI Failure & Root Cause Explanation
 * Generates structured cloud resilience narration conforming to Section 25
 */
export async function explainSimulationFailure(architecture, simResult) {
  if (!hasGeminiApiKey()) {
    return {
      available: false,
      reason: "No Gemini API key configured. Using deterministic engine.",
    };
  }

  const nodesById = new Map(architecture.nodes.map((n) => [n.id, n]));
  const failedNode = nodesById.get(simResult.failedNodeId);
  const entryNode = nodesById.get(architecture.entryPoint);
  const newlyUnreachableLabels = simResult.newlyUnreachable.map((id) => nodesById.get(id)?.label || id);

  const systemInstruction = `You are a Principal AWS Cloud Resilience and Site Reliability Engineer.
Analyze the deterministic failure simulation results for this cloud architecture.
You MUST output strictly valid JSON matching this schema:
{
  "summary": "Clear, concise 1-2 sentence overview of the failure impact",
  "failureCause": "Technical root-cause explaining why components lost connectivity based strictly on the dependency graph",
  "dependencyChain": ["string array of EXACT component names/labels involved in the failure path"],
  "singlePointOfFailure": boolean (true if simResult was SPOF, false otherwise),
  "recommendations": [
    {
      "title": "Actionable architectural fix title",
      "reason": "Why this fix prevents future outages",
      "expectedImprovement": "Quantifiable resilience gain (e.g., Eliminates SPOF, provides 99.99% multi-AZ failover)"
    }
  ],
  "securityAndCostImpact": "Brief note on security or cost trade-off of the recommended fix"
}
CRITICAL RULES:
- Never hallucinate components not in the architecture list.
- Only reference exact component names provided in the prompt.
- singlePointOfFailure MUST be ${simResult.singlePointOfFailure}.`;

  const prompt = `Architecture Components:
${architecture.nodes.map((n) => `- ${n.label} (ID: ${n.id}, Type: ${n.type || n.data?.componentType || "node"}, Region: ${n.data?.region || "ap-south-1"}, AZ: ${n.data?.az || "ap-south-1a"})`).join("\n")}

Entry Point: ${entryNode?.label || architecture.entryPoint || "None"}
Failed Component: ${failedNode?.label || simResult.failedNodeId}
Single Point of Failure: ${simResult.singlePointOfFailure}
Newly Unreachable Components: ${newlyUnreachableLabels.length > 0 ? newlyUnreachableLabels.join(", ") : "None (Redundancy preserved reachability)"}
Total Reachable Remaining: ${simResult.reachableCount}
Total Unreachable: ${simResult.unreachableCount}

Provide the resilience analysis in strict JSON.`;

  try {
    const { text, modelUsed } = await callGeminiApi({
      prompt,
      systemInstruction,
      responseFormat: "json",
      temperature: 0.2,
    });

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
    return {
      available: false,
      reason: err.message,
    };
  }
}

/**
 * 2. Natural Language Prompt-to-Architecture Generator
 * Converts user prompt into a structured graph with ReactFlow nodes, containers, and edges.
 */
export async function generateArchitectureFromPrompt(promptText, options = {}) {
  const allowedComponents = COMPONENT_TYPES.map((c) => ({
    type: c.type,
    label: c.label,
    category: c.category,
    description: c.description,
  }));

  const allowedContainers = GROUP_TYPES.map((g) => ({
    type: g.type,
    label: g.label,
  }));

  const systemInstruction = `You are an AWS Certified Solutions Architect and Cloud Graph Designer.
Your task is to take a natural language user request and generate a complete, production-ready cloud architecture diagram.

ALLOWED COMPONENT TYPES (You can ONLY use these 'type' values for nodes):
${JSON.stringify(allowedComponents, null, 2)}

ALLOWED CONTAINER TYPES (You can ONLY use these 'groupType' values for containers):
${JSON.stringify(allowedContainers, null, 2)}

You MUST output strictly valid JSON matching this schema:
{
  "name": "Short, professional title for the architecture",
  "description": "1-2 sentence overview of the architecture design and topology",
  "region": "AWS region (e.g. ap-south-1, us-east-1, eu-west-1)",
  "az": "Primary AZ (e.g. ap-south-1a)",
  "entryPointId": "ID of the primary ingress node (e.g. node_apigw or node_alb or node_cf)",
  "containers": [
    {
      "id": "group_vpc_1",
      "type": "container",
      "groupType": "vpc",
      "label": "Custom VPC (10.0.0.0/16)",
      "position": { "x": 50, "y": 50 },
      "style": { "width": 800, "height": 450 }
    }
  ],
  "nodes": [
    {
      "id": "node_alb",
      "label": "Application Load Balancer",
      "componentType": "loadbalancer",
      "region": "ap-south-1",
      "az": "ap-south-1a",
      "position": { "x": 100, "y": 180 },
      "parentId": "group_vpc_1" (optional, if inside container)
    }
  ],
  "edges": [
    {
      "id": "e_alb_to_ec2",
      "source": "node_alb",
      "target": "node_ec2_1"
    }
  ],
  "designRationale": [
    "High availability: Multi-AZ deployment prevents single points of failure",
    "Security: Database isolated in private subnet",
    "Performance: CloudFront caching static assets at edge locations"
  ]
}

LAYOUT & POSITIONING GUIDELINES:
- Layout should flow left-to-right (ingress at x=80..150, compute at x=360..450, data/databases at x=680..800).
- Vertically space parallel components (e.g., redundant EC2s at y=100 and y=260).
- Connect edges logically in the direction of traffic flow (Client/CDN -> ALB/API Gateway -> EC2/Lambda -> RDS/DynamoDB/S3).
- Always specify an entryPointId matching the initial ingress node.`;

  const prompt = `User Architecture Request:
"${promptText}"

Selected Region Context: ${options.region || "ap-south-1"} (AZ: ${options.az || "ap-south-1a"})

Generate the complete architecture in valid JSON.`;

  const { text } = await callGeminiApi({
    prompt,
    systemInstruction,
    responseFormat: "json",
    temperature: 0.3,
  });

  const parsed = JSON.parse(text);

  // Validate and sanitize the generated graph
  const validComponentTypes = new Set(COMPONENT_TYPES.map((c) => c.type));
  const validGroupTypes = new Set(GROUP_TYPES.map((g) => g.type));

  const containers = (parsed.containers || []).map((c, idx) => ({
    id: c.id || `container_${idx + 1}`,
    type: "container",
    position: c.position || { x: 50, y: 50 },
    style: c.style || { width: 700, height: 420 },
    zIndex: -1,
    data: {
      groupType: validGroupTypes.has(c.groupType) ? c.groupType : "vpc",
      label: c.label || "VPC Group",
    },
  }));

  const nodes = (parsed.nodes || []).map((n, idx) => {
    const rawType = (n.componentType || n.type || "vm").toLowerCase();
    const componentType = validComponentTypes.has(rawType) ? rawType : "vm";
    const meta = COMPONENT_TYPES.find((c) => c.type === componentType);

    return {
      id: n.id || `node_${idx + 1}`,
      type: "cloudNode",
      position: n.position || { x: 100 + (idx % 3) * 280, y: 100 + Math.floor(idx / 3) * 160 },
      ...(n.parentId ? { parentId: n.parentId, extent: "parent" } : {}),
      data: {
        label: n.label || meta?.label || `Component ${idx + 1}`,
        componentType,
        region: n.region || parsed.region || options.region || "ap-south-1",
        az: n.az || parsed.az || options.az || "ap-south-1a",
      },
    };
  });

  const edges = (parsed.edges || []).map((e, idx) => ({
    id: e.id || `e_${idx + 1}`,
    source: e.source,
    target: e.target,
    animated: true,
  }));

  const flowNodes = [...containers, ...nodes];
  const entryPoint = parsed.entryPointId || nodes[0]?.id || null;

  return {
    name: parsed.name || "AI Generated Cloud Architecture",
    description: parsed.description || "Architecture generated by Google Gemini AI.",
    region: parsed.region || options.region || "ap-south-1",
    az: parsed.az || options.az || "ap-south-1a",
    designRationale: parsed.designRationale || [],
    architecture: {
      entryPoint,
      nodes: flowNodes,
      edges,
    },
  };
}

/**
 * 3. Interactive Cloud Architect AI Copilot Chat
 * Context-aware conversational assistant
 */
export async function chatWithCloudArchitect(messages, architectureContext = {}) {
  const { nodes = [], edges = [], entryPoint = null, region = "ap-south-1", simResult = null } = architectureContext;

  const nodeSummary = nodes
    .filter((n) => n.type !== "regionGroup")
    .map((n) => {
      const isEntry = n.id === entryPoint;
      const type = n.data?.componentType || n.type;
      return `- [${n.id}] ${n.data?.label || n.id} (Type: ${type}, AZ: ${n.data?.az || "default"})${isEntry ? " [ENTRY POINT]" : ""}`;
    })
    .join("\n");

  const edgeSummary = edges.map((e) => `- ${e.source} ➔ ${e.target}`).join("\n");

  const systemInstruction = `You are Cloud Architect AI, an elite AWS Solutions Architect and Site Reliability Engineer powered by Google's free Gemini API.
You are helping the user build, inspect, secure, and optimize their cloud architecture in real-time.

CURRENT LIVE ARCHITECTURE CONTEXT:
- Region: ${region}
- Entry Point: ${entryPoint || "None set"}
- Active Components (${nodes.length}):
${nodeSummary || "No components on canvas yet."}
- Connections (${edges.length}):
${edgeSummary || "No connections yet."}
${
  simResult
    ? `- Active Failure Simulation: Failed component "${simResult.failedLabel || simResult.failedNodeId}" | SPOF: ${simResult.singlePointOfFailure ? "YES (Outage)" : "NO (Redundant)"}`
    : "- Active Failure Simulation: None currently running."
}

GUIDELINES FOR YOUR RESPONSES:
- Provide clear, professional, direct AWS architecture advice.
- Use markdown formatting with bullet points, bold text, and code blocks where helpful.
- Suggest concrete improvements (e.g. adding Multi-AZ standby, Auto-Scaling Groups, CloudFront CDN, S3 lifecycle policies, IAM least privilege).
- If the user asks about costs, mention AWS Free Tier eligibility and cost reduction tips.
- Keep answers insightful, concise, and easy to act upon.`;

  // Format the conversation history for prompt
  const conversationTranscript = messages
    .map((m) => `${m.role === "user" ? "User" : "Cloud Architect AI"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${conversationTranscript}
Cloud Architect AI:`;

  const { text, modelUsed } = await callGeminiApi({
    prompt,
    systemInstruction,
    temperature: 0.5,
  });

  return { text, modelUsed };
}

/**
 * 4. Well-Architected Framework Audit (5 Pillars)
 */
export async function auditWellArchitected(architecture) {
  const nodesById = new Map(architecture.nodes.map((n) => [n.id, n]));
  const componentList = architecture.nodes
    .filter((n) => n.type !== "regionGroup")
    .map((n) => `- ${n.label || n.data?.label} (Type: ${n.data?.componentType || n.type})`)
    .join("\n");

  const edgeList = architecture.edges.map((e) => `- ${nodesById.get(e.source)?.label || e.source} -> ${nodesById.get(e.target)?.label || e.target}`).join("\n");

  const systemInstruction = `You are a Principal AWS Solutions Architect auditing a system against the AWS Well-Architected Framework.
Output strict JSON with this schema:
{
  "overallScore": number (0 to 100),
  "summary": "Brief summary of the architecture posture",
  "pillars": {
    "reliability": { "score": number, "status": "Good|Fair|At Risk", "findings": ["string"] },
    "security": { "score": number, "status": "Good|Fair|At Risk", "findings": ["string"] },
    "costOptimization": { "score": number, "status": "Good|Fair|At Risk", "findings": ["string"] },
    "performanceEfficiency": { "score": number, "status": "Good|Fair|At Risk", "findings": ["string"] },
    "operationalExcellence": { "score": number, "status": "Good|Fair|At Risk", "findings": ["string"] }
  },
  "topPriorityActions": [
    { "title": "string", "pillar": "string", "impact": "High|Medium|Low", "description": "string" }
  ]
}`;

  const prompt = `Components:
${componentList}

Edges:
${edgeList}

Entry Point: ${nodesById.get(architecture.entryPoint)?.label || architecture.entryPoint || "None"}

Perform the Well-Architected Audit in strict JSON.`;

  const { text, modelUsed } = await callGeminiApi({
    prompt,
    systemInstruction,
    responseFormat: "json",
    temperature: 0.3,
  });

  return { data: JSON.parse(text), modelUsed };
}
