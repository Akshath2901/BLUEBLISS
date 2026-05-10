// src/jsx/LoginPage.jsx — BlueBliss V2.0
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const redirectTo = location.state?.from || "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── LEFT BRAND PANEL ─────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-overlay">

          {/* Logo */}
          <div className="auth-brand-top">
            <p className="auth-logo">
              bluebliss <span className="auth-gem">✦</span>
            </p>
            <p className="auth-eyebrow-small">Cloud Kitchen · Hyderabad</p>
          </div>

          {/* Headline */}
          <div className="auth-brand-copy">
            <h2>
              Three brands.<br />
              <em>One obsession.</em>
            </h2>
            <p>
              Fresh, bold, soulful food — crafted daily across
              three premium kitchens and delivered to your door.
            </p>
          </div>

          {/* Stats */}
          <div className="auth-brand-stats">
            {[
              { value:"4.2★", label:"Rating"    },
              { value:"52+",  label:"Dishes"    },
              { value:"3",    label:"Brands"    },
              { value:"45m",  label:"Delivery"  },
            ].map((s,i) => (
              <div key={i} className="auth-stat">
                <span className="auth-stat-val">{s.value}</span>
                <span className="auth-stat-lab">{s.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────── */}
      <div className="auth-right">
        <div className="auth-box">

          {/* Heading */}
          <span className="auth-form-eyebrow">Welcome Back</span>
          <h2 className="auth-form-title">Sign in to continue</h2>
          <p className="auth-form-sub">
            Your favourite food is waiting for you.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} noValidate>
            <div className="auth-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider"><span>or</span></div>

          {/* Social */}
          <div className="auth-social">
            <button className="auth-social-btn google" aria-label="Google">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button className="auth-social-btn facebook" aria-label="Facebook">
              <i className="fab fa-facebook-f" />
            </button>
            <button className="auth-social-btn apple" aria-label="Apple">
              <i className="fab fa-apple" />
            </button>
          </div>

          {/* Footer */}
          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/signup">Create one</Link>
          </p>

          <button className="auth-back" onClick={() => navigate("/")}>
            ← Back to Home
          </button>

        </div>
      </div>
    </div>
  );
}