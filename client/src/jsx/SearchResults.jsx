import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchBar from "./SearchBar";
import "./SearchResults.css";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample food items - replace with your actual API call
  const sampleMenuItems = [
    { id: 1, name: "Butter Chicken", category: "Main Course", price: 350, image: "🍛", description: "Creamy tomato-based curry" },
    { id: 2, name: "Paneer Tikka", category: "Appetizer", price: 250, image: "🧈", description: "Grilled cottage cheese cubes" },
    { id: 3, name: "Biryani", category: "Main Course", price: 300, image: "🍚", description: "Aromatic rice with spices" },
    { id: 4, name: "Masala Dosa", category: "Breakfast", price: 120, image: "🥞", description: "Crispy rice crepe with potato filling" },
    { id: 5, name: "Chicken Kebab", category: "Appetizer", price: 280, image: "🍢", description: "Tender grilled chicken pieces" },
    { id: 6, name: "Veg Pulao", category: "Main Course", price: 180, image: "🍛", description: "Fragrant rice with vegetables" },
    { id: 7, name: "Gulab Jamun", category: "Dessert", price: 80, image: "🍡", description: "Sweet milk solid dumplings" },
    { id: 8, name: "Pasta Alfredo", category: "Main Course", price: 320, image: "🍝", description: "Creamy white sauce pasta" },
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      if (query) {
        const filtered = sampleMenuItems.filter(item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } else {
        setResults([]);
      }
      setLoading(false);
    }, 500);
  }, [query]);

  const handleSearch = (newQuery) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="search-results-container">
      <header className="search-header">
        <div className="header-content">
          <h1 className="brand" onClick={handleBackHome}>BlueBliss Foods & Technologies</h1>
          <SearchBar onSearch={handleSearch} placeholder="Search for dishes..." />
        </div>
      </header>

      <main className="results-main">
        <div className="results-info">
          {query && (
            <h2>
              Search results for: <span className="query-text">"{query}"</span>
            </h2>
          )}
          {!loading && (
            <p className="results-count">
              {results.length} {results.length === 1 ? "item" : "items"} found
            </p>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <div className="results-grid">
                {results.map((item) => (
                  <div key={item.id} className="result-card">
                    <div className="card-image">{item.image}</div>
                    <div className="card-content">
                      <span className="card-category">{item.category}</span>
                      <h3 className="card-title">{item.name}</h3>
                      <p className="card-description">{item.description}</p>
                      <div className="card-footer">
                        <span className="card-price">₹{item.price}</span>
                        <button className="add-btn">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No results found</h3>
                <p>Try searching for something else or browse our menu</p>
                <button className="browse-btn" onClick={handleBackHome}>
                  Browse Menu
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 BlueBliss | Crafted with ❤️</p>
      </footer>
    </div>
  );
}

export default SearchResults;