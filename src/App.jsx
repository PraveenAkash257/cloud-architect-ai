import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Palette from "./components/Palette";
import Canvas from "./components/Canvas";
import AsiaRegionMap from "./components/AsiaRegionMap";

function App() {
  const [session, setSession] = useState(null);
  const [architecture, setArchitecture] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login />;
  }

  if (!architecture) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            position: "absolute",
            top: "18px",
            right: "25px",
            zIndex: 2000,
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid #34415a",
            background: "#172033",
            color: "white",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>

        <AsiaRegionMap
          onCreateArchitecture={(selection) => {
            setArchitecture(selection);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Palette />

      <main style={{ flex: 1 }}>
        <div
          style={{
            height: "45px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "0 15px",
            background: "#0f1728",
            borderBottom: "1px solid #26324a",
            color: "white",
            fontSize: "13px",
          }}
        >
          <button
            onClick={() => setArchitecture(null)}
            style={{
              padding: "6px 10px",
              background: "#172033",
              color: "white",
              border: "1px solid #34415a",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            ← Region Map
          </button>

          <span>
            Region: <strong>{architecture.region}</strong>
          </span>

          <span>
            AZ: <strong>{architecture.az}</strong>
          </span>

          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              marginLeft: "auto",
              padding: "6px 10px",
              background: "#172033",
              color: "white",
              border: "1px solid #34415a",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>

        <div style={{ height: "calc(100vh - 45px)" }}>
          <Canvas />
        </div>
      </main>
    </div>
  );
}

export default App;