import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { REGIONS, REGION_COLORS, azOptionsForRegion } from "../data/regions";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapController({ selectedRegion }) {
  const map = useMap();

  if (selectedRegion) {
    const region = REGIONS.find((r) => r.code === selectedRegion);

    if (region) {
      map.flyTo([region.latitude, region.longitude], 5, {
        duration: 1,
      });
    }
  }

  return null;
}

function createMarker(color, selected) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${selected ? "22px" : "16px"};
        height: ${selected ? "22px" : "16px"};
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 ${selected ? "18px" : "8px"} ${color};
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function AsiaRegionMap({ onCreateArchitecture }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedAz, setSelectedAz] = useState(null);

  const region = REGIONS.find((r) => r.code === selectedRegion);
  const azOptions = azOptionsForRegion(selectedRegion);

  const handleRegionSelect = (code) => {
    setSelectedRegion(code);
    setSelectedAz(null);
  };

  const handleCreate = () => {
    if (!selectedRegion || !selectedAz) return;

    onCreateArchitecture({
      region: selectedRegion,
      az: selectedAz,
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0b1220",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "20px 30px",
          borderBottom: "1px solid #26324a",
          background: "#0f1728",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px" }}>
          ☁ Cloud Architect AI
        </h1>

        <p
          style={{
            margin: "6px 0 0",
            color: "#9ca8bd",
            fontSize: "14px",
          }}
        >
          Select an AWS region to start designing your architecture
        </p>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[20, 110]}
          zoom={3}
          minZoom={2}
          maxZoom={8}
          scrollWheelZoom={true}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedRegion={selectedRegion} />

          {REGIONS.map((r) => {
            const selected = r.code === selectedRegion;
            const color = REGION_COLORS[r.code] || "#4f8ef7";

            return (
              <Marker
                key={r.code}
                position={[r.latitude, r.longitude]}
                icon={createMarker(color, selected)}
                eventHandlers={{
                  click: () => handleRegionSelect(r.code),
                }}
              >
                <Popup>
                  <strong>
                    {r.flag} {r.city}
                  </strong>
                  <br />
                  {r.country}
                  <br />
                  <small>{r.code}</small>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
            background: "rgba(11,18,32,0.95)",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #34415a",
            minWidth: "240px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#8e9ab0",
              marginBottom: "8px",
            }}
          >
            AWS ASIA-PACIFIC REGIONS
          </div>

          {REGIONS.map((r) => (
            <button
              key={r.code}
              onClick={() => handleRegionSelect(r.code)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 8px",
                marginBottom: "3px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                background:
                  selectedRegion === r.code ? "#243653" : "transparent",
                color:
                  selectedRegion === r.code ? "white" : "#b8c1d1",
              }}
            >
              {r.flag} {r.city}
              <span
                style={{
                  float: "right",
                  fontSize: "10px",
                  color: "#71809a",
                }}
              >
                {r.code}
              </span>
            </button>
          ))}
        </div>

        {region && (
          <div
            style={{
              position: "absolute",
              bottom: 25,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(11,18,32,0.97)",
              border: "1px solid #34415a",
              borderRadius: "12px",
              padding: "18px 22px",
              minWidth: "420px",
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {region.flag} {region.city}
            </div>

            <div
              style={{
                color: "#7f8da6",
                fontSize: "12px",
                marginTop: "3px",
              }}
            >
              AWS Region: {region.code}
            </div>

            <div
              style={{
                marginTop: "15px",
                fontSize: "11px",
                color: "#8e9ab0",
              }}
            >
              SELECT AVAILABILITY ZONE
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {azOptions.map((az) => (
                <button
                  key={az}
                  onClick={() => setSelectedAz(az)}
                  style={{
                    padding: "8px 13px",
                    borderRadius: "6px",
                    border:
                      selectedAz === az
                        ? "1px solid #ff9900"
                        : "1px solid #3a465c",
                    background:
                      selectedAz === az ? "#3a2913" : "#172033",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {az}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={!selectedAz}
              style={{
                marginTop: "14px",
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "6px",
                background: selectedAz ? "#ff9900" : "#30394a",
                color: selectedAz ? "#111" : "#778196",
                fontWeight: "600",
                cursor: selectedAz ? "pointer" : "not-allowed",
              }}
            >
              Create Architecture →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}