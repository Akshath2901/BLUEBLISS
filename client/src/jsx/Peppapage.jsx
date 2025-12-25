import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import "./SwiggyStyleMenu.css";

const storage = getStorage();

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: dropdown state
  const [openCategories, setOpenCategories] = useState({});

  // 🔥 NEW: bottom menu state
  const [showCategoryNav, setShowCategoryNav] = useState(false);

  // 🔥 NEW: refs for scroll
  const categoryRefs = useRef({});

  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } =
    useContext(CartContext);

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

                return {
                  ...item,
                  img: imageURL,
                };
              } catch (err) {
                console.error("Image load failed:", item.img);
                return item;
              }
            })
          );

          categories.push({
            ...section,
            items: itemsWithImages,
          });
        }

        // 🔥 open all categories by default
        const initialOpen = {};
        categories.forEach((cat) => {
          initialOpen[cat.category] = true;
        });

        setOpenCategories(initialOpen);
        setMenuData(categories);
      } catch (e) {
        console.error(e);
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
        <h1 className="rest-name">Peppanizze</h1>
      </div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : (
        menuData.map((section, idx) => {
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
                          <h3>{item.name}</h3>
                          <p>₹{item.price}</p>
                          <p>⭐ {item.rating}</p>
                          <p>{item.desc}</p>
                        </div>

                        <div className="item-img-wrapper">
                          <img
                            src={item.img || "/placeholder.png"}
                            alt={item.name}
                            className="item-img"
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
        })
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
