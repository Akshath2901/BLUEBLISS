// /src/jsx/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import AIChat from "./AIChat";
import { OfferBanner } from "./OfferBanner";
import "./Navbar.css";

function Navbar() {
  const [userLocation, setUserLocation] = useState("Detecting...");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const auth = getAuth();
  const currentRoute = useLocation().pathname;
  const navigate = useNavigate();

  // ---------------------- LOCATION DETECTOR ----------------------
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  "User-Agent": "bluebliss/1.0",
                  "Accept-Language": "en",
                },
              }
            );

            const data = await res.json();
            const address =
              `${data.address.road || ""}, ${data.address.suburb || ""}, ${data.address.city || ""}`.trim();

            setUserLocation(address || "Location unavailable");
          } catch {
            setUserLocation("Error fetching location");
          }
        },
        () => setUserLocation("Permission denied")
      );
    } else {
      setUserLocation("Not supported");
    }
  }, []);

  // ---------------------- AUTH STATE ----------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setRole(snap.data().role); // admin / user
        }
      } else {
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // ---------------------- LOGOUT ----------------------
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    navigate("/");
  };

  // ---------------------- ADMIN NAVBAR ----------------------
  if (role === "admin") {
    return (
      <>
        <OfferBanner />
        <nav className="navbar admin-navbar">
          <div className="navbar-container">
            <div className="navbar-left">
              <Link to="/admin" className="logo">Admin Panel</Link>
            </div>

            <div className="navbar-right">
              <button className="btn-cart" onClick={() => navigate("/admin")}>
                📊 Dashboard
              </button>

              <span className="user-email">
                Admin ({user?.email})
              </span>

              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </nav>
        <AIChat />
      </>
    );
  }

  // ---------------------- USER NAVBAR ----------------------
  return (
    <>
      <OfferBanner />
      <nav className="navbar">
        <div className="navbar-container">

          {/* Logo */}
          <div className="navbar-left">
            <Link to="/" className="logo">bluebliss</Link>
          </div>

          {/* Location */}
          <div className="navbar-center">
            <div className="location-section">
              <span className="location-icon">📍</span>
              <span className="location-text">{userLocation}</span>
              <span className="location-dropdown">▼</span>
            </div>
          </div>

          {/* Right */}
          <div className="navbar-right">

            {/* Links */}
            <ul className="nav-links">
              <li>
                <Link
                  to="/combo-builder"
                  className={currentRoute === "/combo-builder" ? "active" : ""}
                  title="Create your own combo!"
                >
                  🍕 Combo Builder
                  <span className="new-badge">NEW</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className={currentRoute === "/about" ? "active" : ""}
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className={currentRoute === "/contact" ? "active" : ""}
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Cart */}
            <button className="btn-cart" onClick={() => navigate("/cart")}>
              🛒 Cart
            </button>

            {/* Auth / Profile */}
            <div className="auth-buttons">
              {!user ? (
                <>
                  <button
                    className="btn-login"
                    onClick={() => navigate("/login")}
                  >
                    Log in
                  </button>

                  <button
                    className="btn-signup"
                    onClick={() => navigate("/signup")}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <div 
                  className="user-profile-btn"
                  onClick={() => navigate("/profile")}
                  title={user.email}
                >
                  <div className="user-avatar">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-greeting">
                    Hi, {user.email.split("@")[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* AI Chat Component */}
      <AIChat />
    </>
  );
}

export default Navbar;