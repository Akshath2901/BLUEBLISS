// Payment.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Payment.css";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const { total, address, suggestion, noContact, cart } = location.state || {};

  const handleFakePayment = () => {
    const orderId = Math.floor(Math.random() * 900000 + 100000);
    
    // First show payment success screen
    setTimeout(() => {
      navigate("/payment-success", {
        state: {
          orderId,
          total,
          address,
          suggestion,
          noContact,
          cart,
        },
      });
      
      // Then redirect to tracking after 3 seconds
      setTimeout(() => {
        navigate("/track-order", {
          state: {
            orderId,
            total,
            address,
            cart,
          },
        });
      }, 3000);
    }, 1500);
  };

  if (!location.state) {
    return <p className="error-msg">⚠ Missing order details.</p>;
  }

  return (
    <div className="payment-page">

      {/* Header */}
      <h1 className="payment-title">💳 Secure Payment</h1>

      <div className="payment-wrapper">

        {/* LEFT SIDE — ORDER SUMMARY */}
        <div className="payment-left">

          <div className="payment-card">
            <h2>🧾 Order Summary</h2>

            <div className="items-list">
              {cart && cart.map((item) => (
                <div key={item.id} className="payment-item">
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="total-row">
              <h3>Total:</h3>
              <h3>₹{total}</h3>
            </div>
          </div>

          {/* ⭐ UPDATED: Display Address from LocationSystem */}
          <div className="payment-card">
            <h2>📍 Delivery Address</h2>
            {address ? (
              <>
                <p className="address-text" style={{ fontWeight: '600', marginBottom: '8px' }}>
                  {address.label && `${address.label.toUpperCase()} - `}
                  {address.houseNo && `${address.houseNo}, `}{address.street}
                </p>
                <p className="address-text">
                  {address.area}, {address.city}, {address.state} {address.pincode}
                </p>
                {address.landmark && (
                  <p className="address-text" style={{ color: '#666', fontSize: '13px' }}>
                    📌 Near: {address.landmark}
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: '#d00' }}>⚠ No address selected</p>
            )}

            {noContact && <p className="highlight-line">🔒 No Contact Delivery Enabled</p>}
            {suggestion && <p className="highlight-line">📝 Note: {suggestion}</p>}
          </div>

        </div>

        {/* RIGHT SIDE — PAYMENT OPTIONS */}
        <div className="payment-right">

          <div className="payment-card payment-options">
            <h2>💰 Payment Options</h2>

            <label className="payment-option">
              <input type="radio" name="pay" defaultChecked />
              <span>UPI (Google Pay / PhonePe / Paytm)</span>
            </label>

            <label className="payment-option">
              <input type="radio" name="pay" />
              <span>Credit / Debit Card</span>
            </label>

            <label className="payment-option">
              <input type="radio" name="pay" />
              <span>Cash on Delivery (Disabled)</span>
            </label>

            <button className="pay-now-btn" onClick={handleFakePayment}>
              Proceed to Pay ₹{total}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Payment;