"use client";

import { useState } from "react";
import { apiFetch, parseJwt } from "../lib/api";

const DEMOS = [
  { r: "admin",   l: "Admin",   hint: "demo.admin@gmail.com"   },
  { r: "analyst", l: "Analyst", hint: "demo.analyst@gmail.com" },
  { r: "viewer",  l: "Viewer",  hint: "demo.viewer@gmail.com"  },
];

function Illustration() {
  return (
    <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxWidth: "360px" }}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#86EFAC" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="220" cy="220" r="200" fill="url(#glow)" />
      <circle cx="220" cy="220" r="155" fill="#DCFCE7" fillOpacity="0.6" />
      <g transform="translate(140,120)">
        <path d="M60 20 Q80 -10 100 20 Q120 -10 140 20 L140 40 Q100 30 60 40 Z" fill="#111" />
        <circle cx="100" cy="45" r="22" fill="#fff" stroke="#111" strokeWidth="2.5" />
        <path d="M90 45 Q95 48 100 45" stroke="#111" strokeWidth="1.5" fill="none" />
        <path d="M105 45 Q110 48 115 45" stroke="#111" strokeWidth="1.5" fill="none" />
        <path d="M70 120 Q100 80 130 120 L150 200 Q100 220 50 200 Z" fill="#86EFAC" stroke="#111" strokeWidth="2.5" />
        <path d="M94 135 Q100 128 106 135 Q106 142 100 150 Q94 142 94 135" fill="#fff" />
        <g stroke="#111" strokeWidth="2.5" fill="none">
          <path d="M75 130 Q30 150 50 185" />
          <path d="M125 130 Q170 150 150 185" />
        </g>
        <circle cx="50"  cy="185" r="10" fill="#fff" stroke="#111" strokeWidth="2" />
        <circle cx="150" cy="185" r="10" fill="#fff" stroke="#111" strokeWidth="2" />
        <path d="M170 40 Q220 0 270 60" stroke="#86EFAC" strokeWidth="2" fill="none" strokeDasharray="6 6">
          <animate attributeName="stroke-dashoffset" from="0" to="24" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
      <g transform="translate(36,248)">
        <rect width="185" height="92" rx="22" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
        <text x="20" y="38" fontFamily="Outfit" fontSize="15" fontWeight="700" fill="#111">Finance Record</text>
        <text x="20" y="58" fontFamily="Inter" fontSize="11" fill="#6b7280">INV-2026-042 · $48,000</text>
        <circle cx="160" cy="46" r="18" fill="#f0fdf4" />
        <text x="153" y="51" fontFamily="Inter" fontSize="14" fontWeight="800" fill="#16a34a">↑</text>
      </g>
      <circle cx="368" cy="98" r="28" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="358" y="105" fontFamily="Outfit" fontSize="16" fontWeight="800" fill="#22c55e">$</text>
      <circle cx="62" cy="72" r="24" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="55" y="78" fontFamily="Inter" fontSize="12" fill="#6b7280">%</text>
    </svg>
  );
}

/**
 * Login / Register screen with demo role quick-fill.
 * Props:
 *   onLogin(token, decodedPayload) – called after successful login
 */
export default function AuthScreen({ onLogin }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);

  function readableError(e, fallback) {
    if (e && typeof e.message === "string" && e.message.trim()) return e.message;
    return fallback;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const body = new URLSearchParams();
      body.set("username", email.trim());
      body.set("password", password);
      const data = await apiFetch("/auth/login", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const decoded = parseJwt(data.access_token);
      if (!decoded?.role || !decoded?.user_id) throw new Error("Invalid token payload");
      onLogin(data.access_token, decoded);
    } catch (e) { setError(readableError(e, "Login failed")); }
    finally    { setLoading(false); }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await apiFetch("/auth/register", undefined, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), password }),
      });
      setSuccess("Account created! Now log in with your credentials.");
      setMode("login"); setFullName(""); setPassword(""); setEmail("");
    } catch (e) { setError(readableError(e, "Registration failed")); }
    finally    { setLoading(false); }
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError(""); setSuccess("");
  }

  return (
    <div className="login-screen">
      <div className="login-card">

        {/* ── Left: Form ─────────────────────────────── */}
        <div className="login-form-area">
          <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 6 }}>
            {mode === "login" ? "Welcome back!" : "Create account"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Roles are auto-assigned from your email suffix.
          </p>

          {/* Demo quick-fill buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {DEMOS.map(({ r, l, hint }) => (
              <button key={r} type="button" id={`demo-${r}`}
                onClick={() => setEmail(hint)}
                style={{
                  flex: 1, padding: "10px 6px", border: "1px solid",
                  borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 12,
                  background:   email === hint ? "#f0fdf4" : "#fff",
                  borderColor:  email === hint ? "var(--accent)" : "var(--line)",
                  color: "var(--ink)", transition: "all 0.18s",
                }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
            {mode === "signup" && (
              <div style={{ marginBottom: 16 }}>
                <input id="signup-name" type="text" placeholder="Full Name"
                  className="input-pill" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <input id="login-email" type="email" placeholder="Email address"
                className="input-pill" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div style={{ marginBottom: 28 }}>
              <input id="login-password" type="password" placeholder="Password"
                className="input-pill" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error   && <div className="msg-error">{error}</div>}
            {success && <div className="msg-success">{success}</div>}

            <button id="auth-submit" className="btn-black-pill" type="submit" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="divider-text">or continue with</div>

          <div className="social-group">
            {/* Google */}
            <div className="social-btn">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            {/* Apple */}
            <div className="social-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.06 2.09-.98 3.93-.98 1.83 0 2.35.98 3.96.946 1.638-.027 2.674-1.47 3.674-2.936 1.154-1.69 1.63-3.328 1.65-3.413-.036-.013-3.17-1.218-3.204-4.793-.028-3.003 2.45-4.444 2.564-4.512-1.404-2.062-3.565-2.296-4.325-2.352-1.83-.153-3.33 1.04-4.24 1.04l.001-.001zM15.343.43c-1.127.135-2.52.844-3.323 1.785-.72.842-1.35 2.046-1.161 3.224 1.154.09 2.483-.623 3.256-1.55.702-.832 1.306-2.007 1.228-3.459z"/>
              </svg>
            </div>
            {/* Facebook */}
            <div className="social-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
          </div>

          <p style={{ marginTop: 28, fontSize: 14, textAlign: "center", color: "var(--muted)" }}>
            {mode === "login" ? "No account? " : "Have an account? "}
            <button id="toggle-auth-mode" onClick={switchMode}
              style={{ background: "none", border: "none", color: "var(--ink)", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              {mode === "login" ? "Register now" : "Login"}
            </button>
          </p>
        </div>

        {/* ── Right: Illustration ─────────────────────── */}
        <div className="login-illustration-area">
          <Illustration />
          <div style={{ marginTop: 36, textAlign: "center" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
              Make your finances clear with <strong>Zorvyn</strong>
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 300 }}>
              Role-based access control. Real-world records. Instant analytics.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink)", opacity: 0.15 }} />
              ))}
              <div style={{ width: 24, height: 8, borderRadius: 4, background: "var(--ink)" }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
