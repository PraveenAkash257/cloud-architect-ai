import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import VideoBackground from "./VideoBackground";

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
    <VideoBackground overlayOpacity={0}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* Claymorphic Floating Card */}
        <div
          className="animate-fade-slide-up"
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "rgba(12, 17, 32, 0.72)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1.5px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "36px",
            padding: "40px 36px",
            boxShadow:
              "0 32px 64px -16px rgba(0, 0, 0, 0.75), 0 0 35px rgba(139, 92, 246, 0.2), inset 0 2px 3px rgba(255, 255, 255, 0.35), inset 0 -2px 5px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top Subtle Ambient Glow Line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "15%",
              right: "15%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.8), rgba(236, 72, 153, 0.8), transparent)",
              borderRadius: "50%",
            }}
          />

          {/* Brand Header with Tactile 3D Icon */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              className="animate-clay-breathe"
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #db2777 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                boxShadow:
                  "0 14px 28px rgba(124, 58, 237, 0.45), inset 0 2px 3px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.3)",
                marginBottom: "16px",
                cursor: "pointer",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1) rotate(6deg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) rotate(0deg)";
              }}
            >
              ☁️
            </div>

            <h1
              style={{
                margin: "0 0 6px",
                fontSize: "24px",
                fontWeight: 900,
                color: "#ffffff",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              Cloud Architect AI
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "var(--clay-muted)",
                fontWeight: 500,
                fontFamily: "var(--font-body)",
              }}
            >
              Visual Infrastructure & Fault Simulation
            </p>
          </div>

          {/* Tactile Tab Switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(6, 9, 17, 0.75)",
              borderRadius: "18px",
              padding: "5px",
              marginBottom: "24px",
              boxShadow: "var(--shadow-clay-pressed)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              position: "relative",
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
                padding: "10px",
                borderRadius: "14px",
                border: "none",
                background:
                  mode === "signin"
                    ? "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)"
                    : "transparent",
                color: mode === "signin" ? "#ffffff" : "var(--clay-muted)",
                fontWeight: 800,
                fontSize: "13px",
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                boxShadow:
                  mode === "signin"
                    ? "0 6px 16px rgba(124, 58, 237, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)"
                    : "none",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
                padding: "10px",
                borderRadius: "14px",
                border: "none",
                background:
                  mode === "signup"
                    ? "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)"
                    : "transparent",
                color: mode === "signup" ? "#ffffff" : "var(--clay-muted)",
                fontWeight: 800,
                fontSize: "13px",
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                boxShadow:
                  mode === "signup"
                    ? "0 6px 16px rgba(124, 58, 237, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)"
                    : "none",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Dynamic Status Notifications */}
          {errorMsg && (
            <div
              className="animate-fade-slide-up"
              style={{
                padding: "12px 16px",
                borderRadius: "16px",
                background: "rgba(239, 68, 68, 0.18)",
                border: "1.5px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                fontSize: "12.5px",
                fontWeight: 600,
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 16px rgba(239, 68, 68, 0.15)",
              }}
            >
              <span style={{ fontSize: "15px" }}>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="animate-fade-slide-up"
              style={{
                padding: "12px 16px",
                borderRadius: "16px",
                background: "rgba(16, 185, 129, 0.18)",
                border: "1.5px solid rgba(16, 185, 129, 0.4)",
                color: "#86efac",
                fontSize: "12.5px",
                fontWeight: 600,
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 16px rgba(16, 185, 129, 0.15)",
              }}
            >
              <span style={{ fontSize: "15px" }}>✨</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--clay-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "7px",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="architect@aws-cloud.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clay-input-recessed"
                style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
                required
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--clay-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  Password
                </label>
                {mode === "signin" && (
                  <span
                    onClick={() => alert("Password reset link will be sent to your email.")}
                    style={{
                      fontSize: "12px",
                      color: "#a78bfa",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b5fd")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#a78bfa")}
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
                  className="clay-input-recessed"
                  style={{
                    padding: "12px 42px 12px 16px",
                    fontSize: "14px",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--clay-muted)",
                    cursor: "pointer",
                    fontSize: "15px",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="animate-fade-slide-up">
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--clay-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "7px",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="clay-input-recessed"
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="clay-button-primary"
              style={{
                width: "100%",
                height: "52px",
                fontSize: "15px",
                marginTop: "8px",
              }}
            >
              {loading ? "Processing..." : mode === "signin" ? "Sign In 🚀" : "Create Account ✨"}
            </button>
          </form>

          {/* Minimalist Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "22px 0 18px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--clay-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "var(--font-heading)",
              }}
            >
              OR
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
          </div>

          {/* Tactile Guest Demo Access */}
          {onGuestLogin && (
            <button
              type="button"
              onClick={onGuestLogin}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "18px",
                border: "1.5px solid rgba(56, 189, 248, 0.35)",
                background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)",
                backdropFilter: "blur(12px)",
                color: "#38bdf8",
                fontSize: "13.5px",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 8px 20px rgba(14, 165, 233, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.2)",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.borderColor = "#38bdf8";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(14, 165, 233, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.35)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(14, 165, 233, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.2)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.96)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              }}
            >
              <span>⚡</span>
              <span>Launch Instant Guest Demo</span>
            </button>
          )}
        </div>
      </div>
    </VideoBackground>
  );
}