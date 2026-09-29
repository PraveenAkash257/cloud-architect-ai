import { useState, useEffect } from "react";
import { PROVIDERS, getActiveProvider, setActiveProvider, getApiKey, setApiKey, testApiKey } from "../services/aiRouter";

const PROVIDER_INFO = {
  [PROVIDERS.GEMINI]: {
    label: "Google Gemini",
    hint: "Free key, no credit card: https://aistudio.google.com/app/apikey",
  },
  [PROVIDERS.GROQ]: {
    label: "Groq (Llama 3.3, open-source)",
    hint: "Free key, no credit card: https://console.groq.com/keys",
  },
};

export default function AiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [provider, setProvider] = useState(getActiveProvider());
  const [apiKey, setApiKeyInput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setProvider(getActiveProvider());
      setTestStatus(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setApiKeyInput(getApiKey(provider));
    setTestStatus(null);
  }, [provider]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(provider, apiKey);
    setActiveProvider(provider);
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
    const res = await testApiKey(provider, apiKey.trim());
    setIsTesting(false);
    setTestStatus({ ok: res.ok, message: res.ok ? res.message : res.error });
    if (res.ok) {
      setApiKey(provider, apiKey);
      setActiveProvider(provider);
      if (onKeySaved) onKeySaved(apiKey);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#14161f",
          borderRadius: "10px",
          padding: "22px",
          width: "380px",
          color: "white",
        }}
      >
        <h3 style={{ marginTop: 0 }}>AI Provider Settings</h3>

        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          {Object.values(PROVIDERS).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                border: provider === p ? "1.5px solid #4f8ef7" : "1px solid #333",
                background: provider === p ? "#1c2a3f" : "#1c1f2b",
                color: "white",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {PROVIDER_INFO[p].label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: "11px", color: "#888", marginTop: 0 }}>{PROVIDER_INFO[provider].hint}</p>

        <input
          type="password"
          placeholder="Paste your API key"
          value={apiKey}
          onChange={(e) => setApiKeyInput(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: "border-box" }}
        />

        {testStatus && (
          <p style={{ fontSize: "12px", color: testStatus.ok ? "#4cc98c" : "#ff6b6b" }}>{testStatus.message}</p>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button onClick={handleTest} disabled={isTesting} style={{ flex: 1, padding: "8px" }}>
            {isTesting ? "Testing…" : "Test Key"}
          </button>
          <button onClick={handleSave} style={{ flex: 1, padding: "8px", background: "#4f8ef7", color: "white" }}>
            Save
          </button>
        </div>
        <button onClick={onClose} style={{ marginTop: "10px", width: "100%", padding: "6px", background: "transparent", color: "#888" }}>
          Close
        </button>
      </div>
    </div>
  );
}
