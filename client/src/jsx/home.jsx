import React from "react";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <header className="navbar">
        <h1 className="brand">BlueBliss Foods & Technologies</h1>
      </header>

      <main className="hero">
        <h2>Welcome to <span>BlueBliss</span> 🌿</h2>
        <p>Your one-stop destination for fresh, delicious, and soulful food.</p>
        <button className="explore-btn">Explore Menu</button>
      </main>

      <footer className="footer">
        <p>© 2025 BlueBliss | Crafted with ❤️</p>
      </footer>
    </div>
  );
}

export default Home;
