// /src/jsx/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import SignupModal from "./Signupmodal";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./Navbar.css";

function Navbar() {
  const [userLocation, setUserLocation] = useState("Detecting...");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
          } catch (err) {
            setUserLocation("Error fetching location");
          }
        },
        () => setUserLocation("Permission denied")
      );
    } else {
      setUserLocation("Not supported");
    }
  }, []);

  // ---------------------- AUTH STATE LISTENER ----------------------
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
  }, []);

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
    );
  }

  // ---------------------- USER NAVBAR ----------------------
  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">

          {/* Left: Logo */}
          <div className="navbar-left">
            <Link to="/" className="logo">bluebliss</Link>
          </div>

          {/* Center: Location */}
          <div className="navbar-center">
            <div className="location-section">
              <span className="location-icon">📍</span>
              <span className="location-text">{userLocation}</span>
              <span className="location-dropdown">▼</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="navbar-right">

            {/* About / Contact */}
            <ul className="nav-links">
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

            {/* Cart button */}
            <button className="btn-cart" onClick={() => navigate("/cart")}>
              🛒 Cart
            </button>

            {/* Auth / Profile */}
            <div className="auth-buttons">
              {!user ? (
                <>
                  <button className="btn-login" onClick={() => setShowLogin(true)}>Log in</button>
                  <button className="btn-signup" onClick={() => setShowSignup(true)}>Sign up</button>
                </>
              ) : (
                <div className="profile-dropdown-container">
                  <div
                    className="user-section"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  >
                    <span className="user-name">
                      Hi, {user.email.split("@")[0]}
                    </span>

                    <div className="user-icon">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {showProfileDropdown && (
                    <div className="profile-dropdown">
                      <Link to="/my-orders">My Orders</Link>
                      <Link to="/my-ratings">My Ratings</Link>

                      <div className="profile-divider"></div>

                      <Link to="/help">Help</Link>

                      <a
                        onClick={handleLogout}
                        style={{ color: "red", cursor: "pointer" }}
                      >
                        Logout
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </>
  );
}

export default Navbar;
