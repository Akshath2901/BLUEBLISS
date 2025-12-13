import React, { useState, useContext } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import LocationSystem from "./LocationSystem"; // ← ADD THIS

function CartPage() {
  const navigate = useNavigate();
  const { cart, increaseQty, decreaseQty } = useContext(CartContext);

  // State for address selection
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  
  const [noContact, setNoContact] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [couponCode, setCouponCode] = useState("");

  // User info
  const user = {
    name: "Akshath Togari",
    phone: "7569534271",
  };

  // Billing calculations
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const deliveryFee = 42;
  const discount = couponCode === "FIRST50" ? 50 : 0;
  const gst = ((subtotal - discount) * 0.105).toFixed(2);
  const total = (subtotal + deliveryFee - discount + Number(gst)).toFixed(0);

  const handleApplyCoupon = () => {
    if (couponCode === "FIRST50") {
      alert("🎉 Coupon applied! You saved ₹50");
    } else {
      alert("❌ Invalid coupon code");
    }
  };

  // ⭐ UPDATED: Proceed to Payment with selected address
  const handleProceedToPayment = () => {
    if (!selectedAddressData) {
      alert("❌ Please select a delivery address");
      return;
    }

    // Pass address object to Payment page
    navigate("/payment", {
      state: {
        cart,
        address: selectedAddressData, // Send the full address object
        total,
        noContact,
        suggestion,
      },
    });
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <button className="back-to-menu" onClick={() => navigate(-1)}>
          ← Back to Menu
        </button>

        <div className="checkout-wrapper">
          {/* LEFT SECTION - Address Management */}
          <div className="checkout-left">
            {/* Logged In User Card */}
            <div className="section-card user-card">
              <div className="card-header">
                <h3 className="section-title">
                  <span className="icon">👤</span> Account
                </h3>
                <span className="verified-badge">✓ Verified</span>
              </div>
              <div className="user-details">
                <p className="user-name">{user.name}</p>
                <p className="user-phone">+91 {user.phone}</p>
              </div>
            </div>

            {/* ⭐ LOCATION SYSTEM COMPONENT */}
            <div style={{ marginTop: "30px" }}>
              <LocationSystemWrapper onAddressSelect={setSelectedAddressData} />
            </div>

            {/* Special Instructions */}
            <div className="section-card suggestions-card" style={{ marginTop: "30px" }}>
              <h3 className="section-title">
                <span className="icon">💬</span> Special Instructions
              </h3>
              <textarea
                className="suggestion-box"
                rows="3"
                placeholder="Add cooking requests, allergies, or delivery instructions..."
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
              ></textarea>
              <p className="char-count">{suggestion.length}/200</p>
            </div>
          </div>

          {/* RIGHT SECTION - Order Summary */}
          <div className="checkout-right">
            {/* Order Summary Header */}
            <div className="order-summary-header">
              <h2>Order Summary</h2>
              <span className="item-count">{cart.length} items</span>
            </div>

            {/* Cart Items */}
            <div className="cart-items-card">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div className="cart-item-row" key={item.id}>
                    <div className="item-left">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="item-thumb"
                      />
                      <div className="item-info">
                        <p className="cart-item-title">{item.name}</p>
                        <p className="item-unit-price">₹{item.price} each</p>
                      </div>
                    </div>

                    <div className="item-right">
                      <div className="qty-controls">
                        <button onClick={() => decreaseQty(item.id)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => increaseQty(item.id)}>+</button>
                      </div>
                      <div className="item-price">
                        ₹{item.price * item.qty}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-cart">
                  <div className="empty-icon">🛒</div>
                  <p>Your cart is empty</p>
                  <button onClick={() => navigate("/")}>Browse Menu</button>
                </div>
              )}
            </div>

            {/* No-contact Delivery */}
            <div className="section-card no-contact-card">
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="noContact"
                  checked={noContact}
                  onChange={(e) => setNoContact(e.target.checked)}
                />
                <label htmlFor="noContact">
                  <span className="checkbox-icon">🔒</span>
                  Opt for No-contact Delivery
                  <p className="checkbox-subtext">
                    Our delivery partner will leave your order at your door
                  </p>
                </label>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="section-card coupon-card">
              <h4>
                <span className="icon">🎁</span> Apply Coupon
              </h4>

              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(e.target.value.toUpperCase())
                  }
                />
                <button onClick={handleApplyCoupon}>APPLY</button>
              </div>

              {couponCode === "FIRST50" && (
                <div className="coupon-success">
                  ✓ Coupon applied! You saved ₹{discount}
                </div>
              )}

              <div className="available-coupons">
                <p className="available-text">Available coupons:</p>
                <div
                  className="coupon-tag"
                  onClick={() => setCouponCode("FIRST50")}
                >
                  FIRST50 - Get ₹50 off
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div className="section-card bill-card">
              <h3 className="section-title">
                <span className="icon">📄</span> Bill Details
              </h3>

              <div className="bill-row">
                <span>Item Total</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="bill-row">
                <span>
                  Delivery Fee
                  <span
                    className="info-icon"
                    title="Standard delivery charges"
                  >
                    ⓘ
                  </span>
                </span>
                <span>₹{deliveryFee}</span>
              </div>

              {discount > 0 && (
                <div className="bill-row discount-row">
                  <span>Discount</span>
                  <span className="discount-amount">-₹{discount}</span>
                </div>
              )}

              <div className="bill-row">
                <span>GST & Other Charges</span>
                <span>₹{gst}</span>
              </div>

              <div className="bill-divider"></div>

              <div className="bill-row total-row">
                <strong>TO PAY</strong>
                <strong className="total-amount">₹{total}</strong>
              </div>
            </div>

            {/* ⭐ UPDATED: Proceed to Payment Button */}
            <button
              className="pay-btn"
              onClick={handleProceedToPayment}
              disabled={!selectedAddressData || cart.length === 0}
            >
              {cart.length === 0
                ? "Add items to proceed"
                : !selectedAddressData
                ? "Select delivery address"
                : `PROCEED TO PAY ₹${total}`}
            </button>

            <p className="secure-payment">
              🔒 100% Secure Payment | All major cards accepted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ⭐ WRAPPER COMPONENT - Makes LocationSystem work in CartPage
