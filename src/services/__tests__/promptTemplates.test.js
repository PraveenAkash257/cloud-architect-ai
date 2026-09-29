import { describe, it, expect } from "vitest";
import { buildFailureExplanationPrompt } from "../promptTemplates";

describe("buildFailureExplanationPrompt — CASE 6: ALB failure disconnects EC2 nodes", () => {
  const architecture = {
    entryPoint: "alb",
    nodes: [
      { id: "alb", type: "loadbalancer", label: "ALB" },
      { id: "ec2-1", type: "vm", label: "EC2 A", az: "ap-south-1a" },
      { id: "ec2-2", type: "vm", label: "EC2 B", az: "ap-south-1a" },
    ],
    edges: [
      { source: "alb", target: "ec2-1" },
      { source: "alb", target: "ec2-2" },
    ],
  };
  const simResult = {
    failedNodeId: "alb",
    singlePointOfFailure: true,
    resilience: "CRITICAL",
    newlyUnreachable: ["ec2-1", "ec2-2"],
    reachableCount: 0,
    unreachableCount: 2,
  };

  const { systemInstruction } = buildFailureExplanationPrompt(architecture, simResult);

  it("instructs the model to describe the ALB as a modeled dependency, not a real-world certainty", () => {
    expect(systemInstruction).toContain("modeled single ingress dependency");
    expect(systemInstruction).toContain("GRAPH SPOF");
    expect(systemInstruction).toContain("AWS SERVICE DEPLOYMENT CHARACTERISTICS");
  });

  it("locks singlePointOfFailure to the deterministic simulation result", () => {
    expect(systemInstruction).toContain("singlePointOfFailure MUST be exactly true");
  });
});
