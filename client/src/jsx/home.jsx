// Update your Home.js with this code
// Location: src/components/Home.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import "./home.css";

import img1 from "../assets/IMG_2054.JPG";
import img2 from "../assets/paneer tikka wrap.jpg";

import Burgers from "/src/assets/brands/PERI PERI CRISPY CHICKEN BURGER.jpg";
import MilkShake from "/src/assets/brands/Biskoff.jpg";

// ⭐ NEW IMPORTS FOR CATEGORY IMAGES
import AfricanPeri from "/src/assets/brands/AFRICAN PERI PERI VEG.jpg";
import PeriChickenWrap from "/src/assets/brands/peri peri chicken wrap.jpg";
import PaneerFries from "/src/assets/paneer tikka wrap.jpg";
import VegetrianaPizza from "/src/assets/VEGETRIANA PIZZA.jpg";

// Brand images
import shrimmers from "/src/assets/brands/PERI PERI CRISPY CHICKEN BURGER.jpg";
import peppanizzeLogo from "/src/assets/brands/AFRICAN PERI PERI VEG.jpg";
import urbanWrapLogo from "/src/assets/brands/peri peri chicken wrap.jpg";

function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [offers, setOffers] = useState([]); // 🔥 FETCH FROM FIREBASE

  // Hero Slider Images
  const heroImages = [
    "" + img1,
    "" + img2,
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&q=80",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80"
  ];

  // ⭐ DEFAULT OFFERS (Fallback)
  const defaultOffers = [
    {
      id: 1,
      title: "50% OFF on Burgers",
      description: "Get flat 50% discount on all burger items",
      code: "BURGER50",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      bgColor: "#FF6B6B",
      bgColorAlt: "#FF8E8E",
      icon: "🍔"
    },
    {
      id: 2,
      title: "Buy 1 Get 1 Free Pizza",
      description: "Order any pizza and get one free",
      code: "PIZZA2X",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
      bgColor: "#FF9500",
      bgColorAlt: "#FFB84D",
      icon: "🍕"
    },
    {
      id: 3,
      title: "30% OFF on All Wraps",
      description: "Enjoy healthy wraps with 30% discount",
      code: "WRAP30",
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
      bgColor: "#4CAF50",
      bgColorAlt: "#66BB6A",
      icon: "🌯"
    },
    {
      id: 4,
      title: "Free Dessert on Orders Above ₹500",
      description: "Get a complimentary dessert with your order",
      code: "SWEET500",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
      bgColor: "#E91E63",
      bgColorAlt: "#F06292",
      icon: "🍰"
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
        console.log("✅ Home page offers loaded:", offersData);
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
  }, []);

  // Auto Slide Offers
  useEffect(() => {
    if (offers.length === 0) return;
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [offers.length]);

  // Handle Search
  const handleSearch = (query) => navigate(`/search?q=${encodeURIComponent(query)}`);

  // Category Click
  const handleCategoryClick = (query) => navigate(`/search?q=${encodeURIComponent(query)}`);

  // Brand Click
  const handleBrandClick = (route) => navigate(route);

  // Offer Click
  const handleOfferClick = (route) => navigate(route);

  // Offer Slider Controls
  const nextOffer = () => setCurrentOffer((prev) => (prev + 1) % offers.length);
  const prevOffer = () => setCurrentOffer((prev) => (prev - 1 + offers.length) % offers.length);

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
              className="cat-nav-btn left"
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
              className="cat-nav-btn right"
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

      {/* ⭐ SPECIAL OFFERS FROM FIREBASE */}
      <section className="offers-section">
        <div className="offers-container">
          <h2 className="offers-title">🎉 Special Offers for You</h2>
          <p className="offers-subtitle">Limited time deals you don't want to miss</p>

          {offers.length > 0 ? (
            <>
              <div className="offers-slider">
                <button className="offer-nav-btn prev" onClick={prevOffer}>‹</button>

                <div className="offer-track">
                  {offers.map((offer, index) => (
                    <div
                      key={offer.id}
                      className={`offer-card ${index === currentOffer ? "active" : ""}`}
                      onClick={() => handleOfferClick(offer.route || "/menu/shrimmers")}
                      style={{
                        backgroundImage: `url(${offer.image})`,
                        background: `linear-gradient(135deg, ${offer.bgColor || "#FF6B6B"} 0%, ${offer.bgColorAlt || "#FF8E8E"} 100%)`
                      }}
                    >
                      <div className="offer-overlay" />
                      <div className="offer-content">
                        <span className="offer-badge">LIMITED OFFER</span>
                        <h3 className="offer-title">
                          {offer.icon && <span style={{ marginRight: "8px" }}>{offer.icon}</span>}
                          {offer.title}
                        </h3>
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

                <button className="offer-nav-btn next" onClick={nextOffer}>›</button>
              </div>

              <div className="offer-indicators">
                {offers.map((_, index) => (
                  <button
                    key={index}
                    className={`offer-indicator ${index === currentOffer ? "active" : ""}`}
                    onClick={() => setCurrentOffer(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              <p>No offers available at the moment</p>
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

              /* DUPLICATE FOR SMOOTH INFINITE SCROLL */
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
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: "230px",
                  borderRadius: "18px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >

                {/* Dark Fade */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(0,0,0,0.45)"
                }} />

                {/* TEXT ON TOP */}
                <div style={{
                  position: "relative",
                  padding: "20px",
                  color: "white",
                  textAlign: "left",
                }}>
                  <h3 style={{ fontSize: "24px", margin: 0 }}>{brand.name}</h3>
                  <p style={{ marginTop: "4px", opacity: 0.9 }}>{brand.tagline}</p>
                  <p style={{ fontSize: "14px", opacity: 0.8 }}>{brand.description}</p>
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