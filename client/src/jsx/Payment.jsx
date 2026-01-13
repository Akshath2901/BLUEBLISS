// src/pages/Payment.jsx - UPDATED VERSION
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import "../jsx/payment.css";

// 🔥 ADD YOUR RESTAURANT INFO HERE
const RESTAURANT_INFO = {
  name: "Blue Bliss",  // ← REPLACE THIS
  address: "opp. chikalguda, Railway Colony, police station, Secunderabad, Telangana 500061",  // ← REPLACE THIS
  coordinates: {
    lat: 17.430833225925735,  // ← REPLACE WITH YOUR RESTAURANT'S LATITUDE
    lng: 78.5133938400985   // ← REPLACE WITH YOUR RESTAURANT'S LONGITUDE
  },
  phone: "+91-7569534271"  // ← REPLACE WITH YOUR PHONE
};

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { total, address, suggestion, noContact, cart, orderId, appliedOffer, offerDiscount, appliedVoucher, voucherDiscount, totalDiscount } = location.state || {};

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
    const finalOrderId = orderId || `ORD-${Date.now()}`;
    const user = auth.currentUser;

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // ✅ UPDATED ORDER STRUCTURE
        const orderData = {
          // Basic info
          orderId: finalOrderId,
          userId: user?.uid || "guest",
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          
          // Cart items
          cart,
          total: Number(total),
          
          // ✅ ENHANCED ADDRESS (with coordinates from CartPage)
          address: {
            label: address.label || "home",
            fullAddress: address.fullAddress || 
              `${address.houseNo ? address.houseNo + ', ' : ''}${address.street}, ${address.area}, ${address.city}`,
            houseNo: address.houseNo || "",
            street: address.street || "",
            area: address.area || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            landmark: address.landmark || "",
            
            // 🔥 GPS Coordinates (from AddressAutocomplete)
            coordinates: address.coordinates || null,
            
            // Delivery info from autocomplete
            deliveryInfo: address.deliveryInfo || null
          },
          
          // ✅ RESTAURANT INFO
          restaurant: RESTAURANT_INFO,
          
          // ✅ CUSTOMER INFO
          customer: {
            name: user?.displayName || "Guest User",
            phone: user?.phoneNumber || user?.email || "",
            email: user?.email || "guest@example.com"
          },
          
          // ✅ DELIVERY STRUCTURE (for third-party integration)
          delivery: {
            partner: null,           // Will be "dunzo", "shadowfax", etc.
            taskId: null,            // Delivery partner's task ID
            trackingUrl: null,       // Tracking link
            currentLocation: null,   // Live GPS
            estimatedDelivery: null, // ETA
            
            agent: {
              name: null,
              phone: null,
              vehicleNo: null
            },
            
            partnerStatus: null,     // "assigned", "picked_up", "in_transit", "delivered"
            assignedAt: null,
            pickedUpAt: null,
            deliveredAt: null,
            
            deliveryFee: 42,
            partnerCharges: null,
            failureReason: null
          },
          
          // ✅ PAYMENT INFO
          payment: {
            method: "online",  // or "cod" based on selection
            status: "completed",
            transactionId: `TXN-${Date.now()}`,
            codAmount: 0  // Set to total if COD
          },
          
          // Additional info
          suggestion: suggestion || "",
          noContact: noContact || false,
          
          // Offers/Vouchers
          appliedOffer: appliedOffer || null,
          offerDiscount: offerDiscount || 0,
          appliedVoucher: appliedVoucher || null,
          voucherDiscount: voucherDiscount || 0,
          totalDiscount: totalDiscount || 0
        };

        console.log("✅ Creating order with structure:", orderData);

        const docRef = await addDoc(collection(db, "orders"), orderData);

        console.log("✅ Order saved successfully with ID:", docRef.id);

        navigate("/payment-success", {
          state: { 
            orderId: finalOrderId, 
            total, 
            address, 
            cart,
            suggestion,
            noContact,
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
                {address?.fullAddress || 
                 `${address?.houseNo ? address.houseNo + ', ' : ''}${address?.street}, ${address?.area}, ${address?.city}`}
              </p>
              {address?.landmark && (
                <p style={{ margin: "4px 0", fontSize: "13px", opacity: 0.7 }}>
                  📌 {address.landmark}
                </p>
              )}
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