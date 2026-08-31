import { describe, it, expect } from "vitest";
import { simulateFailure, validateSimulationInput, detectFailurePoints, SIM_STATE, RESILIENCE } from "../simulateFailure";

function arch(nodeIds, edgePairs) {
  return {
    nodes: nodeIds.map((id) => ({ id, type: "generic", label: id })),
    edges: edgePairs.map(([source, target]) => ({ source, target })),
  };
}

describe("simulateFailure — Test 1: single point of failure", () => {
  // API -> LB -> EC2 -> DB, fail LB
  const architecture = arch(
    ["API", "LB", "EC2", "DB"],
    [
      ["API", "LB"],
      ["LB", "EC2"],
      ["EC2", "DB"],
    ]
  );

  it("marks LB failed and everything downstream unreachable", () => {
    const result = simulateFailure(architecture, "API", "LB");
    expect(result.valid).toBe(true);
    expect(result.states.get("API")).toBe(SIM_STATE.HEALTHY);
    expect(result.states.get("LB")).toBe(SIM_STATE.FAILED);
    expect(result.states.get("EC2")).toBe(SIM_STATE.UNREACHABLE);
    expect(result.states.get("DB")).toBe(SIM_STATE.UNREACHABLE);
    expect(result.singlePointOfFailure).toBe(true);
  });
});

describe("simulateFailure — Test 2: redundant paths", () => {
  // API -> LB1 -> EC2, API -> LB2 -> EC2, fail LB1
  const architecture = arch(
    ["API", "LB1", "LB2", "EC2"],
    [
      ["API", "LB1"],
      ["API", "LB2"],
      ["LB1", "EC2"],
      ["LB2", "EC2"],
    ]
  );

  it("keeps EC2 healthy through the redundant path", () => {
    const result = simulateFailure(architecture, "API", "LB1");
    expect(result.states.get("LB1")).toBe(SIM_STATE.FAILED);
    expect(result.states.get("LB2")).toBe(SIM_STATE.HEALTHY);
    expect(result.states.get("EC2")).toBe(SIM_STATE.HEALTHY);
    expect(result.singlePointOfFailure).toBe(false);
    expect(result.resilience).toBe(RESILIENCE.HIGH);
  });
});

describe("simulateFailure — Test 3: failed leaf", () => {
  // API -> LB -> EC2, fail EC2
  const architecture = arch(
    ["API", "LB", "EC2"],
    [
      ["API", "LB"],
      ["LB", "EC2"],
    ]
  );

  it("keeps upstream nodes healthy when a leaf fails", () => {
    const result = simulateFailure(architecture, "API", "EC2");
    expect(result.states.get("API")).toBe(SIM_STATE.HEALTHY);
    expect(result.states.get("LB")).toBe(SIM_STATE.HEALTHY);
    expect(result.states.get("EC2")).toBe(SIM_STATE.FAILED);
  });
});

describe("simulateFailure — Test 4: pre-existing disconnection", () => {
  // API -> LB -> EC2, and a disconnected DB, fail LB
  const architecture = arch(["API", "LB", "EC2", "DB"], [
    ["API", "LB"],
    ["LB", "EC2"],
  ]);

  it("distinguishes pre-existing disconnection from failure-caused unreachability", () => {
    const result = simulateFailure(architecture, "API", "LB");
    expect(result.states.get("LB")).toBe(SIM_STATE.FAILED);
    expect(result.states.get("EC2")).toBe(SIM_STATE.UNREACHABLE);
    expect(result.states.get("DB")).toBe(SIM_STATE.PRE_EXISTING_DISCONNECTED);
    expect(result.newlyUnreachable).not.toContain("DB");
  });
});

describe("simulateFailure — Test 5: cycle", () => {
  // A -> B -> C -> A, entry A, fail B
  const architecture = arch(["A", "B", "C"], [
    ["A", "B"],
    ["B", "C"],
    ["C", "A"],
  ]);

  it("terminates safely and computes deterministic reachability", () => {
    const result = simulateFailure(architecture, "A", "B");
    expect(result.valid).toBe(true);
    expect(result.states.get("B")).toBe(SIM_STATE.FAILED);
    // With B removed, A can no longer reach B or C.
    expect(result.states.get("C")).toBe(SIM_STATE.UNREACHABLE);
    expect(result.states.get("A")).toBe(SIM_STATE.HEALTHY);
  });

  it("is deterministic across repeated runs", () => {
    const r1 = simulateFailure(architecture, "A", "B");
    const r2 = simulateFailure(architecture, "A", "B");
    expect([...r1.states.entries()]).toEqual([...r2.states.entries()]);
  });
});

