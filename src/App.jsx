import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Palette from "./components/Palette";
import Canvas from "./components/Canvas";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Palette />
      <main style={{ flex: 1 }}>
        <button onClick={() => supabase.auth.signOut()} style={{ margin: "10px" }}>
          Log Out
        </button>
        <Canvas />
      </main>
    </div>
  );
}

export default App;