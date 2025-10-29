import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero background images
  const heroImages = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&q=80",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80"
  ];

  // Food categories
  const foodCategories = [
    { id: 1, name: "Burgers", emoji: "🍔", query: "burger" },
    { id: 2, name: "Pizza", emoji: "🍕", query: "pizza" },
    { id: 3, name: "Biryani", emoji: "🍛", query: "biryani" },
    { id: 4, name: "Desserts", emoji: "🍰", query: "dessert" }
  ];

  // Brands
  const brands = [
    {
      id: 1,
      name: "Shrimmers",
      tagline: "Sparkle in Every Bite",
      description: "Experience the shimmer of flavors with our premium selection",
      icon: "✨",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      route: "/menu/shrimmers",
    },
    {
      id: 2,
      name: "Peppanizze",
      tagline: "Spice Up Your Life",
      description: "Bold flavors that ignite your taste buds",
      icon: "🌶️",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      route: "/menu/peppanizze",
    },
    {
      id: 3,
      name: "UrbanWrap",
      tagline: "Wrapped to Perfection",
      description: "Modern wraps crafted for the urban lifestyle",
      icon: "🌯",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      route: "/menu/urbanwrap",
    },
  ];

  // Auto-slide images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleCategoryClick = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleBrandClick = (route) => {
    navigate(route);
  };

  return (
    <div className="home-container">
      {/* Hero Section with Image Slider */}
      <section className="hero-slider">
        <div className="slider-images">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? "active" : ""}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h2>Welcome to <span>BlueBliss</span> 🌿</h2>
          <p>Your one-stop destination for fresh, delicious, and soulful food.</p>
          
          <div className="transparent-search">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          <button className="explore-btn" onClick={() => navigate("/explore")}>
            Explore Menu
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="slide-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Food Categories Section */}
      <section className="categories-section">
        <div className="categories-container">
          <h2 className="categories-title">What's on your mind?</h2>
          <div className="categories-grid">
            {foodCategories.map((category) => (
              <div
                key={category.id}
                className="category-circle"
                onClick={() => handleCategoryClick(category.query)}
              >
                <div className="category-icon">{category.emoji}</div>
                <p className="category-name">{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="brands-section">
        <div className="brands-container">
          <h2 className="brands-title">Discover Our Brands</h2>
          <p className="brands-subtitle">
            Choose from our collection of culinary experiences
          </p>

          <div className="brands-grid">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="brand-card"
                onClick={() => handleBrandClick(brand.route)}
                style={{ background: brand.color }}
              >
                <div className="brand-card-inner">
                  <div className="brand-icon">{brand.icon}</div>
                  <h3 className="brand-name">{brand.name}</h3>
                  <p className="brand-tagline">{brand.tagline}</p>
                  <p className="brand-description">{brand.description}</p>
                  <div className="brand-arrow">→</div>
                </div>
                <div className="brand-overlay"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Swiggy & Zomato Links Section */}
      <section className="delivery-links">
        <h2>Find Us On</h2>
        <p>Order your favorite meals from your preferred platforms</p>

        <div className="delivery-buttons">
          <a
            href="https://www.zomato.com/hyderabad/shrimmers-padmarao-nagar-secunderabad/order"
            target="_blank"
            rel="noopener noreferrer"
            className="zomato-btn"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png"
              alt="Zomato"
            />
            Order on Zomato
          </a>

          <a
            href="https://www.swiggy.com/city/hyderabad/shrimmers-chilakalguda-padmarao-nagar-rest713034"
            target="_blank"
            rel="noopener noreferrer"
            className="swiggy-btn"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg"
              alt="Swiggy"
            />
            Order on Swiggy
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;