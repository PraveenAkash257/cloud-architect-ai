function RegionGroupNode({ data }) {
  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        border: `1.5px dashed #cbd5e1`,
        background: "rgba(241, 245, 249, 0.45)",
        borderRadius: "14px",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "-11px",
          left: "14px",
          fontSize: "12px",
          fontWeight: 800,
          fontFamily: "var(--font-heading)",
          color: "#475569",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "1px 8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {data.label}
      </span>
    </div>
  );
}

export default RegionGroupNode;
