import { REGIONS, REGION_COLORS, azOptionsForRegion } from "../data/regions";

// Decorative-only landmass blobs — illustrative, not geographically precise.
const LANDMASSES = [
  { cx: 95, cy: 155, rx: 58, ry: 58 },   // South Asia
  { cx: 190, cy: 255, rx: 72, ry: 62 },  // SE Asia / Indonesia
  { cx: 218, cy: 108, rx: 42, ry: 36 },  // Southern China
  { cx: 256, cy: 26, rx: 20, ry: 16 },   // Korea
  { cx: 292, cy: 48, rx: 36, ry: 26 },   // Japan
  { cx: 328, cy: 460, rx: 92, ry: 50 },  // Australia
];

export default function AsiaRegionMap({ selectedRegion, selectedAz, onSelectRegion, onSelectAz }) {
  const azOptions = azOptionsForRegion(selectedRegion);

  return (
    <div>
      <svg viewBox="0 0 400 500" style={{ width: "100%", height: "260px", borderRadius: "10px" }}>
        <defs>
          <radialGradient id="mapBg" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#182338" />
            <stop offset="100%" stopColor="#0d1220" />
          </radialGradient>
          <pattern id="dotGrid" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#26324a" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="400" height="500" rx="12" fill="url(#mapBg)" />
        <rect x="0" y="0" width="400" height="500" rx="12" fill="url(#dotGrid)" opacity="0.5" />

        {LANDMASSES.map((l, i) => (
          <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="#22314a" opacity="0.55" />
        ))}

        {REGIONS.map((r) => {
          const isSelected = r.code === selectedRegion;
          const color = REGION_COLORS[r.code] || "#4f8ef7";
          return (
            <g
              key={r.code}
              onClick={() => onSelectRegion(r.code)}
              style={{ cursor: "pointer" }}
            >
              {isSelected && (
                <circle cx={r.x} cy={r.y} r="12" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6">
                  <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={r.x}
                cy={r.y}
                r={isSelected ? 7 : 5}
                fill={color}
                stroke="#0d1220"
                strokeWidth="1.5"
              />
              <text
                x={r.x + 10}
                y={r.y + 4}
                fontSize="10"
                fill={isSelected ? "#fff" : "#aab2c5"}
                fontWeight={isSelected ? "700" : "400"}
              >
                {r.flag} {r.city}
              </text>
            </g>
          );
        })}
      </svg>

      {selectedRegion && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>
            Availability Zone — {selectedRegion}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {azOptions.map((az) => (
              <button
                key={az}
                onClick={() => onSelectAz(az)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: selectedAz === az ? "1.5px solid #4f8ef7" : "1px solid #333",
                  background: selectedAz === az ? "#1c2a3f" : "#1c1f2b",
                  color: "white",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {az}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}