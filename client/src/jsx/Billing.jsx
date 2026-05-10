// src/jsx/Billing.jsx — BlueBliss V2.0
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "./Billing.css";

export default function Billing() {
  const navigate = useNavigate();
  const { cart } = useContext(CartContext);

  const subTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const gst      = (subTotal * 0.05).toFixed(2);
  const delivery = 40;
  const total    = (subTotal + Number(gst) + delivery).toFixed(2);

  return (
    <div className="billing-page">
      <div className="billing-container">

        <button className="billing-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="billing-header">
          <p className="billing-eyebrow">Your Order</p>
          <h1 className="billing-title">Billing Summary</h1>
        </div>

        <div className="billing-card">

          {/* Items */}
          <div className="billing-items">
            {cart.map(item => (
              <div className="billing-item" key={item.id}>
                <div className="billing-item-left">
                  <span className="billing-item-name">{item.name}</span>
                  <span className="billing-item-qty">× {item.qty}</span>
                </div>
                <span className="billing-item-price">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="billing-divider" />

          {/* Totals */}
          <div className="billing-rows">
            <div className="billing-row">
              <span>Subtotal</span>
              <span>₹{subTotal}</span>
            </div>
            <div className="billing-row">
              <span>GST (5%)</span>
              <span>₹{gst}</span>
            </div>
            <div className="billing-row">
              <span>Delivery</span>
              <span>₹{delivery}</span>
            </div>
          </div>

          <div className="billing-divider" />

          <div className="billing-total">
            <span>Total</span>
            <span className="billing-total-amount">₹{total}</span>
          </div>

          <button className="billing-pay-btn"
            onClick={() => navigate("/payment-gateway")}
            disabled={cart.length === 0}>
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
}