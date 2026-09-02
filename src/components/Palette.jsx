import { COMPONENT_TYPES } from "../data/componentTypes";
import { GROUP_TYPES } from "../data/groupTypes";

const CATEGORIES = ["compute", "data", "networking", "security"];

function Palette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside style={{ width: "220px", padding: "14px", borderRight: "1px solid #333", overflowY: "auto" }}>
      <h2>Components</h2>
      {CATEGORIES.map((category) => (
        <div key={category} style={{ marginBottom: "14px" }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#888" }}>
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
                gap: "8px",
                borderLeft: `4px solid ${c.color}`,
                padding: "8px 10px",
                marginBottom: "6px",
                cursor: "grab",
              }}
              title={c.description}
            >
              <img src={c.icon} alt={c.label} style={{ width: "22px", height: "22px" }} />
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginBottom: "14px", borderTop: "1px solid #333", paddingTop: "12px" }}>
        <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#888" }}>Containers</h4>
        {GROUP_TYPES.map((g) => (
          <div
            key={g.type}
            draggable
            onDragStart={(event) => onDragStart(event, `container:${g.type}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderLeft: `4px solid ${g.color}`,
              padding: "8px 10px",
              marginBottom: "6px",
              cursor: "grab",
            }}
            title={`${g.label} — a resizable grouping box`}
          >
            <span
              style={{
                width: "18px",
                height: "14px",
                border: `1.5px solid ${g.color}`,
                borderRadius: "2px",
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