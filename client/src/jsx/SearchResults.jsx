import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import SearchBar from "./SearchBar";
import "./SearchResults.css";
import { CartContext } from "../context/CartContext";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);

  // ---------------- Fetch menu data from all 3 collections ----------------
  const fetchAllMenuItems = async () => {
    const collections = ["menu", "Pmenu", "Umenu"]; // your THREE menus
    let allItems = [];

    for (const col of collections) {
      const snap = await getDocs(collection(db, col));

      snap.forEach((doc) => {
        const data = doc.data();

        if (data.items && Array.isArray(data.items)) {
          const formattedItems = data.items.map((item, idx) => ({
            id: item.id || `${col}-${doc.id}-${idx}`,
            name: item.name,
            category: data.category || "Food Item",
            price: item.price,
            img: item.img,
            desc: item.desc,
          }));

          allItems = [...allItems, ...formattedItems];
        }
      });
    }

    return allItems;
  };

  // ---------------- SEARCH LOGIC ----------------
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);

      const allItems = await fetchAllMenuItems();

      const filtered = allItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q)
        );
      });

      setResults(filtered);
      setLoading(false);
    };

    if (query) performSearch();
    else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  const handleSearch = (newQuery) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="search-results-container">
      {/* Header */}
      <header className="search-header">
        <div className="header-content">
          <h1 className="brand" onClick={handleBackHome}>
            BlueBliss Foods & Technologies
          </h1>

          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for dishes..."
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="results-main">
        <div className="results-info">
          {query && (
            <h2>
              Search results for:{" "}
              <span className="query-text">"{query}"</span>
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
                    <img
                      src={item.img}
                      alt={item.name}
                      className="card-image-img"
                    />

                    <div className="card-content">
                      <span className="card-category">{item.category}</span>

                      <h3 className="card-title">{item.name}</h3>

                      <p className="card-description">{item.desc}</p>

                      <div className="card-footer">
                        <span className="card-price">₹{item.price}</span>

                        <button
                          className="add-btn"
                          onClick={() =>
                            addToCart({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              img: item.img,
                            })
                          }
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No results found</h3>
                <p>Try searching for something else or browse menu</p>

                <button className="browse-btn" onClick={handleBackHome}>
                  Browse Menu
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 BlueBliss | Crafted with ❤️</p>
      </footer>
    </div>
  );
}

export default SearchResults;
