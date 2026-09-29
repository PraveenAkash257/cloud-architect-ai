import { useState } from "react";
import { generateArchitectureFromPrompt, hasGeminiApiKey } from "../services/geminiService";
import { ASIA_REGIONS } from "../data/regions";

const PROMPT_PRESETS = [
  {
    title: "🌐 3-Tier Enterprise Web App",
    prompt: "Create a highly available 3-tier web application with an Application Load Balancer, EC2 Auto-Scaling group in private subnets, Multi-AZ PostgreSQL RDS, and Redis ElastiCache with CloudFront CDN at the edge.",
  },
  {
    title: "⚡ Serverless Event-Driven API",
    prompt: "Design a serverless REST API using AWS API Gateway, Lambda functions, DynamoDB for storage, S3 bucket for uploads, and SQS queue for async processing.",
  },
  {
    title: "📦 EKS Microservices Cluster",
    prompt: "Generate a containerized microservices platform with Network Load Balancer, ECS/EKS compute cluster, SQS messaging, RDS PostgreSQL database, and CloudWatch monitoring.",
  },
  {
    title: "🛡️ Secure FinTech VPC Architecture",
    prompt: "Build a multi-AZ VPC architecture with strict Security Groups, private subnets for EC2 workloads, KMS-encrypted RDS database, and Route 53 DNS failover.",
  },
  {
    title: "📊 Real-Time Analytics Pipeline",
    prompt: "Design a real-time data ingestion pipeline with API Gateway, SQS message buffer, Lambda consumers, S3 data lake, and DynamoDB fast lookup table.",
  },
];

export default function AiGeneratorModal({
  isOpen,
  onClose,
  onGenerateSuccess,
  currentRegion = "ap-south-1",
  onOpenKeyModal,
}) {
  const [prompt, setPrompt] = useState("");
  const [region, setRegion] = useState(currentRegion);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedResult, setGeneratedResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the cloud architecture you want to generate.");
      return;
    }

    if (!hasGeminiApiKey()) {
      setError("Please configure your free Google Gemini API key first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedResult(null);

    try {
      const result = await generateArchitectureFromPrompt(prompt, { region });
      setGeneratedResult(result);
    } catch (err) {
      console.error("AI architecture generation error:", err);
      setError(err.message || "Failed to generate architecture. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (!generatedResult) return;
    onGenerateSuccess(generatedResult);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 15, 29, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        fontFamily: "var(--font-body)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "22px 28px 18px",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              ✨
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 900, fontFamily: "var(--font-heading)" }}>
                AI Architecture Generator
              </h3>
              <span style={{ fontSize: "12px", opacity: 0.9 }}>
                Powered by Google Gemini 2.5 Flash Free Tier
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#ffffff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {!hasGeminiApiKey() && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                color: "#92400e",
                fontSize: "12.5px",
                fontWeight: 600,
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span>
                <span>Gemini API key is required to use AI generation.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenKeyModal) onOpenKeyModal();
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                Set Free Key
              </button>
            </div>
          )}

          {/* Region Picker & Prompt Controls */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#334155",
                  fontFamily: "var(--font-heading)",
                  marginBottom: "4px",
                }}
              >
                Target AWS Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "12.5px",
                  color: "#0f172a",
                  fontWeight: 600,
                  background: "#f8fafc",
                }}
              >
                {ASIA_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.flag} {r.name} ({r.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Textarea */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#334155",
                fontFamily: "var(--font-heading)",
                marginBottom: "4px",
              }}
            >
              Describe Your Desired Cloud Architecture
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Build a high-availability e-commerce system with Application Load Balancer, EC2 instances in private subnet, Multi-AZ RDS PostgreSQL database, S3 bucket for product images, and SQS for order processing."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1.5px solid #cbd5e1",
                fontSize: "13px",
                lineHeight: 1.5,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          {/* Preset Prompts */}
          <div style={{ marginBottom: "20px" }}>
            <span
              style={{
                display: "block",
                fontSize: "11.5px",
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              Or Choose an Architecture Template:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PROMPT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(preset.prompt)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "10px",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    color: "#334155",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ede9fe";
                    e.currentTarget.style.borderColor = "#c4b5fd";
                    e.currentTarget.style.color = "#6d28d9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.color = "#334155";
                  }}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #fca5a5",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Generated Preview Card */}
          {generatedResult && (
            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#166534" }}>
                  🎉 {generatedResult.name}
                </h4>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    background: "#dcfce7",
                    color: "#15803d",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {generatedResult.architecture.nodes.length} Components • {generatedResult.architecture.edges.length} Connections
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#14532d", margin: "0 0 10px", lineHeight: 1.4 }}>
                {generatedResult.description}
              </p>
              {generatedResult.designRationale?.length > 0 && (
                <div style={{ borderTop: "1px solid #bbf7d0", paddingTop: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#166534", display: "block", marginBottom: "4px" }}>
                    AI Architectural Highlights:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "11.5px", color: "#15803d" }}>
                    {generatedResult.designRationale.map((r, i) => (
                      <li key={i} style={{ marginBottom: "2px" }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 28px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
            {isGenerating ? "🤖 Gemini is generating nodes and connections..." : "Ready to generate"}
          </span>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 16px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                color: "#475569",
              }}
            >
              Cancel
            </button>
            {generatedResult ? (
              <button
                type="button"
                onClick={handleApplyToCanvas}
                style={{
                  padding: "9px 20px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  fontFamily: "var(--font-heading)",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                }}
              >
                🚀 Load Onto Canvas
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                style={{
                  padding: "9px 20px",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  fontFamily: "var(--font-heading)",
                  cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer",
                  opacity: !prompt.trim() ? 0.6 : 1,
                  boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                }}
              >
                {isGenerating ? "⚡ Synthesizing Architecture..." : "✨ Generate Architecture"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
