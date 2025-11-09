import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase"; // ✅ path may change

import "./LoginModal.css";

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose(); // Close modal after login
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✖
        </button>

        <h2>Welcome Back</h2>

        <form onSubmit={handleLogin} className="modal-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="modal-login-btn">
            Log In
          </button>
        </form>

        <div className="divider">OR</div>

        <button className="google-btn">Continue with Google</button>
      </div>
    </div>
  );
}

export default LoginModal;
