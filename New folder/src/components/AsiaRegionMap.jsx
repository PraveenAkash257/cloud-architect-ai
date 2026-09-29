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

// High-Fidelity Glowing Radar Marker Generator
function createCyberMarker(color, selected, latency) {
  return L.divIcon({
    className: "cyber-marker",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${
          selected
            ? `
          <div style="
            position: absolute;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 2px solid ${color};
            animation: radarPulse 1.8s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
            box-shadow: 0 0 20px ${color};
          "></div>
        `
            : `
          <div style="
            position: absolute;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px dashed rgba(255,255,255,0.35);
            animation: radarSpin 10s infinite linear;
          "></div>
        `
        }
        <div style="
          width: ${selected ? "22px" : "15px"};
          height: ${selected ? "22px" : "15px"};
          background: ${color};
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 ${selected ? "25px" : "12px"} ${color}, inset 0 1px 2px rgba(255,255,255,0.6);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 10;
        "></div>
        <div style="
          position: absolute;
          bottom: -20px;
          background: rgba(10, 15, 29, 0.92);
          backdrop-filter: blur(8px);
          border: 1.5px solid ${color};
          border-radius: 12px;
          padding: 2px 7px;
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-heading, system-ui);
          color: #ffffff;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        ">${latency}</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
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
        background: "radial-gradient(circle at 50% 10%, #11182c 0%, #080c16 60%, #04070e 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Free OpenStreetMap dark theme CSS */}
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
          background: #080c16 !important;
        }
        .leaflet-tile {
          filter: brightness(0.6) invert(1) contrast(2.2) hue-rotate(205deg) saturate(0.3) brightness(0.9) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 15, 29, 0.8) !important;
          color: var(--clay-muted) !important;
          font-size: 10px !important;
          border-radius: 8px !important;
          margin: 6px !important;
        }
        .leaflet-control-attribution a {
          color: #a78bfa !important;
        }
      `}</style>

      {/* Top Glass-Clay Unified Command Header */}
      <header
        style={{
          height: "64px",
          padding: "0 clamp(16px, 3vw, 32px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(10, 16, 30, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1000,
        }}
      >
        {/* Left Section: Back Button + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              style={{
                padding: "8px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(10px)",
                color: "#cbd5e1",
                fontSize: "12.5px",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.5)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(124, 58, 237, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#cbd5e1";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
              }}
            >
              ← Back to Dashboard
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              className="animate-clay-breathe"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #ec4899 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: "0 6px 16px rgba(124, 58, 237, 0.4), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.5)",
              }}
            >
              ☁️
            </div>
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#ffffff",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.01em",
                }}
              >
                AWS Asia-Pacific Region Telemetry
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "var(--clay-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Select an infrastructure region to deploy architecture
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Telemetry & Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              color: "#6ee7b7",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            400 Gbps Grid Active
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(14, 165, 233, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              color: "#38bdf8",
              boxShadow: "0 4px 12px rgba(14, 165, 233, 0.15)",
            }}
          >
            10 Regions / 32 AZs
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                padding: "8px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(12px)",
                color: "#cbd5e1",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.5)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(236, 72, 153, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#cbd5e1";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Map Content Viewport */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[18, 105]}
          zoom={4}
          minZoom={3}
          maxZoom={7}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
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
                color: "#a78bfa",
                weight: 2,
                opacity: 0.55,
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
                  <div style={{ color: "#0f172a", fontSize: "12px", fontFamily: "var(--font-heading)" }}>
                    <strong>
                      {r.flag} {r.city}
                    </strong>{" "}
                    ({r.country})
                    <br />
                    <code>{r.code}</code> • <strong>{r.latency}</strong>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Left Floating Sidebar: Region Directory */}
        <div
          className="animate-fade-slide-up"
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            zIndex: 1000,
            background: "rgba(11, 16, 30, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "20px",
            borderRadius: "26px",
            border: "1.5px solid rgba(255, 255, 255, 0.12)",
            width: "280px",
            maxHeight: "calc(100vh - 220px)",
            display: "flex",
            flexDirection: "column",
            boxShadow:
              "0 24px 48px -12px rgba(0, 0, 0, 0.75), inset 0 1.5px 2px rgba(255, 255, 255, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--clay-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "var(--font-heading)",
              }}
            >
              AWS Regions
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#c4b5fd",
                background: "rgba(139, 92, 246, 0.2)",
                border: "1px solid rgba(167, 139, 250, 0.35)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
              }}
            >
              {filteredRegions.length} Active
            </span>
          </div>

          {/* Recessed Search Bar */}
          <input
            type="text"
            placeholder="Search city or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input-recessed"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "14px",
              fontSize: "12.5px",
              marginBottom: "12px",
            }}
          />

          {/* Region list */}
          <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
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
                    padding: "10px 12px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    border: isSelected
                      ? `1.5px solid ${color}`
                      : "1px solid rgba(255, 255, 255, 0.06)",
                    background: isSelected
                      ? "rgba(139, 92, 246, 0.22)"
                      : "rgba(15, 23, 42, 0.45)",
                    color: isSelected ? "#ffffff" : "var(--clay-muted)",
                    boxShadow: isSelected
                      ? "0 4px 14px rgba(124, 58, 237, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)"
                      : "none",
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.45)";
                      e.currentTarget.style.color = "var(--clay-muted)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px" }}>{r.flag}</span>
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "12.5px",
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? "#ffffff" : "#e2e8f0",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {r.city}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--clay-subtle)" }}>{r.code}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      fontFamily: "var(--font-heading)",
                      color: isSelected ? color : "var(--clay-muted)",
                      background: "rgba(0,0,0,0.35)",
                      padding: "2px 7px",
                      borderRadius: "10px",
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
            className="animate-fade-slide-up"
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(11, 16, 30, 0.88)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "32px",
              padding: "24px 28px",
              minWidth: "560px",
              maxWidth: "90vw",
              boxShadow:
                "0 32px 64px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.15), inset 0 2px 2px rgba(255, 255, 255, 0.3)",
              boxSizing: "border-box",
            }}
          >
            {/* Header info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "32px" }}>{region.flag}</span>
                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      color: "#ffffff",
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {region.city}, {region.country}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#a78bfa",
                      fontWeight: 700,
                      fontFamily: "var(--font-heading)",
                      marginTop: "2px",
                    }}
                  >
                    AWS Region: {region.code} • {region.azCount} Availability Zones
                  </div>
                </div>
              </div>

              {/* Telemetry metrics */}
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "6px 12px",
                    borderRadius: "14px",
                    textAlign: "center",
                    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#4ade80",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    ⚡ {region.latency}
                  </div>
                  <div style={{ fontSize: "9.5px", color: "#86efac", fontWeight: 700 }}>LATENCY</div>
                </div>

                <div
                  style={{
                    background: "rgba(14, 165, 233, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    padding: "6px 12px",
                    borderRadius: "14px",
                    textAlign: "center",
                    boxShadow: "0 4px 10px rgba(14, 165, 233, 0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#38bdf8",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    99.99%
                  </div>
                  <div style={{ fontSize: "9.5px", color: "#7dd3fc", fontWeight: 700 }}>SLA</div>
                </div>
              </div>
            </div>

            {/* Feature tags */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {region.features?.map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "11px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    padding: "3px 9px",
                    borderRadius: "8px",
                    color: "#cbd5e1",
                    fontWeight: 600,
                  }}
                >
                  ✓ {f}
                </span>
              ))}
            </div>

            {/* Availability Zone selector */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "11.5px",
                  fontWeight: 800,
                  color: "var(--clay-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Target Availability Zone (AZ)
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {azOptions.map((az) => {
                  const isAzSelected = selectedAz === az;
                  return (
                    <button
                      key={az}
                      onClick={() => setSelectedAz(az)}
                      style={{
                        flex: 1,
                        padding: "9px 14px",
                        borderRadius: "14px",
                        border: isAzSelected
                          ? "1.5px solid rgba(167, 139, 250, 0.7)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        background: isAzSelected
                          ? "linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(219, 39, 119, 0.35) 100%)"
                          : "rgba(15, 23, 42, 0.6)",
                        color: isAzSelected ? "#ffffff" : "var(--clay-muted)",
                        fontWeight: isAzSelected ? 800 : 600,
                        fontSize: "12.5px",
                        fontFamily: "var(--font-heading)",
                        cursor: "pointer",
                        boxShadow: isAzSelected
                          ? "0 4px 14px rgba(124, 58, 237, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3)"
                          : "none",
                        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isAzSelected) {
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isAzSelected) {
                          e.currentTarget.style.color = "var(--clay-muted)";
                          e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                        }
                      }}
                    >
                      {az}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch action button */}
            <button
              onClick={handleCreate}
              disabled={!selectedAz}
              className="clay-button-primary"
              style={{
                width: "100%",
                height: "52px",
                fontSize: "14.5px",
                cursor: selectedAz ? "pointer" : "not-allowed",
                opacity: selectedAz ? 1 : 0.6,
              }}
            >
              <span>🚀 Launch Architecture Canvas in {selectedRegion}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}