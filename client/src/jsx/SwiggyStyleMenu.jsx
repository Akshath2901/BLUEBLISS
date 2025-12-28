import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import { resolveMenuImages } from "./resolveMenuImages";
import "./SwiggyStyleMenu.css";

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]); // 🔥 Fetch from your existing 'offers' collection
  const [openCategories, setOpenCategories] = useState({});
  const [showCategoryNav, setShowCategoryNav] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [itemQty, setItemQty] = useState(1);

  const categoryRefs = useRef({});
  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } =
    useContext(CartContext);

  // 🔥 FETCH MENU DATA
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, "menu"));
        const categories = [];
        snapshot.forEach((doc) => categories.push(doc.data()));

        const categoriesWithImages = await resolveMenuImages(categories);

        const initialOpen = {};
        categoriesWithImages.forEach((cat) => {
          initialOpen[cat.category] = true;
        });

        setOpenCategories(initialOpen);
        setMenuData(categoriesWithImages);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // 🔥 FETCH OFFERS FROM YOUR EXISTING 'offers' COLLECTION
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersSnapshot = await getDocs(collection(db, "offers"));
        const offersData = [];
        offersSnapshot.forEach((doc) => {
          // Only include active offers
          if (doc.data().isActive) {
            offersData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        setOffers(offersData);
      } catch (e) {
        console.log("Offers fetch error:", e);
      }
    };

    fetchOffers();
  }, []);

  // 🔥 ADDON DATA - Customize as needed
  const addonOptions = [
    { id: 1, name: "Cheese", price: 30 },
    { id: 2, name: "Bacon", price: 40 },
    { id: 3, name: "Extra Sauce", price: 15 },
    { id: 4, name: "Lettuce & Tomato", price: 20 },
    { id: 5, name: "Grilled Onions", price: 10 },
  ];

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCategorySelect = (category) => {
    const updated = {};
    Object.keys(openCategories).forEach((key) => {
      updated[key] = false;
    });
    updated[category] = true;

    setOpenCategories(updated);
    setShowCategoryNav(false);

    setTimeout(() => {
      categoryRefs.current[category]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  const handleItemClick = (item, category) => {
    setSelectedItem({ ...item, category });
    setShowItemModal(true);
    setItemQty(1);
    setSelectedAddons({});
  };

  const handleAddToCart = () => {
    const itemId = selectedItem.id || `${selectedItem.category}-${selectedItem.name}`;
    const addonsList = Object.keys(selectedAddons).map((id) => {
      const addon = addonOptions.find((a) => a.id === parseInt(id));
      return addon;
    });

    const addonPrice = addonsList.reduce((sum, addon) => sum + addon.price, 0);

    addToCart({
      id: itemId,
      name: selectedItem.name,
      price: selectedItem.price + addonPrice,
      img: selectedItem.img,
      qty: itemQty,
      addons: addonsList,
      basePrice: selectedItem.price,
    });

    setShowItemModal(false);
    alert("Added to cart!");
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) => {
      const updated = { ...prev };
      if (updated[addonId]) {
        delete updated[addonId];
      } else {
        updated[addonId] = true;
      }
      return updated;
    });
  };

  const addonTotal = Object.keys(selectedAddons).reduce((sum, id) => {
    const addon = addonOptions.find((a) => a.id === parseInt(id));
    return sum + (addon ? addon.price : 0);
  }, 0);

  const itemTotal = selectedItem
    ? (selectedItem.price + addonTotal) * itemQty
    : 0;

  return (
    <div className="menu-wrapper">
      {/* HEADER */}
      <div className="restaurant-header">
        <div className="header-top">
          <div className="header-info">
            <h1 className="rest-name">Shrimmers</h1>
            <p className="rest-rating">⭐ 4.3 • 200 for two</p>
            <p className="rest-category">Burgers, Fast Food</p>
            <p className="rest-location">📍 Padmarao Nagar • 55-65 mins</p>
          </div>
        </div>
      </div>

      {/* 🔥 LIVE DEALS SECTION - FROM YOUR 'offers' COLLECTION */}
      {offers.length > 0 && (
        <div className="live-deals-section">
          <h3 className="deals-title">🎉 Deals for you</h3>
          <div className="deals-carousel">
            {offers.slice(0, 3).map((offer, idx) => (
              <div key={offer.id} className="deal-card">
                <div className="deal-icon">{offer.icon || "🎁"}</div>
                <div className="deal-content">
                  <p className="deal-text">{offer.title}</p>
                  <p className="deal-code">USE {offer.code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="menu-title-divider">MENU</div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : (
        <>
          {menuData.map((section, idx) => {
            const isOpen = openCategories[section.category];

            return (
              <div
                key={idx}
                className="menu-section"
                ref={(el) => (categoryRefs.current[section.category] = el)}
              >
                <div
                  className="category-title"
                  onClick={() => toggleCategory(section.category)}
                >
                  {section.category}
                  <span style={{ float: "right" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>

                {isOpen && (
                  <div className="item-list">
                    {section.items.map((item, index) => {
                      const itemId = item.id || `${section.category}-${index}`;
                      const qty = getItemQty(itemId);

                      return (
                        <div key={index} className="menu-item-card">
                          <div className="item-info">
                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-price">₹{item.price}</p>
                            <p className="item-rating">⭐ {item.rating}</p>
                            <p className="item-desc">{item.desc}</p>
                            
                            <button
                              className="more-details-btn"
                              onClick={() => handleItemClick(item, section.category)}
                            >
                              More Details →
                            </button>
                          </div>

                          <div className="item-img-wrapper">
                            <img
                              src={item.img}
                              className="item-img"
                              alt={item.name}
                            />

                            {qty === 0 ? (
                              <button
                                className="add-btn"
                                onClick={() => handleItemClick(item, section.category)}
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="qty-box">
                                <button onClick={() => decreaseQty(itemId)}>
                                  -
                                </button>
                                <span>{qty}</span>
                                <button onClick={() => increaseQty(itemId)}>
                                  +
                                </button>
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
          })}
        </>
      )}

      {/* FLOATING MENU BUTTON */}
      <button
        className="floating-menu-btn"
        onClick={() => setShowCategoryNav(true)}
      >
        MENU
      </button>

      {/* BOTTOM CATEGORY NAV */}
      {showCategoryNav && (
        <div
          className="category-nav-overlay"
          onClick={() => setShowCategoryNav(false)}
        >
          <div
            className="category-nav-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="category-nav-header">
              <span>Shrimmers</span>
              <button onClick={() => setShowCategoryNav(false)}>✕</button>
            </div>

            {menuData.map((section, idx) => (
              <div
                key={idx}
                className="category-nav-item"
                onClick={() => handleCategorySelect(section.category)}
              >
                <span>{section.category}</span>
                <span className="category-count">{section.items.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ITEM DETAILS MODAL */}
      {showItemModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setShowItemModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedItem.name}</h2>
              <button
                className="close-modal"
                onClick={() => setShowItemModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <img src={selectedItem.img} alt={selectedItem.name} className="modal-img" />
              
              <div className="modal-info">
                <p className="modal-price">₹{selectedItem.price}</p>
                <p className="modal-rating">⭐ {selectedItem.rating}</p>
                <p className="modal-desc">{selectedItem.desc}</p>
              </div>

              {/* ADDONS SECTION */}
              <div className="addons-section">
                <h3>Add Ons (Optional)</h3>
                <p className="addons-subtitle">Add your choice of extras</p>
                
                {addonOptions.map((addon) => (
                  <div key={addon.id} className="addon-item">
                    <label className="addon-label">
                      <input
                        type="checkbox"
                        checked={!!selectedAddons[addon.id]}
                        onChange={() => toggleAddon(addon.id)}
                      />
                      <span className="addon-name">{addon.name}</span>
                      <span className="addon-price">+₹{addon.price}</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* QUANTITY SELECTOR */}
              <div className="qty-selector">
                <label>Quantity:</label>
                <div className="qty-controls">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))}>-</button>
                  <span>{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)}>+</button>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="price-breakdown">
                <div className="breakdown-row">
                  <span>Item Price</span>
                  <span>₹{selectedItem.price}</span>
                </div>
                {addonTotal > 0 && (
                  <div className="breakdown-row">
                    <span>Addons</span>
                    <span>+₹{addonTotal}</span>
                  </div>
                )}
                {itemQty > 1 && (
                  <div className="breakdown-row">
                    <span>Quantity</span>
                    <span>x{itemQty}</span>
                  </div>
                )}
                <div className="breakdown-row total">
                  <span>Total</span>
                  <span>₹{itemTotal}</span>
                </div>
              </div>
            </div>

            {/* ADD TO CART BUTTON */}
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              Add to Cart • ₹{itemTotal}
            </button>
          </div>
        </div>
      )}

      {/* CART BAR */}
      {cart.length > 0 && (
        <div className="bottom-cart-bar">
          <span>{cart.length} item added</span>
          <a href="/cart" className="view-cart-btn">
            VIEW CART
          </a>
        </div>
      )}
    </div>
  );
}

export default SwiggyStyleMenu;