// Update your Home.js with this code
// Location: src/jsx/home.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import "./home.css";

// import img1 from "../assets/IMG_2054.JPG";
// import img2 from "../assets/paneer tikka wrap.jpg";

// import Burgers from "/src/assets/brands/PERI PERI CRISPY CHICKEN BURGER.jpg";
// import MilkShake from "/src/assets/brands/Biskoff.jpg";

// ⭐ NEW IMPORTS FOR CATEGORY IMAGES
// import AfricanPeri from "/src/assets/brands/AFRICAN PERI PERI VEG.jpg";
// import PeriChickenWrap from "/src/assets/brands/peri peri chicken wrap.jpg";
// import PaneerFries from "/src/assets/paneer tikka wrap.jpg";
// import VegetrianaPizza from "/src/assets/VEGETRIANA PIZZA.jpg";

// Brand images
// import shrimmers from "/src/assets/brands/PERI PERI CRISPY CHICKEN BURGER.jpg";
// import peppanizzeLogo from "/src/assets/brands/AFRICAN PERI PERI VEG.jpg";
// import urbanWrapLogo from "/src/assets/brands/peri peri chicken wrap.jpg";

const img1 = "";
const img2 = "";
const Burgers = "";
const MilkShake = "";
const AfricanPeri = "";
const PeriChickenWrap = "";
const PaneerFries = "";
const VegetrianaPizza = "";
const shrimmers = "";
const peppanizzeLogo = "";
const urbanWrapLogo = "";

