import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert("Logged in successfully!");
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: "300px", margin: "100px auto" }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
      />
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <button type="submit" style={{ padding: "8px 16px" }}>
        Log In
      </button>
    </form>
  );
}

export default Login;