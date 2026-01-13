import React, { useState, useContext, useEffect } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { LoyaltyContext } from "../context/LoyaltyContext";
import { auth, db } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import {
  getEligibleOffers,
  getIneligibleOffers,
  calculateOfferDiscount,
  validateOfferCode,
} from "../utils/OffersHelper";
import CartStockValidator from "./CartStockValidator";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

function CartPage() {
  const navigate = useNavigate();
  const { cart, increaseQty, decreaseQty, removeFromCart } = useContext(CartContext);
  const { loyaltyData } = useContext(LoyaltyContext);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [noContact, setNoContact] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [offers, setOffers] = useState([]);
  const [couponError, setCouponError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [appliedOfferDiscount, setAppliedOfferDiscount] = useState(0);
  const [canCheckout, setCanCheckout] = useState(true); // 🔥 NEW: Stock validation state
  const [isUpdating, setIsUpdating] = useState(false); // Prevent double-clicks

  // Get current logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch offers from Firestore
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

  // ✅ BILLING CALCULATIONS - FIXED
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const deliveryFee = cart.length > 0 ? 42 : 0;
  const offerDiscount = appliedOffer ? appliedOfferDiscount : 0;
  const voucherDiscount = appliedVoucher ? appliedVoucher.amount : 0;
  const totalDiscount = offerDiscount + voucherDiscount;
  const gstAmount = cart.length > 0 ? ((subtotal - totalDiscount) * 0.105).toFixed(2) : 0;
  const total = cart.length > 0 ? (subtotal + deliveryFee - totalDiscount + Number(gstAmount)).toFixed(0) : 0;

  // ✅ HANDLERS
  const handleApplyOffer = (offer) => {
    const discount = calculateOfferDiscount(cart, subtotal, offer);
    
    if (!discount.eligible) {
      setCouponError(`❌ ${discount.reason}`);
      return;
    }
    
    setAppliedOffer(offer);
    setAppliedOfferDiscount(discount.discount);
    setCouponError("");
  };

  const handleRemoveOffer = () => {
    setAppliedOffer(null);
    setAppliedOfferDiscount(0);
    setCouponError("");
  };

  const handleApplyVoucher = (voucher) => {
    if (new Date(voucher.expiryDate) < new Date()) {
      setVoucherError("❌ Voucher has expired");
      return;
    }
    setAppliedVoucher(voucher);
    setVoucherError("");
    alert(`🎉 Voucher applied!\n💰 You save ₹${voucher.amount}`);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError("");
  };

  const handleProceedToPayment = () => {
    if (!selectedAddressData) {
      alert("❌ Please select a delivery address");
      return;
    }

    if (!canCheckout) {
      alert("⚠️ Some items in your cart are temporarily unavailable. Please adjust your order.");
      return;
    }

    const orderId = `ORD-${Date.now()}`;

    navigate("/payment", {
      state: {
        orderId,
        cart,
        address: selectedAddressData,
        total,
        noContact,
        suggestion,
        appliedOffer: appliedOffer?.code || null,
        offerDiscount,
        appliedVoucher: appliedVoucher?.voucherId || null,
        voucherDiscount,
        totalDiscount
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
          {/* LEFT SECTION */}
          <div className="checkout-left">
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

            {loyaltyData && (
              <div className="section-card loyalty-card" style={{ marginTop: "30px", background: "linear-gradient(135deg, #ffd700, #d4af37)", color: "#000" }}>
                <h3 className="section-title" style={{ color: "#000" }}>
                  <span className="icon">⭐</span> Your Loyalty Points
                </h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <p style={{ fontSize: "28px", fontWeight: "900", margin: 0 }}>
                    {loyaltyData.totalPoints}
                  </p>
                  <p style={{ fontSize: "13px", opacity: 0.9, margin: 0 }}>
                    {100 - (loyaltyData.totalPoints % 100)} points to next voucher
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginTop: "30px" }}>
              <LocationSystemWrapper 
                userId={currentUser.uid} 
                onAddressSelect={setSelectedAddressData} 
              />
            </div>

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

          {/* RIGHT SECTION */}
          <div className="checkout-right">
            <div className="order-summary-header">
              <h2>Order Summary</h2>
              <span className="item-count">{cart.length} items</span>
            </div>

            <div className="cart-items-card">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div className="cart-item-row" key={item.id}>
                    <div className="item-left">
                      <img src={item.img} alt={item.name} className="item-thumb" />
                      <div className="item-info">
                        <p className="cart-item-title">{item.name}</p>
                        {item.isCombo && item.items && (
                          <div className="combo-items-in-cart">
                            {item.items.map((comboItem, idx) => (
                              <p key={idx} className="combo-item-small">
                                • {comboItem.name}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="item-unit-price">₹{item.price} each</p>
                        {item.isCombo && item.discount && (
                          <p className="combo-discount">💰 Save ₹{item.discount}</p>
                        )}
                      </div>
                    </div>

                    <div className="item-right">
                      <div className="qty-controls">
                        <button 
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    // If qty is 1, confirm before removing
    if (item.qty === 1) {
      if (window.confirm(`Remove ${item.name} from cart?`)) {
        decreaseQty(item.id);
      }
    } else {
      decreaseQty(item.id);
    }
    setTimeout(() => setIsUpdating(false), 300);
  }}
  disabled={isUpdating}  // ✅ Only disable when updating
  style={{ cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}
>−</button>
                        <span>{item.qty}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isUpdating) return;
                            setIsUpdating(true);
                            increaseQty(item.id);
                            setTimeout(() => setIsUpdating(false), 300);
                          }}
                          disabled={isUpdating}
                          style={{ cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}
                        >+</button>
                      </div>
                      <div className="item-price">₹{item.price * item.qty}</div>
                      <button
                        className="item-remove-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm(`Remove ${item.name} from cart?`)) {
                            removeFromCart && removeFromCart(item.id);
                          }
                        }}
                        title="Remove item from cart"
                      >
                        🗑️
                      </button>
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

            {/* 🔥 NEW: STOCK VALIDATION - Shows warnings if items can't be fulfilled */}
            {cart.length > 0 && (
              <CartStockValidator 
                cart={cart} 
                onValidationChange={setCanCheckout}
              />
            )}

            {cart.length > 0 && (
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
                  </label>
                </div>
              </div>
            )}

            {/* LOYALTY VOUCHERS */}
            {cart.length > 0 && loyaltyData?.unlockedVouchers?.filter(v => v.status === "available").length > 0 && (
              <div className="section-card voucher-card" style={{ background: "linear-gradient(135deg, #1c1c1c 0%, #262626 100%)", border: "2px solid rgba(212, 175, 55, 0.3)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🎟️</span> Your Loyalty Vouchers
                </h4>

                {appliedVoucher ? (
                  <div style={{
                    background: "linear-gradient(135deg, #4caf50, #45a049)",
                    padding: "15px",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#fff",
                    marginBottom: "15px"
                  }}>
                    <div>
                      <p style={{ fontSize: "13px", margin: "0 0 5px 0", opacity: 0.9 }}>✓ Voucher Applied</p>
                      <p style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>₹{appliedVoucher.amount} Discount</p>
                    </div>
                    <button onClick={handleRemoveVoucher} style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      padding: "8px 15px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                    {loyaltyData?.unlockedVouchers
                      ?.filter(v => v.status === "available" && new Date(v.expiryDate) > new Date())
                      .map(voucher => (
                        <button
                          key={voucher.voucherId}
                          onClick={() => handleApplyVoucher(voucher)}
                          style={{
                            padding: "12px",
                            background: "linear-gradient(135deg, #ffd700, #d4af37)",
                            border: "none",
                            borderRadius: "10px",
                            color: "#000",
                            fontWeight: "700",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "transform 0.2s ease",
                            fontSize: "14px"
                          }}
                          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                        >
                          <div style={{ fontSize: "16px", marginBottom: "4px" }}>🎁</div>
                          ₹{voucher.amount}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* SMART OFFERS */}
            {cart.length > 0 && (
              <div className="section-card coupon-card">
                <h4><span className="icon">🎁</span> Smart Offers</h4>

                {appliedOffer && (
                  <div style={{
                    background: "linear-gradient(135deg, #4caf50, #45a049)",
                    padding: "15px",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#fff",
                    marginBottom: "15px",
                  }}>
                    <div>
                      <p style={{ fontSize: "13px", margin: "0 0 5px 0", opacity: 0.9 }}>✓ Offer Applied</p>
                      <p style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
                        {appliedOffer.icon} {appliedOffer.code} - Save ₹{offerDiscount}
                      </p>
                      <p style={{ fontSize: "12px", margin: "5px 0 0 0", opacity: 0.8 }}>
                        {appliedOffer.title}
                      </p>
                    </div>
                    <button onClick={handleRemoveOffer} style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      padding: "8px 15px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      whiteSpace: "nowrap"
                    }}>Remove</button>
                  </div>
                )}

                {!appliedOffer && getEligibleOffers(cart, subtotal, offers).length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#4caf50", marginBottom: "10px" }}>
                      ✨ Eligible Offers (Click to apply)
                    </p>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {getEligibleOffers(cart, subtotal, offers).map((offer) => {
                        const discount = calculateOfferDiscount(cart, subtotal, offer);
                        return (
                          <button
                            key={offer.id}
                            onClick={() => handleApplyOffer(offer)}
                            style={{
                              padding: "12px",
                              background: `linear-gradient(135deg, ${offer.bgColor}, ${offer.bgColorAlt})`,
                              border: "none",
                              borderRadius: "10px",
                              color: "#fff",
                              fontWeight: "700",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "transform 0.2s ease",
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = "translateY(-2px)")}
                            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700" }}>
                                  {offer.icon} {offer.code}
                                </p>
                                <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
                                  {offer.title}
                                </p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <p style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "900" }}>
                                  ₹{discount.discount}
                                </p>
                                <p style={{ margin: 0, fontSize: "11px", opacity: 0.85 }}>Save</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {getIneligibleOffers(cart, subtotal, offers).length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#ff9800", marginBottom: "10px" }}>
                      🔒 Almost There! (Unlock these offers)
                    </p>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {getIneligibleOffers(cart, subtotal, offers).slice(0, 2).map((offer) => (
                        <div
                          key={offer.id}
                          style={{
                            padding: "12px",
                            background: `linear-gradient(135deg, ${offer.bgColor}33, ${offer.bgColorAlt}33)`,
                            border: `2px solid ${offer.bgColor}66`,
                            borderRadius: "10px",
                            color: "#fff",
                            opacity: 0.7,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700" }}>
                                {offer.icon} {offer.code}
                              </p>
                              <p style={{ margin: 0, fontSize: "12px" }}>{offer.title}</p>
                            </div>
                            <p style={{ margin: 0, fontSize: "11px", textAlign: "right", fontWeight: "700", color: "#ff9800" }}>
                              {offer.amountNeeded ? `Need ₹${offer.amountNeeded} more` : offer.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BILL DETAILS - 🔥 SHOWS OFFER DISCOUNT */}
            {cart.length > 0 && (
              <div className="section-card bill-card">
                <h3 className="section-title">
                  <span className="icon">📄</span> Bill Details
                </h3>

                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>

                {offerDiscount > 0 && (
                  <div className="bill-row discount-row">
                    <span>
                      Offer Discount
                      <span style={{ fontSize: '11px', color: '#48c479' }}> ({appliedOffer?.code})</span>
                    </span>
                    <span className="discount-amount" style={{ color: '#4caf50' }}>
                      -₹{offerDiscount}
                    </span>
                  </div>
                )}

                {voucherDiscount > 0 && (
                  <div className="bill-row discount-row">
                    <span>Voucher Discount<span style={{ fontSize: '11px', color: '#48c479' }}> (Loyalty)</span></span>
                    <span className="discount-amount" style={{ color: '#4caf50' }}>-₹{voucherDiscount}</span>
                  </div>
                )}

                <div className="bill-row">
                  <span>GST & Other Charges</span>
                  <span>₹{gstAmount}</span>
                </div>

                <div className="bill-divider"></div>

                <div className="bill-row total-row">
                  <strong>TO PAY</strong>
                  <strong className="total-amount">₹{total}</strong>
                </div>

                {totalDiscount > 0 && (
                  <div style={{ textAlign: 'center', marginTop: '10px', padding: '10px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', color: '#4caf50', fontWeight: '700', fontSize: '13px' }}>
                    ✨ You saved ₹{totalDiscount}!
                  </div>
                )}
              </div>
            )}

            <button
              className="pay-btn"
              onClick={handleProceedToPayment}
              disabled={!selectedAddressData || cart.length === 0 || !canCheckout}
            >
              {!canCheckout
                ? "⚠️ Some Items Unavailable"
                : cart.length === 0
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

function LocationSystemWrapper({ userId, onAddressSelect }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <LocationSystemCompact userId={userId} onAddressSelect={onAddressSelect} />
    </div>
  );
}

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
    pincode: '',
    fullAddress: '',      // ← ADD THIS
    coordinates: null,    // ← ADD THIS
    deliveryInfo: null    // ← ADD THIS
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
    alert('Please use the address search or fill in Street, Area, and City');
    return;
  }

  // ✅ ADD THIS NEW VALIDATION
  if (formData.deliveryInfo && !formData.deliveryInfo.isDeliverable) {
    alert('❌ We cannot deliver to this address. Please select an address within our delivery range.');
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
         fullAddress: formData.fullAddress || `${formData.houseNo}, ${formData.street}, ${formData.area}, ${formData.city}`,  // ← ADD
  coordinates: formData.coordinates,      // ← ADD
  deliveryInfo: formData.deliveryInfo,    // ← ADD
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
        pincode: '' ,
        fullAddress: '',       // ← ADD
  coordinates: null,     // ← ADD
  deliveryInfo: null     // ← ADD
      });
      
      alert('✅ Address saved successfully!');
    } catch (err) {
      console.error('Error saving address:', err);
      alert('❌ Failed to save address: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAutocompleteSelect = (addressData) => {
  if (!addressData.deliveryInfo?.isDeliverable) {
    alert('❌ Sorry, we do not deliver to this location yet. Please try a different address.');
    return;
  }
  setFormData({
    label: formData.label,
    houseNo: addressData.components.houseNo,
    street: addressData.components.street,
    area: addressData.components.area,
    landmark: '',
    city: addressData.components.city,
    state: addressData.components.state,
    pincode: addressData.components.pincode,
    fullAddress: addressData.fullAddress,
    coordinates: addressData.coordinates,
    deliveryInfo: addressData.deliveryInfo
  });
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
                  {addr.fullAddress || `${addr.houseNo ? addr.houseNo + ', ' : ''}${addr.street}, ${addr.area}, ${addr.city}`}
                </p>
                {addr.landmark && <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>📌 {addr.landmark}</p>}
                {addr.deliveryInfo?.deliveryTime && (
                  <p style={{ fontSize: '12px', color: '#4caf50', fontWeight: '600', marginTop: '6px' }}>
                    ⏱️ Delivery in {addr.deliveryInfo.deliveryTime}
                  </p>
                )}
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
      onClick={() => {
        setShowAddressForm(!showAddressForm);
        if (showAddressForm) {
          setFormData({ 
            label: 'home', 
            street: '', 
            area: '', 
            landmark: '', 
            houseNo: '', 
            city: '', 
            state: '', 
            pincode: '',
            fullAddress: '',
            coordinates: null,
            deliveryInfo: null
          });
        }
      }}
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
          
          {/* ✅ NEW: ADDRESS AUTOCOMPLETE SEARCH */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Search Address *
            </label>
            <AddressAutocompleteInput
              onAddressSelect={handleAutocompleteSelect}
              placeholder="🔍 Type your address (e.g., Hitech City, Hyderabad)"
              showDeliveryInfo={true}
            />
          </div>

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