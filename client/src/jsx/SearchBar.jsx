// client/src/components/SearchBar.jsx - ENHANCED with AI
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "./SearchBar.css";

function SearchBar({ onSearch, placeholder = "Search dishes, cuisines, or brands..." }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const userIdRef = localStorage.getItem('userId') || 'guest-' + Math.random();
// Local brand & menu suggestions
  const localSuggestions = [
    // Brands
    { name: "Shrimmers", type: "brand", route: "/menu/shrimmers", icon: "✨" },
    { name: "Peppanizze", type: "brand", route: "/menu/peppanizze", icon: "🌶️" },
    { name: "UrbanWrap", type: "brand", route: "/menu/urbanwrap", icon: "🌯" },

    // Burgers
    { name: "Chicken Burger", type: "item", category: "Burgers", icon: "🍔" },
    { name: "Peri Peri Crispy Chicken Burger", type: "item", category: "Burgers", icon: "🍔" },
    { name: "Veg Burger", type: "item", category: "Burgers", icon: "🍔" },
    { name: "Cheese Burger", type: "item", category: "Burgers", icon: "🍔" },

    // Pizza
    { name: "Chicken Pizza", type: "item", category: "Pizza", icon: "🍕" },
    { name: "Vegetriana Pizza", type: "item", category: "Pizza", icon: "🍕" },
    { name: "Cheezy 7 Pizza", type: "item", category: "Pizza", icon: "🍕" },
    { name: "Peri Peri Pizza", type: "item", category: "Pizza", icon: "🍕" },

    // Wraps
    { name: "Chicken Wrap", type: "item", category: "Wraps", icon: "🌯" },
    { name: "Peri Peri Chicken Wrap", type: "item", category: "Wraps", icon: "🌯" },
    { name: "Paneer Tikka Wrap", type: "item", category: "Wraps", icon: "🌯" },
    { name: "Veg Wrap", type: "item", category: "Wraps", icon: "🌯" },

    // Fries & Sides
    { name: "French Fries", type: "item", category: "Fries", icon: "🍟" },
    { name: "Peri Peri Fries", type: "item", category: "Fries", icon: "🍟" },
    { name: "Paneer Fries", type: "item", category: "Fries", icon: "🍟" },
    { name: "Loaded Fries", type: "item", category: "Fries", icon: "🍟" },

    // Shakes
    { name: "Chocolate Milkshake", type: "item", category: "Shakes", icon: "🥤" },
    { name: "Biscoff Milkshake", type: "item", category: "Shakes", icon: "🥤" },
    { name: "Oreo Milkshake", type: "item", category: "Shakes", icon: "🥤" },
    { name: "Strawberry Milkshake", type: "item", category: "Shakes", icon: "🥤" },

    // Peri Peri
    { name: "African Peri Peri Veg", type: "item", category: "Peri Peri", icon: "🔥" },
    { name: "African Peri Peri Chicken", type: "item", category: "Peri Peri", icon: "🔥" },
  ];

  const [filteredLocal, setFilteredLocal] = useState([]);
  // Fetch AI suggestions as user types
useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    // Local suggestions — start from 1 character
    if (query.length >= 1) {
      const matches = localSuggestions.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
      setFilteredLocal(matches.slice(0, 6));
    } else {
      setFilteredLocal([]);
    }

    // AI suggestions — kick in after 3 characters
    if (query.length > 2) {
      fetchAiSuggestions();
    } else {
      setAiSuggestions([]);
    }
  }, [searchQuery]);

  const fetchAiSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef,
          message: searchQuery
        })
      });

      const data = await response.json();
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions.slice(0, 5)); // Show top 5
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();

      // Brand-specific routing
      const brandRoutes = {
        shrimmers: "/menu/shrimmers",
        peppanizze: "/menu/peppanizze",
        urbanwrap: "/menu/urbanwrap",
        "urban wrap": "/menu/urbanwrap",
      };

      for (const [key, route] of Object.entries(brandRoutes)) {
        if (query.includes(key)) {
          navigate(route);
          setSearchQuery("");
          setAiSuggestions([]);
          return;
        }
      }

      // Regular search
      onSearch(searchQuery);
      setAiSuggestions([]);
    }
  };
  const handleQuickAddToCart = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: item.name + item.restaurant,
      name: item.name,
      price: item.price,
      restaurant: item.restaurant,
      category: item.category,
      qty: 1
    });

    // Show feedback
    setSearchQuery('');
    setAiSuggestions([]);
  };

 const handleSuggestionClick = (item) => {
    const name = item.name.toLowerCase();
    const brandRoutes = {
      shrimmers: "/menu/shrimmers",
      peppanizze: "/menu/peppanizze",
      urbanwrap: "/menu/urbanwrap",
      "urban wrap": "/menu/urbanwrap",
    };

    for (const [key, route] of Object.entries(brandRoutes)) {
      if (name.includes(key)) {
        setSearchQuery('');
        setAiSuggestions([]);
        navigate(route);
        return;
      }
    }

    setSearchQuery('');
    setAiSuggestions([]);
    navigate(`/search?q=${encodeURIComponent(item.name)}`);
  };
  const handleClear = () => {
    setSearchQuery("");
    setAiSuggestions([]);
  };

  return (
    <div className={`search-bar-container ${isFocused ? "focused" : ""}`}>
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay to allow click on suggestions
              setTimeout(() => setIsFocused(false), 200);
            }}
            autoComplete="off"
          />

          {searchQuery && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <button type="submit" className="search-btn">
            Search
          </button>
        </div>

        {/* AI SUGGESTIONS DROPDOWN */}
{/* SUGGESTIONS DROPDOWN */}
        {isFocused && searchQuery.trim().length >= 1 && (filteredLocal.length > 0 || searchQuery.trim().length > 2) && (
          <div className="ai-suggestions-dropdown">
            {/* LOCAL SUGGESTIONS */}
            {filteredLocal.length > 0 && (
              <>
                <div className="suggestions-header">
                  <span className="ai-label">🔍 Quick Suggestions</span>
                </div>
                <div className="suggestions-list">
                  {filteredLocal.map((item, idx) => (
                    <div
                      key={"local-" + idx}
                      className="suggestion-item local-suggestion"
                      onClick={() => handleLocalSuggestionClick(item)}
                    >
                      <div className="suggestion-content">
                        <div className="suggestion-name">
                          {item.icon} {item.name}
                        </div>
                        <div className="suggestion-meta">
                          {item.type === "brand" ? (
                            <span className="suggestion-restaurant" style={{ background: "#ffd700", color: "#0f0e09" }}>
                              ⭐ Brand
                            </span>
                          ) : (
                            <span className="suggestion-restaurant">{item.category}</span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        {item.type === "brand" ? "View Menu →" : "Search →"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
           {searchQuery.trim().length > 2 && (loading ? (
              <div className="suggestions-loading">
                <span className="loading-spinner">⏳</span> AI finding items...
              </div>
            ) : aiSuggestions.length > 0 ? (
              <>
                <div className="suggestions-header">
                  <span className="ai-label">✨ AI Recommendations</span>
                </div>
                <div className="suggestions-list">
                  {aiSuggestions.map((item, idx) => (
                    <div key={idx} className="suggestion-item">
                      <div 
                        className="suggestion-content"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        <div className="suggestion-name">{item.name}</div>
                        <div className="suggestion-meta">
                          <span className="suggestion-price">₹{item.price}</span>
                          <span className="suggestion-restaurant">
                            {item.restaurant}
                          </span>
                          <span className="suggestion-rating">
                            ⭐ {item.rating}
                          </span>
                        </div>
                        {item.desc && (
                          <div className="suggestion-desc">{item.desc}</div>
                        )}
                      </div>
                      <button
                        className="quick-add-btn"
                        onClick={(e) => handleQuickAddToCart(item, e)}
                        title="Quick add to cart"
                      >
                        🛒 Add
                      </button>
                    </div>
                  ))}
                </div>
                <div className="suggestions-footer">
                  <p className="view-all-link">
                    Press Enter to view all results →
                  </p>
                </div>
              </>
            ) : (
              <div className="suggestions-empty">
                <p>Try: "burgers under 299" or "spicy items"</p>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;