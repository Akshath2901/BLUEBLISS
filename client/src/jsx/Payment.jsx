// src/pages/Payment.jsx - UPDATED WITH USER DATA FETCH
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import "./Payment.css";

// 🔥 RESTAURANT INFO
const RESTAURANT_INFO = {
  name: "Blue Bliss",
  address: "opp. chikalguda, Railway Colony, police station, Secunderabad, Telangana 500061",
  coordinates: {
    lat: 17.430833225925735,
    lng: 78.5133938400985
  },
  phone: "+91-7569534271"
};

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [fetchingUser, setFetchingUser] = useState(true);
  
  const { total, address, suggestion, noContact, cart, orderId, appliedOffer, offerDiscount, appliedVoucher, voucherDiscount, totalDiscount } = location.state || {};

  // ✅ FETCH USER DATA FROM FIRESTORE
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setFetchingUser(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          // Fallback to auth data if no Firestore profile
          setUserData({
            name: user.displayName || "User",
            email: user.email,
            phone: user.phoneNumber || ""
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData({
          name: user.displayName || "User",
          email: user.email,
          phone: ""
        });
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUserData();
  }, []);

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
        // ✅ UPDATED ORDER STRUCTURE WITH REAL USER DATA
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
          
          // ✅ ENHANCED ADDRESS (with coordinates)
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
            coordinates: address.coordinates || null,
            deliveryInfo: address.deliveryInfo || null
          },
          
          // ✅ RESTAURANT INFO
          restaurant: RESTAURANT_INFO,
          
          // ✅ CUSTOMER INFO FROM FIRESTORE
          customer: {
            name: userData?.name || user?.displayName || "Guest User",
            phone: userData?.phone || user?.phoneNumber || "",
            email: userData?.email || user?.email || "guest@example.com",
            userId: user?.uid || "guest"
          },
          
          // ✅ DELIVERY STRUCTURE
          delivery: {
            partner: null,
            taskId: null,
            trackingUrl: null,
            currentLocation: null,
            estimatedDelivery: null,
            
            agent: {
              name: null,
              phone: null,
              vehicleNo: null
            },
            
            partnerStatus: null,
            assignedAt: null,
            pickedUpAt: null,
            deliveredAt: null,
            
            deliveryFee: 42,
            partnerCharges: null,
            failureReason: null
          },
          
          // ✅ PAYMENT INFO
          payment: {
            method: "online",
            status: "completed",
            transactionId: `TXN-${Date.now()}`,
            codAmount: 0
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

        console.log("✅ Creating order with user data:", orderData.customer);

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

  if (fetchingUser) {
    return (
      <div className="payment-page">
        <div style={{ textAlign: "center", padding: "60px", color: "#fff" }}>
          <div className="loader-spinner" style={{
            width: 40,
            height: 40,
            border: "4px solid rgba(255,215,0,0.2)",
            borderTop: "4px solid #ffd700",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite"
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <h1 className="payment-title">💳 Secure Payment</h1>
      
      <div className="payment-wrapper">
        {/* LEFT - Order Summary */}
        <div className="payment-left">
          <div className="payment-card">
            <h2>Order Summary</h2>
            
            {/* ✅ SHOW CUSTOMER INFO */}
            {userData && (
              <div style={{
                padding: "16px",
                background: "rgba(255, 215, 0, 0.1)",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid rgba(255, 215, 0, 0.3)"
              }}>
                <h3 style={{ fontSize: "14px", color: "#ffd700", marginBottom: "8px" }}>
                  👤 Ordering As
                </h3>
                <p style={{ fontSize: "16px", fontWeight: "600", margin: "4px 0" }}>
                  {userData.name}
                </p>
                <p style={{ fontSize: "13px", opacity: 0.7, margin: "2px 0" }}>
                  📧 {userData.email}
                </p>
                {userData.phone && (
                  <p style={{ fontSize: "13px", opacity: 0.7, margin: "2px 0" }}>
                    📱 {userData.phone}
                  </p>
                )}
              </div>
            )}
            
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
              🔒 Your payment is 100% secure
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Payment;