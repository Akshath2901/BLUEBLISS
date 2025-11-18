import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./jsx/home";
import SearchResults from "./jsx/SearchResults";
import Navbar from "./jsx/Navbar";
import About from "./jsx/About";
import ExploreMenu from "./jsx/ExploreMenu";
import Contact from "./jsx/Contact";
import SwiggyStyleMenu from "./jsx/SwiggyStyleMenu";
import PeppaStyleMenu from "./jsx/Peppapage";
import UrbanStyleMenu from "./jsx/Urbanpage"; // 🍽️ Sample Restaurant Menu

import CartPage from "./jsx/CartPage";         // 🛒 Cart Page
import Billing from "./jsx/Billing";           // 🧾 Billing Page
import PaymentGateway from "./jsx/PaymentGateway"; // 💳 Payment Page
import ProtectedRoute from "./jsx/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Main Navigation Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/explore-menu" element={<ExploreMenu />} />
        <Route path="/contact" element={<Contact />} />

        {/* Search Results */}
        <Route path="/search" element={<SearchResults />} />

        {/* Cart System */}
        <Route path="/cart" element={<ProtectedRoute><CartPage/></ProtectedRoute>} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/payment-gateway" element={<PaymentGateway />} />

        {/* You can add more restaurant menu routes here later */}
  
            <Route path="/menu/shrimmers" element={<SwiggyStyleMenu />} />
            <Route path="/menu/peppanizze" element={<PeppaStyleMenu />} />
            <Route path="/menu/urbanwrap" element={<UrbanStyleMenu />} />

        
      </Routes>
    </Router>
  );
}

export default App;
