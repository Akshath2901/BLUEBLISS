import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./jsx/home";
import SearchResults from "./jsx/SearchResults";
import Navbar from "./jsx/Navbar";
import About from "./jsx/About";
import ExploreMenu from "./jsx/ExploreMenu";
import Contact from "./jsx/Contact";
import SwiggyStyleMenu from "./jsx/SwiggyStyleMenu"; // ✅ new component

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore-menu" element={<ExploreMenu />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/search" element={<SearchResults />} />

        {/* ✅ dynamic route for menu (ex: /menu/pizza, /menu/burgers, etc.) */}
        <Route path="/menu/shrimmers" element={<SwiggyStyleMenu />} />
        <Route path="/menu/shrimmers" element={<SwiggyStyleMenu />} />
        <Route path="/menu/shrimmers" element={<SwiggyStyleMenu />} />
        
      </Routes>
    </Router>
  );
}

export default App;
