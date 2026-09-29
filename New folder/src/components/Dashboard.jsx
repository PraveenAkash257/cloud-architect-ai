import { useState, useRef, useMemo } from "react";
import { SAMPLE_PROJECTS } from "../data/sampleProjects";
import VideoBackground from "./VideoBackground";

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
    <VideoBackground overlayOpacity={0}>
      {/* Hidden file input for Open Local Project */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        style={{ display: "none" }}
      />

      {/* Sleek Floating Glass Header */}
      <header
        style={{
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 4vw, 48px)",
          background: "rgba(10, 15, 29, 0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            className="animate-clay-breathe"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 8px 20px rgba(124, 58, 237, 0.45), inset 0 2px 2px rgba(255, 255, 255, 0.4)",
            }}
          >
            ☁️
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 900,
                color: "#ffffff",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.01em",
              }}
            >
              Cloud Architect AI
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)";
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

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px clamp(16px, 4vw, 40px) 60px",
          maxWidth: "1060px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Minimal Hero Header */}
        <div className="animate-fade-slide-up" style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 900,
              color: "#ffffff",
              margin: "0 0 10px",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
              textShadow:
                "0 2px 4px rgba(0, 0, 0, 0.95), 0 6px 16px rgba(0, 0, 0, 0.85), 0 12px 30px rgba(0, 0, 0, 0.75), 0 0 50px rgba(0, 0, 0, 0.9)",
            }}
          >
            Design, Simulate & Export Cloud Architectures
          </h1>
          <p
            style={{
              color: "#f8fafc",
              fontSize: "15.5px",
              fontWeight: 600,
              margin: "0 auto 20px",
              maxWidth: "640px",
              lineHeight: 1.6,
              fontFamily: "var(--font-body)",
              textShadow:
                "0 1.5px 3px rgba(0, 0, 0, 0.95), 0 4px 12px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 0, 0, 0.9)",
            }}
          >
            Visual cloud infrastructure modeling with automated Single Point of Failure (SPOF) resilience analysis and production Terraform code generation.
          </p>

          {/* Telemetry Feature Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              className="animate-clay-breathe"
              style={{
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: "#e9d5ff",
                background: "rgba(12, 17, 32, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(167, 139, 250, 0.45)",
                padding: "6px 16px",
                borderRadius: "24px",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5), 0 0 15px rgba(124, 58, 237, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              <span>🌐</span>
              <span>10 AWS Asia Regions</span>
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: "#bae6fd",
                background: "rgba(12, 17, 32, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(56, 189, 248, 0.45)",
                padding: "6px 16px",
                borderRadius: "24px",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5), 0 0 15px rgba(14, 165, 233, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              <span>⚡</span>
              <span>Fault Simulation Engine</span>
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: "#fbcfe8",
                background: "rgba(12, 17, 32, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(244, 114, 182, 0.45)",
                padding: "6px 16px",
                borderRadius: "24px",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5), 0 0 15px rgba(236, 72, 153, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              <span>📦</span>
              <span>Terraform (.tf) IaC</span>
            </div>
          </div>
        </div>

        {/* Prominent Tactile Bento Action Cards */}
        <div
          className="animate-fade-slide-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            width: "100%",
            marginBottom: "40px",
          }}
        >
          {/* Card 1: Create New Architecture Canvas (Hero Gradient Clay) */}
          <div
            onClick={onNewProject}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "30px",
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(219, 39, 119, 0.85) 100%)",
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(255, 255, 255, 0.3)",
              boxShadow:
                "0 20px 40px -10px rgba(124, 58, 237, 0.5), 0 0 25px rgba(236, 72, 153, 0.3), inset 0 2px 3px rgba(255, 255, 255, 0.5)",
              padding: "26px 28px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 28px 50px -10px rgba(124, 58, 237, 0.65), 0 0 35px rgba(236, 72, 153, 0.45), inset 0 2.5px 3.5px rgba(255, 255, 255, 0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 20px 40px -10px rgba(124, 58, 237, 0.5), 0 0 25px rgba(236, 72, 153, 0.3), inset 0 2px 3px rgba(255, 255, 255, 0.5)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.96)";
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 900,
                color: "#ffffff",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
                flexShrink: 0,
              }}
            >
              +
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#ffffff",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.01em",
                }}
              >
                Create New Architecture
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.85)",
                  marginTop: "4px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Select AWS region & launch visual designer
              </div>
            </div>
          </div>

          {/* Card 2: Open Local Project (Sleek Frosted Glass-Clay) */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "30px",
              background: "rgba(13, 19, 36, 0.72)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1.5px solid rgba(255, 255, 255, 0.16)",
              boxShadow:
                "0 20px 40px -10px rgba(0, 0, 0, 0.65), 0 0 25px rgba(56, 189, 248, 0.15), inset 0 2px 2px rgba(255, 255, 255, 0.25)",
              padding: "26px 28px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
              e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.5)";
              e.currentTarget.style.boxShadow =
                "0 28px 50px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.35), inset 0 2px 2px rgba(255, 255, 255, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
              e.currentTarget.style.boxShadow =
                "0 20px 40px -10px rgba(0, 0, 0, 0.65), 0 0 25px rgba(56, 189, 248, 0.15), inset 0 2px 2px rgba(255, 255, 255, 0.25)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.96)";
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.25) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                boxShadow: "0 6px 16px rgba(14, 165, 233, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                flexShrink: 0,
              }}
            >
              📂
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#ffffff",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.01em",
                }}
              >
                Open Local Project
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--clay-muted)",
                  marginTop: "4px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Import architecture JSON from device
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Projects Feed Card */}
        <div
          className="animate-fade-slide-up"
          style={{
            width: "100%",
            background: "rgba(11, 16, 30, 0.68)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1.5px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "32px",
            padding: "28px clamp(16px, 3vw, 32px)",
            boxShadow:
              "0 32px 64px -16px rgba(0, 0, 0, 0.75), inset 0 1.5px 2px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Feed Header with Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "19px",
                  fontWeight: 900,
                  color: "#ffffff",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.01em",
                }}
              >
                Cloud Infrastructure Architectures
              </h2>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--clay-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Launch curated architectures or pick up previous work
              </span>
            </div>

            {/* Quick Search */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input-recessed"
                style={{
                  padding: "9px 14px 9px 34px",
                  fontSize: "13px",
                  borderRadius: "14px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "13px",
                  color: "var(--clay-muted)",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "16px",
                    border: isActive
                      ? "1px solid rgba(167, 139, 250, 0.6)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(219, 39, 119, 0.35) 100%)"
                      : "rgba(15, 23, 42, 0.5)",
                    color: isActive ? "#ffffff" : "var(--clay-muted)",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 800 : 600,
                    fontFamily: "var(--font-heading)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: isActive
                      ? "0 4px 14px rgba(124, 58, 237, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3)"
                      : "none",
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--clay-muted)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.5)";
                    }
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Clean Projects List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredProjects.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "var(--clay-muted)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                }}
              >
                No architecture designs found matching &quot;{searchQuery}&quot;.
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
                    borderRadius: "20px",
                    background: "rgba(15, 23, 42, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(24, 34, 60, 0.75)";
                    e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.45)";
                    e.currentTarget.style.transform = "translateX(6px) scale(1.008)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(124, 58, 237, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.5)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "translateX(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.98)";
                  }}
                >
                  {/* Left Section: Icon, Title & Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)",
                        border: "1px solid rgba(167, 139, 250, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        flexShrink: 0,
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      {project.providerIcon}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: 800,
                            color: "#ffffff",
                            fontFamily: "var(--font-heading)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {project.name}
                        </span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 800,
                            fontFamily: "var(--font-heading)",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            background: "rgba(139, 92, 246, 0.2)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(167, 139, 250, 0.3)",
                          }}
                        >
                          {project.providerTag}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12.5px",
                          color: "var(--clay-muted)",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.description}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--clay-subtle)",
                          marginTop: "3px",
                          fontWeight: 500,
                        }}
                      >
                        Region: <strong style={{ color: "#e2e8f0" }}>{project.region}</strong> ({project.az}) •{" "}
                        {project.architecture.nodes.length} Components
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Status Badge & Interactive Arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "var(--font-heading)",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        color: project.statusColor,
                        background: project.statusBg,
                        border: `1px solid ${project.statusColor}33`,
                        textAlign: "center",
                      }}
                    >
                      {project.status}
                    </span>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "rgba(139, 92, 246, 0.15)",
                        border: "1px solid rgba(167, 139, 250, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#a78bfa",
                        fontSize: "14px",
                        fontWeight: 900,
                      }}
                    >
                      →
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </VideoBackground>
  );
}
