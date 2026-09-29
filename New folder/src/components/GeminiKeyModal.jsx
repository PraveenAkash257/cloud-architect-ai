import { useState, useEffect } from "react";
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey } from "../services/geminiService";

export default function GeminiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { ok: boolean, message: string }
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGeminiApiKey());
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    if (onKeySaved) onKeySaved(apiKey);
    onClose();
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestStatus({ ok: false, message: "Please enter an API key first." });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    const res = await testGeminiApiKey(apiKey.trim());
    setIsTesting(false);
    setTestStatus({
      ok: res.ok,
      message: res.ok ? res.message : res.error,
    });
    if (res.ok) {
      setGeminiApiKey(apiKey);
      if (onKeySaved) onKeySaved(apiKey);
    }
  };

  const handleClear = () => {
    setApiKey("");
    setGeminiApiKey("");
    setTestStatus({ ok: true, message: "API key cleared. System will use deterministic fallback." });
    if (onKeySaved) onKeySaved("");
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
          maxWidth: "540px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
          animation: "modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 20px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
            color: "#ffffff",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: "0 4px 12px rgba(56, 189, 248, 0.4)",
              }}
            >
              🤖
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 900, fontFamily: "var(--font-heading)" }}>
                Google Gemini Free API
              </h3>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Powered by Gemini 2.5 Flash & 1.5 Flash (Free Tier)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#94a3b8",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Free Tier Callout Banner */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "12.5px",
              lineHeight: 1.5,
              marginBottom: "20px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "18px" }}>🎉</span>
            <div>
              <strong style={{ display: "block", color: "#14532d", fontWeight: 800, marginBottom: "2px" }}>
                100% Free with Google AI Studio
              </strong>
              Google provides free Gemini API access (15 requests/min, no credit card required). You can grab a free API key in under 15 seconds.
              <div style={{ marginTop: "8px" }}>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#0284c7",
                    fontWeight: 800,
                    textDecoration: "none",
                    fontSize: "12px",
                    background: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: "1px solid #bae6fd",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <span>🔗 Get Free Gemini API Key at Google AI Studio</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 800,
                color: "#1e293b",
                fontFamily: "var(--font-heading)",
                marginBottom: "6px",
              }}
            >
              Gemini API Key
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Key is stored locally in your browser (or loaded from <code>.env</code>).
            </span>
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: testStatus.ok ? "#dcfce7" : "#fee2e2",
                color: testStatus.ok ? "#166534" : "#991b1b",
                border: `1px solid ${testStatus.ok ? "#86efac" : "#fca5a5"}`,
              }}
            >
              <span>{testStatus.ok ? "✅" : "❌"}</span>
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: "9px 16px",
                  background: "#ffffff",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Clear Key
              </button>
            )}
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              style={{
                padding: "9px 16px",
                background: "#f1f5f9",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                cursor: isTesting || !apiKey.trim() ? "not-allowed" : "pointer",
                opacity: !apiKey.trim() ? 0.6 : 1,
              }}
            >
              {isTesting ? "Testing..." : "⚡ Test Connection"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "9px 20px",
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
              }}
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
