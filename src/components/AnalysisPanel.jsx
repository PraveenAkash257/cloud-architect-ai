import { RESILIENCE } from "../utils/simulateFailure";
import AsiaRegionMap from "./AsiaRegionMap";

const RESILIENCE_COLOR = {
  [RESILIENCE.CRITICAL]: "#ff3b3b",
  [RESILIENCE.LOW]: "#ff8a3b",
  [RESILIENCE.MEDIUM]: "#ffcf3b",
  [RESILIENCE.HIGH]: "#4cc98c",
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", marginBottom: "6px" }}>{title}</h4>
      {children}
    </div>
  );
}

export default function AnalysisPanel({
  selectedNode,
  entryPointId,
  simResult,
  validationMessage,
  explanation,
  riskScan,
  riskScanMessage,
  onSetEntryPoint,
  onSimulate,
  onReset,
  onSetRegion,
  onSetAz,
  onDetectFailurePoints,
  onClearRiskScan,
}) {
  const region = selectedNode?.data?.region || "";

  return (
    <aside style={{ width: "320px", padding: "14px", borderLeft: "1px solid #333", overflowY: "auto", fontSize: "13px" }}>
      <h2 style={{ marginTop: 0 }}>Analysis</h2>

      <Section title="Selected component">
        {selectedNode ? (
          <div>
            <div style={{ marginBottom: "8px" }}>{selectedNode.data.label}</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
              <button onClick={() => onSetEntryPoint(selectedNode.id)} disabled={entryPointId === selectedNode.id}>
                {entryPointId === selectedNode.id ? "Entry point ✓" : "Set as Entry Point"}
              </button>
              <button onClick={() => onSimulate(selectedNode.id)} style={{ background: "#ff3b3b", color: "white" }}>
                Simulate Failure
              </button>
            </div>
            <AsiaRegionMap
              selectedRegion={region}
              selectedAz={selectedNode?.data?.az || ""}
              onSelectRegion={(code) => onSetRegion(selectedNode.id, code)}
              onSelectAz={(az) => onSetAz(selectedNode.id, az)}
            />
          </div>
        ) : (
          <p style={{ color: "#888" }}>Click a component on the canvas to select it.</p>
        )}
      </Section>

      <Section title="Auto-detect failure points">
        <p style={{ color: "#aaa", marginTop: 0 }}>
          Scans every component and highlights the ones that are single points of failure — no manual clicking needed.
        </p>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={onDetectFailurePoints}>Detect Failure Points</button>
          {riskScan && <button onClick={onClearRiskScan}>Clear Scan</button>}
        </div>
        {riskScanMessage && <p style={{ color: "#ffb020" }}>{riskScanMessage}</p>}
        {riskScan && (
          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {riskScan.length === 0 && <p style={{ color: "#4cc98c" }}>No components found — add some to scan.</p>}
            {riskScan.map((r) => (
              <div
                key={r.nodeId}
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  background: r.singlePointOfFailure ? "rgba(192,132,252,0.12)" : "#1c1f2b",
                  border: r.singlePointOfFailure ? "1px solid #c084fc" : "1px solid transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{r.label}</span>
                  <span style={{ color: RESILIENCE_COLOR[r.resilience], fontWeight: 700, fontSize: "11px" }}>{r.resilience}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>
                  {r.singlePointOfFailure
                    ? `Single point of failure — breaks ${r.newlyUnreachableCount} component${r.newlyUnreachableCount === 1 ? "" : "s"}`
                    : "Not a single point of failure"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {validationMessage && (
        <Section title="Status">
          <p style={{ color: "#ffb020" }}>{validationMessage}</p>
        </Section>
      )}

      {simResult && simResult.valid && (
        <>
          <Section title="Failed component">
            <div>{simResult.failedLabel}</div>
          </Section>

          <Section title="Impact">
            <div>Newly Unreachable: {simResult.unreachableCount}</div>
          </Section>

          <Section title="Reachability">
            <div>Reachable: {simResult.reachableCount}</div>
            <div>Unreachable: {simResult.unreachableCount}</div>
            <div>Pre-existing Disconnected: {simResult.preExistingDisconnectedCount}</div>
          </Section>

          <Section title="Single point of failure">
            <div style={{ fontWeight: 700, color: simResult.singlePointOfFailure ? "#ff3b3b" : "#4cc98c" }}>
              {simResult.singlePointOfFailure ? "YES" : "NO"}
            </div>
          </Section>

          <Section title="Resilience">
            <div style={{ fontWeight: 700, color: RESILIENCE_COLOR[simResult.resilience] }}>{simResult.resilience}</div>
          </Section>

          {explanation && (
            <Section title={explanation.source === "fallback" ? "Explanation (deterministic)" : "AI Explanation"}>
              <p>{explanation.summary}</p>
              <p style={{ color: "#aaa" }}>{explanation.failureCause}</p>
              {explanation.recommendations?.length > 0 && (
                <div>
                  <strong>Recommendations</strong>
                  {explanation.recommendations.map((rec, i) => (
                    <div key={i} style={{ marginTop: "6px", padding: "8px", background: "#1c1f2b", borderRadius: "6px" }}>
                      <div style={{ fontWeight: 700 }}>{rec.title}</div>
                      <div style={{ color: "#aaa" }}>{rec.reason}</div>
                      <div style={{ color: "#4cc98c" }}>{rec.expectedImprovement}</div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ color: "#666", fontSize: "11px", marginTop: "8px" }}>
                Based on the modeled architecture and dependency graph — this does not model latency, capacity, or real
                cloud-provider failover mechanics.
              </p>
            </Section>
          )}

          <button onClick={onReset} style={{ width: "100%", padding: "8px", marginTop: "8px" }}>
            Reset Simulation
          </button>
        </>
      )}
    </aside>
  );
}
