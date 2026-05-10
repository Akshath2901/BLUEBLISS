// src/jsx/CartBar.jsx
// Swiggy-style bottom cart bar — shows when cart has items, hides on cart/payment pages

import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "./CartBar.css";

// Pages where CartBar should NOT show
const HIDDEN_ON = ["/cart", "/billing", "/payment", "/payment-gateway", "/payment-success", "/order-tracking"];

export default function CartBar() {
  const { cart } = useContext(CartContext);
  const navigate  = useNavigate();
  const location  = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Hide on certain pages
  if (HIDDEN_ON.some(p => location.pathname.startsWith(p))) return null;

  // Hide if cart is empty
  if (!cart || cart.length === 0) return null;

  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = cart.reduce((acc, i) => acc + i.qty * i.price, 0);

  return (
    <div className={`cart-bar ${expanded ? "cart-bar-open" : ""}`}>

      {/* ── Collapsed strip ── */}
      <div className="cart-bar-strip" onClick={() => setExpanded(p => !p)}>
        {/* Left: item count badge + text */}
        <div className="cart-bar-left">
          <div className="cart-bar-badge">{totalItems}</div>
          <div className="cart-bar-text">
            <span className="cart-bar-label">
              {totalItems} {totalItems === 1 ? "item" : "items"} in cart
            </span>
            <span className="cart-bar-sub">
              {cart.slice(0,2).map(i => i.name).join(", ")}
              {cart.length > 2 ? ` +${cart.length - 2} more` : ""}
            </span>
          </div>
        </div>

        {/* Right: total + checkout button */}
        <div className="cart-bar-right">
          <span className="cart-bar-total">₹{totalPrice}</span>
          <button
            className="cart-bar-btn"
            onClick={e => { e.stopPropagation(); navigate("/cart"); }}
          >
            Checkout →
          </button>
          <span className="cart-bar-chevron">{expanded ? "▼" : "▲"}</span>
        </div>
      </div>

      {/* ── Expanded preview ── */}
      {expanded && (
        <div className="cart-bar-expanded">
          <div className="cart-bar-items">
            {cart.map((item, i) => (
              <div key={i} className="cart-bar-item">
                <span className="cart-bar-item-qty">{item.qty}×</span>
                <span className="cart-bar-item-name">{item.name}</span>
                <span className="cart-bar-item-price">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="cart-bar-summary">
            <span>Subtotal</span>
            <span>₹{totalPrice}</span>
          </div>

          <button
            className="cart-bar-full-btn"
            onClick={() => navigate("/cart")}
          >
            🛒 View Cart & Checkout
          </button>
        </div>
      )}
    </div>
  );
}