function LocationSystemWrapper({ onAddressSelect }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <LocationSystemCompact onAddressSelect={onAddressSelect} />
    </div>
  );
}

// ⭐ COMPACT VERSION OF LOCATION SYSTEM (for CartPage)
function LocationSystemCompact({ onAddressSelect }) {
  const [addresses, setAddresses] = React.useState([]);
  const [selectedAddress, setSelectedAddress] = React.useState(null);
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    label: 'home',
    street: '',
    area: '',
    landmark: '',
    houseNo: '',
    city: '',
    state: '',
    pincode: ''
  });

  React.useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = () => {
    try {
      const saved = localStorage.getItem('bluebliss_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAddresses(parsed);
        if (parsed.length > 0) {
          setSelectedAddress(parsed[0].id);
          onAddressSelect(parsed[0]); // Send to parent
        }
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  const saveAddress = () => {
    if (!formData.street.trim() || !formData.area.trim() || !formData.city.trim()) {
      alert('Please fill in Street, Area, and City');
      return;
    }

    const newAddress = {
      id: Date.now(),
      ...formData,
      timestamp: new Date().toISOString()
    };

    const updated = [...addresses, newAddress];
    setAddresses(updated);
    localStorage.setItem('bluebliss_addresses', JSON.stringify(updated));

    setSelectedAddress(newAddress.id);
    onAddressSelect(newAddress); // Send to parent
    setShowAddressForm(false);
    setFormData({ label: 'home', street: '', area: '', landmark: '', houseNo: '', city: '', state: '', pincode: '' });
  };

  const deleteAddress = (id) => {
    const updated = addresses.filter(addr => addr.id !== id);
    setAddresses(updated);
    localStorage.setItem('bluebliss_addresses', JSON.stringify(updated));

    if (selectedAddress === id) {
      const newSelected = updated[0];
      setSelectedAddress(newSelected?.id || null);
      onAddressSelect(newSelected || null);
    }
  };

  const handleAddressSelect = (addr) => {
    setSelectedAddress(addr.id);
    onAddressSelect(addr); // Send to parent
  };

  const currentAddress = addresses.find(addr => addr.id === selectedAddress);

  return (
    <>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: '0 0 20px 0' }}>
        📍 Delivery Address
      </h3>

      {/* Saved Addresses List */}
      {addresses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {addresses.map(addr => (
            <div
              key={addr.id}
              onClick={() => handleAddressSelect(addr)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: selectedAddress === addr.id ? '3px solid #ffd700' : '2px solid #e0e0e0',
                background: selectedAddress === addr.id ? '#fffbf0' : '#f5f5f5',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1c1c1c', margin: 0, textTransform: 'capitalize' }}>
                    {addr.label}
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                    {addr.houseNo && `${addr.houseNo}, `}{addr.street}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    {addr.area}, {addr.city}
                  </p>
                  {addr.landmark && <p style={{ fontSize: '12px', color: '#999' }}>📌 Near: {addr.landmark}</p>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(addr.id);
                  }}
                  style={{
                    background: '#fee',
                    border: 'none',
                    color: '#d00',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Address Button */}
      <button
        onClick={() => setShowAddressForm(!showAddressForm)}
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #ffd700',
          background: 'white',
          color: '#ffd700',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        + {showAddressForm ? 'Cancel' : 'Add New Address'}
      </button>

      {/* Add Address Form */}
      {showAddressForm && (
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
            >
              <option value="home">🏠 Home</option>
              <option value="work">💼 Work</option>
              <option value="favorite">❤️ Favorite</option>
            </select>

            <input
              type="text"
              placeholder="House No."
              value={formData.houseNo}
              onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
            />

            <input
              type="text"
              placeholder="Street Address *"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
            />

            <input
              type="text"
              placeholder="Area / Locality *"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
            />

            <input
              type="text"
              placeholder="Landmark (Optional)"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                placeholder="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
              />
            </div>

            <input
              type="text"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '2px solid #ddd' }}
            />

            <button
              onClick={saveAddress}
              style={{
                padding: '10px',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                color: '#1c1c1c',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save Address
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CartPage;