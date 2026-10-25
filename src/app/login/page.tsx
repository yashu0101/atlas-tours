"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (res.ok) { router.push("/admin"); } else { setError("Invalid email or password"); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a3a6b, #0a1628)", fontFamily: "Poppins, sans-serif" }}>
      <form onSubmit={handleLogin} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "48px 40px", width: "100%", maxWidth: "420px", color: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "60px", height: "60px", background: "linear-gradient(135deg, #e67e22, #f39c12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
            <i className="fas fa-lock" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Admin Login</h1>
          <p style={{ opacity: 0.6, fontSize: "14px", marginTop: "4px" }}>Atlas Tour & Travels</p>
        </div>
        {error && <div style={{ background: "rgba(231,76,60,0.2)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#e74c3c" }}>{error}</div>}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", opacity: 0.7, display: "block", marginBottom: "6px" }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} placeholder="admin@atlastours.com" />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", opacity: 0.7, display: "block", marginBottom: "6px" }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} placeholder="Enter password" />
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #e67e22, #f39c12)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
