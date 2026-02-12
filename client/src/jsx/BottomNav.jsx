import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./BottomNav.css";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation().pathname;

  const scrollToBrands = () => {
    if (location === "/") {
      // Already on home, just scroll
      const brandsSection = document.querySelector(".brands-section");
      if (brandsSection) {
        brandsSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Go to home first, then scroll after page loads
      navigate("/");
      setTimeout(() => {
        const brandsSection = document.querySelector(".brands-section");
        if (brandsSection) {
          brandsSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
  };

  const tabs = [
    { label: "Home", icon: "🏠", path: "/" },
    { label: "Menu", icon: "🍽️", path: "brands-scroll" },
    { label: "Cart", icon: "🛒", path: "/cart" },
    { label: "Orders", icon: "📋", path: "/order-tracking" },
    { label: "Account", icon: "👤", path: "/profile" },
  ];

  const handleTabClick = (tab) => {
    if (tab.path === "brands-scroll") {
      scrollToBrands();
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
          className={`bottom-nav-item ${isActive(tab) ? "active" : ""}`}
          onClick={() => handleTabClick(tab)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;