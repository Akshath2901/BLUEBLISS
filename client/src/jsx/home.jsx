import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentOffer, setCurrentOffer] = useState(0);

  // Hero background images
  const heroImages = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&q=80",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80"
  ];

  // Offers data
  const offers = [
    {
      id: 1,
      title: "50% OFF on Burgers",
      description: "Get flat 50% discount on all burger items",
      code: "BURGER50",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      route: "/menu/shrimmers"
    },
    {
      id: 2,
      title: "Buy 1 Get 1 Free Pizza",
      description: "Order any pizza and get one free",
      code: "PIZZA2X",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
      route: "/menu/peppanizze"
    },
    {
      id: 3,
      title: "30% OFF on All Wraps",
      description: "Enjoy healthy wraps with 30% discount",
      code: "WRAP30",
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
      route: "/menu/urbanwrap"
    },
    {
      id: 4,
      title: "Free Dessert on Orders Above ₹500",
      description: "Get a complimentary dessert with your order",
      code: "SWEET500",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
      route: "/menu/shrimmers"
    }
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

  // Auto-slide hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-slide offers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 4000);
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

  const handleOfferClick = (route) => {
    navigate(route);
  };

  const nextOffer = () => {
    setCurrentOffer((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    setCurrentOffer((prev) => (prev - 1 + offers.length) % offers.length);
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

      {/* Offers Slider Section - NEW! */}
      <section className="offers-section">
        <div className="offers-container">
          <h2 className="offers-title">🎉 Special Offers for You</h2>
          <p className="offers-subtitle">Limited time deals you don't want to miss</p>
          
          <div className="offers-slider">
            <button className="offer-nav-btn prev" onClick={prevOffer}>
              ‹
            </button>
            
            <div className="offer-track">
              {offers.map((offer, index) => (
                <div
                  key={offer.id}
                  className={`offer-card ${index === currentOffer ? "active" : ""}`}
                  onClick={() => handleOfferClick(offer.route)}
                  style={{
                    backgroundImage: `url(${offer.image})`,
                  }}
                >
                  <div className="offer-overlay" />
                  <div className="offer-content">
                    <span className="offer-badge">LIMITED OFFER</span>
                    <h3 className="offer-title">{offer.title}</h3>
                    <p className="offer-description">{offer.description}</p>
                    <div className="offer-code">
                      <span>Use Code:</span>
                      <strong>{offer.code}</strong>
                    </div>
                    <button className="claim-btn">Claim Now →</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="offer-nav-btn next" onClick={nextOffer}>
              ›
            </button>
          </div>

          {/* Offer Indicators */}
          <div className="offer-indicators">
            {offers.map((_, index) => (
              <button
                key={index}
                className={`offer-indicator ${index === currentOffer ? "active" : ""}`}
                onClick={() => setCurrentOffer(index)}
              />
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