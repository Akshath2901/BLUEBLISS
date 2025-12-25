import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import { resolveMenuImages } from "./resolveMenuImages";
import "./SwiggyStyleMenu.css";

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

  // existing dropdown state
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
        const snapshot = await getDocs(collection(db, "menu"));
        const categories = [];
        snapshot.forEach((doc) => categories.push(doc.data()));

        const categoriesWithImages = await resolveMenuImages(categories);

        // keep your existing behavior: open all by default
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

  // existing toggle
  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // 🔥 NEW: select from bottom menu
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
        <h1 className="rest-name">Shrimmers</h1>
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
                {/* CATEGORY HEADER (unchanged, just clickable) */}
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
              <span>99 Store</span>
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

      {/* CART BAR (unchanged) */}
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
