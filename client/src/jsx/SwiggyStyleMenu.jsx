import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // adjust path if needed
import "./SwiggyStyleMenu.css";

function SwiggyStyleMenu() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Brand configurations
  const brandConfig = {
    shrimmers: {
      name: "Shrimmers",
      tagline: "Sparkle in Every Bite",
      icon: "✨",
      rating: "4.3",
      reviews: "318K+",
      priceForTwo: "₹350",
      deliveryTime: "65-75 mins",
      cuisines: ["Biryani", "Chinese", "North Indian"]
    },
    peppanizze: {
      name: "Peppanizze",
      tagline: "Spice Up Your Life",
      icon: "🌶️",
      rating: "4.5",
      reviews: "250K+",
      priceForTwo: "₹400",
      deliveryTime: "45-55 mins",
      cuisines: ["Mexican", "Italian", "Continental"]
    },
    urbanwrap: {
      name: "UrbanWrap",
      tagline: "Wrapped to Perfection",
      icon: "🌯",
      rating: "4.4",
      reviews: "180K+",
      priceForTwo: "₹300",
      deliveryTime: "30-40 mins",
      cuisines: ["Wraps", "Healthy", "Salads"]
    }
  };

  const currentBrand = brandConfig[brandName] || brandConfig.shrimmers;

  // 🔥 Fetch menu data from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "menus", brandName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // if your document directly stores the array:
          if (Array.isArray(data)) {
            setMenuData(data);
          } else if (Array.isArray(data.menu)) {
            setMenuData(data.menu);
          } else {
            console.warn("Unexpected Firestore data structure:", data);
            setMenuData([]);
          }
        } else {
          console.log("No such document!");
          setMenuData([]);
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
        setMenuData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [brandName]);

  const handleBackHome = () => navigate("/");

  const handleAddToCart = (item) => {
    console.log("Added to cart:", item);
    // TODO: Add your cart logic here
  };

  const filteredMenu = menuData
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="swiggy-menu-container">
      <header className="swiggy-header">
        <div className="header-top">
          <button className="back-btn" onClick={handleBackHome}>
            ← Back
          </button>
          <h1 className="restaurant-name">{currentBrand.name}</h1>
        </div>
      </header>

      <section className="restaurant-info">
        <div className="info-container">
          <div className="info-left">
            <div className="rating-badge">
              ⭐ {currentBrand.rating} ({currentBrand.reviews} ratings)
            </div>
            <p className="price-info">{currentBrand.priceForTwo} for two</p>
            <p className="cuisines">{currentBrand.cuisines.join(", ")}</p>
          </div>
          <div className="info-right">
            <p className="outlet">📍 Outlet: Tolichowki</p>
            <p className="delivery-time">🕐 {currentBrand.deliveryTime}</p>
          </div>
        </div>
      </section>

      <div className="deals-section">
        <h3>Deals for you</h3>
        <div className="deal-card">
          <span className="deal-icon">🎉</span>
          <div>
            <strong>Flat ₹50 Off</strong>
            <p>NO CODE REQUIRED</p>
          </div>
        </div>
      </div>

      <div className="menu-divider">
        <span>MENU</span>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search for dishes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dish-search"
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}>
          <span className="veg-icon">🟢</span> Veg
        </button>
        <button className="filter-tab">
          <span className="nonveg-icon">🔴</span> Non-Veg
        </button>
        <button className="filter-tab bestseller">Bestseller</button>
      </div>

      <main className="menu-content">
        {loading ? (
          <div className="loading">Loading menu...</div>
        ) : filteredMenu.length === 0 ? (
          <div className="loading">No items found 😔</div>
        ) : (
          filteredMenu.map((section, idx) => (
            <section key={idx} className="menu-section">
              <h2 className="section-title">{section.category}</h2>
              <div className="items-grid">
                {section.items.map((item) => (
                  <div key={item.id} className="menu-item">
                    <div className="item-left">
                      <span className={`veg-indicator ${item.isVeg ? "veg" : "nonveg"}`}>
                        {item.isVeg ? "🟢" : "🔴"}
                      </span>
                      {item.isBestseller && (
                        <span className="bestseller-badge">⭐ Bestseller</span>
                      )}
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-price">₹{item.price}</p>
                      <p className="item-rating">
                        ⭐ {item.rating} ({item.reviews})
                      </p>
                      <p className="item-description">{item.description}</p>
                    </div>
                    <div className="item-right">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="item-image"
                      />
                      <button
                        className="add-btn"
                        onClick={() => handleAddToCart(item)}
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <button className="floating-menu-btn">MENU</button>

      <footer className="footer">
        <p>© 2025 BlueBliss | Crafted with ❤️</p>
      </footer>
    </div>
  );
}

export default SwiggyStyleMenu;
