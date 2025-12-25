import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import { resolveMenuImages } from "./resolveMenuImages";
import "./SwiggyStyleMenu.css";

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: dropdown state
  const [openCategories, setOpenCategories] = useState({});

  // 🔥 NEW: bottom menu state
  const [showCategoryNav, setShowCategoryNav] = useState(false);

  // 🔥 NEW: refs for scrolling
  const categoryRefs = useRef({});

  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } =
    useContext(CartContext);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Umenu"));
        const categories = [];
        snapshot.forEach((doc) => categories.push(doc.data()));

        // image resolving (unchanged)
        const categoriesWithImages = await resolveMenuImages(categories);

        // 🔥 open all categories by default
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

  // toggle from category header
  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // select from bottom navigator
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

  return (
    <div className="menu-wrapper">

      {/* HEADER */}
      <div className="restaurant-header">
        <h1 className="rest-name">Urban Wrap</h1>

        <div className="rest-info">
          <div className="rest-left">
            <p className="rest-rating">⭐ 4.5 (3.8k+ ratings)</p>
            <p className="rest-price">₹300 for two</p>
            <p className="rest-category">Wraps • Fries • Drinks</p>
          </div>

          <div className="rest-right">
            <p className="rest-outlet">Outlet: Tolichowki</p>
            <p className="rest-time">30–35 mins</p>
          </div>
        </div>
      </div>

      <div className="deals-section">
        <div className="deal-card">
          <span className="deal-icon">🔥</span>
          <div>
            <h4>Items at ₹49</h4>
            <p>On selected items</p>
          </div>
        </div>

        <div className="deal-card">
          <span className="deal-icon">🏷️</span>
          <div>
            <h4>Flat ₹150 Off</h4>
            <p>Use CELEBRATION</p>
          </div>
        </div>
      </div>

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
                ref={(el) =>
                  (categoryRefs.current[section.category] = el)
                }
              >
                {/* CATEGORY DROPDOWN HEADER */}
                <div
                  className="category-title"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleCategory(section.category)}
                >
                  {section.category}
                  <span style={{ float: "right" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>

                {/* CATEGORY ITEMS */}
                {isOpen && (
                  <div className="item-list">
                    {section.items.map((item, index) => {
                      const itemId =
                        item.id || `${section.category}-${index}`;
                      const qty = getItemQty(itemId);

                      return (
                        <div key={index} className="menu-item-card">
                          <div className="item-info">
                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-price">₹{item.price}</p>
                            <p className="item-rating">⭐ {item.rating}</p>
                            <p className="item-desc">{item.desc}</p>
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
                                onClick={() =>
                                  addToCart({
                                    id: itemId,
                                    name: item.name,
                                    price: item.price,
                                    img: item.img,
                                  })
                                }
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

      {/* 🔥 FLOATING MENU BUTTON */}
      <button
        className="floating-menu-btn"
        onClick={() => setShowCategoryNav(true)}
      >
        MENU
      </button>

      {/* 🔥 BOTTOM CATEGORY NAV */}
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
              <span>Menu</span>
              <button onClick={() => setShowCategoryNav(false)}>✕</button>
            </div>

            {menuData.map((section, idx) => (
              <div
                key={idx}
                className="category-nav-item"
                onClick={() =>
                  handleCategorySelect(section.category)
                }
              >
                <span>{section.category}</span>
                <span className="category-count">
                  {section.items.length}
                </span>
              </div>
            ))}
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
