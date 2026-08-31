import { REGION_COLORS } from "../data/regions";

// A purely visual grouping box drawn behind the components that belong to a
// given region/AZ. It's computed on every render from current node
// positions (see Canvas.jsx) rather than stored as real graph state, so it
// never becomes part of the canonical architecture and never affects the
// failure simulation.
function RegionGroupNode({ data }) {
  const color = REGION_COLORS[data.region] || "#555";
  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        border: `1.5px dashed ${color}`,
        background: `${color}14`,
        borderRadius: "10px",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "-10px",
          left: "10px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#12141c",
          background: color,
          padding: "1px 8px",
          borderRadius: "4px",
        }}
      >
        {data.label}
      </span>
    </div>
  );
}

export default RegionGroupNode;
