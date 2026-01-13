// client/src/components/SearchBar.jsx - ENHANCED with AI
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "./SearchBar.css";

function SearchBar({ onSearch, placeholder = "🤖 Search dishes, ask AI anything..." }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const userIdRef = localStorage.getItem('userId') || 'guest-' + Math.random();

  // Fetch AI suggestions as user types
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
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
      // Regular search - redirects to search results page
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
        {isFocused && searchQuery.trim().length > 2 && (
          <div className="ai-suggestions-dropdown">
            {loading ? (
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
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;