import React, { useState } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useContext } from "react";

function CartPage() {
  const navigate = useNavigate();

  // USER SAMPLE
  const user = {
    name: "Akshath Togari",
    phone: "7569534271",
  };

  // ADDRESSES
  const addresses = [
    {
      id: 1,
      label: "Home",
      address:
        "20-1-378, Kokatat Colony, Puranapool, Hyderabad, Telangana 500064, India.",
      eta: "40 MINS",
    },
    {
      id: 2,
      label: "Work",
      address:
        "Blue Bliss, Chilakalguda, Hyderabad, Telangana, India.",
      eta: "69 MINS",
    },
    {
      id: 3,
      label: "Friends & Family",
      address:
        "Sai Nanditha Enclave, Kachiguda, Hyderabad, Telangana 500027.",
      eta: "49 MINS",
    },
    {
      id: 4,
      label: "Sam",
      address:
        "Sri Rayapatnam, Indira Nagar, Hyderabad, Telangana 500061.",
      eta: "64 MINS",
    },
  ];

  const [selectedAddress, setSelectedAddress] = useState(null);

  // SAMPLE CART ITEMS
const { cart, increaseQty, decreaseQty } = useContext(CartContext);

  // BILLING
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const deliveryFee = 42;
  const gst = (subtotal * 0.105).toFixed(2);
  const total = (subtotal + deliveryFee + Number(gst)).toFixed(0);

  return (
    <div className="checkout-wrapper">
      
      {/* LEFT SECTION */}
      <div className="checkout-left">
        
        {/* Logged In */}
        <div className="section-card">
          <h3 className="section-title">
            <span className="icon">👤</span> Logged in
          </h3>
          <p className="user-info">
            {user.name} | {user.phone}
          </p>
        </div>

        {/* Address Selector */}
        <div className="section-card">
          <h3 className="section-title">
            <span className="icon">📍</span> Choose Delivery Address
          </h3>
          <p className="subtext">Multiple addresses in this location</p>

          <div className="address-grid">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`address-card ${
                  selectedAddress === addr.id ? "active" : ""
                }`}
                onClick={() => setSelectedAddress(addr.id)}
              >
                <h4>{addr.label}</h4>
                <p>{addr.address}</p>
                <p className="eta">{addr.eta}</p>

                <button className="deliver-btn">
                  {selectedAddress === addr.id ? "SELECTED" : "DELIVER HERE"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="section-card">
          <h3 className="section-title">Any suggestions?</h3>
          <textarea
            className="suggestion-box"
            rows="3"
            placeholder="We will pass it on..."
          ></textarea>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="checkout-right">

        {/* Restaurant */}
        <div className="cart-card">
          <h3>KFC</h3>
          <p className="rest-location">Inner Ring Road</p>
        </div>

        {/* Cart Items */}
        <div className="cart-items">
          {cart.map((item) => (
            <div className="cart-item-row" key={item.id}>
              <div className="cart-item-title">{item.name}</div>

              <div className="qty-controls">
                <button onClick={() => decreaseQty(item.id)}>-</button>
                <span>{item.qty}</span>
                <button onClick={() => increaseQty(item.id)}>+</button>
              </div>

              <div className="item-price">₹{item.price}</div>
            </div>
          ))}
        </div>

        {/* No-contact */}
        <div className="section-card">
          <div className="checkbox-row">
            <input type="checkbox" />
            <label>Opt for No-contact Delivery</label>
          </div>
        </div>

        {/* Coupon */}
        <div className="section-card">
          <h4>Apply Coupon</h4>
        </div>

        {/* Bill */}
        <div className="section-card">
          <h3 className="section-title">Bill Details</h3>

          <div className="bill-row">
            <span>Item Total</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="bill-row">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee}</span>
          </div>

          <div className="bill-row">
            <span>GST & Other Charges</span>
            <span>₹{gst}</span>
          </div>

          <hr />

          <div className="bill-row total">
            <strong>TO PAY</strong>
            <strong>₹{total}</strong>
          </div>
        </div>

        <button className="pay-btn" onClick={() => navigate("/payment-gateway")}>
          PROCEED TO PAY ₹{total}
        </button>
      </div>
    </div>
  );
}

export default CartPage;
