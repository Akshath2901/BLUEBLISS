// src/pages/OrderTracking.jsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import "../jsx/ordertracking.css";

export default function OrderTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    console.log("🔍 Tracking order:", orderId);

    // ✅ Query orders collection - Try both string and number formats
    const q = query(
      collection(db, "orders"), 
      where("orderId", "==", orderId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const orderData = snapshot.docs[0];
          const data = { 
            id: orderData.id, 
            ...orderData.data() 
          };
          setOrder(data);
          console.log("✅ Order found:", data);
        } else {
          // Try searching by number if string search failed
          const numericOrderId = typeof orderId === 'string' ? parseInt(orderId) : orderId;
          const q2 = query(
            collection(db, "orders"),
            where("orderId", "==", numericOrderId)
          );
          
          onSnapshot(q2, (snapshot2) => {
            if (!snapshot2.empty) {
              const orderData = snapshot2.docs[0];
              setOrder({ id: orderData.id, ...orderData.data() });
              console.log("✅ Order found (numeric):", orderData.data());
            } else {
              setError("Order not found");
              console.log("❌ No order found with ID:", orderId);
            }
            setLoading(false);
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("❌ Error fetching order:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  if (loading) {
    return (
      <div className="tracking-loading-container">
        <div className="loading-spinner">
          <div className="spinner-emoji">⏳</div>
        </div>
        <h2>Loading order details...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="tracking-error-container">
        <div className="error-icon">❌</div>
        <h2>{error || "Order not found"}</h2>
        <p style={{ marginTop: '10px', color: '#999' }}>
          Order ID: {orderId}
        </p>
        <button 
          onClick={() => navigate("/")}
          className="back-home-btn"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ✅ Updated status steps with delivery
  const statusSteps = [
    { key: "pending", label: "Order Placed", icon: "📋" },
    { key: "approved", label: "Accepted", icon: "✅" },
    { key: "ready", label: "Preparing", icon: "👨‍🍳" },
    { key: "out-for-delivery", label: "Out for Delivery", icon: "🛵" },
    { key: "completed", label: "Delivered", icon: "🎉" }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return "#ff6b6b";
      case "approved": return "#ffd700";
      case "ready": return "#51cf66";
      case "out-for-delivery": return "#FFD700";
      case "completed": return "#4caf50";
      default: return "#999";
    }
  };

  const getStatusMessage = (status) => {
    switch(status) {
      case "pending": return "⏳ Waiting for restaurant to accept your order...";
      case "approved": return "✅ Order accepted! We're preparing your food...";
      case "ready": return "👨‍🍳 Your food is ready! Assigning delivery partner...";
      case "out-for-delivery": return "🛵 Your order is on the way!";
      case "completed": return "🎉 Order delivered! Enjoy your meal!";
      default: return "Processing your order...";
    }
  };

  return (
    <div className="tracking-page">
      <button 
        onClick={() => navigate("/")}
        className="back-button"
      >
        ← Back to Home
      </button>

      <div className="tracking-header">
        <h1 className="tracking-title">📦 Order Tracking</h1>
        <h2 className="tracking-order-id">Order #{order.orderId}</h2>
      </div>

      {/* STATUS PROGRESS BAR */}
      <div className="status-progress-container">
        <div className="progress-line-bg">
          <div 
            className="progress-line-fill"
            style={{
              width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
              transition: 'width 0.5s ease'
            }}
          ></div>
        </div>

        <div className="status-steps">
          {statusSteps.map((step, idx) => {
            const isActive = idx <= currentStepIndex;
            return (
              <div 
                key={step.key}
                className={`status-step ${isActive ? 'active' : 'inactive'}`}
              >
                <div className="status-circle">
                  {step.icon}
                </div>
                <p className="status-label">{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CURRENT STATUS CARD */}
      <div className="status-card" style={{ borderLeftColor: getStatusColor(order.status) }}>
        <h3 className="status-heading" style={{ color: getStatusColor(order.status) }}>
          {order.status.toUpperCase().replace(/-/g, ' ')}
        </h3>
        <p className="status-message">
          {getStatusMessage(order.status)}
        </p>
      </div>

      {/* ORDER DETAILS */}
      <div className="order-details-grid">
        {/* Items */}
        <div className="order-card">
          <h3 className="order-card-title">🍽️ Order Items</h3>
          <div className="order-items-list">
            {order.cart?.map((item, idx) => (
              <div key={idx} className="order-item">
                <div className="item-details">
                  <p className="item-name">{item.name}</p>
                  <p className="item-qty">Qty: {item.qty}</p>
                </div>
                <span className="item-total">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span className="total-label">Total</span>
            <span className="total-price">₹{order.total}</span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="order-card">
          <h3 className="order-card-title">📍 Delivery Address</h3>
          <div className="address-details">
            <p className="address-label">
              {order.address?.label || "Home"}
            </p>
            
            {/* ✅ Support both old and new address formats */}
            {order.address?.fullAddress ? (
              <p className="address-text">
                {order.address.fullAddress}
              </p>
            ) : (
              <>
                <p className="address-text">
                  {order.address?.houseNo && `${order.address.houseNo}, `}
                  {order.address?.street}
                </p>
                <p className="address-text">
                  {order.address?.area}
                </p>
                <p className="address-text">
                  {order.address?.city}
                  {order.address?.state && `, ${order.address.state}`}
                  {order.address?.pincode && ` ${order.address.pincode}`}
                </p>
              </>
            )}
            
            {order.address?.landmark && (
              <p className="address-landmark">
                📌 Landmark: {order.address.landmark}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Special Instructions */}
      {order.suggestion && (
        <div className="order-card" style={{ marginTop: '20px' }}>
          <h3 className="order-card-title">💬 Special Instructions</h3>
          <p style={{ fontSize: '14px', color: '#ccc', padding: '10px' }}>
            {order.suggestion}
          </p>
        </div>
      )}

      {/* ✅ No Contact Delivery Badge */}
      {order.noContact && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255, 77, 77, 0.1)',
          border: '2px solid #ff4d4d',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#ff4d4d',
          fontWeight: '700'
        }}>
          🔒 No-Contact Delivery Requested
        </div>
      )}
    </div>
  );
}