import { describe, it, expect } from "vitest";
import { cleanArchitectureGraph, validateAndRepairAuditOutput, isValidComponentType, isValidGroupType } from "../../services/aiValidator";
import { sanitizeGeneratedArchitecture } from "../../services/promptTemplates";

describe("isValidComponentType / isValidGroupType", () => {
  it("accepts known types and rejects invented ones", () => {
    expect(isValidComponentType("vm")).toBe(true);
    expect(isValidComponentType("quantum-computer")).toBe(false);
    expect(isValidGroupType("vpc")).toBe(true);
    expect(isValidGroupType("made-up-group")).toBe(false);
  });
});

describe("cleanArchitectureGraph", () => {
  const nodes = [{ id: "a" }, { id: "b" }];
  const containers = [{ id: "c1" }];

  it("drops edges referencing a non-existent node", () => {
    const result = cleanArchitectureGraph({
      nodes,
      containers,
      edges: [
        { source: "a", target: "b" },
        { source: "a", target: "ghost" },
      ],
      entryPoint: "a",
    });
    expect(result.edges).toEqual([{ source: "a", target: "b" }]);
  });

  it("clears a parentId that references a non-existent container", () => {
    const result = cleanArchitectureGraph({
      nodes: [{ id: "a", parentId: "not_a_real_container" }, { id: "b" }],
      containers,
      edges: [],
      entryPoint: "a",
    });
    const nodeA = result.nodes.find((n) => n.id === "a");
    expect(nodeA.parentId).toBeUndefined();
  });

  it("falls back entryPoint to the first node if the given one doesn't exist", () => {
    const result = cleanArchitectureGraph({ nodes, containers, edges: [], entryPoint: "missing" });
    expect(result.entryPoint).toBe("a");
  });
});

describe("sanitizeGeneratedArchitecture — CASE 1: does not assign a fake AZ to regional services", () => {
  const parsed = {
    region: "ap-south-1",
    entryPointId: "node_1",
    nodes: [
      { id: "node_1", componentType: "apigateway", label: "API" },
      { id: "node_2", componentType: "sqs", label: "Queue" },
      { id: "node_3", componentType: "dynamodb", label: "Table" },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
    ],
  };

  const result = sanitizeGeneratedArchitecture(parsed, { region: "ap-south-1", az: "ap-south-1a" });

  it("omits az for regional-scoped nodes even when a fallback AZ option is supplied", () => {
    for (const n of result.architecture.nodes) {
      expect(n.data.az).toBeUndefined();
    }
  });
});

describe("sanitizeGeneratedArchitecture — CASE 4: SQS without a modeled DLQ is just a normal node", () => {
  const parsed = {
    nodes: [{ id: "q1", componentType: "sqs", label: "Orders Queue" }],
    edges: [],
    entryPointId: "q1",
  };
  const result = sanitizeGeneratedArchitecture(parsed);

  it("keeps the queue node without fabricating DLQ information", () => {
    const node = result.architecture.nodes.find((n) => n.id === "q1");
    expect(node.data.componentType).toBe("sqs");
    expect(node.data).not.toHaveProperty("dlq");
  });
});

describe("sanitizeGeneratedArchitecture — falls back invalid/unknown component types safely", () => {
  const parsed = {
    nodes: [{ id: "n1", componentType: "quantum-computer", label: "???" }],
    edges: [],
  };
  const result = sanitizeGeneratedArchitecture(parsed);

  it("coerces an unknown component type to the safe default (vm)", () => {
    expect(result.architecture.nodes[0].data.componentType).toBe("vm");
  });
});

describe("sanitizeGeneratedArchitecture — drops dangling edges and bad parent references", () => {
  const parsed = {
    nodes: [
      { id: "n1", componentType: "vm", parentId: "ghost_container" },
      { id: "n2", componentType: "vm" },
    ],
    edges: [
      { source: "n1", target: "n2" },
      { source: "n1", target: "does_not_exist" },
    ],
    entryPointId: "does_not_exist_either",
  };
  const result = sanitizeGeneratedArchitecture(parsed);

  it("drops the edge to a nonexistent node", () => {
    expect(result.architecture.edges).toHaveLength(1);
  });

  it("strips the parentId pointing at a nonexistent container", () => {
    const n1 = result.architecture.nodes.find((n) => n.id === "n1");
    expect(n1.parentId).toBeUndefined();
  });

  it("falls back the entry point to the first valid node", () => {
    expect(result.architecture.entryPoint).toBe("n1");
  });
});

describe("validateAndRepairAuditOutput", () => {
  it("clamps overallScore into 0-100 and drops findings missing required evidence/recommendation", () => {
    const repaired = validateAndRepairAuditOutput({
      overallScore: 140,
      summary: "Mostly solid.",
      findings: [
        { severity: "HIGH", category: "SECURITY", title: "Public DB", evidence: "DB has no VPC info", recommendation: "Move to private subnet" },
        { title: "Incomplete finding — missing evidence/recommendation" },
      ],
      topPriorityActions: [{ title: "Fix DB exposure", severity: "HIGH", reason: "Highest risk" }],
    });

    expect(repaired.overallScore).toBe(100);
    expect(repaired.findings).toHaveLength(1);
    expect(repaired.findings[0].title).toBe("Public DB");
  });

  it("coerces unknown severity/category to safe defaults instead of dropping the finding", () => {
    const repaired = validateAndRepairAuditOutput({
      overallScore: 50,
      findings: [
        { severity: "SUPER_CRITICAL", category: "MADE_UP", title: "Something", evidence: "e", recommendation: "r" },
      ],
    });
    expect(repaired.findings[0].severity).toBe("INFO");
    expect(repaired.findings[0].category).toBe("OPERATIONS");
  });

  it("handles completely malformed input without throwing", () => {
    const repaired = validateAndRepairAuditOutput(null);
    expect(repaired.overallScore).toBeNull();
    expect(repaired.findings).toEqual([]);
    expect(repaired.topPriorityActions).toEqual([]);
  });
});

describe("CASE 5: missing security-group information is never treated as a vulnerability by the validator", () => {
  it("a finding with no evidence field is dropped rather than assumed insecure", () => {
    const repaired = validateAndRepairAuditOutput({
      findings: [{ severity: "HIGH", category: "SECURITY", title: "Security group is insecure" }],
    });
    // No `evidence`/`recommendation` supplied -> dropped, not fabricated.
    expect(repaired.findings).toHaveLength(0);
  });
});
