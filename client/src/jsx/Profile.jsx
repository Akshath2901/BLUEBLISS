// /src/jsx/Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import MyOrders from "./profile/MyOrders";
import MyRatings from "./profile/MyRatings";
import RateOrder from "./profile/RateOrder"; // ADD THIS IMPORT
import Help from "./profile/Help";
import PaymentMethods from "./profile/PaymentMethods";
import Addresses from "./profile/Addresses";
import LoyaltyRewardsSection from "./profile/LoyaltyRewardsSection";
import "./profile/profile.css";

export default function Profile() {
  const [activeSection, setActiveSection] = useState("orders");
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ratingOrderData, setRatingOrderData] = useState(null); // ADD THIS STATE
  const auth = getAuth();
  const navigate = useNavigate();

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      // Fetch user data from Firestore
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Handle section change and close mobile menu
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  // ADD THIS FUNCTION - Handle rate order navigation
  const handleRateOrder = (orderData) => {
    setRatingOrderData(orderData);
    setActiveSection("rate-order");
  };

  // ADD THIS FUNCTION - Handle back from rating
  const handleBackFromRating = () => {
    setRatingOrderData(null);
    setActiveSection("orders");
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-wrapper">
      {/* HEADER */}
      <div className="profile-header">
        <div className="header-content">
          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="hamburger-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            title="Menu"
          >
            ☰
          </button>

          <div className="header-info">
            <h1>Hi, {user.email.split("@")[0]}</h1>
            <p>{user.email}</p>
            {userData?.phone && <p className="phone-info">📱 {userData.phone}</p>}
          </div>
          <button
            className="edit-profile-btn"
            onClick={() => handleSectionChange("settings")}
          >
            ✏️ EDIT PROFILE
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay active"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* MAIN CONTAINER */}
      <div className="profile-container">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`profile-sidebar ${mobileMenuOpen ? "active" : ""}`}>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeSection === "orders" ? "active" : ""}`}
              onClick={() => handleSectionChange("orders")}
            >
              <span className="nav-icon">📦</span>
              <span>My Orders</span>
            </button>

            <button
              className={`nav-item ${activeSection === "ratings" ? "active" : ""}`}
              onClick={() => handleSectionChange("ratings")}
            >
              <span className="nav-icon">⭐</span>
              <span>My Ratings</span>
            </button>

            <div className="sidebar-divider"></div>

            <button
              className={`nav-item ${activeSection === "loyalty" ? "active" : ""}`}
              onClick={() => handleSectionChange("loyalty")}
            >
              <span className="nav-icon">🎁</span>
              <span>My Rewards</span>
            </button>

            <button
              className={`nav-item ${activeSection === "addresses" ? "active" : ""}`}
              onClick={() => handleSectionChange("addresses")}
            >
              <span className="nav-icon">📍</span>
              <span>Addresses</span>
            </button>

            <button
              className={`nav-item ${activeSection === "payments" ? "active" : ""}`}
              onClick={() => handleSectionChange("payments")}
            >
              <span className="nav-icon">💳</span>
              <span>Payments</span>
            </button>

            <div className="sidebar-divider"></div>

            <button
              className={`nav-item ${activeSection === "settings" ? "active" : ""}`}
              onClick={() => handleSectionChange("settings")}
            >
              <span className="nav-icon">⚙️</span>
              <span>Settings</span>
            </button>

            <button
              className={`nav-item ${activeSection === "help" ? "active" : ""}`}
              onClick={() => handleSectionChange("help")}
            >
              <span className="nav-icon">❓</span>
              <span>Help</span>
            </button>

            <div className="sidebar-divider"></div>

            <button
              className="nav-item logout-btn"
              onClick={handleLogout}
            >
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="profile-main">
          {/* PASS handleRateOrder to MyOrders */}
          {activeSection === "orders" && <MyOrders onRateOrder={handleRateOrder} />}
          {activeSection === "ratings" && <MyRatings />}
          {activeSection === "rate-order" && (
            <RateOrder 
              orderData={ratingOrderData} 
              onBack={handleBackFromRating}
            />
          )}
          {activeSection === "loyalty" && <LoyaltyRewardsSection />}
          {activeSection === "addresses" && <Addresses />}
          {activeSection === "payments" && <PaymentMethods />}
          {activeSection === "settings" && <SettingsSection user={user} userData={userData} />}
          {activeSection === "help" && <Help />}
        </main>
      </div>
    </div>
  );
}

// ==================== SETTINGS SECTION ====================
import { updateDoc } from "firebase/firestore";

function SettingsSection({ user, userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    phone: userData?.phone || "",
    email: user?.email || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
      });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

      <div className="settings-section-card">
        <h3>Personal Information</h3>

        <div className="setting-item">
          <label htmlFor="name">Full Name</label>
          {isEditing ? (
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />
          ) : (
            <p className="setting-value">{formData.name || "Not set"}</p>
          )}
        </div>

        <div className="setting-item">
          <label htmlFor="phone">Phone Number</label>
          {isEditing ? (
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          ) : (
            <p className="setting-value">{formData.phone || "Not set"}</p>
          )}
        </div>

        <div className="setting-item">
          <label htmlFor="email">Email Address</label>
          <p className="setting-value email-display">{formData.email}</p>
          <small className="email-note">Email cannot be changed</small>
        </div>

        <div className="settings-actions">
          {isEditing ? (
            <>
              <button
                className="save-btn"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: userData?.name || "",
                    phone: userData?.phone || "",
                    email: user?.email || "",
                  });
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Information
            </button>
          )}
        </div>
      </div>

      <div className="settings-section-card">
        <h3>Preferences</h3>
        <label className="checkbox-item">
          <input type="checkbox" defaultChecked />
          <span>Receive promotional emails</span>
        </label>
        <label className="checkbox-item">
          <input type="checkbox" defaultChecked />
          <span>Receive order updates via SMS</span>
        </label>
        <label className="checkbox-item">
          <input type="checkbox" defaultChecked />
          <span>Receive new offers & deals</span>
        </label>
      </div>
    </div>
  );
}