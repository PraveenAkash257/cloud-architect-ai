import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { REGIONS, REGION_COLORS, BACKBONE_LINKS, azOptionsForRegion } from "../data/regions";
import "leaflet/dist/leaflet.css";

// Smooth Camera Controller
function MapController({ selectedRegion }) {
  const map = useMap();

  if (selectedRegion) {
    const region = REGIONS.find((r) => r.code === selectedRegion);
    if (region) {
      map.flyTo([region.latitude, region.longitude], 5, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }

  return null;
}

// Glowing Pulse Radar Marker Generator
function createCyberMarker(color, selected, latency) {
  return L.divIcon({
    className: "cyber-marker",
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${selected ? `
          <div style="
            position: absolute;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid ${color};
            animation: radarPulse 1.8s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
            box-shadow: 0 0 15px ${color};
          "></div>
        ` : `
          <div style="
            position: absolute;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1px dashed rgba(255,255,255,0.3);
            animation: radarSpin 10s infinite linear;
          "></div>
        `}
        <div style="
          width: ${selected ? "20px" : "14px"};
          height: ${selected ? "20px" : "14px"};
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 ${selected ? "22px" : "10px"} ${color};
          transition: all 0.3s ease;
          z-index: 10;
        "></div>
        <div style="
          position: absolute;
          bottom: -18px;
          background: rgba(10, 15, 29, 0.9);
          border: 1px solid ${color}88;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 9px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        ">${latency}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function AsiaRegionMap({ onCreateArchitecture, onBackToDashboard, onSignOut }) {
  const [selectedRegion, setSelectedRegion] = useState("ap-south-1");
  const [selectedAz, setSelectedAz] = useState("ap-south-1a");
  const [searchQuery, setSearchQuery] = useState("");

  const region = useMemo(() => REGIONS.find((r) => r.code === selectedRegion), [selectedRegion]);
  const azOptions = useMemo(() => azOptionsForRegion(selectedRegion), [selectedRegion]);

  const filteredRegions = useMemo(() => {
    if (!searchQuery) return REGIONS;
    const q = searchQuery.toLowerCase();
    return REGIONS.filter(
      (r) =>
        r.city.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Compute backbone polylines between coordinates
  const backbonePolylines = useMemo(() => {
    const regionCoords = new Map(REGIONS.map((r) => [r.code, [r.latitude, r.longitude]]));
    return BACKBONE_LINKS.map(([[codeA, codeB], label]) => {
      const posA = regionCoords.get(codeA);
      const posB = regionCoords.get(codeB);
      if (!posA || !posB) return null;
      return { positions: [posA, posB], label, key: `${codeA}-${codeB}` };
    }).filter(Boolean);
  }, []);

  const handleRegionSelect = (code) => {
    setSelectedRegion(code);
    const options = azOptionsForRegion(code);
    setSelectedAz(options[0] || null);
  };

  const handleCreate = () => {
    if (!selectedRegion || !selectedAz) return;
    onCreateArchitecture({
      region: selectedRegion,
      az: selectedAz,
      name: `AWS ${region?.city || selectedRegion} Stack`,
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#070b14",
        color: "white",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 100% Free OpenStreetMap dark-inversion CSS (No API key, zero watermarks) */}
      <style>{`
        @keyframes radarPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .leaflet-container {
          background: #070b14 !important;
        }
        /* Convert standard free OpenStreetMap tiles to high-tech dark theme */
        .leaflet-tile {
          filter: brightness(0.55) invert(1) contrast(2.4) hue-rotate(200deg) saturate(0.25) brightness(0.85) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 15, 29, 0.8) !important;
          color: #64748b !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #94a3b8 !important;
        }
      `}</style>

      {/* Top Telemetry & Unified Command Header */}
      <div
        style={{
          height: "56px",
          padding: "0 20px",
          borderBottom: "1px solid #1a273f",
          background: "rgba(10, 16, 30, 0.95)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1000,
        }}
      >
        {/* Left Section: Back Button + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #26354f",
                background: "#131d31",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#38bdf8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.borderColor = "#26354f";
              }}
            >
              ← Back to Dashboard
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #ff9900, #ea580c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              ☁️
            </div>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                AWS Asia-Pacific Region Telemetry
              </span>
              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>
                Select a data center to open Architecture Canvas
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Telemetry & Log Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ color: "#94a3b8" }}>Backbone:</span>
            <strong style={{ color: "#4ade80" }}>400 Gbps Subsea Grid Active</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#94a3b8" }}>Active:</span>
            <strong style={{ color: "#38bdf8" }}>10 AWS Regions / 32 AZs</strong>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #26354f",
                background: "#131d31",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#475569";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.borderColor = "#26354f";
              }}
            >
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[18, 105]}
          zoom={4}
          minZoom={3}
          maxZoom={7}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          {/* 100% Free OpenStreetMap with high-contrast dark CSS filter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedRegion={selectedRegion} />

          {/* Inter-Region Fiber Optic Grid Lines */}
          {backbonePolylines.map((link) => (
            <Polyline
              key={link.key}
              positions={link.positions}
              pathOptions={{
                color: "#ff9900",
                weight: 1.5,
                opacity: 0.45,
                dashArray: "6, 8",
              }}
            />
          ))}

          {/* Region Markers */}
          {REGIONS.map((r) => {
            const isSelected = r.code === selectedRegion;
            const color = REGION_COLORS[r.code] || "#38bdf8";

            return (
              <Marker
                key={r.code}
                position={[r.latitude, r.longitude]}
                icon={createCyberMarker(color, isSelected, r.latency)}
                eventHandlers={{
                  click: () => handleRegionSelect(r.code),
                }}
              >
                <Popup>
                  <div style={{ color: "#0f172a", fontSize: "12px" }}>
                    <strong>{r.flag} {r.city}</strong> ({r.country})<br />
                    <code>{r.code}</code> • <strong>{r.latency}</strong>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Left Floating Sidebar: Region Telemetry Directory */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
            background: "rgba(10, 16, 30, 0.92)",
            backdropFilter: "blur(12px)",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #1e2c44",
            width: "260px",
            maxHeight: "calc(100vh - 200px)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AWS Regions
            </span>
            <span style={{ fontSize: "10px", color: "#ff9900", background: "rgba(255, 153, 0, 0.15)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
              {filteredRegions.length} Active
            </span>
          </div>

          {/* Search filter input */}
          <input
            type="text"
            placeholder="🔍 Search city or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: "6px",
              border: "1px solid #243552",
              background: "#0a1120",
              color: "#f8fafc",
              fontSize: "12px",
              marginBottom: "10px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
            {filteredRegions.map((r) => {
              const isSelected = selectedRegion === r.code;
              const color = REGION_COLORS[r.code] || "#38bdf8";

              return (
                <button
                  key={r.code}
                  onClick={() => handleRegionSelect(r.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "8px 10px",
                    marginBottom: "4px",
                    border: isSelected ? `1px solid ${color}` : "1px solid transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? "#ffffff" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{r.flag}</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 500, color: isSelected ? "#f8fafc" : "#cbd5e1" }}>
                        {r.city}
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>{r.code}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: isSelected ? color : "#64748b",
                      background: "rgba(0,0,0,0.3)",
                      padding: "2px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    {r.latency}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Floating Deployment Console */}
        {region && (
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(10, 16, 30, 0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid #1e2c44",
              borderRadius: "14px",
              padding: "18px 24px",
              minWidth: "520px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)",
              boxSizing: "border-box",
            }}
          >
            {/* Header info */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>{region.flag}</span>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>
                    {region.city}, {region.country}
                  </div>
                  <div style={{ fontSize: "11px", color: "#ff9900", fontWeight: 600 }}>
                    AWS Region: {region.code} • {region.azCount} Availability Zones
                  </div>
                </div>
              </div>

              {/* Telemetry metrics */}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ background: "#0a1120", border: "1px solid #1e2c44", padding: "4px 8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>⚡ {region.latency}</div>
                  <div style={{ fontSize: "9px", color: "#64748b" }}>LATENCY</div>
                </div>
                <div style={{ background: "#0a1120", border: "1px solid #1e2c44", padding: "4px 8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>99.99%</div>
                  <div style={{ fontSize: "9px", color: "#64748b" }}>SLA</div>
                </div>
              </div>
            </div>

            {/* Feature tags */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
              {region.features?.map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    color: "#94a3b8",
                  }}
                >
                  ✓ {f}
                </span>
              ))}
            </div>

            {/* Availability Zone selector */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#8fa0bc", textTransform: "uppercase", marginBottom: "8px" }}>
                Select Target Availability Zone (AZ)
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {azOptions.map((az) => (
                  <button
                    key={az}
                    onClick={() => setSelectedAz(az)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: selectedAz === az ? "1px solid #ff9900" : "1px solid #243552",
                      background: selectedAz === az ? "rgba(255, 153, 0, 0.2)" : "#0c1322",
                      color: selectedAz === az ? "#ff9900" : "#94a3b8",
                      fontWeight: selectedAz === az ? 700 : 500,
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {az}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch action button */}
            <button
              onClick={handleCreate}
              disabled={!selectedAz}
              style={{
                width: "100%",
                padding: "11px",
                border: "1px solid #ff9900",
                borderRadius: "8px",
                background: selectedAz ? "linear-gradient(135deg, #ff9900 0%, #ea580c 100%)" : "#1e293b",
                color: selectedAz ? "#0f172a" : "#64748b",
                fontWeight: 800,
                fontSize: "13px",
                cursor: selectedAz ? "pointer" : "not-allowed",
                boxShadow: selectedAz ? "0 4px 20px rgba(255, 153, 0, 0.4)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => selectedAz && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>🚀 Launch Architecture Canvas in {selectedRegion}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}