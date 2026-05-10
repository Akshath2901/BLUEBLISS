// src/jsx/Profile.jsx — BlueBliss V2.0
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import MyOrders from "./profile/MyOrders";
import MyRatings from "./profile/MyRatings";
import RateOrder from "./profile/RateOrder";
import Help from "./profile/Help";
import PaymentMethods from "./profile/PaymentMethods";
import Addresses from "./profile/Addresses";
import LoyaltyRewardsSection from "./profile/LoyaltyRewardsSection";
import "./profile/profile.css";

/* ── Settings Section ──────────────────────────────────────── */
function SettingsSection({ user, userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData,  setFormData]  = useState({
    name:  userData?.name  || "",
    phone: userData?.phone || "",
    email: user?.email     || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
        name: formData.name, phone: formData.phone,
      });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (e) {
      alert("Error updating profile");
    } finally { setIsSaving(false); }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  return (
    <div className="settings-container">
      <h2 className="pf-section-title">Account Settings</h2>

      <div className="pf-card settings-section-card">
        <h3>Personal Information</h3>

        <div className="setting-item">
          <label>Full Name</label>
          {isEditing
            ? <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
            : <p className="setting-value">{formData.name || "Not set"}</p>
          }
        </div>

        <div className="setting-item">
          <label>Phone Number</label>
          {isEditing
            ? <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 xxxxxxxxxx" />
            : <p className="setting-value">{formData.phone || "Not set"}</p>
          }
        </div>

        <div className="setting-item">
          <label>Email Address</label>
          <p className="setting-value email-display">{formData.email}</p>
          <small className="email-note">Email cannot be changed</small>
        </div>

        <div className="settings-actions">
          {isEditing ? (
            <>
              <button className="pf-btn-primary save-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
              <button className="pf-btn-ghost cancel-btn"
                onClick={() => { setIsEditing(false); setFormData({ name:userData?.name||"", phone:userData?.phone||"", email:user?.email||"" }); }}>
                Cancel
              </button>
            </>
          ) : (
            <button className="pf-btn-primary edit-btn" onClick={() => setIsEditing(true)}>
              Edit Information
            </button>
          )}
        </div>
      </div>

      <div className="pf-card settings-section-card">
        <h3>Notification Preferences</h3>
        {[
          "Receive promotional emails",
          "Receive order updates via SMS",
          "Receive new offers & deals",
        ].map((label, i) => (
          <label key={i} className="checkbox-item">
            <input type="checkbox" defaultChecked />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Profile Page ──────────────────────────────────────────── */
export default function Profile() {
  const [activeSection,    setActiveSection]    = useState("orders");
  const [user,             setUser]             = useState(null);
  const [userData,         setUserData]         = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [ratingOrderData,  setRatingOrderData]  = useState(null);

  const auth     = getAuth();
  const navigate = useNavigate();

  /* ── Resize & scroll lock ── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
  }, [mobileMenuOpen]);

  /* ── Auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) { navigate("/login"); return; }
      setUser(currentUser);
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, [auth, navigate]);

  const handleLogout = async () => {
    try { await signOut(auth); navigate("/"); }
    catch (e) { console.error(e); }
  };

  const handleSection = section => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleRateOrder   = data  => { setRatingOrderData(data); setActiveSection("rate-order"); };
  const handleBackRating  = ()    => { setRatingOrderData(null); setActiveSection("orders"); };

  /* ── Loading ── */
  if (loading) return (
    <div className="profile-loading">
      <div className="loading-spinner" />
      <p>Loading your profile…</p>
    </div>
  );

  if (!user) return null;

  const displayName = userData?.name || user.email.split("@")[0];
  const initial     = displayName[0]?.toUpperCase() || "U";

  const NAV_GROUPS = [
    [
      { id:"orders",    icon:"📦", label:"My Orders" },
      { id:"ratings",   icon:"⭐", label:"My Ratings" },
    ],
    [
      { id:"loyalty",   icon:"🎁", label:"Rewards" },
      { id:"addresses", icon:"📍", label:"Addresses" },
      { id:"payments",  icon:"💳", label:"Payments" },
    ],
    [
      { id:"settings",  icon:"⚙️", label:"Settings" },
      { id:"help",      icon:"❓", label:"Help" },
    ],
  ];

  /* ── Render ── */
  return (
    <div className="profile-wrapper">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="header-content">
          <button className="hamburger-menu-btn"
            onClick={() => setMobileMenuOpen(p => !p)} aria-label="Menu">
            ☰
          </button>

          <div className="header-left">
            <div className="header-avatar">{initial}</div>
            <div className="header-info">
              <h1>Hi, {displayName} 👋</h1>
              <p className="header-email">{user.email}</p>
              {userData?.phone && <p className="header-phone">📱 {userData.phone}</p>}
            </div>
          </div>

          <button className="edit-profile-btn" onClick={() => handleSection("settings")}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay active" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="profile-container">

        {/* Sidebar */}
        <aside className={`profile-sidebar ${mobileMenuOpen ? "active" : ""}`}>

          {/* User card in sidebar */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi}>
                {group.map(item => (
                  <button key={item.id}
                    className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                    onClick={() => handleSection(item.id)}>
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
                {gi < NAV_GROUPS.length - 1 && <div className="sidebar-divider" />}
              </div>
            ))}

            <div className="sidebar-divider" />

            <button className="nav-item logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="profile-main">
          {activeSection === "orders"     && <MyOrders onRateOrder={handleRateOrder} />}
          {activeSection === "ratings"    && <MyRatings />}
          {activeSection === "rate-order" && <RateOrder orderData={ratingOrderData} onBack={handleBackRating} />}
          {activeSection === "loyalty"    && <LoyaltyRewardsSection />}
          {activeSection === "addresses"  && <Addresses />}
          {activeSection === "payments"   && <PaymentMethods />}
          {activeSection === "settings"   && <SettingsSection user={user} userData={userData} />}
          {activeSection === "help"       && <Help />}
        </main>
      </div>
    </div>
  );
}