
// A purely visual grouping box drawn behind the components that belong to a
// given region/AZ. It's computed on every render from current node
// positions (see Canvas.jsx) rather than stored as real graph state, so it
// never becomes part of the canonical architecture and never affects the
// failure simulation.
function RegionGroupNode({ data }) {
  return (
    <div
            style={{
        width: data.width,
        height: data.height,
        border: `1.5px solid #232323`,
        background: "rgba(255,255,255,0.6)",
        borderRadius: "4px",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "-10px",
          left: "12px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#232323",
          background: "#ffffff",
          padding: "0 6px",
        }}
      >
        {data.label}
      </span>
    </div>
  );
}

export default RegionGroupNode;
