import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SearchBar from "./SearchBar";
import "./BrandMenu.css";

function BrandMenu() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);

  // Brand configurations
  const brandConfig = {
    shrimmers: {
      name: "Shrimmers",
      tagline: "Sparkle in Every Bite",
      icon: "✨",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      items: [
        { id: 1, name: "Glitter Burger", price: 299, image: "🍔", category: "Burgers" },
        { id: 2, name: "Sparkle Fries", price: 149, image: "🍟", category: "Sides" },
        { id: 3, name: "Diamond Shake", price: 199, image: "🥤", category: "Beverages" },
        { id: 4, name: "Crystal Pizza", price: 399, image: "🍕", category: "Pizza" },
      ]
    },
    peppanizze: {
      name: "Peppanizze",
      tagline: "Spice Up Your Life",
      icon: "🌶️",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      items: [
        { id: 1, name: "Fire Wings", price: 349, image: "🍗", category: "Appetizers" },
        { id: 2, name: "Spicy Tacos", price: 279, image: "🌮", category: "Mexican" },
        { id: 3, name: "Hot Noodles", price: 249, image: "🍜", category: "Asian" },
        { id: 4, name: "Pepper Pasta", price: 299, image: "🍝", category: "Italian" },
      ]
    },
    urbanwrap: {
      name: "UrbanWrap",
      tagline: "Wrapped to Perfection",
      icon: "🌯",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      items: [
        { id: 1, name: "Classic Wrap", price: 199, image: "🌯", category: "Wraps" },
        { id: 2, name: "Falafel Wrap", price: 229, image: "🥙", category: "Wraps" },
        { id: 3, name: "Chicken Caesar", price: 269, image: "🌯", category: "Wraps" },
        { id: 4, name: "Veggie Delight", price: 189, image: "🥗", category: "Healthy" },
      ]
    }
  };

  const currentBrand = brandConfig[brandName] || brandConfig.shrimmers;

  useEffect(() => {
    setMenuItems(currentBrand.items);
  }, [brandName]);

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="brand-menu-container">
      <header className="menu-header">
        <div className="header-content">
          <h1 className="brand-logo" onClick={handleBackHome}>
            BlueBliss Foods & Technologies
          </h1>
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      <section className="brand-hero" style={{ background: currentBrand.color }}>
        <div className="brand-hero-content">
          <div className="brand-hero-icon">{currentBrand.icon}</div>
          <h1 className="brand-hero-title">{currentBrand.name}</h1>
          <p className="brand-hero-tagline">{currentBrand.tagline}</p>
        </div>
      </section>

      <main className="menu-main">
        <div className="menu-container">
          <h2 className="menu-title">Our Menu</h2>
          
          <div className="menu-grid">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-card">
                <div className="menu-card-image">{item.image}</div>
                <div className="menu-card-content">
                  <span className="menu-card-category">{item.category}</span>
                  <h3 className="menu-card-title">{item.name}</h3>
                  <div className="menu-card-footer">
                    <span className="menu-card-price">₹{item.price}</span>
                    <button className="menu-add-btn">Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 BlueBliss | Crafted with ❤️</p>
      </footer>
    </div>
  );
}

export default BrandMenu;