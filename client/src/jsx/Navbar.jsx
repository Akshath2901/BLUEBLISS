// src/jsx/Navbar.jsx — BlueBliss V2.0 Premium
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../lib/firebase";
import {
  doc, getDoc, collection, query,
  where, orderBy, limit, onSnapshot
} from "firebase/firestore";
import AIChat from "./AIChat";
import OfferBanner from "./OfferBanner";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";
import { useVegFilter } from "../context/VegFilterContext";

const ACTIVE_STATUSES = [
  "pending","approved","confirmed","preparing",
  "ready","out-for-delivery","out_for_delivery","picked"
];

export default function Navbar() {
  const [userLocation, setUserLocation]   = useState("Detecting...");
  const [user, setUser]                   = useState(null);
  const [role, setRole]                   = useState(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [scrollPct, setScrollPct]         = useState(0);

  const auth         = getAuth();
  const location     = useLocation();
  const currentRoute = location.pathname;
  const navigate     = useNavigate();
  const { isVegOnly, toggleVegOnly } = useVegFilter();

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [currentRoute]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Scroll effects: shadow + progress bar
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(scrollTop > 20);
      setScrollPct(docH > 0 ? (scrollTop / docH) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) { setUserLocation("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const addr = [data.address?.road, data.address?.suburb, data.address?.city]
            .filter(Boolean).join(", ");
          setUserLocation(addr || "Hyderabad");
        } catch { setUserLocation("Hyderabad"); }
      },
      () => setUserLocation("Hyderabad")
    );
  }, []);

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setRole(snap.data().role);
      } else { setRole(null); setHasActiveOrder(false); }
    });
  }, [auth]);

  // Live order watch
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      setHasActiveOrder(!!snap.docs.map(d => d.data()).find(o => ACTIVE_STATUSES.includes(o.status)));
    }, () => {});
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); setRole(null); navigate("/");
  };

  // ── Admin navbar ──────────────────────────────────
  if (role === "admin") {
    return (
      <>
        <OfferBanner />
        <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
          <div className="navbar-inner">
            <Link to="/admin" className="nav-logo">
              <span className="logo-word">bluebliss</span>
              <span className="logo-gem">✦</span>
            </Link>
            <div className="nav-right">
              <button className="btn-primary" onClick={() => navigate("/admin")}>📊 Dashboard</button>
              <span className="admin-email-badge">Admin</span>
              <button className="btn-ghost" onClick={handleLogout}>Logout</button>
              <ThemeToggle size="sm" />
            </div>
          </div>
          <div className="nav-progress" style={{ width: `${scrollPct}%` }} />
        </nav>
        <AIChat />
      </>
    );
  }

  // ── User navbar ───────────────────────────────────
  return (
    <>
      <OfferBanner />

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} role="navigation">
        <div className="navbar-inner">

          {/* ── Logo ── */}
          <Link to="/" className="nav-logo" aria-label="BlueBliss Home">
            <span className="logo-word">bluebliss</span>
            <span className="logo-gem">✦</span>
          </Link>

          {/* ── Location (desktop) ── */}
          <div className="nav-location">
            <span className="loc-pin">📍</span>
            <span className="loc-text">{userLocation}</span>
            <span className="loc-chevron">▾</span>
          </div>

          {/* ── Desktop right ── */}
          <div className="nav-right">

            {/* Nav links */}
            <div className="nav-links">
              <Link to="/combo-builder" className={`nav-link ${currentRoute === "/combo-builder" ? "active" : ""}`}>
                🍕 Combo
                <span className="badge-new">NEW</span>
              </Link>
              <Link to="/about" className={`nav-link ${currentRoute === "/about" ? "active" : ""}`}>About</Link>
              <Link to="/contact" className={`nav-link ${currentRoute === "/contact" ? "active" : ""}`}>Contact</Link>
              {user && (
                <Link to="/order-tracking" className={`nav-link ${currentRoute === "/order-tracking" ? "active" : ""}`}>
                  📦 Orders
                  {hasActiveOrder && <span className="badge-live">LIVE</span>}
                </Link>
              )}
            </div>

            {/* Veg toggle */}
            <button
              className={`veg-pill ${isVegOnly ? "on" : ""}`}
              onClick={toggleVegOnly}
              title="Show vegetarian items only"
            >
              <span className="veg-dot-icon" />
              Veg
            </button>

            {/* Cart */}
            <button className="btn-cart" onClick={() => navigate("/cart")}>
              <span>🛒</span>
              Cart
            </button>

            {/* Auth */}
            {!user ? (
              <div className="nav-auth">
                <button className="btn-ghost" onClick={() => navigate("/login")}>Log in</button>
                <button className="btn-primary" onClick={() => navigate("/signup")}>Sign up</button>
              </div>
            ) : (
              <button
                className="nav-avatar"
                onClick={() => navigate("/profile")}
                title={user.email}
                aria-label="Open profile"
              >
                <span className="avatar-letter">{user.email.charAt(0).toUpperCase()}</span>
                <span className="avatar-name">Hi, {user.email.split("@")[0]}</span>
              </button>
            )}

            {/* Theme toggle */}
            <ThemeToggle size="sm" />
          </div>

          {/* ── Mobile right ── */}
          <div className="nav-mobile-actions">
            <ThemeToggle size="sm" />
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span className="ham-line" />
              <span className="ham-line" />
              <span className="ham-line" />
            </button>
          </div>
        </div>

        {/* Scroll progress line */}
        <div className="nav-progress" style={{ width: `${scrollPct}%` }} />
      </nav>

      {/* ── Mobile Drawer Backdrop ── */}
      <div
        className={`drawer-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile Drawer ── */}
      <aside className={`mobile-drawer ${menuOpen ? "open" : ""}`} aria-label="Mobile navigation">

        {/* Drawer header */}
        <div className="drawer-header">
          <Link to="/" className="drawer-logo" onClick={() => setMenuOpen(false)}>
            <span className="logo-word">bluebliss</span>
            <span className="logo-gem">✦</span>
          </Link>
          <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {/* Location */}
        <div className="drawer-location">
          <span className="loc-pin">📍</span>
          <span>{userLocation}</span>
        </div>

        {/* Nav links */}
        <nav className="drawer-links">
          {[
            { to: "/combo-builder", label: "🍕 Combo Builder", badge: "NEW" },
            { to: "/about",         label: "About" },
            { to: "/contact",       label: "Contact" },
            ...(user ? [{ to: "/order-tracking", label: "📦 My Orders", badge: hasActiveOrder ? "LIVE" : null }] : []),
            ...(user ? [{ to: "/profile",        label: "👤 Profile" }] : []),
          ].map(({ to, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`drawer-link ${currentRoute === to ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
              {badge === "NEW"  && <span className="badge-new">{badge}</span>}
              {badge === "LIVE" && <span className="badge-live">{badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="drawer-divider" />

        {/* Veg toggle */}
        <button
          className={`drawer-veg ${isVegOnly ? "on" : ""}`}
          onClick={toggleVegOnly}
        >
          <span className="veg-dot-icon" />
          Veg Only
          <span className="drawer-veg-state">{isVegOnly ? "ON" : "OFF"}</span>
        </button>

        {/* Cart */}
        <button className="drawer-cart" onClick={() => { navigate("/cart"); setMenuOpen(false); }}>
          🛒 View Cart
        </button>

        {/* Auth */}
        <div className="drawer-auth">
          {!user ? (
            <>
              <button className="drawer-btn-login"  onClick={() => { navigate("/login");  setMenuOpen(false); }}>Log in</button>
              <button className="drawer-btn-signup" onClick={() => { navigate("/signup"); setMenuOpen(false); }}>Sign up</button>
            </>
          ) : (
            <>
              <div className="drawer-user">
                <div className="drawer-avatar">{user.email.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="drawer-user-name">{user.email.split("@")[0]}</p>
                  <p className="drawer-user-email">{user.email}</p>
                </div>
              </div>
              <button className="drawer-logout" onClick={handleLogout}>Sign out</button>
            </>
          )}
        </div>
      </aside>

      <AIChat />
    </>
  );
}