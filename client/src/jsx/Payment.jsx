// src/pages/Payment.jsx - PREMIUM VERSION WITH UPDATED STYLING
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import "../jsx/payment.css"; // Import the premium CSS

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { total, address, suggestion, noContact, cart } = location.state || {};

  const handleFakePayment = async () => {
    if (!cart || cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!address) {
      alert("Please select a delivery address");
      return;
    }

    setLoading(true);
    const orderId = Math.floor(Math.random() * 900000 + 100000);
    const user = auth.currentUser;

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // ✅ SAVE ORDER TO FIRESTORE
        const docRef = await addDoc(collection(db, "orders"), {
          orderId,
          userId: user?.uid || "guest",
          userEmail: user?.email || "guest@example.com",
          userName: user?.displayName || "Guest User",
          cart,
          total: Number(total),
          address: {
            label: address.label || "home",
            houseNo: address.houseNo || "",
            street: address.street || "",
            area: address.area || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            landmark: address.landmark || "",
          },
          suggestion: suggestion || "",
          noContact: noContact || false,
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        console.log("✅ Order saved successfully with ID:", docRef.id);

        navigate("/payment-success", {
          state: { 
            orderId, 
            total, 
            address, 
            cart,
            firestoreId: docRef.id 
          },
        });
      } catch (error) {
        console.error("❌ Error creating order:", error);
        alert("Failed to create order. Please try again.");
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="payment-page">
      <h1 className="payment-title">💳 Secure Payment</h1>
      
      <div className="payment-wrapper">
        {/* LEFT - Order Summary */}
        <div className="payment-left">
          <div className="payment-card">
            <h2>Order Summary</h2>
            
            <div className="items-list">
              {cart?.map((item) => (
                <div key={item.id} className="payment-item">
                  <div>
                    <p className="payment-item-label">{item.name}</p>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                      ₹{item.price} × {item.qty}
                    </p>
                  </div>
                  <span className="payment-item-price">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            
            <div className="total-row">
              <span className="total-label">Total</span>
              <span className="total-amount">₹{total}</span>
            </div>

            {/* Delivery Address */}
            <div className="highlight-line">
              <h3 style={{ fontSize: "16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                📍 Delivery Address
              </h3>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>
                {address?.houseNo && `${address.houseNo}, `}
                {address?.street}
              </p>
              <p style={{ margin: "4px 0", fontSize: "14px", opacity: 0.8 }}>
                {address?.area}, {address?.city}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT - Payment Options */}
        <div className="payment-right">
          <div className="payment-card">
            <h2>Payment Options</h2>
            
            <label className="payment-option selected">
              <input 
                type="radio" 
                name="pay" 
                defaultChecked 
              />
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>💳</span>
                <span>UPI (Google Pay / PhonePe)</span>
              </span>
            </label>

            <label className="payment-option">
              <input 
                type="radio" 
                name="pay" 
              />
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>💰</span>
                <span>Cash on Delivery</span>
              </span>
            </label>

            <button 
              onClick={handleFakePayment}
              disabled={loading || !cart || cart.length === 0}
              className="pay-now-btn"
            >
              {loading ? "Processing Payment..." : `PAY ₹${total}`}
            </button>

            <div className="secure-badge">
              Your payment is 100% secure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;