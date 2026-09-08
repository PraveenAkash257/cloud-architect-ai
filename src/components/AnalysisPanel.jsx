import { RESILIENCE } from "../utils/simulateFailure";
import { getComponentMeta } from "../data/componentTypes";

const RESILIENCE_META = {
  [RESILIENCE.CRITICAL]: { label: "CRITICAL", bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626", border: "#fca5a5" },
  [RESILIENCE.LOW]: { label: "LOW", bg: "rgba(249, 115, 22, 0.12)", text: "#ea580c", border: "#fdba74" },
  [RESILIENCE.MEDIUM]: { label: "MEDIUM", bg: "rgba(234, 179, 8, 0.15)", text: "#ca8a04", border: "#fde047" },
  [RESILIENCE.HIGH]: { label: "HIGH", bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a", border: "#86efac" },
};

function PanelCard({ title, icon, children, style }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "14px",
        marginBottom: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11.5px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            fontFamily: "var(--font-heading)",
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
        width: "360px",
        background: "#ffffff",
        borderLeft: "1px solid #e2e8f0",
        color: "#1e293b",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: "var(--font-body)",
        boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.02)",
        zIndex: 10,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a", fontFamily: "var(--font-heading)" }}>
            Architecture Analysis
          </h2>
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>Failure simulation & risk scanner</span>
        </div>
        {simResult && (
          <button
            onClick={onReset}
            style={{
              padding: "5px 12px",
              fontSize: "11.5px",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
          padding: "16px",
        }}
      >
        {/* Validation or Warning Alert */}
        {validationMessage && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              color: "#92400e",
              fontSize: "12px",
              fontWeight: 600,
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
              borderColor: simResult.singlePointOfFailure ? "#fca5a5" : "#86efac",
              background: simResult.singlePointOfFailure ? "#fef2f2" : "#f0fdf4",
            }}
          >
            {/* Failed Node Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: 600 }}>Failed Component</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-heading)" }}>
                  {simResult.failedLabel}
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  fontFamily: "var(--font-heading)",
                  padding: "3px 8px",
                  borderRadius: "6px",
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
                padding: "8px 12px",
                borderRadius: "8px",
                background: simResult.singlePointOfFailure ? "#fee2e2" : "#dcfce7",
                border: `1px solid ${simResult.singlePointOfFailure ? "#f87171" : "#4ade80"}`,
                marginBottom: "12px",
                fontSize: "12px",
                fontWeight: 700,
                color: simResult.singlePointOfFailure ? "#991b1b" : "#166534",
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              <div style={{ background: "#ffffff", padding: "10px 8px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "17px", fontWeight: 900, color: "#16a34a", fontFamily: "var(--font-heading)" }}>
                  {simResult.reachableCount}
                </div>
                <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Reachable</div>
              </div>
              <div style={{ background: "#ffffff", padding: "10px 8px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "17px", fontWeight: 900, color: "#dc2626", fontFamily: "var(--font-heading)" }}>
                  {simResult.unreachableCount}
                </div>
                <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Unreachable</div>
              </div>
              <div style={{ background: "#ffffff", padding: "10px 8px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "17px", fontWeight: 900, color: "#64748b", fontFamily: "var(--font-heading)" }}>
                  {simResult.preExistingDisconnectedCount}
                </div>
                <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Isolated</div>
              </div>
            </div>

            {/* AI Explanation / Root Cause */}
            {explanation && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "8px" }}>
                <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#2563eb", fontFamily: "var(--font-heading)", marginBottom: "4px" }}>
                  {explanation.source === "fallback" ? "Analysis Summary" : "🤖 AI Analysis"}
                </div>
                <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.5, margin: "0 0 8px" }}>
                  {explanation.summary}
                </p>
                {explanation.failureCause && (
                  <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.4, margin: "0 0 10px" }}>
                    <strong>Root Cause:</strong> {explanation.failureCause}
                  </p>
                )}

                {/* Recommendations */}
                {explanation.recommendations?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-heading)", marginBottom: "6px" }}>
                      Recommended Architecture Fixes
                    </div>
                    {explanation.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          marginBottom: "6px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "12px", color: "#0f172a" }}>{rec.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{rec.reason}</div>
                        <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, marginTop: "4px" }}>
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
                padding: "9px",
                marginTop: "10px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                color: "#334155",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
                    style={{ width: "30px", height: "30px", flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-heading)", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                      fontWeight: 800,
                      background: "#dcfce7",
                      color: "#166534",
                      border: "1px solid #86efac",
                      padding: "2px 7px",
                      borderRadius: "6px",
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
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: isSelectedEntry ? "1px solid #86efac" : "none",
                    background: isSelectedEntry ? "#dcfce7" : "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                    color: isSelectedEntry ? "#166534" : "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-heading)",
                    cursor: isSelectedEntry ? "default" : "pointer",
                    boxShadow: isSelectedEntry ? "none" : "0 2px 8px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  {isSelectedEntry ? "✓ Entry Point" : "Set Entry Point"}
                </button>
                <button
                  onClick={() => onSimulate(selectedNode.id)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-heading)",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
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
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    fontFamily: "var(--font-heading)",
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
            <div style={{ textAlign: "center", padding: "18px 8px", color: "#64748b", fontSize: "12.5px" }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>👆</div>
              Click any component on the canvas to set it as Entry Point or simulate its failure.
            </div>
          )}
        </PanelCard>

        {/* 3. Auto-Detect Failure Points (Auto Scan) */}
        <PanelCard title="Auto-Detect Weak Points" icon="🔍">
          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4, margin: "0 0 12px" }}>
            Scans the entire architecture to detect single points of failure without manual testing.
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <button
              onClick={onDetectFailurePoints}
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color: "white",
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(124, 58, 237, 0.25)",
              }}
            >
              Scan Architecture
            </button>
            {riskScan && (
              <button
                onClick={onClearRiskScan}
                style={{
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "var(--font-heading)",
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
                padding: "8px 12px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                color: "#92400e",
                fontSize: "11.5px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              {riskScanMessage}
            </div>
          )}

          {riskScan && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {riskScan.length === 0 ? (
                <div style={{ color: "#16a34a", fontSize: "12px", fontWeight: 600, textAlign: "center", padding: "10px" }}>
                  No components to scan. Add components and set an Entry Point.
                </div>
              ) : (
                riskScan.map((r) => {
                  const meta = RESILIENCE_META[r.resilience] || RESILIENCE_META[RESILIENCE.HIGH];
                  return (
                    <div
                      key={r.nodeId}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: r.singlePointOfFailure ? "#faf5ff" : "#ffffff",
                        border: r.singlePointOfFailure ? "1.5px solid #d8b4fe" : "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: "12.5px", color: "#0f172a", fontFamily: "var(--font-heading)" }}>
                          {r.label}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            fontFamily: "var(--font-heading)",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            background: meta.bg,
                            color: meta.text,
                            border: `1px solid ${meta.border}`,
                          }}
                        >
                          {r.resilience}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: r.singlePointOfFailure ? "#7e22ce" : "#64748b", fontWeight: 600, marginTop: "4px" }}>
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
