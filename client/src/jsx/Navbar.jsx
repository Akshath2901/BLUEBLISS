// /src/jsx/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import SignupModal from "./Signupmodal";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import "./Navbar.css";

function Navbar() {
  const [userLocation, setUserLocation] = useState("Detecting...");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(null);
  const auth = getAuth();

  const currentRoute = useLocation().pathname;
  const navigate = useNavigate();

  // ✅ Detect location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.state_district;
            setUserLocation(city || "Location unavailable");
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

  // ✅ Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      alert("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ✅ Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ✅ Signup success callback
  const handleSignupSuccess = (user) => {
    console.log("Signup successful:", user);
    setUser(user);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Left Section - Logo */}
          <div className="navbar-left">
            <Link to="/" className="logo">
              bluebliss
            </Link>
          </div>

          {/* Center Section */}
          <div className="navbar-center">
            <div className="location-section">
              <span className="location-icon">📍</span>
              <span className="location-text">{userLocation}</span>
              <span className="location-dropdown">▼</span>
            </div>

            <form onSubmit={handleSearch} className="search-section">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search for restaurant, cuisine or a dish"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>
          </div>

          {/* Right Section */}
          <div className="navbar-right">
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
                  to="/explore"
                  className={currentRoute === "/explore" ? "active" : ""}
                >
                  Explore
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

            {/* ✅ Auth Buttons Section */}
            <div className="auth-buttons">
              {user ? (
                <>
                  <span className="user-email">
                    Hi, {user.email.split("@")[0]}
                  </span>
                  <button className="btn-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-login"
                    onClick={() => setShowLogin(true)}
                  >
                    Log in
                  </button>
                  <button
                    className="btn-signup"
                    onClick={() => setShowSignup(true)}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Show modals conditionally */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSignupSuccess={handleSignupSuccess}
        />
      )}
    </>
  );
}

export default Navbar;
