// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./SignupPage.css";

function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Save user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: "user",
        createdAt: new Date(),
      });

      navigate("/login");
    } catch (err) {
      setError(err.message.replace("Firebase:", ""));
    }
  };

  return (
    <div className="signup-page">

      {/* LEFT IMAGE PANEL */}
      <div className="signup-left">
        <div className="signup-left-overlay">
          <h1>BlueBliss</h1>
          <p>Join the premium food experience</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="signup-right">
        <div className="signup-box">

          <h2>Create Account</h2>
          <p className="signup-subtitle">Sign up to continue</p>

          <form onSubmit={handleSignup}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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

            {error && <p className="signup-error">{error}</p>}

            <button type="submit" className="signup-btn">
              CREATE ACCOUNT
            </button>
          </form>

          <div className="signup-divider">
            <span>OR</span>
          </div>

          <div className="social-signup">
            <button className="google">G</button>
            <button className="facebook">f</button>
            <button className="apple"></button>
          </div>

          <p className="signup-footer">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>
              Login
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

export default SignupPage;
