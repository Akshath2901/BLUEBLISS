import React, { useState, useContext, useEffect } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { auth, db } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";

function CartPage() {
  const navigate = useNavigate();
  const { cart, increaseQty, decreaseQty } = useContext(CartContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [noContact, setNoContact] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [offers, setOffers] = useState([]);
  const [couponError, setCouponError] = useState("");

  // Get current logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 FETCH OFFERS FROM 'offers' COLLECTION
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersSnapshot = await getDocs(collection(db, "offers"));
        const offersData = [];
        offersSnapshot.forEach((doc) => {
          if (doc.data().isActive) {
            offersData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        setOffers(offersData);
      } catch (e) {
        console.log("Error fetching offers:", e);
      }
    };

    fetchOffers();
  }, []);

  // Billing calculations
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const deliveryFee = 42;

  // 🔥 PARSE OFFER DETAILS FUNCTION
  const parseOfferDetails = (offer) => {
    const title = offer.title || "";
    const description = offer.description || "";
    const fullText = `${title} ${description}`.toLowerCase();

    let minAmount = 0;
    let maxDiscount = 0;
    let discountType = null; // "percent" or "fixed"
    let discountValue = 0;

    // Extract minimum order amount (e.g., "orders above 500" or "on orders of ₹500")
    const minMatch = fullText.match(/(?:above|of|₹)?\s*(\d+)/);
    if (minMatch) {
      minAmount = parseInt(minMatch[1]);
    }

    // Extract discount amount (e.g., "₹250 off" or "upto ₹250")
    const amountMatch = fullText.match(/(?:upto|get|off|₹)\s*₹?(\d+)/);
    if (amountMatch) {
      maxDiscount = parseInt(amountMatch[1]);
    }

    // Check if it's percentage or fixed
    if (fullText.includes("%")) {
      discountType = "percent";
      const percentMatch = fullText.match(/(\d+)%/);
      if (percentMatch) {
        discountValue = parseInt(percentMatch[1]);
      }
    } else {
      discountType = "fixed";
      discountValue = maxDiscount;
    }

    return {
      minAmount,
      maxDiscount,
      discountType,
      discountValue
    };
  };

  // 🔥 CALCULATE DISCOUNT BASED ON CONDITIONS
  const calculateDiscount = (matchedOffer) => {
    if (!matchedOffer) return { discount: 0, reason: "" };

    const offerDetails = parseOfferDetails(matchedOffer);
    
    // Check if order meets minimum amount requirement
    if (subtotal < offerDetails.minAmount) {
      return {
        discount: 0,
        reason: `Minimum order of ₹${offerDetails.minAmount} required`,
        eligible: false
      };
    }

    // Calculate discount based on type
    let discount = 0;
    if (offerDetails.discountType === "percent") {
      discount = Math.floor((subtotal * offerDetails.discountValue) / 100);
      // Cap discount to max if specified
      if (offerDetails.maxDiscount > 0) {
        discount = Math.min(discount, offerDetails.maxDiscount);
      }
    } else {
      // Fixed discount
      discount = Math.min(offerDetails.discountValue, subtotal);
    }

    return {
      discount,
      reason: `✓ Coupon applied successfully!`,
      eligible: true,
      maxDiscount: offerDetails.maxDiscount
    };
  };

  // 🔥 FIND MATCHING OFFER
  const matchedOffer = offers.find(offer => offer.code === couponCode);
  const discountInfo = matchedOffer ? calculateDiscount(matchedOffer) : { discount: 0, reason: "" };
  const discount = discountInfo.discount || 0;

  const gst = ((subtotal - discount) * 0.105).toFixed(2);
  const total = (subtotal + deliveryFee - discount + Number(gst)).toFixed(0);

  // 🔥 IMPROVED COUPON VALIDATION
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("❌ Please enter a coupon code");
      return;
    }

    if (!matchedOffer) {
      setCouponError("❌ Invalid coupon code");
      return;
    }

    const discountResult = calculateDiscount(matchedOffer);

    if (!discountResult.eligible) {
      setCouponError(`❌ ${discountResult.reason}`);
      return;
    }

    setCouponError("");
    alert(`🎉 ${discountResult.reason}\n💰 You save ₹${discountResult.discount}`);
  };

  const handleProceedToPayment = () => {
    if (!selectedAddressData) {
      alert("❌ Please select a delivery address");
      return;
    }

    navigate("/payment", {
      state: {
        cart,
        address: selectedAddressData,
        total,
        noContact,
        suggestion,
        appliedCoupon: couponCode,
        discount
      },
    });
  };

  // Only render if user is logged in
  if (!currentUser) {
    return (
      <div className="checkout-page">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Please login to continue</h2>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

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
                <p className="user-name">{currentUser.displayName || "User"}</p>
                <p className="user-phone">{currentUser.email}</p>
              </div>
            </div>

            {/* Location System Component */}
            <div style={{ marginTop: "30px" }}>
              <LocationSystemWrapper 
                userId={currentUser.uid} 
                onAddressSelect={setSelectedAddressData} 
              />
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

            {/* 🔥 COUPON SECTION WITH CONDITIONAL LOGIC */}
            <div className="section-card coupon-card">
              <h4>
                <span className="icon">🎁</span> Apply Coupon
              </h4>

              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                />
                <button onClick={handleApplyCoupon}>APPLY</button>
              </div>

              {/* Error or Success Message */}
              {couponError && (
                <div className="coupon-error" style={{ color: '#e74c3c', marginTop: '10px', fontSize: '13px' }}>
                  {couponError}
                </div>
              )}

              {matchedOffer && discountInfo.eligible && (
                <div className="coupon-success">
                  ✓ {matchedOffer.title}
                  <br />
                  💰 You save ₹{discount}
                </div>
              )}

              {/* 🔥 SHOW AVAILABLE COUPONS WITH CONDITIONS */}
              <div className="available-coupons">
                <p className="available-text">Available coupons:</p>
                {offers.length > 0 ? (
                  offers.slice(0, 3).map((offer) => {
                    const offerDetails = parseOfferDetails(offer);
                    const isEligible = subtotal >= offerDetails.minAmount;
                    
                    return (
                      <div
                        key={offer.id}
                        className="coupon-tag"
                        onClick={() => {
                          setCouponCode(offer.code);
                          setCouponError("");
                        }}
                        style={{
                          opacity: isEligible ? 1 : 0.5,
                          cursor: isEligible ? 'pointer' : 'not-allowed',
                          pointerEvents: isEligible ? 'auto' : 'none'
                        }}
                        title={!isEligible ? `Minimum order ₹${offerDetails.minAmount} required` : ""}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span>
                            {offer.icon} {offer.code}
                          </span>
                          {!isEligible && (
                            <span style={{ fontSize: '11px', color: '#999' }}>
                              Min ₹{offerDetails.minAmount}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          {offer.title}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#999', fontSize: '12px' }}>No offers available</p>
                )}
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
                  <span>
                    Discount
                    {matchedOffer && <span style={{ fontSize: '11px', color: '#48c479' }}> ({matchedOffer.code})</span>}
                  </span>
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

            {/* Proceed to Payment Button */}
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

// WRAPPER COMPONENT
function LocationSystemWrapper({ userId, onAddressSelect }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <LocationSystemCompact userId={userId} onAddressSelect={onAddressSelect} />
    </div>
  );
}

// FIREBASE-INTEGRATED LOCATION SYSTEM
function LocationSystemCompact({ userId, onAddressSelect }) {
  const [addresses, setAddresses] = React.useState([]);
  const [selectedAddress, setSelectedAddress] = React.useState(null);
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
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
    if (userId) {
      loadAddressesFromFirebase();
    }
  }, [userId]);

  const loadAddressesFromFirebase = async () => {
    try {
      setLoading(true);
      const addressesRef = collection(db, "userAddresses");
      const q = query(addressesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const loadedAddresses = [];
      querySnapshot.forEach((doc) => {
        loadedAddresses.push({ id: doc.id, ...doc.data() });
      });

      setAddresses(loadedAddresses);
      
      if (loadedAddresses.length > 0) {
        setSelectedAddress(loadedAddresses[0].id);
        onAddressSelect(loadedAddresses[0]);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async () => {
    if (!formData.street.trim() || !formData.area.trim() || !formData.city.trim()) {
      alert('Please fill in Street, Area, and City');
      return;
    }

    try {
      setLoading(true);
      
      const newAddressId = `${userId}_${Date.now()}`;
      
      const newAddress = {
        userId,
        label: formData.label,
        street: formData.street,
        area: formData.area,
        landmark: formData.landmark,
        houseNo: formData.houseNo,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        timestamp: new Date().toISOString()
      };

      const addressDocRef = doc(db, "userAddresses", newAddressId);
      await setDoc(addressDocRef, newAddress);

      const updatedAddresses = [...addresses, { id: newAddressId, ...newAddress }];
      setAddresses(updatedAddresses);

      setSelectedAddress(newAddressId);
      onAddressSelect({ id: newAddressId, ...newAddress });
      
      setShowAddressForm(false);
      setFormData({ 
        label: 'home', 
        street: '', 
        area: '', 
        landmark: '', 
        houseNo: '', 
        city: '', 
        state: '', 
        pincode: '' 
      });
      
      alert('✅ Address saved successfully!');
    } catch (err) {
      console.error('Error saving address:', err);
      alert('❌ Failed to save address: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "userAddresses", id));

      const updated = addresses.filter(addr => addr.id !== id);
      setAddresses(updated);

      if (selectedAddress === id) {
        const newSelected = updated[0];
        setSelectedAddress(newSelected?.id || null);
        onAddressSelect(newSelected || null);
      }

      alert('✅ Address deleted successfully!');
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('❌ Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (addr) => {
    setSelectedAddress(addr.id);
    onAddressSelect(addr);
  };

  if (loading && addresses.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Loading addresses...</div>;
  }

  return (
    <>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: '0 0 20px 0' }}>
        📍 Delivery Address
      </h3>

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
              disabled={loading}
              style={{
                padding: '10px',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                color: '#1c1c1c',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? '⏳ Saving...' : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CartPage;