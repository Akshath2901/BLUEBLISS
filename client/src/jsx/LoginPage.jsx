// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back after login (ex: /cart)
  const redirectTo = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRAND PANEL */}
      <div className="login-left">
        <div className="login-left-overlay">
          <h1>BlueBliss</h1>
          <p>Premium food experience, delivered fresh</p>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="login-right">
        <div className="login-box">

          <h2>Welcome Back</h2>
          <p className="login-subtitle">Login to continue</p>

          <form onSubmit={handleLogin}>

            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

          </form>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <div className="social-login">
            <button className="google">G</button>
            <button className="facebook">f</button>
            <button className="apple"></button>
          </div>

          <p className="login-footer">
            Don’t have an account?{" "}
            <Link to="/signup">Register Now</Link>
          </p>

          <button
            className="back-home"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
