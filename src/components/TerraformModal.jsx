import { useState } from "react";

export default function TerraformModal({ isOpen, onClose, terraformCode, resourceCount, region }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(terraformCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([terraformCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "main.tf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 15, 29, 0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "850px",
          height: "85vh",
          backgroundColor: "#0d1321",
          border: "1px solid #233554",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
          color: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1e2c44",
            backgroundColor: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>📦</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>
                Generated Terraform Configuration (<code style={{ color: "#7dd3fc" }}>main.tf</code>)
              </h3>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "11px" }}>
                <span
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  AWS Region: {region || "ap-south-1"}
                </span>
                <span
                  style={{
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "#4ade80",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {resourceCount} Resources Configured
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Code Viewer */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            backgroundColor: "#080c16",
            fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace",
            fontSize: "12.5px",
            lineHeight: 1.6,
            color: "#e2e8f0",
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            <code>{terraformCode}</code>
          </pre>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #1e2c44",
            backgroundColor: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Ready for deployment via <code style={{ color: "#94a3b8" }}>terraform apply</code>
          </span>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: copied ? "#15803d" : "#1e293b",
                color: copied ? "#ffffff" : "#f1f5f9",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.2s",
              }}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Code"}
            </button>

            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #0284c7",
                background: "#0284c7",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              💾 Download main.tf
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
