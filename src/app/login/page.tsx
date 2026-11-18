"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Login styles: own variables, dark values when the site theme is dark. `.login-input` keeps the
// globals.css rule that hides the mouse outline while :focus-visible still shows the keyboard ring.
const STYLES = `
.lg-root{--l-bg:#F3F4F7;--l-surface:#FFFFFF;--l-text:#1B2130;--l-muted:#5D6678;--l-border:#C9CFDA;--l-accent:#E67E22;--l-accent-hover:#D06E16;
  --l-on-accent:#0A1628;--l-accent-soft:#FFF3E6;--l-bad-bg:#FDECEA;--l-bad:#B42318;
  min-height:100vh;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);background:var(--l-bg);color:var(--l-text);font-family:var(--font-poppins),'Poppins',sans-serif}
[data-theme="dark"] .lg-root{--l-bg:#10141F;--l-surface:#161B28;--l-text:#E8EAF0;--l-muted:#97A1B4;--l-border:#343C4F;--l-accent-soft:rgba(230,126,34,.14);--l-bad-bg:#3A1C1C;--l-bad:#F59A93}
.lg-root *{box-sizing:border-box}
.lg-photo{position:relative;background:#1A2132 url(/images/hero-fallback.jpg) center/cover no-repeat;display:flex;align-items:flex-end;padding:48px}
.lg-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,22,40,.15) 30%,rgba(10,22,40,.85))}
.lg-photo-text{position:relative;z-index:1;color:#fff;max-width:420px}
.lg-photo-text img{width:52px;height:52px;border-radius:12px;margin-bottom:18px;display:block}
.lg-photo-text p{margin:0;font-size:1.6rem;font-weight:600;line-height:1.3}
.lg-photo-text span{display:block;margin-top:8px;font-size:.9rem;opacity:.85}
.lg-panel{display:flex;flex-direction:column;justify-content:center;padding:48px 24px}
.lg-form{width:100%;max-width:380px;margin:0 auto}
.lg-form h1{margin:0;font-size:1.6rem;font-weight:600;letter-spacing:-.01em}
.lg-form .lg-sub{margin:6px 0 32px;color:var(--l-muted);font-size:.9rem}
.lg-field{display:flex;flex-direction:column;gap:6px;margin-bottom:18px;font-size:.85rem;font-weight:500}
.lg-input-wrap{position:relative}
.lg-root .login-input{width:100%;padding:12px 14px;background:var(--l-surface);border:1px solid var(--l-border);border-radius:10px;color:var(--l-text);font:inherit;font-size:.95rem;transition:border-color .15s,box-shadow .15s}
.lg-root .login-input:focus{border-color:var(--l-accent);box-shadow:0 0 0 3px var(--l-accent-soft)}
.lg-input-wrap .login-input{padding-right:48px}
.lg-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:8px;background:none;color:var(--l-muted);cursor:pointer}
.lg-eye:hover{color:var(--l-text)}
.lg-error{background:var(--l-bad-bg);color:var(--l-bad);border-radius:10px;padding:10px 14px;margin-bottom:18px;font-size:.85rem}
.lg-submit{width:100%;margin-top:8px;padding:13px;border:0;border-radius:10px;background:var(--l-accent);color:var(--l-on-accent);font:inherit;font-size:.95rem;font-weight:600;cursor:pointer;transition:background .15s}
.lg-submit:hover{background:var(--l-accent-hover)}
.lg-submit:disabled{opacity:.7;cursor:progress}
.lg-back{display:inline-block;margin-top:28px;color:var(--l-muted);font-size:.85rem;text-decoration:none}
.lg-back:hover{color:var(--l-text);text-decoration:underline}
@media (max-width:860px){
  .lg-root{grid-template-columns:1fr}
  .lg-photo{min-height:180px;padding:24px}
  .lg-photo-text img{width:40px;height:40px;margin-bottom:10px}
  .lg-photo-text p{font-size:1.15rem}
  .lg-photo-text span{display:none}
  .lg-panel{justify-content:flex-start;padding:32px 16px}
}
`;

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {off
        ? <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        : <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />}
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) { router.push("/admin"); }
      else if (res.status === 401) { setError("Email or password is incorrect. Check both and try again."); }
      else {
        const body = await res.json().catch(() => null);
        setError(body?.error || `Login failed (${res.status}). Please try again.`);
      }
    } catch (err) {
      console.error("Login request failed", err);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg-root">
      <style>{STYLES}</style>
      <div className="lg-photo" aria-hidden="true">
        <div className="lg-photo-text">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/atlas-logo.jpeg" alt="" />
          <p>Atlas Tour &amp; Travels</p>
          <span>Manage packages, bookings, enquiries and everything on your website.</span>
        </div>
      </div>
      <main className="lg-panel">
        <form onSubmit={handleLogin} className="lg-form">
          <h1>Admin login</h1>
          <p className="lg-sub">Sign in to manage the Atlas Tour &amp; Travels website.</p>
          {error && <div className="lg-error" role="alert">{error}</div>}
          <label className="lg-field">
            Email
            <input type="email" className="login-input" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" placeholder="you@example.com" />
          </label>
          <label className="lg-field">
            Password
            <span className="lg-input-wrap">
              <input type={showPassword ? "text" : "password"} className="login-input" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter password" />
              <button type="button" className="lg-eye" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(s => !s)}>
                <EyeIcon off={showPassword} />
              </button>
            </span>
          </label>
          <button type="submit" className="lg-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <Link href="/" className="lg-back">Back to website</Link>
        </form>
      </main>
    </div>
  );
}