function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [offers, setOffers] = useState([]);

  // Hero Slider Images
  const heroImages = [
    "" + img1,
    "" + img2,
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&q=80",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80"
  ];

  // ⭐ DEFAULT OFFERS
  const defaultOffers = [
    {
      id: 1,
      title: "BUY 2 BURGERS FOR 99",
      description: "Valid till 25th dec",
      code: "BURGER99",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      bgColor: "#d4af37",
      bgColorAlt: "#ffd700",
      icon: "🍔"
    },
    {
      id: 2,
      title: "GET 50% OFF ON PIZZA",
      description: "Valid till 30th dec",
      code: "PIZZA50",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
      bgColor: "#d4af37",
      bgColorAlt: "#ffd700",
      icon: "🍕"
    },
    {
      id: 3,
      title: "FREE DELIVERY ABOVE 199",
      description: "Valid till 28th dec",
      code: "FREEDEL",
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
      bgColor: "#d4af37",
      bgColorAlt: "#ffd700",
      icon: "🚚"
    }
  ];

  // 🔥 FETCH OFFERS FROM FIREBASE
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersSnapshot = await getDocs(collection(db, "offers"));
        const offersData = [];
        
        offersSnapshot.forEach((doc) => {
          if (doc.data().isActive) {
            offersData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        
        setOffers(offersData.length > 0 ? offersData : defaultOffers);
      } catch (e) {
        console.log("Error fetching home offers:", e);
        setOffers(defaultOffers);
      }
    };

    fetchOffers();
  }, []);

  // ⭐ UPDATED FOOD CATEGORIES WITH REAL IMAGES
  const foodCategories = [
    { id: 1, name: "Burgers", image: Burgers, query: "burger" },
    { id: 2, name: "Pizza", image: VegetrianaPizza, query: "pizza" },
    { id: 3, name: "Fries", image: PaneerFries, query: "fries" },
    { id: 4, name: "MilkShakes", image: MilkShake, query: "milkshake" },
    { id: 5, name: "Wraps", image: PeriChickenWrap, query: "wrap" },
    { id: 6, name: "Peri Peri", image: AfricanPeri, query: "peri peri" }
  ];

  const brands = [
    {
      id: 1,
      name: "Shrimmers",
      tagline: "Sparkle in Every Bite",
      description: "Experience the shimmer of flavors with our premium selection",
      icon: "✨",
      image: shrimmers,
      route: "/menu/shrimmers",
    },
    {
      id: 2,
      name: "Peppanizze",
      tagline: "Spice Up Your Life",
      description: "Bold flavors that ignite your taste buds",
      icon: "🌶️",
      image: peppanizzeLogo,
      route: "/menu/peppanizze",
    },
    {
      id: 3,
      name: "UrbanWrap",
      tagline: "Wrapped to Perfection",
      description: "Modern wraps crafted for the urban lifestyle",
      icon: "🌯",
      image: urbanWrapLogo,
      route: "/menu/urbanwrap",
    },
  ];

  // Auto Slide Hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Auto Slide Offers
  useEffect(() => {
    if (offers.length === 0) return;
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [offers.length]);

  // ⭐ AI TOAST NOTIFICATION - Show on homepage
  useEffect(() => {
    const timer = setTimeout(() => {
      window.showAiToast("🔥 Trending Now: CHEEZY 7 PIZZA is selling like hotcakes! ₹229", 8000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle Search
  const handleSearch = (query) => navigate(`/search?q=${encodeURIComponent(query)}`);

  // Category Click
  const handleCategoryClick = (query) => navigate(`/search?q=${encodeURIComponent(query)}`);

  // Brand Click
  const handleBrandClick = (route) => navigate(route);

  // Offer Slider Controls
  const nextOffer = () => {
    setCurrentOffer((prev) => (prev + 1) % offers.length);
  };
  
  const prevOffer = () => {
    setCurrentOffer((prev) => (prev - 1 + offers.length) % offers.length);
  };

  return (
    <div className="home-container">

      {/* HERO SECTION */}
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
          <button className="explore-btn" onClick={() => navigate("/explore")}>Explore Menu</button>
        </div>

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

      {/* Categories Slider */}
      <section className="categories-section">
        <div className="categories-container">
          <h2 className="categories-title">What's on your mind?</h2>

          <div className="categories-slider-wrapper">
            <button
              className="cat-nav-btn"
              onClick={() =>
                document
                  .querySelector(".categories-slider")
                  .scrollBy({ left: -300, behavior: "smooth" })
              }
            >
              ‹
            </button>

            <div className="categories-slider">
              {foodCategories.map((category) => (
                <div
                  key={category.id}
                  className="category-circle"
                  onClick={() => handleCategoryClick(category.query)}
                >
                  <div 
                    className="category-icon"
                    style={{
                      backgroundImage: `url(${category.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <p className="category-name">{category.name}</p>
                </div>
              ))}
            </div>

            <button
              className="cat-nav-btn"
              onClick={() =>
                document
                  .querySelector(".categories-slider")
                  .scrollBy({ left: 300, behavior: "smooth" })
              }
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ⭐ SPECIAL OFFERS SECTION - MOBILE OPTIMIZED */}
      <section className="offers-section">
        <div className="offers-container">
          <h2 className="offers-title">🎉 Special Offers for You</h2>
          <p className="offers-subtitle">Limited time deals you don't want to miss</p>

          {offers.length > 0 ? (
            <>
              <div className="offers-slider">
                <button className="offer-nav-btn offer-nav-prev" onClick={prevOffer} aria-label="Previous offer">
                  ‹
                </button>

                <div className="offer-track">
                  {offers.map((offer, index) => (
                    <div
                      key={offer.id}
                      className={`offer-card ${index === currentOffer ? "active" : ""}`}
                    >
                      <div 
                        className="offer-overlay"
                        style={{
                          background: `linear-gradient(135deg, ${offer.bgColor || "#d4af37"} 0%, ${offer.bgColorAlt || "#ffd700"} 100%)`
                        }}
                      >
                        <div className="offer-content">
                          <span className="offer-badge">LIMITED OFFER</span>
                          <h3 className="offer-title">
                            {offer.icon && <span>{offer.icon}</span>} {offer.title}
                          </h3>
                          <p className="offer-description">{offer.description}</p>
                          <div className="offer-code">
                            <span>Use Code:</span>
                            <strong>{offer.code}</strong>
                          </div>
                          <button className="claim-btn">Claim Now →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="offer-nav-btn offer-nav-next" onClick={nextOffer} aria-label="Next offer">
                  ›
                </button>
              </div>

              <div className="offer-indicators">
                {offers.map((_, index) => (
                  <button
                    key={index}
                    className={`offer-indicator ${index === currentOffer ? "active" : ""}`}
                    onClick={() => setCurrentOffer(index)}
                    aria-label={`Go to offer ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              <p>Loading offers...</p>
            </div>
          )}
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="reviews-section">
        <h2 className="reviews-title">⭐ What Customers Say</h2>

        <div className="reviews-slider">
          <div className="reviews-track">
            {[
              {
                name: "Akash R",
                review: "Best burgers in Hyderabad. Super juicy and fresh!",
                rating: "⭐⭐⭐⭐⭐"
              },
              {
                name: "Sneha K",
                review: "Loved the wraps. Packaging & taste both top notch.",
                rating: "⭐⭐⭐⭐⭐"
              },
              {
                name: "Rahul M",
                review: "Fast delivery and premium quality food!",
                rating: "⭐⭐⭐⭐"
              },
              {
                name: "Priya S",
                review: "Black & gold vibe + amazing food. 10/10.",
                rating: "⭐⭐⭐⭐⭐"
              },
              {
                name: "Akash R",
                review: "Best burgers in Hyderabad. Super juicy and fresh!",
                rating: "⭐⭐⭐⭐⭐"
              },
              {
                name: "Sneha K",
                review: "Loved the wraps. Packaging & taste both top notch.",
                rating: "⭐⭐⭐⭐⭐"
              },
              {
                name: "Rahul M",
                review: "Fast delivery and premium quality food!",
                rating: "⭐⭐⭐⭐"
              },
              {
                name: "Priya S",
                review: "Black & gold vibe + amazing food. 10/10.",
                rating: "⭐⭐⭐⭐⭐"
              }
            ].map((item, index) => (
              <div key={index} className="review-card">
                <p className="review-text">"{item.review}"</p>
                <div className="review-footer">
                  <span className="review-name">{item.name}</span>
                  <span className="review-rating">{item.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND SECTION */}
      <section className="brands-section">
        <div className="brands-container">
          <h2 className="brands-title">Discover Our Brands</h2>
          <p className="brands-subtitle">Choose from our collection of culinary experiences</p>

          <div className="brands-grid">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="brand-card"
                onClick={() => handleBrandClick(brand.route)}
                style={{
                  backgroundImage: `url(${brand.image})`,
                }}
              >
                <div className="brand-overlay" />
                <div className="brand-card-inner">
                  <div className="brand-icon">{brand.icon}</div>
                  <h3 className="brand-name">{brand.name}</h3>
                  <p className="brand-tagline">{brand.tagline}</p>
                  <div className="brand-arrow">→</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;