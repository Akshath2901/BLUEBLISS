import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { CartContext } from "../context/CartContext";
import { resolveMenuImages } from "./resolveMenuImages";
import "./ComboBuilder.css";

// Brand collections mapping
const BRAND_COLLECTIONS = {
  menu: "Shrimmers",
  Pmenu: "Peppanizze",
  Umenu: "Urban Bites",
};

// Pre-built combo templates
const COMBO_TEMPLATES = [
  {
    id: "breakfast",
    name: "Breakfast Bundle",
    icon: "🌅",
    description: "Start your day right",
    discountBonus: 2,
  },
  {
    id: "lunch",
    name: "Lunch Combo",
    icon: "🍛",
    description: "Complete meal experience",
    discountBonus: 2,
  },
  {
    id: "quickbites",
    name: "Quick Bites",
    icon: "⚡",
    description: "Fast and satisfying",
    discountBonus: 0,
  },
  {
    id: "family",
    name: "Family Pack",
    icon: "👨‍👩‍👧‍👦",
    description: "Feed 3-4 people",
    discountBonus: 3,
  },
  {
    id: "indulgent",
    name: "Indulgent Feast",
    icon: "🤤",
    description: "Go all out",
    discountBonus: 3,
  },
];

export default function ComboBuilder() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuData, setMenuData] = useState({}); // { brandName: { category: [items] } }
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [savedCombos, setSavedCombos] = useState([]);
  const [comboName, setComboName] = useState("");
  const [activeTab, setActiveTab] = useState("builder");
  const [loading, setLoading] = useState(true);
  const [trendingCombos, setTrendingCombos] = useState([]);
  const [expandedBrands, setExpandedBrands] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        console.log("👤 User logged in:", user.uid);
        loadSavedCombos(user.uid);
        loadTrendingCombos();
      } else {
        console.log("👤 No user logged in");
        setSavedCombos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load all menu data from all brands
  useEffect(() => {
    loadAllMenus();
  }, []);

  const loadAllMenus = async () => {
    try {
      setLoading(true);
      const allMenus = {};

      // Fetch from all brand collections
      for (const [collectionName, brandName] of Object.entries(
        BRAND_COLLECTIONS
      )) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          const categories = [];

          snapshot.forEach((doc) => {
            categories.push(doc.data());
          });

          // Resolve images
          const categoriesWithImages = await resolveMenuImages(categories);

          // Group by category
          const brandCategories = {};
          categoriesWithImages.forEach((section) => {
            const categoryName = section.category || "Uncategorized";
            if (!brandCategories[categoryName]) {
              brandCategories[categoryName] = [];
            }
            if (section.items && Array.isArray(section.items)) {
              brandCategories[categoryName].push(
                ...section.items.map((item, idx) => ({
                  ...item,
                  id: item.id || `${collectionName}-${categoryName}-${idx}`,
                }))
              );
            }
          });

          allMenus[brandName] = brandCategories;
        } catch (err) {
          console.error(`Error loading ${brandName}:`, err);
        }
      }

      setMenuData(allMenus);
      // Initialize all brands as expanded
      const initialExpanded = {};
      Object.keys(allMenus).forEach((brand) => {
        initialExpanded[brand] = true;
      });
      setExpandedBrands(initialExpanded);
      setLoading(false);
    } catch (error) {
      console.error("Error loading menus:", error);
      setLoading(false);
    }
  };

  const loadSavedCombos = async (userId) => {
    try {
      console.log("Loading saved combos for userId:", userId);
      
      const combosRef = collection(db, "userCombos");
      const q = query(combosRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const combos = [];
      querySnapshot.forEach((doc) => {
        console.log("Found combo:", doc.id, doc.data());
        combos.push({ id: doc.id, ...doc.data() });
      });

      console.log("Total combos loaded:", combos.length);
      setSavedCombos(combos);
    } catch (error) {
      console.error("Error loading combos:", error);
    }
  };

  const loadTrendingCombos = async () => {
    try {
      const combosRef = collection(db, "userCombos");
      const querySnapshot = await getDocs(combosRef);

      const combos = [];
      querySnapshot.forEach((doc) => {
        combos.push({ id: doc.id, ...doc.data() });
      });

      const trending = combos
        .sort((a, b) => (b.timesReordered || 0) - (a.timesReordered || 0))
        .slice(0, 5);

      setTrendingCombos(trending);
    } catch (error) {
      console.error("Error loading trending combos:", error);
    }
  };

  const toggleBrand = (brand) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brand]: !prev[brand],
    }));
  };

  const toggleCategory = (brand, category) => {
    const key = `${brand}-${category}`;
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate discount
  const calculateDiscount = (itemCount) => {
    if (itemCount <= 1) return 0;
    if (itemCount === 2) return 5;
    if (itemCount <= 4) return 8;
    return 10;
  };

  const addDishToCombo = (dish) => {
    setSelectedDishes([
      ...selectedDishes,
      { ...dish, comboItemId: `${dish.name}-${Date.now()}` },
    ]);
  };

  const removeDishFromCombo = (comboItemId) => {
    setSelectedDishes(
      selectedDishes.filter((item) => item.comboItemId !== comboItemId)
    );
  };

  const originalPrice = selectedDishes.reduce((sum, item) => sum + item.price, 0);
  const discountPercentage = calculateDiscount(selectedDishes.length);
  const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));
  const discount = originalPrice - discountedPrice;
  const pointsEarned = Math.floor(discountedPrice / 25) * 1.5;

  const handleSaveCombo = async () => {
    if (!currentUser) {
      alert("Please login to save combos");
      navigate("/login");
      return;
    }

    if (!comboName.trim()) {
      alert("Please enter a combo name");
      return;
    }

    if (selectedDishes.length === 0) {
      alert("Please add at least one item to the combo");
      return;
    }

    try {
      const comboId = `combo-${currentUser.uid}-${Date.now()}`;

      const comboData = {
        userId: currentUser.uid,
        name: comboName,
        dishes: selectedDishes.map((dish) => ({
          name: dish.name,
          price: dish.price,
        })),
        originalPrice,
        discountedPrice,
        discount,
        discountPercentage,
        createdAt: new Date().toISOString(),
        timesReordered: 0,
      };

      console.log("🔥 SAVING COMBO:", {
        comboId,
        userId: currentUser.uid,
        name: comboName,
        dishes: selectedDishes.length,
      });

      // Save to Firebase
      await setDoc(doc(db, "userCombos", comboId), comboData);
      console.log("✅ Combo saved to Firebase!");

      // Immediately update local state
      setSavedCombos((prevCombos) => [
        ...prevCombos,
        { id: comboId, ...comboData },
      ]);

      // Clear form
      setComboName("");
      setSelectedDishes([]);

      // Show success and switch tab
      alert("✅ Combo saved successfully!");
      setActiveTab("saved");

      // Also reload from Firebase to sync
      setTimeout(() => {
        loadSavedCombos(currentUser.uid);
      }, 500);
    } catch (error) {
      console.error("❌ Error saving combo:", error);
      alert("❌ Failed to save combo: " + error.message);
    }
  };

  const handleAddCurrentComboToCart = () => {
    if (!currentUser) {
      alert("Please login to add combos to cart");
      navigate("/login");
      return;
    }

    if (selectedDishes.length === 0) {
      alert("Please add at least one item to the combo");
      return;
    }

    const comboItem = {
      id: `combo-temp-${Date.now()}`,
      name: comboName || `Custom Combo (${selectedDishes.length} items)`,
      price: discountedPrice,
      originalPrice,
      discount,
      discountPercentage,
      isCombo: true,
      items: selectedDishes.map((dish) => ({
        name: dish.name,
        price: dish.price,
      })),
      qty: 1,
      img: "🍽️",
    };

    addToCart(comboItem);
    alert("✅ Combo added to cart!");

    setComboName("");
    setSelectedDishes([]);
    navigate("/cart");
  };

  if (!currentUser) {
    return (
      <div className="combo-auth-required">
        <div className="auth-card">
          <div className="auth-icon">🔐</div>
          <h2>Login Required</h2>
          <p>Please login to create and manage your personalized combos</p>
          <button className="auth-btn" onClick={() => navigate("/login")}>
            🔓 Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="combo-builder-wrapper">
      <div className="combo-builder-header">
        <h1>🍕 Create Your Perfect Combo</h1>
        <p>Mix & match from our menu and save your favorite combinations!</p>
      </div>

      <div className="combo-tabs">
        <button
          className={`tab-btn ${activeTab === "builder" ? "active" : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          🛠️ Build Combo
        </button>
        <button
          className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          ⭐ Saved Combos ({savedCombos.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "trending" ? "active" : ""}`}
          onClick={() => setActiveTab("trending")}
        >
          🔥 Trending ({trendingCombos.length})
        </button>
      </div>

      <div className="combo-content">
        {/* BUILD COMBO TAB */}
        {activeTab === "builder" && (
          <div className="combo-builder-section">
            <div className="builder-layout">
              {/* Left: All Dishes with Dropdowns */}
              <div className="dishes-panel">
                <h2>📋 Available Dishes</h2>

                {loading ? (
                  <p className="loading-text">Loading menus from all brands...</p>
                ) : Object.keys(menuData).length === 0 ? (
                  <p className="loading-text">No menus found</p>
                ) : (
                  <div className="brands-accordion">
                    {Object.entries(menuData).map(([brandName, categories]) => (
                      <div key={brandName} className="brand-section">
                        <button
                          className="brand-header"
                          onClick={() => toggleBrand(brandName)}
                        >
                          <span className="brand-name">🍽️ {brandName}</span>
                          <span className="toggle-icon">
                            {expandedBrands[brandName] ? "▼" : "▶"}
                          </span>
                        </button>

                        {expandedBrands[brandName] && (
                          <div className="brand-content">
                            {Object.entries(categories).map(
                              ([categoryName, items]) => {
                                const catKey = `${brandName}-${categoryName}`;
                                const isOpen = expandedCategories[catKey];

                                return (
                                  <div key={catKey} className="category-accordion">
                                    <button
                                      className="category-header"
                                      onClick={() =>
                                        toggleCategory(brandName, categoryName)
                                      }
                                    >
                                      <span>{categoryName}</span>
                                      <span className="item-count">
                                        {items.length}
                                      </span>
                                      <span className="toggle-icon">
                                        {isOpen ? "▼" : "▶"}
                                      </span>
                                    </button>

                                    {isOpen && (
                                      <div className="items-accordion">
                                        {items.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="small-dish-item"
                                          >
                                            <div className="small-dish-img">
                                              {item.img ? (
                                                <img
                                                  src={item.img}
                                                  alt={item.name}
                                                  onError={(e) => {
                                                    e.target.src = "🍽️";
                                                  }}
                                                />
                                              ) : (
                                                "🍽️"
                                              )}
                                            </div>
                                            <div className="small-dish-info">
                                              <h4>{item.name}</h4>
                                              <p className="small-price">
                                                ₹{item.price}
                                              </p>
                                            </div>
                                            <button
                                              className="small-add-btn"
                                              onClick={() =>
                                                addDishToCombo(item)
                                              }
                                            >
                                              +
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Combo Builder */}
              <div className="builder-panel">
                <div className="builder-card">
                  <h2>🎯 Your Combo</h2>

                  <input
                    type="text"
                    placeholder="Give your combo a name..."
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    className="combo-name-input"
                  />

                  <div className="selected-items">
                    <h3>Items ({selectedDishes.length})</h3>

                    {selectedDishes.length === 0 ? (
                      <div className="empty-combo">
                        <p>👈 Add items from the left to create your combo</p>
                      </div>
                    ) : (
                      <div className="items-list">
                        {selectedDishes.map((item) => (
                          <div key={item.comboItemId} className="combo-item">
                            <div className="item-details">
                              <p className="item-name">{item.name}</p>
                            </div>
                            <div className="item-right">
                              <span className="item-price">₹{item.price}</span>
                              <button
                                className="remove-btn"
                                onClick={() =>
                                  removeDishFromCombo(item.comboItemId)
                                }
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedDishes.length > 0 && (
                    <div className="price-breakdown">
                      <div className="price-row">
                        <span>Original Price:</span>
                        <span>₹{originalPrice}</span>
                      </div>
                      <div className="price-row discount-row">
                        <span>{discountPercentage}% Combo Discount:</span>
                        <span className="discount-amount">-₹{discount}</span>
                      </div>
                      <div className="price-row total-row">
                        <strong>Final Price:</strong>
                        <strong className="final-price">₹{discountedPrice}</strong>
                      </div>
                      <div className="loyalty-boost">
                        <span>⭐ Earn {Math.round(pointsEarned)} Points</span>
                        <span className="boost-badge">+50% Bonus!</span>
                      </div>
                      <p className="discount-note">
                        💰 You save ₹{discount} on this combo!
                      </p>
                    </div>
                  )}

                  <div className="action-buttons">
                    <button
                      className="save-combo-btn"
                      onClick={handleSaveCombo}
                      disabled={selectedDishes.length === 0 || loading}
                    >
                      {loading ? "⏳ Saving..." : "💾 Save for Later"}
                    </button>
                    <button
                      className="add-cart-btn"
                      onClick={handleAddCurrentComboToCart}
                      disabled={selectedDishes.length === 0}
                    >
                      🛒 Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMBO TEMPLATES - Show when builder is empty */}
        {activeTab === "builder" && selectedDishes.length === 0 && (
          <div className="combo-templates-section">
            <h2>📋 Quick Start Templates</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
              Select a template to get started with recommended discount bonuses!
            </p>
            <div className="templates-grid">
              {COMBO_TEMPLATES.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-icon">{template.icon}</div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  {template.discountBonus > 0 && (
                    <div className="template-bonus">
                      +{template.discountBonus}% Extra Discount
                    </div>
                  )}
                  <button
                    className="template-btn"
                    onClick={() => {
                      setComboName(`${template.name} - Custom`);
                      alert(
                        `📋 ${template.name} template selected! Start adding items to get ${template.discountBonus || 0}% bonus discount`
                      );
                    }}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAVED COMBOS TAB */}
        {activeTab === "saved" && (
          <div className="saved-combos-section">
            <div
              style={{
                marginBottom: "30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  color: "#ffd700",
                  fontWeight: "900",
                }}
              >
                ⭐ Saved Combos ({savedCombos.length})
              </h2>
              <button
                onClick={() => loadSavedCombos(currentUser.uid)}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #ffd700, #d4af37)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#000",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                🔄 Refresh
              </button>
            </div>

            {savedCombos.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">😕</p>
                <p style={{ fontSize: "20px", color: "#fff", margin: "10px 0" }}>
                  No saved combos yet
                </p>
                <p className="empty-subtext">
                  Create and save your favorite combos!
                </p>
                <button
                  className="goto-builder-btn"
                  onClick={() => setActiveTab("builder")}
                >
                  🛠️ Create Combo
                </button>
              </div>
            ) : (
              <div className="saved-combos-grid">
                {savedCombos.map((combo) => (
                  <div key={combo.id} className="saved-combo-card">
                    <div className="combo-header">
                      <h3>{combo.name}</h3>
                      <span className="items-badge">
                        {combo.dishes ? combo.dishes.length : 0} items
                      </span>
                    </div>

                    {combo.dishes && combo.dishes.length > 0 && (
                      <div className="combo-items-preview">
                        {combo.dishes.map((item, idx) => (
                          <p key={idx} className="preview-item">
                            • {item.name} (₹{item.price})
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="combo-pricing">
                      <div className="price-info">
                        <span className="original-price">
                          ₹{combo.originalPrice}
                        </span>
                        <span className="discount-badge">
                          {combo.discountPercentage}% OFF
                        </span>
                      </div>
                      <div className="final-combo-price">
                        ₹{combo.discountedPrice}
                      </div>
                    </div>

                    <p className="save-amount">Save ₹{combo.discount}</p>

                    {combo.timesReordered > 0 && (
                      <p className="reorder-count">
                        ✨ Reordered {combo.timesReordered} times
                      </p>
                    )}

                    <div className="combo-actions">
                      <button
                        className="reorder-btn"
                        onClick={() => {
                          const comboItem = {
                            id: `combo-${combo.id}-${Date.now()}`,
                            name: combo.name,
                            price: combo.discountedPrice,
                            originalPrice: combo.originalPrice,
                            discount: combo.discount,
                            discountPercentage: combo.discountPercentage,
                            isCombo: true,
                            items: combo.dishes || [],
                            qty: 1,
                            img: "🍽️",
                          };
                          addToCart(comboItem);
                          alert(`✅ "${combo.name}" added to cart!`);
                          navigate("/cart");
                        }}
                      >
                        🛒 Reorder
                      </button>
                      <button
                        className="delete-btn"
                        onClick={async () => {
                          if (window.confirm(`Delete "${combo.name}"?`)) {
                            try {
                              await deleteDoc(doc(db, "userCombos", combo.id));
                              alert("✅ Combo deleted!");
                              loadSavedCombos(currentUser.uid);
                            } catch (error) {
                              alert("❌ Failed to delete combo");
                            }
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRENDING COMBOS TAB */}
        {activeTab === "trending" && (
          <div className="trending-combos-section">
            {trendingCombos.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🔥</p>
                <p>No trending combos yet</p>
              </div>
            ) : (
              <div className="saved-combos-grid">
                {trendingCombos.map((combo) => (
                  <div key={combo.id} className="saved-combo-card">
                    <div className="combo-header">
                      <h3>{combo.name}</h3>
                    </div>
                    <p className="trending-stat">
                      ✨ Ordered {combo.timesReordered} times
                    </p>
                    <div className="combo-pricing">
                      <div className="final-combo-price">₹{combo.discountedPrice}</div>
                    </div>
                    <button className="trending-order-btn">🔥 Order Now</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}