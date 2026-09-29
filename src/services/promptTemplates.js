/**
 * Provider-agnostic prompt construction.
 *
 * Both geminiService.js and groqService.js call the exact same builders
 * here, so the two providers are guaranteed to be asked the same question
 * in the same way — only the HTTP transport and model differ between them.
 *
 * All prompt builders route architecture data through
 * architectureContext.js's buildCompactArchitectureContext(), which is the
 * single place that decides AWS region/AZ scope semantics (see
 * data/awsServiceKnowledge.js). This keeps every feature — generation,
 * failure explanation, audit, copilot — consistent and prevents regional/
 * global services (S3, SQS, DynamoDB, CloudFront, ...) from being reported
 * as if they lived in one Availability Zone.
 */

import { COMPONENT_TYPES } from "../data/componentTypes";
import { GROUP_TYPES } from "../data/groupTypes";
import { AWS_SERVICE_KNOWLEDGE } from "../data/awsServiceKnowledge";
import { buildCompactArchitectureContext, buildCompactSimulationFacts } from "./architectureContext";
import { cleanArchitectureGraph } from "./aiValidator";

// Shared across every prompt that reasons about an architecture. Kept short
// on purpose — this is a free-tier app and every token here is paid on
// every single call.
const ANTI_HALLUCINATION_RULES = `ANTI-HALLUCINATION RULES (apply strictly):
- Never invent nodes, edges, or components not explicitly supplied.
- Never invent traffic volume, latency, or throughput numbers.
- Never assume VPC attachment, security groups, IAM configuration, backups, encryption, or Multi-AZ unless explicitly represented.
- Never claim a service is deployed in a single AZ unless an AZ is explicitly given for it.
- If information needed for a judgment is missing, say exactly: "Not represented in the architecture."
- If a conclusion depends on unstated configuration, phrase it conditionally, e.g. "If the service is VPC-connected..." or "If the database is configured as single-AZ...".`;

function componentKnowledgeLine(c) {
  const k = AWS_SERVICE_KNOWLEDGE[c.type];
  return {
    type: c.type,
    label: c.label,
    category: c.category,
    scope: k?.scope || "UNKNOWN",
  };
}

export function buildFailureExplanationPrompt(architecture, simResult) {
  const context = buildCompactArchitectureContext({
    nodes: architecture.nodes,
    edges: architecture.edges,
    entryPoint: architecture.entryPoint,
  });
  const facts = buildCompactSimulationFacts(simResult);
  const nodesById = new Map(architecture.nodes.map((n) => [n.id, n]));
  const newlyUnreachableLabels = (simResult.newlyUnreachable || []).map((id) => nodesById.get(id)?.label || id);
  const failedLabel = nodesById.get(simResult.failedNodeId)?.label || simResult.failedNodeId;

  const systemInstruction = `You are a Principal AWS Cloud Resilience and Site Reliability Engineer.
Analyze the deterministic failure simulation facts for this cloud architecture. The graph connectivity result (SPOF, reachability) has ALREADY been computed deterministically and is NOT yours to recompute or contradict — your job is to explain it.

You MUST distinguish two different kinds of statement:
- GRAPH SPOF: a fact about the supplied topology (e.g. "no alternate path exists in this diagram").
- AWS SERVICE DEPLOYMENT CHARACTERISTICS: general facts about how the AWS service behaves (e.g. "S3 is a regional service").
Do not conflate the two. Say "${failedLabel} is a modeled single ingress dependency because no alternate path exists in the supplied topology," not "${failedLabel} will definitely fail."

${ANTI_HALLUCINATION_RULES}

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
      "expectedImprovement": "Expected resilience gain, described qualitatively (e.g. 'removes this single point of failure'), not a fabricated percentage"
    }
  ],
  "securityAndCostImpact": "Brief note on security or cost trade-off of the recommended fix"
}
CRITICAL RULES:
- singlePointOfFailure MUST be exactly ${simResult.singlePointOfFailure}.
- Only reference component ids/labels present in the architecture context below.`;

  const prompt = `Architecture (compact, region/AZ shown only where architecturally meaningful):
${JSON.stringify(context, null, 0)}

Deterministic simulation facts (already computed — do not recompute):
${JSON.stringify(facts, null, 0)}
Newly unreachable (labels): ${newlyUnreachableLabels.length > 0 ? newlyUnreachableLabels.join(", ") : "None (redundancy preserved reachability)"}
Failed component: ${failedLabel}

Provide the resilience analysis in strict JSON.`;

  return { systemInstruction, prompt };
}

