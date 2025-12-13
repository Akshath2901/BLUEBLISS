import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import "./SwiggyStyleMenu.css";

const storage = getStorage();

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } =
    useContext(CartContext);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Pmenu"));
        const categories = [];

        for (const docSnap of snapshot.docs) {
          const section = docSnap.data();

          // 🔥 Resolve image URLs for each item
          const itemsWithImages = await Promise.all(
  section.items.map(async (item) => {
    if (!item.img) {
      console.log("❌ No imagePath:", item.name);
      return item;
    }

    try {
      console.log("🟡 Fetching image:", item.img);

      const imageRef = ref(storage, item.img);
      const imageURL = await getDownloadURL(imageRef);

      console.log("🟢 Image URL:", imageURL);

      return {
        ...item,
        img: imageURL,
      };
    } catch (err) {
      console.error("🔴 Image load failed:", item.img, err);
      return item;
    }
  })
);


          categories.push({
            ...section,
            items: itemsWithImages,
          });
        }

        setMenuData(categories);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return (
    <div className="menu-wrapper">

      {/* HEADER */}
      <div className="restaurant-header">
        <h1 className="rest-name">Urban Wrap</h1>
      </div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : (
        menuData.map((section, idx) => (
          <div key={idx} className="menu-section">
            <h2 className="category-title">{section.category}</h2>

            <div className="item-list">
              {section.items.map((item, index) => {
                const itemId = item.id || `${section.category}-${index}`;
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
          </div>
        ))
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

export default SwiggyStyleMenu;
