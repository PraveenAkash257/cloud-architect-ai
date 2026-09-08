import { COMPONENT_TYPES } from "../data/componentTypes";
import { GROUP_TYPES } from "../data/groupTypes";

const CATEGORIES = ["compute", "data", "networking", "security"];

function Palette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      style={{
        width: "240px",
        padding: "16px",
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "2px 0 10px rgba(0, 0, 0, 0.02)",
        fontFamily: "var(--font-body)",
        zIndex: 10,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 900,
            color: "#0f172a",
            fontFamily: "var(--font-heading)",
            margin: "0 0 4px",
          }}
        >
          Cloud Palette
        </h2>
        <span style={{ fontSize: "11.5px", color: "#64748b" }}>Drag components to canvas</span>
      </div>

      {CATEGORIES.map((category) => (
        <div key={category} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h4
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#94a3b8",
              fontFamily: "var(--font-heading)",
              margin: "4px 0 2px",
            }}
          >
            {category}
          </h4>
          {COMPONENT_TYPES.filter((c) => c.category === category).map((c) => (
            <div
              key={c.type}
              draggable
              onDragStart={(event) => onDragStart(event, c.type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderLeft: `4px solid ${c.color}`,
                padding: "8px 12px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeftColor: c.color,
                borderLeftWidth: "4px",
                color: "#1e293b",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "grab",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(3px)";
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
              }}
              title={c.description}
            >
              <img src={c.icon} alt={c.label} style={{ width: "22px", height: "22px" }} />
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <h4
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#94a3b8",
            fontFamily: "var(--font-heading)",
            margin: "0 0 2px",
          }}
        >
          Containers & Groups
        </h4>
        {GROUP_TYPES.map((g) => (
          <div
            key={g.type}
            draggable
            onDragStart={(event) => onDragStart(event, `container:${g.type}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderLeft: `4px solid ${g.color}`,
              padding: "8px 12px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderLeftColor: g.color,
              borderLeftWidth: "4px",
              color: "#1e293b",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "grab",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateX(3px)";
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
            }}
            title={`${g.label} — a resizable grouping box`}
          >
            <span
              style={{
                width: "18px",
                height: "14px",
                border: `2px solid ${g.color}`,
                borderRadius: "3px",
                display: "inline-block",
              }}
            />
            <span>{g.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Palette;