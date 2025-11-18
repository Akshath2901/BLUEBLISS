import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import "./SwiggyStyleMenu.css";

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } =
    useContext(CartContext);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Umenu"));
        const categories = [];
        snapshot.forEach((doc) => categories.push(doc.data()));
        setMenuData(categories);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="menu-wrapper">

      {/* -------------- RESTAURANT HEADER -------------- */}
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

      {/* -------------- DEALS SECTION -------------- */}
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

      {/* -------------- MENU LABEL -------------- */}
      <div className="menu-title-divider">MENU</div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : (
        <>
          {/* -------------- CATEGORY SECTION -------------- */}
          {menuData.map((section, idx) => (
            <div key={idx} className="menu-section">

              <h2 className="category-title">{section.category}</h2>

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
                      </div>

                      <div className="item-img-wrapper">
                        <img src={item.img} className="item-img" />

                        {/* --- ADD BUTTON or QTY BOX --- */}
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
                            <button
                              className="qty-btn"
                              onClick={() => decreaseQty(itemId)}
                            >
                              -
                            </button>

                            <span className="qty-count">{qty}</span>

                            <button
                              className="qty-btn"
                              onClick={() => increaseQty(itemId)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* -------------- STICKY BOTTOM BAR -------------- */}
      {cart.length > 0 && (
        <div className="bottom-cart-bar">
          <span>{cart.length} item added</span>
          <a href="/cart" className="view-cart-btn">VIEW CART</a>
        </div>
      )}
    </div>
  );
}

export default SwiggyStyleMenu;
