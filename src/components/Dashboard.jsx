import { useState, useRef, useMemo } from "react";
import { SAMPLE_PROJECTS } from "../data/sampleProjects";

const CATEGORIES = ["All Projects", "VPC & Compute", "Containers", "Edge & CDN", "Serverless"];

export default function Dashboard({ onNewProject, onOpenProject, onSignOut }) {
  const [selectedCategory, setSelectedCategory] = useState("All Projects");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.nodes && Array.isArray(json.nodes)) {
          const flowNodes = json.nodes.map((n, i) => ({
            id: n.id || `node_${i + 1}`,
            type: "cloudNode",
            position: n.position || { x: 100 + (i % 3) * 280, y: 100 + Math.floor(i / 3) * 160 },
            data: {
              label: n.label || n.type || `AWS Component ${i + 1}`,
              componentType: n.type || "vm",
              region: n.region || json.region || "ap-south-1",
              az: n.az || json.az || "ap-south-1a",
            },
          }));

          const flowEdges = (json.edges || []).map((e, i) => ({
            id: e.id || `e_${i + 1}`,
            source: e.source,
            target: e.target,
            animated: true,
          }));

          onOpenProject({
            name: file.name.replace(".json", ""),
            region: json.region || "ap-south-1",
            az: json.az || "ap-south-1a",
            architecture: {
              entryPoint: json.entryPoint || flowNodes[0]?.id || null,
              nodes: flowNodes,
              edges: flowEdges,
            },
          });
        } else {
          alert("Invalid architecture JSON format. Expected an object with a 'nodes' array.");
        }
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const filteredProjects = useMemo(() => {
    return SAMPLE_PROJECTS.filter((p) => {
      const matchesCategory =
        selectedCategory === "All Projects" || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#070b14",
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(255, 153, 0, 0.08) 0%, rgba(14, 165, 233, 0.04) 40%, #070b14 80%)",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Hidden file input for Open Local Project */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        style={{ display: "none" }}
      />

      {/* Top Navigation Header */}
      <header
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 36px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          background: "rgba(10, 16, 30, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ff9900 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              boxShadow: "0 0 20px rgba(255, 153, 0, 0.4)",
            }}
          >
            ☁️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.02em" }}>
                AWS Cloud Architect AI
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  background: "rgba(255, 153, 0, 0.15)",
                  color: "#ff9900",
                  border: "1px solid rgba(255, 153, 0, 0.3)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                STUDIO
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "20px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              fontSize: "11px",
              color: "#4ade80",
              fontWeight: 600,
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            AWS Engine: Active
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                padding: "7px 14px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#334155";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.borderColor = "#1e293b";
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 20px 60px",
          maxWidth: "920px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#f8fafc",
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            Design, Simulate & Export AWS Architectures
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 auto", maxWidth: "600px" }}>
            Visual cloud infrastructure modeling with deterministic failure injection analysis and production Terraform code generation.
          </p>

          {/* Telemetry Feature Badges */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "16px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#ff9900",
                background: "rgba(255, 153, 0, 0.1)",
                border: "1px solid rgba(255, 153, 0, 0.25)",
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              🌐 10 AWS Asia-Pacific Regions
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              ⚡ Deterministic SPOF Failure Simulation
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#4ade80",
                background: "rgba(74, 222, 128, 0.1)",
                border: "1px solid rgba(74, 222, 128, 0.25)",
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              📦 Dynamic Terraform (.tf) IaC Export
            </span>
          </div>
        </div>

        {/* Top Action Grid: Two Prominent Action Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            width: "100%",
            marginBottom: "36px",
          }}
        >
          {/* Action 1: Create New Architecture Canvas (High Contrast AWS Cyan/Blue) */}
          <button
            onClick={onNewProject}
            style={{
              height: "88px",
              borderRadius: "16px",
              border: "1px solid #38bdf8",
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
              boxShadow: "0 0 30px rgba(2, 132, 199, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              padding: "0 22px",
              gap: "16px",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(2, 132, 199, 0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(2, 132, 199, 0.4)";
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              +
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>
                Create New Architecture Canvas
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px" }}>
                Select AWS region on map & open visual canvas
              </div>
            </div>
          </button>

          {/* Action 2: Open Local Project (Brushed Silver Metallic) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: "88px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "linear-gradient(135deg, #475569 0%, #94a3b8 50%, #cbd5e1 100%)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              padding: "0 22px",
              gap: "16px",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 14px 36px rgba(0, 0, 0, 0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(15, 23, 42, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              📁
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>
                Open Local Project
              </div>
              <div style={{ fontSize: "12px", color: "#1e293b", marginTop: "2px" }}>
                Import architecture JSON from your computer
              </div>
            </div>
          </button>
        </div>

        {/* Structured Feed Section: Recent Infrastructure Projects */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#0b1220",
            border: "1px solid #1a273f",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)",
            boxSizing: "border-box",
          }}
        >
          {/* Feed Header with Search & Categories */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#f8fafc" }}>
                Recent AWS Infrastructure Projects
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Select a template or resume recent cloud architecture designs
              </span>
            </div>

            {/* Quick Search */}
            <input
              type="text"
              placeholder="🔍 Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #243552",
                background: "#080d18",
                color: "#f8fafc",
                fontSize: "12px",
                outline: "none",
                minWidth: "180px",
              }}
            />
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: selectedCategory === cat ? "1px solid #ff9900" : "1px solid #1e293b",
                  background: selectedCategory === cat ? "rgba(255, 153, 0, 0.15)" : "#0d1527",
                  color: selectedCategory === cat ? "#ff9900" : "#94a3b8",
                  fontSize: "11.5px",
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredProjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "13px" }}>
                No AWS projects found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e2c44",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#142038";
                    e.currentTarget.style.borderColor = "#ff9900";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0f172a";
                    e.currentTarget.style.borderColor = "#1e2c44";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  {/* Left: AWS Tag, Title, and Description */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 153, 0, 0.1)",
                        border: "1px solid rgba(255, 153, 0, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {project.providerIcon}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                          {project.name}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(255, 153, 0, 0.15)",
                            color: "#ff9900",
                          }}
                        >
                          {project.providerTag}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>
                        {project.description}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        Region: <strong style={{ color: "#cbd5e1" }}>{project.region}</strong> ({project.az}) • {project.architecture.nodes.length} Components
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp, Status Badge, and Arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {project.modified}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        color: project.statusColor,
                        backgroundColor: project.statusBg,
                        border: `1px solid ${project.statusColor}33`,
                        minWidth: "65px",
                        textAlign: "center",
                      }}
                    >
                      {project.status}
                    </span>
                    <span style={{ color: "#ff9900", fontSize: "16px", fontWeight: 700 }}>
                      →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
