// src/jsx/SignupModal.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase.jsx"; // Import from firebase.jsx
import "./SignupModal.css"; // Same folder
function SignupModal({ onClose, onSignupSuccess }) {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation function
  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      setError("Phone number must be 10 digits");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    console.log("Signup attempt started");

    // Validate form
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setLoading(true);

    try {
      console.log("Creating user with email:", email);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      console.log("User created:", user.uid);

      // Store user data in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          phoneNumber: phoneNumber,
          referenceCode: referenceCode || null,
          createdAt: new Date(),
          displayName: "",
          profilePicture: null,
          addresses: [],
          savedPaymentMethods: [],
        });
        console.log("User document created in Firestore");
      } catch (firestoreError) {
        console.warn("Firestore error (continuing anyway):", firestoreError);
        // Continue anyway, user is created in Auth
      }

      setSuccessMessage("Account created successfully! Redirecting...");

      // Reset form
      setEmail("");
      setPhoneNumber("");
      setReferenceCode("");
      setPassword("");
      setConfirmPassword("");

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        if (onSignupSuccess) {
          onSignupSuccess(user);
        }
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);

      // Handle Firebase errors
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please log in or use another email.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="signup-overlay" onClick={onClose}></div>

      {/* Modal */}
      <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="signup-header">
          <h2>Create Your Account</h2>
          <button 
            type="button"
            className="close-btn" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Phone Number Field */}
          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phoneNumber}
              onChange={(e) => {
                // Allow only numbers
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhoneNumber(value);
              }}
              required
              disabled={loading}
              maxLength="10"
            />
          </div>

          {/* Reference Code Field */}
          <div className="form-group">
            <label htmlFor="referenceCode">Reference Code (Optional)</label>
            <input
              id="referenceCode"
              type="text"
              placeholder="Enter referral code if you have one"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength="20"
            />
            <small className="form-hint">Get discounts by using a referral code</small>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Success Message */}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Terms & Conditions */}
          <div className="terms-checkbox">
            <input 
              type="checkbox" 
              id="terms" 
              required 
              disabled={loading} 
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          {/* Login Link */}
          <p className="login-link">
            Already have an account?{" "}
            <a 
              href="#login" 
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              Log in here
            </a>
          </p>
        </form>
      </div>
    </>
  );
}

export default SignupModal;