describe("validation", () => {
  it("rejects a missing entry point", () => {
    const architecture = arch(["A", "B"], [["A", "B"]]);
    const result = validateSimulationInput(architecture, null, "B");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/entry point/i);
  });

  it("rejects an invalid edge reference", () => {
    const architecture = {
      nodes: [{ id: "A", type: "generic", label: "A" }],
      edges: [{ source: "A", target: "ghost" }],
    };
    const result = validateSimulationInput(architecture, "A", "A");
    expect(result.valid).toBe(false);
  });

  it("rejects an empty architecture", () => {
    const result = validateSimulationInput({ nodes: [], edges: [] }, null, null);
    expect(result.valid).toBe(false);
  });

  it("rejects a missing failed-node id", () => {
    const architecture = arch(["A", "B"], [["A", "B"]]);
    const result = validateSimulationInput(architecture, "A", "ghost");
    expect(result.valid).toBe(false);
  });
});

describe("repeated simulations", () => {
  it("can simulate different failures back to back without shared state", () => {
    const architecture = arch(["API", "LB", "EC2", "DB"], [
      ["API", "LB"],
      ["LB", "EC2"],
      ["EC2", "DB"],
    ]);
    const r1 = simulateFailure(architecture, "API", "LB");
    const r2 = simulateFailure(architecture, "API", "EC2");
    expect(r1.states.get("EC2")).toBe(SIM_STATE.UNREACHABLE);
    expect(r2.states.get("EC2")).toBe(SIM_STATE.FAILED);
    expect(r2.states.get("LB")).toBe(SIM_STATE.HEALTHY);
  });
});

describe("detectFailurePoints — auto-scan", () => {
  it("flags the load balancer as a SPOF but not the redundant path's siblings", () => {
    // API -> LB1 -> EC2, API -> LB2 -> EC2
    const architecture = arch(["API", "LB1", "LB2", "EC2"], [
      ["API", "LB1"],
      ["API", "LB2"],
      ["LB1", "EC2"],
      ["LB2", "EC2"],
    ]);
    const results = detectFailurePoints(architecture, "API");
    const byId = Object.fromEntries(results.map((r) => [r.nodeId, r]));
    expect(byId.LB1.singlePointOfFailure).toBe(false);
    expect(byId.LB2.singlePointOfFailure).toBe(false);
    expect(byId.EC2.singlePointOfFailure).toBe(false);
    // entry point itself is excluded from the scan
    expect(byId.API).toBeUndefined();
  });

  it("flags every node on a single chain as a SPOF except the leaf", () => {
    const architecture = arch(["API", "LB", "EC2", "DB"], [
      ["API", "LB"],
      ["LB", "EC2"],
      ["EC2", "DB"],
    ]);
    const results = detectFailurePoints(architecture, "API");
    const byId = Object.fromEntries(results.map((r) => [r.nodeId, r]));
    expect(byId.LB.singlePointOfFailure).toBe(true);
    expect(byId.EC2.singlePointOfFailure).toBe(true);
    expect(byId.DB.singlePointOfFailure).toBe(false); // nothing left downstream of the leaf
  });

  it("sorts the most impactful failures first", () => {
    const architecture = arch(["API", "LB", "EC2", "DB"], [
      ["API", "LB"],
      ["LB", "EC2"],
      ["EC2", "DB"],
    ]);
    const results = detectFailurePoints(architecture, "API");
    expect(results[0].nodeId).toBe("LB");
    expect(results[0].newlyUnreachableCount).toBeGreaterThanOrEqual(results[results.length - 1].newlyUnreachableCount);
  });
});

describe("entry point itself fails", () => {
  it("classifies as CRITICAL resilience", () => {
    const architecture = arch(["API", "LB", "EC2"], [
      ["API", "LB"],
      ["LB", "EC2"],
    ]);
    const result = simulateFailure(architecture, "API", "API");
    expect(result.states.get("API")).toBe(SIM_STATE.FAILED);
    expect(result.states.get("LB")).toBe(SIM_STATE.UNREACHABLE);
    expect(result.states.get("EC2")).toBe(SIM_STATE.UNREACHABLE);
    expect(result.resilience).toBe(RESILIENCE.CRITICAL);
  });
});
