// /src/jsx/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import AIChat from "./AIChat";
import OfferBanner from "./OfferBanner";
import "./Navbar.css";
import { useVegFilter } from "../context/VegFilterContext";

const ACTIVE_STATUSES = ["pending","approved","confirmed","preparing","ready",
                         "out-for-delivery","out_for_delivery","picked"];

function Navbar() {
  const [userLocation, setUserLocation] = useState("Detecting...");
  const [user, setUser]   = useState(null);
  const [role, setRole]   = useState(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  const auth         = getAuth();
  const currentRoute = useLocation().pathname;
  const navigate     = useNavigate();
  const { isVegOnly, toggleVegOnly } = useVegFilter();

  // ── Location detector ──────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setUserLocation("Not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const address = `${data.address?.road || ""}, ${data.address?.suburb || ""}, ${data.address?.city || ""}`.trim();
          setUserLocation(address || "Location unavailable");
        } catch {
          setUserLocation("Error fetching location");
        }
      },
      () => setUserLocation("Permission denied")
    );
  }, []);

  // ── Auth state ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const ref  = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setRole(snap.data().role);
      } else {
        setRole(null);
        setHasActiveOrder(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // ── Watch for active order (desktop badge) ─────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      const active = snap.docs
        .map(d => d.data())
        .find(o => ACTIVE_STATUSES.includes(o.status));
      setHasActiveOrder(!!active);
    }, () => {});
    return () => unsub();
  }, [user]);

  // ── Logout ─────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    navigate("/");
  };

  // ── Admin navbar ───────────────────────────────────────
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
              <span className="user-email">Admin ({user?.email})</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </nav>
        <AIChat />
      </>
    );
  }

  // ── User navbar ────────────────────────────────────────
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
            <ul className="nav-links">
              <li>
                <Link to="/combo-builder"
                  className={currentRoute === "/combo-builder" ? "active" : ""}
                  title="Create your own combo!">
                  🍕 Combo Builder
                  <span className="new-badge">NEW</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className={currentRoute === "/about" ? "active" : ""}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className={currentRoute === "/contact" ? "active" : ""}>
                  Contact
                </Link>
              </li>

              {/* ── Orders link — only shown when logged in ── */}
              {user && (
                <li>
                  <Link
                    to="/order-tracking"
                    className={currentRoute === "/order-tracking" ? "active" : ""}
                    style={{ position: "relative" }}
                  >
                    📦 Orders
                    {/* Live badge when there's an active order */}
                    {hasActiveOrder && (
                      <span style={{
                        position:   "absolute",
                        top:        "-6px",
                        right:      "-10px",
                        background: "linear-gradient(135deg, #ff6b35, #ff9500)",
                        color:      "#fff",
                        fontSize:   "8px",
                        fontWeight: "900",
                        padding:    "2px 5px",
                        borderRadius: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        animation:  "navBadgePulse 2s infinite",
                        whiteSpace: "nowrap",
                      }}>
                        LIVE
                      </span>
                    )}
                  </Link>
                </li>
              )}
            </ul>

            {/* Veg only toggle */}
            <button
              className={`veg-global-toggle ${isVegOnly ? "active" : ""}`}
              onClick={toggleVegOnly}
              title="Show only veg items"
            >
              🟢 Veg Only
            </button>

            {/* Cart */}
            <button className="btn-cart" onClick={() => navigate("/cart")}>
              🛒 Cart
            </button>

            {/* Auth / Profile */}
            <div className="auth-buttons">
              {!user ? (
                <>
                  <button className="btn-login"  onClick={() => navigate("/login")}>Log in</button>
                  <button className="btn-signup" onClick={() => navigate("/signup")}>Sign up</button>
                </>
              ) : (
                <div
                  className="user-profile-btn"
                  onClick={() => navigate("/profile")}
                  title={user.email}
                >
                  <div className="user-avatar">{user.email.charAt(0).toUpperCase()}</div>
                  <span className="user-greeting">Hi, {user.email.split("@")[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Animation for live badge */}
      <style>{`
        @keyframes navBadgePulse {
          0%,100% { box-shadow: 0 0 4px rgba(255,107,53,0.5); }
          50%      { box-shadow: 0 0 10px rgba(255,107,53,0.9); }
        }
      `}</style>
    </>
  );
}

export default Navbar;