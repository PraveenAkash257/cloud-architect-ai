import { describe, it, expect } from "vitest";
import { buildCompactArchitectureContext } from "../architectureContext";

// Canonical-shaped nodes (as produced by utils/architecture.js toCanonicalArchitecture)
function canonicalNode(id, type, extra = {}) {
  return { id, type, label: id, ...extra };
}

describe("buildCompactArchitectureContext — CASE 1: API Gateway -> SQS -> Lambda -> DynamoDB", () => {
  const nodes = [
    canonicalNode("api", "apigateway"),
    canonicalNode("queue", "sqs"),
    canonicalNode("fn", "serverless"),
    canonicalNode("table", "dynamodb"),
  ];
  const edges = [
    { source: "api", target: "queue" },
    { source: "queue", target: "fn" },
    { source: "fn", target: "table" },
  ];

  const context = buildCompactArchitectureContext({ nodes, edges, entryPoint: "api", region: "ap-south-1" });

  it("marks SQS and DynamoDB as REGIONAL", () => {
    expect(context.nodes.find((n) => n.id === "queue").scope).toBe("REGIONAL");
    expect(context.nodes.find((n) => n.id === "table").scope).toBe("REGIONAL");
  });

  it("never attaches an AZ to regional services even without one supplied", () => {
    for (const n of context.nodes) {
      if (["queue", "table", "api"].includes(n.id)) {
        expect(n.az).toBeUndefined();
      }
    }
  });

  it("keeps all edges since every source/target exists", () => {
    expect(context.edges).toHaveLength(3);
  });
});

describe("buildCompactArchitectureContext — CASE 2: EC2 only in ap-south-1a", () => {
  const nodes = [canonicalNode("ec2-1", "vm", { az: "ap-south-1a" })];
  const context = buildCompactArchitectureContext({ nodes, edges: [], entryPoint: "ec2-1", region: "ap-south-1" });

  it("surfaces the AZ for an AZ-scoped service", () => {
    const ec2 = context.nodes.find((n) => n.id === "ec2-1");
    expect(ec2.scope).toBe("AZ");
    expect(ec2.az).toBe("ap-south-1a");
  });
});

describe("buildCompactArchitectureContext — CASE 3: EC2 in two AZs", () => {
  const nodes = [
    canonicalNode("ec2-1", "vm", { az: "ap-south-1a" }),
    canonicalNode("ec2-2", "vm", { az: "ap-south-1b" }),
  ];
  const context = buildCompactArchitectureContext({ nodes, edges: [], entryPoint: "ec2-1", region: "ap-south-1" });

  it("reports each EC2's own distinct AZ", () => {
    const azs = context.nodes.map((n) => n.az);
    expect(new Set(azs).size).toBe(2);
  });
});

describe("buildCompactArchitectureContext — never invents an AZ for global/regional services", () => {
  const nodes = [
    canonicalNode("s3", "storage"),
    canonicalNode("cf", "cdn"),
    canonicalNode("dns", "route53"),
  ];
  const context = buildCompactArchitectureContext({ nodes, edges: [], entryPoint: "cf", region: "ap-south-1" });

  it("omits az for S3 (REGIONAL) and marks CDN/Route53 as GLOBAL", () => {
    expect(context.nodes.find((n) => n.id === "s3").az).toBeUndefined();
    expect(context.nodes.find((n) => n.id === "cf").scope).toBe("GLOBAL");
    expect(context.nodes.find((n) => n.id === "dns").scope).toBe("GLOBAL");
  });
});

describe("buildCompactArchitectureContext — drops dangling edges and container pseudo-nodes", () => {
  const nodes = [
    canonicalNode("alb", "loadbalancer"),
    canonicalNode("ec2", "vm", { az: "ap-south-1a" }),
    { id: "group_1", type: "regionGroup", label: "ap-south-1a" },
  ];
  const edges = [
    { source: "alb", target: "ec2" },
    { source: "ec2", target: "does_not_exist" },
  ];
  const context = buildCompactArchitectureContext({ nodes, edges, entryPoint: "alb", region: "ap-south-1" });

  it("excludes the regionGroup visual node", () => {
    expect(context.nodes.find((n) => n.id === "group_1")).toBeUndefined();
  });

  it("drops the edge referencing a missing node", () => {
    expect(context.edges).toHaveLength(1);
    expect(context.edges[0]).toEqual({ source: "alb", target: "ec2" });
  });
});

describe("buildCompactArchitectureContext — React Flow node shape", () => {
  it("normalizes RF-shaped nodes (data.componentType/data.az) the same way as canonical nodes", () => {
    const rfNodes = [
      { id: "ec2", type: "cloudNode", parentId: undefined, data: { label: "Web Server", componentType: "vm", region: "ap-south-1", az: "ap-south-1a" } },
      { id: "sqs", type: "cloudNode", data: { label: "Queue", componentType: "sqs", region: "ap-south-1" } },
    ];
    const rfEdges = [{ source: "ec2", target: "sqs" }];
    const context = buildCompactArchitectureContext({ nodes: rfNodes, edges: rfEdges, entryPoint: "ec2", region: "ap-south-1" });

    expect(context.nodes.find((n) => n.id === "ec2").scope).toBe("AZ");
    expect(context.nodes.find((n) => n.id === "ec2").az).toBe("ap-south-1a");
    expect(context.nodes.find((n) => n.id === "sqs").scope).toBe("REGIONAL");
    expect(context.nodes.find((n) => n.id === "sqs").az).toBeUndefined();
  });
});
