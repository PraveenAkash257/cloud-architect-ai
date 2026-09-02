import { RESILIENCE } from "../utils/simulateFailure";
import { getComponentMeta } from "../data/componentTypes";

const RESILIENCE_META = {
  [RESILIENCE.CRITICAL]: { label: "CRITICAL", bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", border: "#ef4444" },
  [RESILIENCE.LOW]: { label: "LOW", bg: "rgba(249, 115, 22, 0.15)", text: "#f97316", border: "#f97316" },
  [RESILIENCE.MEDIUM]: { label: "MEDIUM", bg: "rgba(234, 179, 8, 0.15)", text: "#eab308", border: "#eab308" },
  [RESILIENCE.HIGH]: { label: "HIGH", bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e", border: "#22c55e" },
};

function PanelCard({ title, icon, children, style }) {
  return (
    <div
      style={{
        background: "#161f30",
        border: "1px solid #25334d",
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "14px",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#8fa0bc",
            marginBottom: "10px",
          }}
        >
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </div>
      )}
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
  onDetectFailurePoints,
  onClearRiskScan,
  onDeleteNode,
}) {
  const isSelectedEntry = selectedNode && selectedNode.id === entryPointId;
  const selectedMeta = selectedNode ? getComponentMeta(selectedNode.data?.componentType) : null;

  return (
    <aside
      style={{
        width: "350px",
        background: "#0c1322",
        borderLeft: "1px solid #1e2c44",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1e2c44",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.02em" }}>
            Architecture Analysis
          </h2>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Failure simulation & risk detection</span>
        </div>
        {simResult && (
          <button
            onClick={onReset}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "5px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
        }}
      >
        {/* Validation or Warning Alert */}
        {validationMessage && (
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "8px",
              color: "#fbbf24",
              fontSize: "12px",
              lineHeight: 1.4,
              marginBottom: "14px",
              display: "flex",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{validationMessage}</span>
          </div>
        )}

        {/* 1. Active Simulation Results */}
        {simResult && simResult.valid && (
          <PanelCard
            title="Simulation Result"
            icon="⚡"
            style={{
              borderColor: simResult.singlePointOfFailure ? "#dc2626" : "#16a34a",
              background: simResult.singlePointOfFailure ? "rgba(220, 38, 38, 0.08)" : "rgba(22, 163, 74, 0.08)",
            }}
          >
            {/* Failed Node Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Failed Component</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>{simResult.failedLabel}</span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: RESILIENCE_META[simResult.resilience]?.bg,
                  color: RESILIENCE_META[simResult.resilience]?.text,
                  border: `1px solid ${RESILIENCE_META[simResult.resilience]?.border}`,
                }}
              >
                {simResult.resilience} RESILIENCE
              </span>
            </div>

            {/* SPOF Banner */}
            <div
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                background: simResult.singlePointOfFailure ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                border: `1px solid ${simResult.singlePointOfFailure ? "#ef4444" : "#22c55e"}`,
                marginBottom: "12px",
                fontSize: "12px",
                fontWeight: 600,
                color: simResult.singlePointOfFailure ? "#fca5a5" : "#86efac",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{simResult.singlePointOfFailure ? "⚠️" : "🛡️"}</span>
              <span>
                {simResult.singlePointOfFailure
                  ? `Single Point of Failure (breaks ${simResult.unreachableCount} component${simResult.unreachableCount === 1 ? "" : "s"})`
                  : "Not a Single Point of Failure (Redundant paths active)"}
              </span>
            </div>

            {/* Reachability Metric Tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "12px" }}>
              <div style={{ background: "#0f172a", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#22c55e" }}>{simResult.reachableCount}</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Reachable</div>
              </div>
              <div style={{ background: "#0f172a", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#ef4444" }}>{simResult.unreachableCount}</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Unreachable</div>
              </div>
              <div style={{ background: "#0f172a", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#94a3b8" }}>
                  {simResult.preExistingDisconnectedCount}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Isolated</div>
              </div>
            </div>

            {/* AI Explanation / Root Cause */}
            {explanation && (
              <div style={{ borderTop: "1px solid #25334d", paddingTop: "12px", marginTop: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#93c5fd", marginBottom: "4px" }}>
                  {explanation.source === "fallback" ? "Analysis Summary" : "🤖 AI Analysis"}
                </div>
                <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4, margin: "0 0 8px" }}>
                  {explanation.summary}
                </p>
                {explanation.failureCause && (
                  <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4, margin: "0 0 10px" }}>
                    <strong>Root Cause:</strong> {explanation.failureCause}
                  </p>
                )}

                {/* Recommendations */}
                {explanation.recommendations?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8fa0bc", marginBottom: "6px" }}>
                      Recommended Architecture Fixes
                    </div>
                    {explanation.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "6px",
                          padding: "8px 10px",
                          marginBottom: "6px",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "12px", color: "#f1f5f9" }}>{rec.title}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{rec.reason}</div>
                        <div style={{ fontSize: "11px", color: "#34d399", fontWeight: 500, marginTop: "4px" }}>
                          ✓ {rec.expectedImprovement}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onReset}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "10px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "6px",
                color: "#e2e8f0",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset Simulation
            </button>
          </PanelCard>
        )}

        {/* 2. Selected Component Actions */}
        <PanelCard title="Selected Component" icon="🎯">
          {selectedNode ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                {selectedMeta?.icon && (
                  <img
                    src={selectedMeta.icon}
                    alt={selectedNode.data.label}
                    style={{ width: "28px", height: "28px", flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedNode.data.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {selectedMeta?.label || selectedNode.type || "Component"}
                    {selectedNode.data?.az ? ` • ${selectedNode.data.az}` : ""}
                  </div>
                </div>
                {isSelectedEntry && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      background: "#22c55e",
                      color: "#052e16",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    ENTRY
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => onSetEntryPoint(selectedNode.id)}
                  disabled={isSelectedEntry}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: isSelectedEntry ? "1px solid #22c55e" : "1px solid #3b82f6",
                    background: isSelectedEntry ? "rgba(34, 197, 94, 0.15)" : "#1d4ed8",
                    color: isSelectedEntry ? "#86efac" : "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: isSelectedEntry ? "default" : "pointer",
                  }}
                >
                  {isSelectedEntry ? "✓ Entry Point" : "Set Entry Point"}
                </button>
                <button
                  onClick={() => onSimulate(selectedNode.id)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #dc2626",
                    background: "#b91c1c",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Simulate Failure
                </button>
              </div>

              {onDeleteNode && (
                <button
                  onClick={() => onDeleteNode(selectedNode.id)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid #451a1a",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#fca5a5",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  🗑️ Delete Component
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "14px 6px", color: "#64748b", fontSize: "12px" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>👆</div>
              Click any component on the canvas to set it as Entry Point or simulate its failure.
            </div>
          )}
        </PanelCard>

        {/* 3. Auto-Detect Failure Points (Auto Scan) */}
        <PanelCard title="Auto-Detect Weak Points" icon="🔍">
          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.4, margin: "0 0 10px" }}>
            Scans the entire architecture to detect single points of failure without manual testing.
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <button
              onClick={onDetectFailurePoints}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #8b5cf6",
                background: "#6d28d9",
                color: "white",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Scan Architecture
            </button>
            {riskScan && (
              <button
                onClick={onClearRiskScan}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {riskScanMessage && (
            <div
              style={{
                padding: "8px 10px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "6px",
                color: "#fbbf24",
                fontSize: "11px",
                marginBottom: "8px",
              }}
            >
              {riskScanMessage}
            </div>
          )}

          {riskScan && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
              {riskScan.length === 0 ? (
                <div style={{ color: "#22c55e", fontSize: "12px", textAlign: "center", padding: "8px" }}>
                  No components to scan. Add components and set an Entry Point.
                </div>
              ) : (
                riskScan.map((r) => {
                  const meta = RESILIENCE_META[r.resilience] || RESILIENCE_META[RESILIENCE.HIGH];
                  return (
                    <div
                      key={r.nodeId}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: r.singlePointOfFailure ? "rgba(192, 132, 252, 0.1)" : "#0f172a",
                        border: r.singlePointOfFailure ? "1px solid #c084fc" : "1px solid #1e293b",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "12px", color: "#f8fafc" }}>{r.label}</span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: meta.bg,
                            color: meta.text,
                            border: `1px solid ${meta.border}`,
                          }}
                        >
                          {r.resilience}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: r.singlePointOfFailure ? "#d8b4fe" : "#64748b", marginTop: "4px" }}>
                        {r.singlePointOfFailure
                          ? `⚠️ Single Point of Failure — breaks ${r.newlyUnreachableCount} node${r.newlyUnreachableCount === 1 ? "" : "s"}`
                          : "✓ Not a single point of failure"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </PanelCard>
      </div>
    </aside>
  );
}
