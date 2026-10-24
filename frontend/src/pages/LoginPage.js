import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await login(email.trim(), password);
    setBusy(false);
    if (result.ok) navigate("/dashboard", { replace: true });
    else setError(result.error);
  }

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="hero-brand">
          <div className="hero-logo">D</div>
          <span>Data Observatory</span>
        </div>

        <div>
          <h1>Trace every dataset's journey.</h1>
          <p className="lead">
            Register datasets, follow their versions, and keep a verifiable
            provenance trail on-chain. Built for research teams who care about
            the story behind their data.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="icon">▤</div>
              <div>
                <strong>Versioned provenance</strong>
                <small>Every change becomes a new, permanent record.</small>
              </div>
            </div>
            <div className="hero-feature">
              <div className="icon">◇</div>
              <div>
                <strong>Blockchain-backed</strong>
                <small>Compact records anchored to a tamper-evident chain.</small>
              </div>
            </div>
            <div className="hero-feature">
              <div className="icon">✓</div>
              <div>
                <strong>Integrity at a glance</strong>
                <small>SHA-256 verification detects content drift instantly.</small>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", fontSize: 12, opacity: 0.6 }}>
          Blockchain Dataset Provenance System · Final year project
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to your workspace</h2>
          <p className="sub">Continue managing dataset lineage and integrity.</p>

          {error && (
            <div className="auth-alert error">
              <strong>Sign-in failed:</strong> {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}