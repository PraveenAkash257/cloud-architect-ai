import { useState } from "react";
import { NodeResizer } from "@xyflow/react";
import { getGroupMeta } from "../data/groupTypes";

export default function ContainerNode({ id, data, selected }) {
  const meta = getGroupMeta(data.groupType);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label || meta?.label || "Group");

  const commitLabel = () => {
    setEditing(false);
    data.onRename?.(id, label);
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={100}
        lineStyle={{ borderColor: meta?.color || "#0284c7" }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, background: "#ffffff", border: "1.5px solid #0284c7" }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          border: `2px solid ${meta?.color || "#0284c7"}`,
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
          position: "relative",
        }}
      >
        {editing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => e.key === "Enter" && commitLabel()}
            style={{
              position: "absolute",
              top: "-12px",
              left: "12px",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: meta?.color || "#0f172a",
              background: "#ffffff",
              border: `1.5px solid ${meta?.color || "#0284c7"}`,
              borderRadius: "6px",
              padding: "2px 8px",
              zIndex: 20,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
          />
        ) : (
          <span
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
            style={{
              position: "absolute",
              top: "-11px",
              left: "12px",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: meta?.color || "#0f172a",
              background: "#ffffff",
              border: `1px solid ${meta?.color || "#e2e8f0"}`,
              borderRadius: "6px",
              padding: "2px 8px",
              cursor: "text",
              zIndex: 20,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            {label}
          </span>
        )}
        {data.onDeleteNode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteNode(id);
            }}
            title="Delete group"
            style={{
              position: "absolute",
              top: "-10px",
              right: "8px",
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
              zIndex: 20,
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
            }}
          >
            ×
          </button>
        )}
      </div>
    </>
  );
}
