import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Palette from "./components/Palette";
import Canvas from "./components/Canvas";
import AsiaRegionMap from "./components/AsiaRegionMap";
import Dashboard from "./components/Dashboard";

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard"); // "dashboard" | "regionMap" | "canvas"
  const [architecture, setArchitecture] = useState(null);
  const [initialArchitecture, setInitialArchitecture] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore guest session signout error
    }
    setSession(null);
    setView("dashboard");
  };

  if (!session) {
    return (
      <Login
        onGuestLogin={() =>
          setSession({ user: { email: "architect@aws-cloud.demo" }, isGuest: true })
        }
      />
    );
  }

  // 1. Dashboard Welcome Screen
  if (view === "dashboard") {
    return (
      <Dashboard
        onNewProject={() => setView("regionMap")}
        onOpenProject={(proj) => {
          setArchitecture({ region: proj.region, az: proj.az, name: proj.name });
          setInitialArchitecture(proj.architecture);
          setView("canvas");
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  // 2. Region & Availability Zone Map Selector
  if (view === "regionMap") {
    return (
      <AsiaRegionMap
        onCreateArchitecture={(selection) => {
          setArchitecture(selection);
          setInitialArchitecture(null);
          setView("canvas");
        }}
        onBackToDashboard={() => setView("dashboard")}
        onSignOut={handleSignOut}
      />
    );
  }

  // 3. Main Architecture Canvas
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      <Palette />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div
          style={{
            height: "56px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 20px",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            color: "#1e293b",
            fontSize: "13px",
            fontFamily: "var(--font-heading)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setView("dashboard")}
            style={{
              padding: "7px 14px",
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "12.5px",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0f172a";
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#334155";
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ← Dashboard
          </button>

          <button
            onClick={() => setView("regionMap")}
            style={{
              padding: "7px 14px",
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "12.5px",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0f172a";
              e.currentTarget.style.borderColor = "#0284c7";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#334155";
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            🗺️ Region Map
          </button>

          {architecture?.name && (
            <span style={{ color: "#7c3aed", fontWeight: 800, fontSize: "14px", marginLeft: "6px" }}>
              {architecture.name}
            </span>
          )}

          <span style={{ color: "#cbd5e1" }}>•</span>

          <span style={{ fontSize: "12.5px", color: "#64748b" }}>
            Region: <strong style={{ color: "#0f172a" }}>{architecture?.region || "ap-south-1"}</strong>
          </span>

          <span style={{ fontSize: "12.5px", color: "#64748b" }}>
            AZ: <strong style={{ color: "#0f172a" }}>{architecture?.az || "ap-south-1a"}</strong>
          </span>

          <button
            onClick={handleSignOut}
            style={{
              marginLeft: "auto",
              padding: "7px 14px",
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "12.5px",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            Log Out
          </button>
        </div>

        <div style={{ height: "calc(100vh - 48px)" }}>
          <Canvas
            initialArchitecture={initialArchitecture}
            region={architecture?.region}
            az={architecture?.az}
          />
        </div>
      </main>
    </div>
  );
}

export default App;