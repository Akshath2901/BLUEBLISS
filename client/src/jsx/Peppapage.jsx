// src/jsx/Peppapage.jsx
// ✅ UPDATED: Kitchen closed gate + out-of-stock item support added

import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db, auth } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import { useRestaurantStatus } from "../context/RestaurantStatusContext"; // ✅ NEW
import KitchenClosed from "./KitchenClosed";                              // ✅ NEW
import "./SwiggyStyleMenu.css";

const storage = getStorage();

function Peppa() {
  // ✅ NEW
  const { isBrandOpen, loading: statusLoading } = useRestaurantStatus();

  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [openCategories, setOpenCategories] = useState({});
  const [showCategoryNav, setShowCategoryNav] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [itemQty, setItemQty] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [filteredMenuData, setFilteredMenuData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [activeDealIndex, setActiveDealIndex] = useState(0);

  const categoryRefs = useRef({});
  const searchBarRef = useRef(null);

  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } = useContext(CartContext);

  const categoryOrder = ["PIZZAS", "GARLIC BREAD", "PASTA", "SIDES", "BEVERAGES", "DESSERTS"];

  const sortCategories = (categories) => {
    return [...categories].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category.toUpperCase());
      const indexB = categoryOrder.indexOf(b.category.toUpperCase());
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const customizationGroups = [
    {
      id: "size", title: "Choose Size", subtitle: "Select upto 1", maxSelection: 1, required: false,
      options: [
        { id: "size-1", name: "Regular (8 inch)", price: 0, type: "veg" },
        { id: "size-2", name: "Medium (10 inch)", price: 50, type: "veg" },
        { id: "size-3", name: "Large (12 inch)", price: 100, type: "veg" }
      ]
    },
    {
      id: "cheese", title: "Extra Cheese", subtitle: "Select upto 1", maxSelection: 1, required: false,
      options: [
        { id: "cheese-1", name: "Extra Cheese", price: 40, type: "veg" },
        { id: "cheese-2", name: "Double Cheese", price: 80, type: "veg" }
      ]
    },
    {
      id: "toppings", title: "Additional Toppings", subtitle: "Select upto 3", maxSelection: 3, required: false,
      options: [
        { id: "top-1", name: "Jalapeños", price: 25, type: "veg" },
        { id: "top-2", name: "Olives", price: 30, type: "veg" },
        { id: "top-3", name: "Mushrooms", price: 35, type: "veg" },
        { id: "top-4", name: "Extra Sauce", price: 20, type: "veg" }
      ]
    }
  ];

  const renderFoodTypeIndicator = (item) => {
    const isVeg = item.type === "veg" || item.isVeg === true;
    return (
      <span style={{
        display: "inline-block", width: "16px", height: "16px",
        border: `2px solid ${isVeg ? "#48c479" : "#e74c3c"}`,
        borderRadius: "2px", position: "relative", marginRight: "8px", flexShrink: 0
      }}>
        <span style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", width: "6px", height: "6px",
          borderRadius: "50%", backgroundColor: isVeg ? "#48c479" : "#e74c3c"
        }} />
      </span>
    );
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Pmenu"));
        const categories = [];
        for (const docSnap of snapshot.docs) {
          const section = docSnap.data();
          const itemsWithImages = await Promise.all(
            section.items.map(async (item) => {
              if (!item.img) return item;
              try {
                const imageRef = ref(storage, item.img);
                const imageURL = await getDownloadURL(imageRef);
                return { ...item, img: imageURL };
              } catch (err) {
                return item;
              }
            })
          );
          categories.push({ ...section, items: itemsWithImages });
        }
        const sortedCategories = sortCategories(categories);
        const initialOpen = {};
        sortedCategories.forEach((cat) => { initialOpen[cat.category] = true; });
        setOpenCategories(initialOpen);
        setMenuData(sortedCategories);
        setFilteredMenuData(sortedCategories);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersSnapshot = await getDocs(collection(db, "offers"));
        const offersData = [];
        offersSnapshot.forEach((doc) => { if (doc.data().isActive) offersData.push({ id: doc.id, ...doc.data() }); });
        setOffers(offersData);
      } catch (e) { console.log("Offers fetch error:", e); }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (!offers.length) return;
    const interval = setInterval(() => setActiveDealIndex((prev) => prev === offers.length - 1 ? 0 : prev + 1), 1800);
    return () => clearInterval(interval);
  }, [offers]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const itemMap = new Map();
        orders.slice(0, 5).forEach(order => {
          if (order.cart) order.cart.forEach(item => { if (!itemMap.has(item.id)) itemMap.set(item.id, item); });
        });
        setRecentItems(Array.from(itemMap.values()).slice(0, 4));
      } catch (e) { console.log("Error fetching order history:", e); }
    };
    fetchRecentOrders();
  }, []);

  useEffect(() => {
    if (filterType === "all") {
      setFilteredMenuData(sortCategories(menuData));
    } else {
      const filtered = menuData.map(category => ({
        ...category,
        items: category.items.filter(item => {
          if (filterType === "veg") return item.type === "veg" || item.isVeg === true;
          if (filterType === "nonveg") return item.type === "nonveg" || item.type === "non-veg" || item.isVeg === false;
          return true;
        })
      })).filter(category => category.items.length > 0);
      setFilteredMenuData(sortCategories(filtered));
    }
  }, [filterType, menuData]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const matchedCategory = filteredMenuData.find(category =>
      category.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (matchedCategory) {
      const el = categoryRefs.current[matchedCategory.category];
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchQuery, filteredMenuData]);

  const toggleCategory = (category) => setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));

  const handleCategorySelect = (category) => {
    const updated = {};
    Object.keys(openCategories).forEach((key) => { updated[key] = false; });
    updated[category] = true;
    setOpenCategories(updated);
    setShowCategoryNav(false);
    setTimeout(() => categoryRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  };

  const handleItemClick = (item, category, itemId) => {
    // ✅ Don't open modal for out-of-stock items
    if (item.isAvailable === false) return;
    setSelectedItem({ ...item, category, itemId });
    setShowItemModal(true);
    setItemQty(1);
    setSelectedAddons({});
  };

  const handleAddToCart = () => {
    const itemId = selectedItem.itemId;
    const addonsList = [];
    let addonPrice = 0;
    customizationGroups.forEach(group => {
      group.options.forEach(option => {
        if (selectedAddons[option.id]) { addonsList.push(option); addonPrice += option.price; }
      });
    });
    addToCart({ id: itemId, name: selectedItem.name, price: selectedItem.price + addonPrice, img: selectedItem.img, qty: itemQty, addons: addonsList, basePrice: selectedItem.price });
    setShowItemModal(false);
  };

  const toggleAddon = (addonId, groupId) => {
    const group = customizationGroups.find(g => g.id === groupId);
    if (!group) return;
    setSelectedAddons((prev) => {
      const updated = { ...prev };
      const selectedInGroup = group.options.filter(opt => updated[opt.id]).length;
      if (updated[addonId]) { delete updated[addonId]; }
      else {
        if (selectedInGroup < group.maxSelection) updated[addonId] = true;
        else alert(`You can only select up to ${group.maxSelection} items from ${group.title}`);
      }
      return updated;
    });
  };

  const addonTotal = customizationGroups.reduce((sum, group) => sum + group.options.reduce((gs, option) => gs + (selectedAddons[option.id] ? option.price : 0), 0), 0);
  const itemTotal = selectedItem ? (selectedItem.price + addonTotal) * itemQty : 0;
  const totalItems = menuData.reduce((sum, cat) => sum + cat.items.length, 0);
  const vegItems = menuData.reduce((sum, cat) => sum + cat.items.filter(item => item.type === "veg" || item.isVeg === true).length, 0);
  const nonVegItems = menuData.reduce((sum, cat) => sum + cat.items.filter(item => item.type === "nonveg" || item.type === "non-veg" || item.isVeg === false).length, 0);

  // ✅ KITCHEN CLOSED GATE — checks global kitchen AND peppanizze brand toggle
  if (statusLoading) return null;
  if (!isBrandOpen("peppanizze")) return <KitchenClosed />;

  return (
    <div className="menu-wrapper">
      <div className="top-search-bar" ref={searchBarRef}>
        <div className="top-search-wrapper">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Search for dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && <button className="clear-search" onClick={() => { setSearchQuery(""); setIsSearching(false); }}>✕</button>}
          </div>
          <button className={`veg-only-toggle ${filterType === "veg" ? "active" : ""}`} onClick={() => setFilterType(filterType === "veg" ? "all" : "veg")}>
            <span className="veg-icon"><span className="veg-dot"></span></span>
            <span className="veg-text">Veg Only</span>
          </button>
        </div>
      </div>

      {isSearching && (
        <div className="search-results-banner">
          <p>{filteredMenuData.reduce((sum, cat) => sum + cat.items.length, 0)} results for "{searchQuery}"</p>
          <button className="clear-search-btn" onClick={() => { setSearchQuery(""); setIsSearching(false); }}>Clear search</button>
        </div>
      )}

      <div className="restaurant-header">
        <div className="header-top">
          <div className="header-info">
            <h1 className="rest-name">Peppanizze</h1>
            <p className="rest-rating">⭐ 4.5 • ₹350 for two</p>
            <p className="rest-category">Pizza, Italian, Fast Food</p>
            <p className="rest-location">📍 Padmarao Nagar • 40-50 mins</p>
          </div>
        </div>
      </div>

      {offers.length > 0 && (
        <div className="live-deals-section">
          <h3 className="deals-title">🎉 Deals for you</h3>
          <div className="deal-strip">
            <div className="deal-strip-content">
              <div className="deal-left">
                <span className="deal-icon">{offers[activeDealIndex]?.icon || "🎁"}</span>
                <div>
                  <div className="deal-main-text">{offers[activeDealIndex]?.title}</div>
                  <div className="deal-sub-text">USE {offers[activeDealIndex]?.code}</div>
                </div>
              </div>
              <div className="deal-counter">{activeDealIndex + 1}/{offers.length}</div>
            </div>
          </div>
        </div>
      )}

      <div className="filter-section">
        <div className="filter-buttons">
          <button className={`filter-btn ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>
            <span className="filter-text">All Items</span><span className="filter-count">{totalItems}</span>
          </button>
          <button className={`filter-btn veg-filter ${filterType === "veg" ? "active" : ""}`} onClick={() => setFilterType("veg")}>
            <span className="veg-indicator"><span className="veg-dot"></span></span>
            <span className="filter-text">Veg Only</span><span className="filter-count">{vegItems}</span>
          </button>
          <button className={`filter-btn nonveg-filter ${filterType === "nonveg" ? "active" : ""}`} onClick={() => setFilterType("nonveg")}>
            <span className="nonveg-indicator"><span className="nonveg-dot"></span></span>
            <span className="filter-text">Non-Veg</span><span className="filter-count">{nonVegItems}</span>
          </button>
        </div>
        {filterType !== "all" && <p className="filter-info">Showing {filterType === "veg" ? vegItems : nonVegItems} {filterType} items</p>}
      </div>

      {recentItems.length > 0 && (
        <div className="order-again-section">
          <h3 className="order-again-title">🔄 Order Again</h3>
          <div className="order-again-carousel">
            {recentItems.map((item) => {
              const qty = getItemQty(item.id);
              const isAvailable = item.isAvailable !== false;
              return (
                <div key={item.id} className="order-again-card" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                  <img src={item.img} alt={item.name} className="order-again-img" />
                  <div className="order-again-info">
                    <p className="order-again-name">{item.name}</p>
                    <p className="order-again-price">₹{item.price}</p>
                  </div>
                  {!isAvailable ? (
                    <span style={{ fontSize: "11px", color: "#f44336", fontWeight: "700" }}>OUT OF STOCK</span>
                  ) : qty === 0 ? (
                    <button className="order-again-add-btn" onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1, basePrice: item.price })}>ADD</button>
                  ) : (
                    <div className="order-again-qty-box">
                      <button onClick={() => decreaseQty(item.id)}>-</button>
                      <span>{qty}</span>
                      <button onClick={() => increaseQty(item.id)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="menu-title-divider">MENU</div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : filteredMenuData.length === 0 ? (
        <div className="empty-filter">
          <div className="empty-icon">🍕</div>
          <h3>No items found</h3>
          <p>Try changing the filter to see more items</p>
          <button className="reset-filter-btn" onClick={() => setFilterType("all")}>Show All Items</button>
        </div>
      ) : (
        filteredMenuData.map((section, idx) => {
          const isOpen = openCategories[section.category];
          return (
            <div key={idx} className="menu-section" ref={(el) => (categoryRefs.current[section.category] = el)}>
              <div className="category-title" onClick={() => toggleCategory(section.category)}>
                {section.category}
                <span style={{ float: "right" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div className="item-list">
                  {section.items.map((item, index) => {
                    const itemId = item.id || `${section.category}-${item.name}`.replace(/\s+/g, '_').toLowerCase();
                    const qty = getItemQty(itemId);
                    // ✅ Out-of-stock check
                    const isAvailable = item.isAvailable !== false;
                    return (
                      <div key={index} className="menu-item-card" style={{ opacity: isAvailable ? 1 : 0.6 }}>
                        <div className="item-info">
                          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                            {renderFoodTypeIndicator(item)}
                            <h3 className="item-name" style={{ margin: 0 }}>{item.name}</h3>
                            {/* ✅ Out-of-stock badge */}
                            {!isAvailable && (
                              <span style={{
                                marginLeft: "8px", fontSize: "10px", fontWeight: "800", color: "#f44336",
                                background: "rgba(244,67,54,0.12)", padding: "2px 8px",
                                borderRadius: "4px", border: "1px solid rgba(244,67,54,0.3)"
                              }}>OUT OF STOCK</span>
                            )}
                          </div>
                          <p className="item-price">₹{item.price}</p>
                          <p className="item-rating">⭐ {item.rating}</p>
                          <p className="item-desc">{item.desc}</p>
                          {isAvailable && (
                            <button className="more-details-btn" onClick={() => handleItemClick(item, section.category, itemId)}>More Details →</button>
                          )}
                        </div>
                        <div className="item-img-wrapper">
                          <img src={item.img || "/placeholder.png"} className="item-img" alt={item.name} style={{ filter: isAvailable ? "none" : "grayscale(60%)" }} />
                          {!isAvailable ? (
                            <button className="add-btn" disabled style={{ background: "#444", cursor: "not-allowed", color: "#888" }}>N/A</button>
                          ) : qty === 0 ? (
                            <button className="add-btn" onClick={() => handleItemClick(item, section.category, itemId)}>ADD</button>
                          ) : (
                            <div className="qty-box">
                              <button onClick={() => decreaseQty(itemId)}>-</button>
                              <span>{qty}</span>
                              <button onClick={() => increaseQty(itemId)}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <button className="floating-menu-btn" onClick={() => setShowCategoryNav(true)}>MENU</button>

      {showCategoryNav && (
        <div className="category-nav-overlay" onClick={() => setShowCategoryNav(false)}>
          <div className="category-nav-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="category-nav-header">
              <span>Peppanizze</span>
              <button onClick={() => setShowCategoryNav(false)}>✕</button>
            </div>
            {menuData.map((section, idx) => (
              <div key={idx} className="category-nav-item" onClick={() => handleCategorySelect(section.category)}>
                <span>{section.category}</span>
                <span className="category-count">{section.items.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showItemModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {renderFoodTypeIndicator(selectedItem)}
                <h2 style={{ margin: 0 }}>{selectedItem.name}</h2>
              </div>
              <button className="close-modal" onClick={() => setShowItemModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <img src={selectedItem.img} alt={selectedItem.name} className="modal-img" />
              <div className="modal-info">
                <p className="modal-price">₹{selectedItem.price}</p>
                <p className="modal-rating">⭐ {selectedItem.rating}</p>
                <p className="modal-desc">{selectedItem.desc}</p>
              </div>
              <div className="addons-section">
                {customizationGroups.map((group) => (
                  <div key={group.id} className="customization-group">
                    <h3>{group.title}</h3>
                    <p className="addons-subtitle">{group.subtitle}</p>
                    {group.options.map((option) => (
                      <div key={option.id} className="addon-item">
                        <label className="addon-label">
                          <div className="addon-left">
                            {renderFoodTypeIndicator({ type: option.type })}
                            <span className="addon-name">{option.name}</span>
                          </div>
                          <div className="addon-right">
                            <span className="addon-price">+₹{option.price}</span>
                            <input type="checkbox" checked={!!selectedAddons[option.id]} onChange={() => toggleAddon(option.id, group.id)} />
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="qty-selector">
                <label>Quantity:</label>
                <div className="qty-controls">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))}>-</button>
                  <span>{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)}>+</button>
                </div>
              </div>
              <div className="price-breakdown">
                <div className="breakdown-row"><span>Item Price</span><span>₹{selectedItem.price}</span></div>
                {addonTotal > 0 && <div className="breakdown-row"><span>Addons</span><span>+₹{addonTotal}</span></div>}
                {itemQty > 1 && <div className="breakdown-row"><span>Quantity</span><span>x{itemQty}</span></div>}
                <div className="breakdown-row total"><span>Total</span><span>₹{itemTotal}</span></div>
              </div>
            </div>
            <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart • ₹{itemTotal}</button>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="bottom-cart-bar">
          <span>{cart.length} item added</span>
          <a href="/cart" className="view-cart-btn">VIEW CART</a>
        </div>
      )}
    </div>
  );
}

export default Peppa;