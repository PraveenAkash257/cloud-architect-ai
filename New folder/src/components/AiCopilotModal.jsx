import { useState, useRef, useEffect } from "react";
import { chatWithCloudArchitect, hasGeminiApiKey } from "../services/geminiService";

const QUICK_ACTIONS = [
  {
    icon: "🛡️",
    label: "SPOF & Resilience Audit",
    prompt: "Please conduct a rigorous resilience audit of my current cloud architecture. Highlight any single points of failure, missing redundancy, and recommend multi-AZ improvements.",
  },
  {
    icon: "💰",
    label: "Cost Optimization & Free Tier",
    prompt: "Analyze the cost efficiency of this architecture. Which components are AWS Free Tier eligible, and what strategies (e.g. Spot instances, reserved capacity, DynamoDB on-demand) will minimize our cloud bill?",
  },
  {
    icon: "🔒",
    label: "Security & IAM Review",
    prompt: "Review the security posture of this architecture. What security groups, private subnet isolations, IAM least-privilege roles, and encryption-at-rest configurations should we enforce?",
  },
  {
    icon: "⚡",
    label: "Scale for High Traffic",
    prompt: "How can I scale this architecture to handle 50,000 requests per second with sub-50ms latency? Suggest caching (ElastiCache/CloudFront), load balancing, and auto-scaling rules.",
  },
];

export default function AiCopilotModal({
  isOpen,
  onClose,
  architectureContext = {},
  onOpenKeyModal,
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm your **Cloud Architect AI Copilot** powered by Google Gemini (Free Tier).\n\nI have full real-time awareness of the components and connections on your canvas. How can I help you improve, secure, or optimize your cloud architecture today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [modelUsed, setModelUsed] = useState("gemini-2.5-flash");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || isTyping) return;

    if (!hasGeminiApiKey()) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: textToSend },
        {
          role: "assistant",
          content:
            "⚠️ **Gemini API Key Required**\n\nPlease configure your free Google Gemini API key to chat with the AI Copilot. You can get a free key in 10 seconds at [Google AI Studio](https://aistudio.google.com/app/apikey).",
        },
      ]);
      setInputValue("");
      return;
    }

    const updatedMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(updatedMessages);
    if (!customPrompt) setInputValue("");
    setIsTyping(true);

    try {
      const response = await chatWithCloudArchitect(updatedMessages, architectureContext);
      setModelUsed(response.modelUsed || "gemini-2.5-flash");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.text },
      ]);
    } catch (err) {
      console.error("AI Copilot chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ **Error communicating with Gemini:** ${err.message || "Please check your network and API key."}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "✨ Chat reset. I'm ready to review your live architecture anytime!",
      },
    ]);
  };

  // Simple markdown renderer for bold, code blocks, lists, and links
  const renderMarkdown = (text) => {
    // Split into code blocks and normal paragraphs
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "");
        return (
          <pre
            key={idx}
            style={{
              background: "#0f172a",
              color: "#e2e8f0",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontFamily: "monospace",
              overflowX: "auto",
              margin: "8px 0",
            }}
          >
            <code>{code}</code>
          </pre>
        );
      }

      // Format basic markdown (bold, lists, backticks)
      const lines = part.split("\n");
      return (
        <div key={idx} style={{ margin: "4px 0" }}>
          {lines.map((line, lineIdx) => {
            if (line.startsWith("### ")) {
              return (
                <h4 key={lineIdx} style={{ margin: "10px 0 4px", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  {line.replace("### ", "")}
                </h4>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h3 key={lineIdx} style={{ margin: "12px 0 6px", fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>
                  {line.replace("## ", "")}
                </h3>
              );
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <div key={lineIdx} style={{ display: "flex", gap: "6px", marginLeft: "6px", marginBottom: "3px" }}>
                  <span style={{ color: "#7c3aed" }}>•</span>
                  <span>{formatInlineMarkdown(line.substring(2))}</span>
                </div>
              );
            }
            return (
              <p key={lineIdx} style={{ margin: line ? "0 0 6px" : "0", lineHeight: 1.5 }}>
                {formatInlineMarkdown(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const formatInlineMarkdown = (text) => {
    // Basic inline bold and code replacement
    const elements = [];
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    tokens.forEach((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        elements.push(
          <strong key={i} style={{ color: "#0f172a", fontWeight: 800 }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        elements.push(
          <code
            key={i}
            style={{
              background: "#f1f5f9",
              color: "#6d28d9",
              padding: "1px 5px",
              borderRadius: "4px",
              fontSize: "11.5px",
              fontFamily: "monospace",
              border: "1px solid #e2e8f0",
            }}
          >
            {token.slice(1, -1)}
          </code>
        );
      } else {
        elements.push(token);
      }
    });
    return elements;
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "min(460px, 100vw)",
        background: "#ffffff",
        boxShadow: "-8px 0 35px rgba(0, 0, 0, 0.18)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid #e2e8f0",
        fontFamily: "var(--font-body)",
        animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ✨
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, fontFamily: "var(--font-heading)" }}>
              Cloud Architect Copilot
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: hasGeminiApiKey() ? "#22c55e" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {hasGeminiApiKey() ? `Google Gemini (${modelUsed})` : "API Key Required"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#94a3b8",
              padding: "5px 8px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#ffffff",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Live Topology Context Bar */}
      <div
        style={{
          padding: "8px 16px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          fontSize: "11.5px",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          Context: <strong>{architectureContext.nodes?.length || 0} nodes</strong> •{" "}
          <strong>{architectureContext.edges?.length || 0} edges</strong> • {architectureContext.region || "ap-south-1"}
        </span>
        {!hasGeminiApiKey() && (
          <button
            type="button"
            onClick={onOpenKeyModal}
            style={{
              background: "transparent",
              border: "none",
              color: "#7c3aed",
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Set Key
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          background: "#fbfcfd",
        }}
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: "12px 16px",
                borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isUser ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" : "#ffffff",
                color: isUser ? "#ffffff" : "#334155",
                fontSize: "12.5px",
                boxShadow: isUser
                  ? "0 4px 12px rgba(124, 58, 237, 0.25)"
                  : "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.04)",
              }}
            >
              {isUser ? <div>{msg.content}</div> : renderMarkdown(msg.content)}
            </div>
          );
        })}

        {isTyping && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "10px 14px",
              borderRadius: "16px 16px 16px 4px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🤖 Gemini is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Pills */}
      <div
        style={{
          padding: "8px 14px",
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          gap: "6px",
          overflowX: "auto",
        }}
      >
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(action.prompt)}
            disabled={isTyping}
            style={{
              flexShrink: 0,
              padding: "5px 10px",
              borderRadius: "8px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              fontSize: "11px",
              fontWeight: 700,
              color: "#334155",
              cursor: isTyping ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
            }}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "12px 14px",
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: "flex", gap: "8px" }}
        >
          <input
            type="text"
            placeholder="Ask Gemini about your cloud architecture..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1.5px solid #cbd5e1",
              fontSize: "12.5px",
              outline: "none",
              color: "#0f172a",
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13px",
              cursor: isTyping || !inputValue.trim() ? "not-allowed" : "pointer",
              opacity: !inputValue.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
