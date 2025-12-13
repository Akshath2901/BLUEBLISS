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
  const [activeFilter, setActiveFilter] = useState("all");

  const { addToCart, increaseQty, decreaseQty, getItemQty } = useContext(CartContext);

  // Fetch all menu items
  const fetchAllMenuItems = async () => {
    const collections = ["menu", "Pmenu", "Umenu"];
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
            rating: item.rating || "4.2",
            isVeg: item.isVeg !== false,
          }));

          allItems = [...allItems, ...formattedItems];
        }
      });
    }

    return allItems;
  };

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

  const filteredResults = results.filter((item) => {
    if (activeFilter === "veg") return item.isVeg;
    if (activeFilter === "nonveg") return !item.isVeg;
    return true;
  });

  return (
    <div className="search-results-container">
      <header className="search-header">
        <div className="header-content">
          <button className="back-btn-search" onClick={handleBackHome}>
            ← Back
          </button>
          <h1 className="brand-search" onClick={handleBackHome}>
            BlueBliss
          </h1>
          <SearchBar onSearch={handleSearch} placeholder="Search for dishes..." />
        </div>
      </header>

      <main className="results-main">
        <div className="results-info">
          {query && (
            <h2 className="results-title">
              Search results for <span className="query-highlight">"{query}"</span>
            </h2>
          )}

          {!loading && (
            <div className="results-meta">
              <p className="results-count">
                {filteredResults.length} {filteredResults.length === 1 ? "dish" : "dishes"} found
              </p>

              <div className="filter-chips">
                <button
                  className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  All Items
                </button>
                <button
                  className={`filter-chip ${activeFilter === "veg" ? "active" : ""}`}
                  onClick={() => setActiveFilter("veg")}
                >
                  🟢 Veg
                </button>
                <button
                  className={`filter-chip ${activeFilter === "nonveg" ? "active" : ""}`}
                  onClick={() => setActiveFilter("nonveg")}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-animation">
              <div className="food-loader">
                <div className="plate"></div>
                <div className="food-item"></div>
                <div className="food-item"></div>
                <div className="food-item"></div>
              </div>
              <p className="loading-text">Finding delicious dishes...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredResults.length > 0 ? (
              <div className="results-grid">
                {filteredResults.map((item) => {
                  const qty = getItemQty(item.id);
                  
                  return (
                    <div key={item.id} className="dish-card">
                      <div className="dish-image-wrapper">
                        <img src={item.img} alt={item.name} className="dish-image" />
                        <span className={`veg-badge ${item.isVeg ? "veg" : "nonveg"}`}>
                          {item.isVeg ? "🟢" : "🔴"}
                        </span>
                      </div>

                      <div className="dish-content">
                        <span className="dish-category">{item.category}</span>
                        <h3 className="dish-name">{item.name}</h3>
                        <p className="dish-description">{item.desc}</p>

                        <div className="dish-meta">
                          <span className="dish-rating">⭐ {item.rating}</span>
                        </div>

                        <div className="dish-footer">
                          <span className="dish-price">₹{item.price}</span>

                          {qty === 0 ? (
                            <button
                              className="add-to-cart-btn"
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
                          ) : (
                            <div className="quantity-controls">
                              <button
                                className="qty-btn-minus"
                                onClick={() => decreaseQty(item.id)}
                              >
                                −
                              </button>
                              <span className="qty-display">{qty}</span>
                              <button
                                className="qty-btn-plus"
                                onClick={() => increaseQty(item.id)}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-animation">
                  <div className="empty-plate">🍽️</div>
                  <div className="search-magnifier">🔍</div>
                </div>
                <h3 className="no-results-title">No dishes found</h3>
                <p className="no-results-text">
                  We couldn't find any dishes matching "{query}"
                </p>
                <button className="browse-menu-btn" onClick={handleBackHome}>
                  Browse Full Menu
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default SearchResults;