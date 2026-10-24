import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("owner");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await register(name.trim(), email.trim(), password, role);
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
          <h1>Create your observatory.</h1>
          <p className="lead">
            Sign up as a dataset owner to register datasets and record every
            transformation. Choose auditor if you only need to verify existing
            records.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="icon">◆</div>
              <div>
                <strong>Owner</strong>
                <small>Register datasets, upload versions, record changes.</small>
              </div>
            </div>
            <div className="hero-feature">
              <div className="icon">◇</div>
              <div>
                <strong>Auditor</strong>
                <small>Browse datasets and verify integrity across the chain.</small>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", fontSize: 12, opacity: 0.6 }}>
          Your credentials are hashed with bcrypt before storage.
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Get started</p>
          <h2>Create your account</h2>
          <p className="sub">It only takes a moment.</p>

          {error && (
            <div className="auth-alert error">
              <strong>Could not register:</strong> {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Piyush Sharma"
                minLength={2}
                required
              />
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="role">Account role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="owner">Dataset owner</option>
                <option value="auditor">Auditor / viewer</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
            >
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="auth-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}