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
        lineStyle={{ borderColor: meta?.color || "#232323" }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          border: `1.5px solid ${meta?.color || "#232323"}`,
          borderRadius: "4px",
          background: "rgba(255,255,255,0.55)",
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
              fontWeight: 600,
              color: meta?.color || "#232323",
              background: "#fff",
              border: `1px solid ${meta?.color || "#232323"}`,
              borderRadius: "3px",
              padding: "1px 6px",
              zIndex: 20,
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
              fontWeight: 600,
              color: meta?.color || "#232323",
              background: "#ffffff",
              padding: "0 6px",
              cursor: "text",
              zIndex: 20,
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
              top: "-9px",
              right: "8px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#dc2626",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1,
              zIndex: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}
          >
            ×
          </button>
        )}
      </div>
    </>
  );
}
