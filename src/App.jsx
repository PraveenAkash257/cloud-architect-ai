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
    <div style={{ display: "flex", height: "100vh" }}>
      <Palette />

      <main style={{ flex: 1 }}>
        <div
          style={{
            height: "48px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 16px",
            background: "#0f1728",
            borderBottom: "1px solid #26324a",
            color: "white",
            fontSize: "13px",
          }}
        >
          <button
            onClick={() => setView("dashboard")}
            style={{
              padding: "6px 10px",
              background: "#172033",
              color: "#94a3b8",
              border: "1px solid #34415a",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            ← Dashboard
          </button>

          <button
            onClick={() => setView("regionMap")}
            style={{
              padding: "6px 10px",
              background: "#172033",
              color: "#94a3b8",
              border: "1px solid #34415a",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            🗺️ Region Map
          </button>

          {architecture?.name && (
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>
              {architecture.name}
            </span>
          )}

          <span style={{ color: "#64748b" }}>•</span>

          <span>
            Region: <strong style={{ color: "#f8fafc" }}>{architecture?.region || "ap-south-1"}</strong>
          </span>

          <span>
            AZ: <strong style={{ color: "#f8fafc" }}>{architecture?.az || "ap-south-1a"}</strong>
          </span>

          <button
            onClick={handleSignOut}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              background: "#172033",
              color: "#cbd5e1",
              border: "1px solid #34415a",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "12px",
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