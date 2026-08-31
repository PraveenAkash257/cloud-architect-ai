import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "../data/componentTypes";

const STATE_STYLE = {
  FAILED: { border: "#ff3b3b", glow: "0 0 0 3px rgba(255,59,59,0.25)", label: "FAILED", labelBg: "#ff3b3b" },
  UNREACHABLE: { border: "#ffb020", glow: "0 0 0 3px rgba(255,176,32,0.22)", label: "UNREACHABLE", labelBg: "#ffb020" },
  PRE_EXISTING_DISCONNECTED: {
    border: "#8a8f9c",
    glow: "0 0 0 3px rgba(138,143,156,0.18)",
    label: "PRE-EXISTING DISCONNECTED",
    labelBg: "#8a8f9c",
  },
};

function CloudNode({ data }) {
  const meta = getComponentMeta(data.componentType);
  const stateStyle = data.status ? STATE_STYLE[data.status] : null;
  const isEntryPoint = !!data.isEntryPoint;
  // Risk-scan styling only applies when no manual simulation is currently
  // overriding the node's appearance (Section 18-style precedence: an
  // active, explicit simulation always wins over the passive auto-scan).
  const atRisk = !stateStyle && !!data.atRisk;
  const borderColor = stateStyle?.border || (atRisk ? "#c084fc" : meta?.color || "#999");

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
          ? "0 0 0 3px rgba(192,132,252,0.25)"
          : isEntryPoint
          ? "0 0 0 3px rgba(76,201,140,0.25)"
          : "none",
        borderRadius: "8px",
        padding: "10px 14px",
        background: "#1c1f2b",
        color: "white",
        minWidth: "150px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img src={meta?.icon} alt={data.label} style={{ width: "26px", height: "26px" }} />
        <span>{data.label}</span>
        {isEntryPoint && (
          <span
            title="Entry point"
            style={{
              marginLeft: "auto",
              fontSize: "10px",
              fontWeight: 700,
              color: "#0b2e22",
              background: "#4cc98c",
              borderRadius: "4px",
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
            fontWeight: 700,
            letterSpacing: "0.03em",
            color: "#12141c",
            background: stateStyle.labelBg,
            borderRadius: "4px",
            padding: "2px 6px",
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
            fontWeight: 700,
            letterSpacing: "0.03em",
            color: "#12141c",
            background: "#c084fc",
            borderRadius: "4px",
            padding: "2px 6px",
          }}
        >
          AT RISK
        </span>
      )}
      {data.az && (
        <span style={{ fontSize: "10px", color: "#8a8f9c" }}>{data.az}</span>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default CloudNode;
