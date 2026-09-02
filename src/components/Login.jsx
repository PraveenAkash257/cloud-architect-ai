import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login({ onGuestLogin }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }

      setLoading(true);
      try {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user && !data?.session) {
          setSuccessMsg("Account created! Check your email to confirm your account.");
        } else {
          setSuccessMsg("Account created successfully!");
        }
      } catch (err) {
        setErrorMsg(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        }
      } catch (err) {
        setErrorMsg(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#060911",
        backgroundImage:
          "radial-gradient(circle at 50% 30%, rgba(255, 153, 0, 0.08) 0%, transparent 60%), radial-gradient(circle at 50% 80%, rgba(56, 189, 248, 0.04) 0%, transparent 50%)",
        color: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Centered Minimalist Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#0d1322",
          border: "1px solid #1c273e",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 153, 0, 0.05)",
          boxSizing: "border-box",
        }}
      >
        {/* Centered Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ff9900 0%, #ea580c 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 0 25px rgba(255, 153, 0, 0.4)",
              marginBottom: "14px",
            }}
          >
            ☁️
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.01em" }}>
            AWS Cloud Architect AI
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Infrastructure & Fault-Simulation Studio
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            background: "#080c18",
            borderRadius: "8px",
            padding: "3px",
            marginBottom: "20px",
            border: "1px solid #172136",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: "6px",
              border: "none",
              background: mode === "signin" ? "#1e293b" : "transparent",
              color: mode === "signin" ? "#f8fafc" : "#64748b",
              fontWeight: 600,
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: "6px",
              border: "none",
              background: mode === "signup" ? "#1e293b" : "transparent",
              color: mode === "signup" ? "#f8fafc" : "#64748b",
              fontWeight: 600,
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: "6px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "12px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: "6px",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#86efac",
              fontSize: "12px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#8fa0bc", textTransform: "uppercase", marginBottom: "5px" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "7px",
                border: "1px solid #1c273e",
                background: "#080c16",
                color: "#f8fafc",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ff9900")}
              onBlur={(e) => (e.target.style.borderColor = "#1c273e")}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#8fa0bc", textTransform: "uppercase" }}>
                Password
              </label>
              {mode === "signin" && (
                <span
                  onClick={() => alert("Password reset link will be sent to your email.")}
                  style={{ fontSize: "11px", color: "#ff9900", cursor: "pointer" }}
                >
                  Forgot?
                </span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 34px 9px 12px",
                  borderRadius: "7px",
                  border: "1px solid #1c273e",
                  background: "#080c16",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ff9900")}
                onBlur={(e) => (e.target.style.borderColor = "#1c273e")}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "13px",
                  userSelect: "none",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#8fa0bc", textTransform: "uppercase", marginBottom: "5px" }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "7px",
                  border: "1px solid #1c273e",
                  background: "#080c16",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ff9900")}
                onBlur={(e) => (e.target.style.borderColor = "#1c273e")}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "7px",
              border: "1px solid #ff9900",
              background: "linear-gradient(135deg, #ff9900 0%, #ea580c 100%)",
              color: "#0a0f1d",
              fontSize: "13px",
              fontWeight: 800,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 3px 15px rgba(255, 153, 0, 0.35)",
              marginTop: "4px",
              transition: "opacity 0.15s, transform 0.15s",
            }}
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0 14px" }}>
          <div style={{ flex: 1, height: "1px", background: "#172136" }} />
          <span style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#172136" }} />
        </div>

        {/* Quick Demo Access */}
        {onGuestLogin && (
          <button
            type="button"
            onClick={onGuestLogin}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: "7px",
              border: "1px solid #22304d",
              background: "#090e1b",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#38bdf8";
              e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#22304d";
              e.currentTarget.style.background = "#090e1b";
            }}
          >
            <span>⚡ Launch Guest Demo Studio</span>
          </button>
        )}
      </div>
    </div>
  );
}