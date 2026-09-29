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
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(6px)",
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
          maxWidth: "860px",
          height: "85vh",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          color: "#0f172a",
          overflow: "hidden",
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>📦</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-heading)" }}>
                Generated Terraform Configuration (<code style={{ color: "#0284c7" }}>main.tf</code>)
              </h3>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "11px" }}>
                <span
                  style={{
                    background: "rgba(2, 132, 199, 0.1)",
                    color: "#0284c7",
                    border: "1px solid rgba(2, 132, 199, 0.2)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                  }}
                >
                  AWS Region: {region || "ap-south-1"}
                </span>
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
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
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#64748b",
              fontSize: "16px",
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: "10px",
              fontWeight: 700,
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
            padding: "20px 24px",
            backgroundColor: "#f8fafc",
            fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "#0f172a",
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            <code>{terraformCode}</code>
          </pre>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Ready for deployment via <code style={{ color: "#0f172a", fontWeight: 700 }}>terraform apply</code>
          </span>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "9px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: copied ? "#dcfce7" : "#ffffff",
                color: copied ? "#166534" : "#1e293b",
                fontSize: "12.5px",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Code"}
            </button>

            <button
              onClick={handleDownload}
              style={{
                padding: "9px 18px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                color: "#ffffff",
                fontSize: "12.5px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 3px 10px rgba(2, 132, 199, 0.3)",
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
