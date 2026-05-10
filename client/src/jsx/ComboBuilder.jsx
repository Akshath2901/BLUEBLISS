// src/jsx/ComboBuilder.jsx — BlueBliss V2.0 Premium
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { CartContext } from "../context/CartContext";
import { resolveMenuImages } from "./resolveMenuImages";
import "./ComboBuilder.css";

const BRAND_COLLECTIONS = {
  menu:  "Shrimmers",
  Pmenu: "Peppanizze",
  Umenu: "UrbanWrap",
};

const COMBO_TEMPLATES = [
  { id:"breakfast",  name:"Breakfast Bundle",  icon:"🌅", description:"Start your day right",     discountBonus:2 },
  { id:"lunch",      name:"Lunch Combo",        icon:"🍛", description:"Complete meal experience", discountBonus:2 },
  { id:"quickbites", name:"Quick Bites",        icon:"⚡", description:"Fast and satisfying",      discountBonus:0 },
  { id:"family",     name:"Family Pack",        icon:"👨‍👩‍👧‍👦", description:"Feed 3–4 people",         discountBonus:3 },
  { id:"indulgent",  name:"Indulgent Feast",    icon:"🤤", description:"Go all out",               discountBonus:3 },
];

export default function ComboBuilder() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [currentUser,        setCurrentUser]        = useState(null);
  const [menuData,           setMenuData]           = useState({});
  const [selectedDishes,     setSelectedDishes]     = useState([]);
  const [savedCombos,        setSavedCombos]        = useState([]);
  const [comboName,          setComboName]          = useState("");
  const [activeTab,          setActiveTab]          = useState("builder");
  const [loading,            setLoading]            = useState(true);
  const [trendingCombos,     setTrendingCombos]     = useState([]);
  const [expandedBrands,     setExpandedBrands]     = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  /* ── Auth ─────────────────────────────────────────────── */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) { loadSavedCombos(user.uid); loadTrendingCombos(); }
      else       { setSavedCombos([]); }
    });
    return () => unsub();
  }, []);

  /* ── Menus ────────────────────────────────────────────── */
  useEffect(() => { loadAllMenus(); }, []);

  const loadAllMenus = async () => {
    try {
      setLoading(true);
      const allMenus = {};

      for (const [colName, brandName] of Object.entries(BRAND_COLLECTIONS)) {
        try {
          const snap = await getDocs(collection(db, colName));
          const categories = [];
          snap.forEach(d => categories.push(d.data()));
          const withImages = await resolveMenuImages(categories);

          const brandCats = {};
          withImages.forEach(section => {
            const cat = section.category || "Uncategorized";
            if (!brandCats[cat]) brandCats[cat] = [];
            if (section.items && Array.isArray(section.items)) {
              brandCats[cat].push(...section.items.map((item, idx) => ({
                ...item,
                id: item.id || `${colName}-${cat}-${idx}`,
              })));
            }
          });
          allMenus[brandName] = brandCats;
        } catch (err) { console.error(`Error loading ${brandName}:`, err); }
      }

      setMenuData(allMenus);
      const init = {};
      Object.keys(allMenus).forEach(b => { init[b] = true; });
      setExpandedBrands(init);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadSavedCombos = async userId => {
    try {
      const q = query(collection(db, "userCombos"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const combos = [];
      snap.forEach(d => combos.push({ id: d.id, ...d.data() }));
      setSavedCombos(combos);
    } catch (e) { console.error(e); }
  };

  const loadTrendingCombos = async () => {
    try {
      const snap = await getDocs(collection(db, "userCombos"));
      const combos = [];
      snap.forEach(d => combos.push({ id: d.id, ...d.data() }));
      setTrendingCombos(combos.sort((a,b) => (b.timesReordered||0) - (a.timesReordered||0)).slice(0,5));
    } catch (e) { console.error(e); }
  };

  const toggleBrand    = b    => setExpandedBrands(p => ({ ...p, [b]: !p[b] }));
  const toggleCategory = (b,c) => {
    const k = `${b}-${c}`;
    setExpandedCategories(p => ({ ...p, [k]: !p[k] }));
  };

  /* ── Pricing ──────────────────────────────────────────── */
  const calculateDiscount = n => { if (n<=1) return 0; if (n===2) return 5; if (n<=4) return 8; return 10; };
  const originalPrice     = selectedDishes.reduce((s,i) => s + i.price, 0);
  const discountPct       = calculateDiscount(selectedDishes.length);
  const discountedPrice   = Math.round(originalPrice * (1 - discountPct/100));
  const discount          = originalPrice - discountedPrice;
  const pointsEarned      = Math.floor(discountedPrice/25) * 1.5;

  const addDishToCombo    = dish => setSelectedDishes(p => [...p, { ...dish, comboItemId:`${dish.name}-${Date.now()}` }]);
  const removeDishFromCombo = id => setSelectedDishes(p => p.filter(i => i.comboItemId !== id));

  /* ── Save combo ───────────────────────────────────────── */
  const handleSaveCombo = async () => {
    if (!currentUser) { alert("Please login to save combos"); navigate("/login"); return; }
    if (!comboName.trim()) { alert("Please enter a combo name"); return; }
    if (!selectedDishes.length) { alert("Please add at least one item"); return; }

    try {
      const comboId   = `combo-${currentUser.uid}-${Date.now()}`;
      const comboData = {
        userId: currentUser.uid, name: comboName,
        dishes: selectedDishes.map(d => ({ name:d.name, price:d.price })),
        originalPrice, discountedPrice, discount, discountPercentage:discountPct,
        createdAt: new Date().toISOString(), timesReordered: 0,
      };

      await setDoc(doc(db, "userCombos", comboId), comboData);
      setSavedCombos(p => [...p, { id:comboId, ...comboData }]);
      setComboName(""); setSelectedDishes([]);
      alert("✅ Combo saved!");
      setActiveTab("saved");
      setTimeout(() => loadSavedCombos(currentUser.uid), 500);
    } catch (e) { alert("❌ Failed to save: " + e.message); }
  };

  /* ── Add to cart ──────────────────────────────────────── */
  const handleAddCurrentComboToCart = () => {
    if (!currentUser) { alert("Please login"); navigate("/login"); return; }
    if (!selectedDishes.length) { alert("Add at least one item"); return; }

    addToCart({
      id: `combo-temp-${Date.now()}`,
      name: comboName || `Custom Combo (${selectedDishes.length} items)`,
      price: discountedPrice, originalPrice, discount, discountPercentage:discountPct,
      isCombo: true, items: selectedDishes.map(d => ({ name:d.name, price:d.price })),
      qty: 1, img: "🍽️",
    });
    setComboName(""); setSelectedDishes([]);
    navigate("/cart");
  };

  /* ── Auth required ────────────────────────────────────── */
  if (!currentUser) return (
    <div className="combo-auth-required">
      <div className="auth-card">
        <span className="auth-icon">🔐</span>
        <h2>Login Required</h2>
        <p>Login to create and manage your personalised combos</p>
        <button className="auth-btn" onClick={() => navigate("/login")}>
          🔓 Login Now
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="combo-builder-wrapper">

      {/* ── HEADER ── */}
      <div className="combo-builder-header">
        <h1>Create Your Perfect Combo</h1>
        <p>Mix & match from our menu and save your favourite combinations</p>
      </div>

      {/* ── TABS ── */}
      <div className="combo-tabs">
        {[
          { key:"builder",  label:"🛠️ Build Combo" },
          { key:"saved",    label:`⭐ Saved (${savedCombos.length})` },
          { key:"trending", label:`🔥 Trending (${trendingCombos.length})` },
        ].map(t => (
          <button key={t.key}
            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="combo-content">

        {/* ══ BUILD TAB ══════════════════════════════════ */}
        {activeTab === "builder" && (
          <div className="combo-builder-section">
            <div className="builder-layout">

              {/* Left: Dishes Panel */}
              <div className="dishes-panel">
                <h2>Available Dishes</h2>

                {loading ? (
                  <p className="loading-text">Loading menus from all brands...</p>
                ) : Object.keys(menuData).length === 0 ? (
                  <p className="loading-text">No menus found</p>
                ) : (
                  <div className="brands-accordion">
                    {Object.entries(menuData).map(([brandName, categories]) => (
                      <div key={brandName} className="brand-section">

                        <button className="brand-header" onClick={() => toggleBrand(brandName)}>
                          <span className="brand-name">🍽️ {brandName}</span>
                          <span className={`toggle-icon ${expandedBrands[brandName] ? "open" : ""}`}>
                            {expandedBrands[brandName] ? "▼" : "▶"}
                          </span>
                        </button>

                        {expandedBrands[brandName] && (
                          <div className="brand-content">
                            {Object.entries(categories).map(([catName, items]) => {
                              const key  = `${brandName}-${catName}`;
                              const open = expandedCategories[key];
                              return (
                                <div key={key} className="category-accordion">
                                  <button className="category-header"
                                    onClick={() => toggleCategory(brandName, catName)}>
                                    <span>{catName}</span>
                                    <span className="item-count">{items.length}</span>
                                    <span className={`toggle-icon ${open ? "open" : ""}`}>
                                      {open ? "▼" : "▶"}
                                    </span>
                                  </button>

                                  {open && (
                                    <div className="items-accordion">
                                      {items.map((item, idx) => (
                                        <div key={idx} className="small-dish-item">
                                          <div className="small-dish-img">
                                            {item.img
                                              ? <img src={item.img} alt={item.name} onError={e => { e.target.style.display="none"; }} />
                                              : "🍽️"
                                            }
                                          </div>
                                          <div className="small-dish-info">
                                            <h4>{item.name}</h4>
                                            <p className="small-price">₹{item.price}</p>
                                          </div>
                                          <button className="small-add-btn" onClick={() => addDishToCombo(item)}>
                                            +
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Builder Card */}
              <div className="builder-panel">
                <div className="builder-card">
                  <h2>Your Combo</h2>

                  <input
                    type="text"
                    placeholder="Give your combo a name..."
                    value={comboName}
                    onChange={e => setComboName(e.target.value)}
                    className="combo-name-input"
                  />

                  <div className="selected-items">
                    <h3>Items <span className="item-tally">({selectedDishes.length})</span></h3>

                    {selectedDishes.length === 0 ? (
                      <div className="empty-combo">
                        <span className="empty-combo-icon">👈</span>
                        <p>Add items from the left to build your combo</p>
                      </div>
                    ) : (
                      <div className="items-list">
                        {selectedDishes.map(item => (
                          <div key={item.comboItemId} className="combo-item">
                            <div className="item-details">
                              <p className="item-name">{item.name}</p>
                            </div>
                            <div className="item-right">
                              <span className="item-price">₹{item.price}</span>
                              <button className="remove-btn" onClick={() => removeDishFromCombo(item.comboItemId)}>
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
                        <span>Original price</span>
                        <span>₹{originalPrice}</span>
                      </div>
                      <div className="price-row discount-row">
                        <span>{discountPct}% combo discount</span>
                        <span className="discount-amount">−₹{discount}</span>
                      </div>
                      <div className="price-row total-row">
                        <strong>Final price</strong>
                        <strong className="final-price">₹{discountedPrice}</strong>
                      </div>
                      <div className="loyalty-boost">
                        <span>⭐ Earn {Math.round(pointsEarned)} points</span>
                        <span className="boost-badge">+50% Bonus!</span>
                      </div>
                      <p className="discount-note">💰 You save ₹{discount} on this combo</p>
                    </div>
                  )}

                  <div className="action-buttons">
                    <button className="save-combo-btn" onClick={handleSaveCombo}
                      disabled={selectedDishes.length === 0 || loading}>
                      💾 Save for Later
                    </button>
                    <button className="add-cart-btn" onClick={handleAddCurrentComboToCart}
                      disabled={selectedDishes.length === 0}>
                      🛒 Add Combo to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TEMPLATES (shown when builder is empty) ═════ */}
        {activeTab === "builder" && selectedDishes.length === 0 && (
          <div className="combo-templates-section">
            <div className="templates-header">
              <p className="templates-eyebrow">Quick Start</p>
              <h2 className="templates-title">Choose a Template</h2>
              <p className="templates-sub">
                Select a template to get started — each unlocks a bonus discount
              </p>
            </div>
            <div className="templates-grid">
              {COMBO_TEMPLATES.map((t, i) => (
                <div key={t.id} className="template-card"
                  style={{ animationDelay:`${i*0.08}s` }}>
                  <span className="template-icon">{t.icon}</span>
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                  {t.discountBonus > 0 && (
                    <div className="template-bonus">+{t.discountBonus}% Extra Discount</div>
                  )}
                  <button className="template-btn"
                    onClick={() => {
                      setComboName(`${t.name} — Custom`);
                      alert(`📋 ${t.name} selected! Start adding items to unlock ${t.discountBonus||0}% bonus discount`);
                    }}>
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SAVED COMBOS TAB ═══════════════════════════ */}
        {activeTab === "saved" && (
          <div className="saved-combos-section">
            <div className="saved-header-row">
              <h2 className="saved-section-title">
                ⭐ Your Saved Combos
              </h2>
              <button className="refresh-btn"
                onClick={() => loadSavedCombos(currentUser.uid)}>
                🔄 Refresh
              </button>
            </div>

            {savedCombos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">😕</span>
                <p className="empty-primary">No saved combos yet</p>
                <p className="empty-sub">Create and save your favourite combinations</p>
                <button className="goto-builder-btn" onClick={() => setActiveTab("builder")}>
                  🛠️ Build Your First Combo
                </button>
              </div>
            ) : (
              <div className="saved-combos-grid">
                {savedCombos.map((combo, i) => (
                  <div key={combo.id} className="saved-combo-card"
                    style={{ animationDelay:`${i*0.06}s` }}>
                    <div className="combo-header">
                      <h3>{combo.name}</h3>
                      <span className="items-badge">{combo.dishes?.length || 0} items</span>
                    </div>

                    {combo.dishes?.length > 0 && (
                      <div className="combo-items-preview">
                        {combo.dishes.map((item, idx) => (
                          <p key={idx} className="preview-item">
                            · {item.name} <span className="preview-price">₹{item.price}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="combo-pricing">
                      <div className="price-info">
                        <span className="original-price">₹{combo.originalPrice}</span>
                        <span className="discount-badge">{combo.discountPercentage}% OFF</span>
                      </div>
                      <div className="final-combo-price">₹{combo.discountedPrice}</div>
                    </div>

                    <p className="save-amount">You save ₹{combo.discount}</p>

                    {combo.timesReordered > 0 && (
                      <p className="reorder-count">✨ Reordered {combo.timesReordered} times</p>
                    )}

                    <div className="combo-actions">
                      <button className="reorder-btn" onClick={() => {
                        addToCart({
                          id:`combo-${combo.id}-${Date.now()}`, name:combo.name,
                          price:combo.discountedPrice, originalPrice:combo.originalPrice,
                          discount:combo.discount, discountPercentage:combo.discountPercentage,
                          isCombo:true, items:combo.dishes||[], qty:1, img:"🍽️",
                        });
                        navigate("/cart");
                      }}>
                        🛒 Reorder
                      </button>
                      <button className="delete-btn" onClick={async () => {
                        if (window.confirm(`Delete "${combo.name}"?`)) {
                          try {
                            await deleteDoc(doc(db, "userCombos", combo.id));
                            loadSavedCombos(currentUser.uid);
                          } catch (e) { alert("❌ Failed to delete"); }
                        }
                      }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TRENDING TAB ════════════════════════════════ */}
        {activeTab === "trending" && (
          <div className="trending-combos-section">
            {trendingCombos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔥</span>
                <p className="empty-primary">No trending combos yet</p>
                <p className="empty-sub">Be the first to create one!</p>
              </div>
            ) : (
              <div className="saved-combos-grid">
                {trendingCombos.map((combo, i) => (
                  <div key={combo.id} className="saved-combo-card trending-combo-card"
                    style={{ animationDelay:`${i*0.07}s` }}>
                    <span className="trending-badge">🔥 TRENDING</span>
                    <div className="combo-header">
                      <h3>{combo.name}</h3>
                    </div>
                    <p className="trending-stat">✨ Ordered {combo.timesReordered} times</p>
                    <div className="combo-pricing">
                      <div className="final-combo-price">₹{combo.discountedPrice}</div>
                    </div>
                    <button className="trending-order-btn" onClick={() => {
                      addToCart({
                        id:`combo-trend-${combo.id}-${Date.now()}`, name:combo.name,
                        price:combo.discountedPrice, isCombo:true,
                        items:combo.dishes||[], qty:1, img:"🍽️",
                      });
                      navigate("/cart");
                    }}>
                      🔥 Order Now
                    </button>
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