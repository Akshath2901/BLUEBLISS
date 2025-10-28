import React from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const brands = [
    {
      id: 1,
      name: "Shrimmers",
      tagline: "Sparkle in Every Bite",
      description: "Experience the shimmer of flavors with our premium selection",
      icon: "✨",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      route: "/menu/shrimmers"
    },
    {
      id: 2,
      name: "Peppanizze",
      tagline: "Spice Up Your Life",
      description: "Bold flavors that ignite your taste buds",
      icon: "🌶️",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      route: "/menu/peppanizze"
    },
    {
      id: 3,
      name: "UrbanWrap",
      tagline: "Wrapped to Perfection",
      description: "Modern wraps crafted for the urban lifestyle",
      icon: "🌯",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      route: "/menu/urbanwrap"
    }
  ];

  const handleBrandClick = (route) => {
    navigate(route);
  };

  return (
    <div className="home-container">
      <header className="navbar">
        <h1 className="brand">BlueBliss Foods & Technologies</h1>
      </header>

      <main className="hero">
        <h2>Welcome to <span>BlueBliss</span> 🌿</h2>
        <p>Your one-stop destination for fresh, delicious, and soulful food.</p>
        
        <SearchBar onSearch={handleSearch} />
        
        <button className="explore-btn">Explore Menu</button>
      </main>

      {/* Brands Section */}
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

      <footer className="footer">
        <p>© 2025 BlueBliss | Crafted with ❤️</p>
      </footer>
    </div>
  );
}

export default Home;