export function buildArchitectureGenerationPrompt(promptText, options = {}) {
  const allowedComponents = COMPONENT_TYPES.map((c) => ({
    ...componentKnowledgeLine(c),
    description: c.description,
  }));

  const allowedContainers = GROUP_TYPES.map((g) => ({
    type: g.type,
    label: g.label,
  }));

  const systemInstruction = `You are an AWS Certified Solutions Architect and Cloud Graph Designer.
Your task is to take a natural language user request and generate a complete, production-ready cloud architecture diagram.

Prefer architectural correctness over architectural complexity.

GENERATION RULES:
1. Understand the user's actual requirements before designing anything.
2. Prefer the simplest architecture that satisfies them — do not over-engineer.
3. Use appropriate AWS services and create a logical traffic/data flow.
4. Every node id must be unique and valid; every edge's source and target must reference an existing node id.
5. Every parentId must reference an existing container id.
6. entryPointId must reference an existing node id.
7. Use ONLY the component types and container types listed below — never invent an AWS service or type.
8. The "scope" field below tells you whether AZ placement is meaningful for that service: GLOBAL and REGIONAL services must NOT be given an "az" — omit it entirely. Only AZ/MULTI_AZ-scoped services (e.g. EC2, RDS, Auto Scaling) may have an "az".
9. Use multiple AZs only when the user's requirements justify high availability or redundancy — do not claim redundancy merely because multiple services exist.
10. Consider security, reliability, performance, and cost; do not add unnecessary infrastructure.

${ANTI_HALLUCINATION_RULES}

ALLOWED COMPONENT TYPES (You can ONLY use these 'type' values for nodes; "scope" tells you whether "az" is meaningful for that type):
${JSON.stringify(allowedComponents, null, 2)}

ALLOWED CONTAINER TYPES (You can ONLY use these 'groupType' values for containers):
${JSON.stringify(allowedContainers, null, 2)}

You MUST output strictly valid JSON matching this schema:
{
  "name": "Short, professional title for the architecture",
  "description": "1-2 sentence overview of the architecture design and topology",
  "region": "AWS region (e.g. ap-south-1, us-east-1, eu-west-1)",
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
      "position": { "x": 100, "y": 180 },
      "parentId": "group_vpc_1" (optional, if inside container)
    },
    {
      "id": "node_ec2_1",
      "label": "EC2 Instance",
      "componentType": "vm",
      "region": "ap-south-1",
      "az": "ap-south-1a",
      "position": { "x": 380, "y": 100 }
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

Note: omit "az" entirely for GLOBAL/REGIONAL-scoped nodes (e.g. S3, SQS, DynamoDB, CloudFront, API Gateway) — only include it for AZ/MULTI_AZ-scoped nodes (e.g. EC2, RDS, Auto Scaling), and only when that placement is actually part of the design.

LAYOUT & POSITIONING GUIDELINES:
- Layout should flow left-to-right (ingress at x=80..150, compute at x=360..450, data/databases at x=680..800).
- Vertically space parallel components (e.g., redundant EC2s at y=100 and y=260).
- Connect edges logically in the direction of traffic flow (Client/CDN -> ALB/API Gateway -> EC2/Lambda -> RDS/DynamoDB/S3).
- Always specify an entryPointId matching the initial ingress node.`;

  const prompt = `User Architecture Request:
"${promptText}"

Selected Region Context: ${options.region || "ap-south-1"}${options.az ? ` (AZ: ${options.az}, use only for AZ-scoped nodes if relevant)` : ""}

Generate the complete architecture in valid JSON.`;

  return { systemInstruction, prompt };
}

