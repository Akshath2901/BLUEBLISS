import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [userLocation, setUserLocation] = useState("Detecting...");
  const [searchQuery, setSearchQuery] = useState("");
  const currentRoute = useLocation().pathname;
  const navigate = useNavigate();

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left Section - Logo */}
        <div className="navbar-left">
          <Link to="/" className="logo">
            bluebliss
          </Link>
        </div>

        {/* Center Section - Location & Search */}
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

        {/* Right Section - Navigation Links */}
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
          <div className="auth-buttons">
            <button className="btn-login">Log in</button>
            <button className="btn-signup">Sign up</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;