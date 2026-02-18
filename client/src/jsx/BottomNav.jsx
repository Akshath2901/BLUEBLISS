// src/jsx/BottomNav.jsx
// ✅ UPDATED: Active order badge on Orders tab + better mobile UX

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import "./BottomNav.css";

function BottomNav() {
  const navigate        = useNavigate();
  const location        = useLocation().pathname;
  const { cart }        = useContext(CartContext);
  const [user, setUser] = useState(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderStatus, setActiveOrderStatus] = useState(null);

  const cartCount = cart?.reduce((sum, item) => sum + (item.qty || 1), 0) || 0;

  // Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return () => unsub();
  }, []);

  // Watch for active orders
  useEffect(() => {
    if (!user) { setHasActiveOrder(false); return; }

    const activeStatuses = ["pending","confirmed","preparing","ready","out_for_delivery","picked"];

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      const active = snap.docs
        .map(d => d.data())
        .find(o => activeStatuses.includes(o.status));
      setHasActiveOrder(!!active);
      setActiveOrderStatus(active?.status || null);
    });

    return () => unsub();
  }, [user]);

  const scrollToBrands = () => {
    if (location === "/") {
      const brandsSection = document.querySelector(".brands-section");
      if (brandsSection) brandsSection.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const brandsSection = document.querySelector(".brands-section");
        if (brandsSection) brandsSection.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  const STATUS_ICON = {
    pending:          "🟡",
    confirmed:        "🔵",
    preparing:        "🔴",
    ready:            "🟢",
    out_for_delivery: "🛵",
    picked:           "🛵",
  };

  const tabs = [
    {
      label:  "Home",
      icon:   "🏠",
      path:   "/",
      badge:  null,
    },
    {
      label:  "Menu",
      icon:   "🍽️",
      path:   "brands-scroll",
      badge:  null,
    },
    {
      label:  "Cart",
      icon:   "🛒",
      path:   "/cart",
      badge:  cartCount > 0 ? cartCount : null,
      badgeType: "count",
    },
    {
      label:  hasActiveOrder ? "Tracking" : "Orders",
      icon:   hasActiveOrder ? (STATUS_ICON[activeOrderStatus] || "🛵") : "📋",
      path:   "/order-tracking",
      badge:  hasActiveOrder ? "LIVE" : null,
      badgeType: "live",
      pulse:  hasActiveOrder,
    },
    {
      label:  "Account",
      icon:   "👤",
      path:   "/profile",
      badge:  null,
    },
  ];

  const handleTabClick = (tab) => {
    if (tab.path === "brands-scroll") {
      scrollToBrands();
    } else if (tab.path === "/" && location === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(tab.path);
    }
  };

  const isActive = (tab) => {
    if (tab.path === "brands-scroll") return false;
    return location === tab.path;
  };

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={`bottom-nav-item ${isActive(tab) ? "active" : ""} ${tab.pulse ? "order-pulse" : ""}`}
          onClick={() => handleTabClick(tab)}
        >
          {/* Badge */}
          {tab.badge !== null && (
            <span className={`bnav-badge ${tab.badgeType === "live" ? "badge-live" : "badge-count"}`}>
              {tab.badge}
            </span>
          )}

          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>

          {/* Active indicator bar */}
          {isActive(tab) && <span className="bnav-active-bar" />}
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;