export function buildCopilotChatPrompt(messages, architectureContext = {}) {
  const { nodes = [], edges = [], entryPoint = null, region = "ap-south-1", simResult = null, auditFindings = null } = architectureContext;

  const context = buildCompactArchitectureContext({ nodes, edges, entryPoint, region });
  const facts = buildCompactSimulationFacts(simResult);

  const systemInstruction = `You are Cloud Architect AI, an elite AWS Solutions Architect and Site Reliability Engineer.
You are helping the user build, inspect, secure, and optimize their cloud architecture in real-time.

CURRENT LIVE ARCHITECTURE CONTEXT (compact; region/AZ shown only where architecturally meaningful):
${JSON.stringify(context, null, 0)}
${facts ? `\nACTIVE FAILURE SIMULATION (deterministic, already computed): ${JSON.stringify(facts, null, 0)}` : "\nActive Failure Simulation: None currently running."}
${auditFindings ? `\nMOST RECENT AUDIT FINDINGS: ${JSON.stringify(auditFindings, null, 0)}` : ""}

${ANTI_HALLUCINATION_RULES}

GUIDELINES FOR YOUR RESPONSES:
- Base every answer on the actual architecture context above — e.g. for "where is my SPOF?" inspect the real topology; for "is this highly available?" inspect actual AZ distribution and dependencies; for "how do I improve it?" prioritize the most important actual findings.
- Provide clear, professional, direct AWS architecture advice. Keep answers concise and actionable — prefer a short list of concrete points over a long essay.
- Use markdown formatting with bullet points, bold text, and code blocks where helpful.
- If the user asks about costs, mention AWS Free Tier eligibility and cost reduction tips.`;

  // Keep only the most recent messages so token usage stays flat as the
  // conversation grows — the compact architecture context above is always
  // included fresh, so older chat turns add little value anyway.
  const recentMessages = messages.slice(-6);
  const conversationTranscript = recentMessages
    .map((m) => `${m.role === "user" ? "User" : "Cloud Architect AI"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${conversationTranscript}\nCloud Architect AI:`;

  return { systemInstruction, prompt };
}

export function buildWellArchitectedAuditPrompt(architecture) {
  const context = buildCompactArchitectureContext({
    nodes: architecture.nodes,
    edges: architecture.edges,
    entryPoint: architecture.entryPoint,
  });

  const systemInstruction = `You are a Principal AWS Solutions Architect auditing a system against the AWS Well-Architected Framework.
Analyze ONLY the supplied architecture below. Do not give generic AWS advice unless it is tied to specific evidence in this architecture.

${ANTI_HALLUCINATION_RULES}

If a pillar cannot be evaluated because relevant configuration isn't represented (e.g. no security-group or IAM information at all), do not treat that absence as a vulnerability — state "Not represented in the architecture" instead.

Score based only on evidence actually present. A missing configuration that simply cannot be evaluated should not automatically lower the score.

You MUST output strictly valid JSON matching this schema:
{
  "overallScore": number (0 to 100, evidence-based, no fabricated precision),
  "summary": "short summary of the architecture posture",
  "findings": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "RELIABILITY|SECURITY|PERFORMANCE|COST|OPERATIONS",
      "title": "short title",
      "affectedNodes": ["node_id"],
      "evidence": "specific evidence from the supplied architecture",
      "impact": "what could happen",
      "recommendation": "specific improvement",
      "tradeoff": "cost/complexity tradeoff if relevant"
    }
  ],
  "topPriorityActions": [
    { "title": "short title", "severity": "CRITICAL|HIGH|MEDIUM|LOW", "reason": "why this should be prioritized" }
  ]
}
Keep findings concise — Finding / Evidence / Impact / Recommendation / Tradeoff, not long paragraphs. Do not invent exact availability percentages or exact dollar costs.

Check where applicable: RELIABILITY (single-AZ deployment, single instance, single dependency, missing DLQ, backup/recovery, autoscaling), SECURITY (public exposure, IAM, encryption, TLS, WAF, logging), PERFORMANCE (bottlenecks, synchronous chains, caching, CDN, queue buffering), COST (unnecessary infrastructure, NAT Gateway, always-on compute, redundancy, storage lifecycle), OPERATIONS (monitoring, alarms, failure detection).`;

  const prompt = `Architecture (compact, region/AZ shown only where architecturally meaningful):
${JSON.stringify(context, null, 0)}

Perform the Well-Architected Audit in strict JSON, grounded only in the architecture above.`;

  return { systemInstruction, prompt };
}

/**
 * Shared post-processing for the architecture-generation feature: validates
 * and sanitizes whatever JSON a provider returns against the app's actual
 * allowed component/container types, so a hallucinated type from either
 * provider can never reach the canvas.
 */
export function sanitizeGeneratedArchitecture(parsed, options = {}) {
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
    const knowledge = AWS_SERVICE_KNOWLEDGE[componentType];
    // Only carry an AZ onto the node when the service's scope actually makes
    // AZ placement meaningful. Regional/global services (S3, SQS, DynamoDB,
    // CloudFront, ...) must never be stamped with a fabricated AZ — that
    // false precision is exactly what causes incorrect resilience analysis
    // downstream (e.g. reporting a "single-AZ S3 bucket").
    const azIsMeaningful = !knowledge || knowledge.scope === "AZ" || knowledge.scope === "MULTI_AZ";
    const az = azIsMeaningful ? n.az || parsed.az || options.az || undefined : undefined;

    return {
      id: n.id || `node_${idx + 1}`,
      type: "cloudNode",
      position: n.position || { x: 100 + (idx % 3) * 280, y: 100 + Math.floor(idx / 3) * 160 },
      ...(n.parentId ? { parentId: n.parentId, extent: "parent" } : {}),
      data: {
        label: n.label || meta?.label || `Component ${idx + 1}`,
        componentType,
        region: n.region || parsed.region || options.region || "ap-south-1",
        ...(az ? { az } : {}),
      },
    };
  });

  const edges = (parsed.edges || []).map((e, idx) => ({
    id: e.id || `e_${idx + 1}`,
    source: e.source,
    target: e.target,
    animated: true,
  }));

  const rawEntryPoint = parsed.entryPointId || nodes[0]?.id || null;
  // cleanArchitectureGraph works against plain node/edge shapes, so build
  // lightweight stand-ins (it only needs .id / .parentId / .source / .target).
  const cleaned = cleanArchitectureGraph({
    nodes: nodes.map((n) => ({ id: n.id, parentId: n.parentId })),
    containers,
    edges,
    entryPoint: rawEntryPoint,
  });
  const cleanedParentById = new Map(cleaned.nodes.map((c) => [c.id, c.parentId]));
  const finalNodes = nodes.map((n) => {
    const keepParentId = cleanedParentById.get(n.id);
    if (n.parentId && !keepParentId) {
      const { parentId, extent, ...rest } = n;
      return rest;
    }
    return n;
  });

  const flowNodes = [...containers, ...finalNodes];

  return {
    name: parsed.name || "AI Generated Cloud Architecture",
    description: parsed.description || "Architecture generated by AI.",
    region: parsed.region || options.region || "ap-south-1",
    az: parsed.az || options.az || "ap-south-1a",
    designRationale: parsed.designRationale || [],
    architecture: {
      entryPoint: cleaned.entryPoint,
      nodes: flowNodes,
      edges: cleaned.edges,
    },
  };
}
