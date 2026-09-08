import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "../data/componentTypes";

const STATE_STYLE = {
  FAILED: { border: "#ef4444", glow: "0 0 0 3px rgba(239, 68, 68, 0.35)", label: "FAILED", labelBg: "#ef4444", labelColor: "#ffffff" },
  UNREACHABLE: { border: "#f59e0b", glow: "0 0 0 3px rgba(245, 158, 11, 0.35)", label: "UNREACHABLE", labelBg: "#f59e0b", labelColor: "#ffffff" },
  PRE_EXISTING_DISCONNECTED: {
    border: "#94a3b8",
    glow: "0 0 0 3px rgba(148, 163, 184, 0.3)",
    label: "ISOLATED",
    labelBg: "#94a3b8",
    labelColor: "#ffffff",
  },
};

function CloudNode({ data }) {
  const meta = getComponentMeta(data.componentType);
  const stateStyle = data.status ? STATE_STYLE[data.status] : null;
  const isEntryPoint = !!data.isEntryPoint;
  const atRisk = !stateStyle && !!data.atRisk;
  const borderColor = stateStyle?.border || (atRisk ? "#a855f7" : meta?.color || "#cbd5e1");

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onNodeClick?.(data.nodeId);
      }}
      style={{
        border: `2px solid ${borderColor}`,
        boxShadow: stateStyle
          ? stateStyle.glow
          : atRisk
          ? "0 0 0 3px rgba(168, 85, 247, 0.3), 0 6px 16px rgba(0, 0, 0, 0.06)"
          : isEntryPoint
          ? "0 0 0 3px rgba(16, 185, 129, 0.3), 0 6px 16px rgba(0, 0, 0, 0.06)"
          : "0 4px 14px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 1px #ffffff",
        borderRadius: "14px",
        padding: "10px 14px",
        background: "#ffffff",
        color: "#1e293b",
        fontFamily: "var(--font-heading)",
        minWidth: "160px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.15s ease",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#64748b", width: "8px", height: "8px" }} />

      {/* Quick Delete button */}
      {data.onDeleteNode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDeleteNode(data.nodeId);
          }}
          title="Delete component"
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#fee2e2",
            border: "1.5px solid #ef4444",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
            zIndex: 10,
            boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          }}
        >
          ×
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img src={meta?.icon} alt={data.label} style={{ width: "26px", height: "26px" }} />
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{data.label}</span>
        {isEntryPoint && (
          <span
            title="Entry point"
            style={{
              marginLeft: "auto",
              fontSize: "10px",
              fontWeight: 800,
              color: "#065f46",
              background: "#a7f3d0",
              border: "1px solid #34d399",
              borderRadius: "6px",
              padding: "2px 6px",
            }}
          >
            ENTRY
          </span>
        )}
      </div>

      {stateStyle && (
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: stateStyle.labelColor,
            background: stateStyle.labelBg,
            borderRadius: "6px",
            padding: "2px 6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          {stateStyle.label}
        </span>
      )}

      {atRisk && (
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: "#ffffff",
            background: "#a855f7",
            borderRadius: "6px",
            padding: "2px 6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          AT RISK
        </span>
      )}

      {data.az && (
        <span style={{ fontSize: "10.5px", fontWeight: 600, color: "#64748b" }}>{data.az}</span>
      )}

      <Handle type="source" position={Position.Right} style={{ background: "#64748b", width: "8px", height: "8px" }} />
    </div>
  );
}

export default CloudNode;
