// src/jsx/CartPage.jsx — BlueBliss V2.0 Premium
import React, { useState, useContext, useEffect } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { LoyaltyContext } from "../context/LoyaltyContext";
import { auth, db } from "../lib/firebase";
import {
  collection, doc, setDoc, deleteDoc,
  query, where, getDocs,
} from "firebase/firestore";
import {
  getEligibleOffers, getIneligibleOffers,
  calculateOfferDiscount,
} from "../utils/OffersHelper";
import CartStockValidator from "./CartStockValidator";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

/* ══════════════════════════════════════════════════════════
   MEAL SUGGESTIONS
══════════════════════════════════════════════════════════ */
function MealSuggestions({ cart }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => { fetchSuggestions(); }, [cart]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const cartIds = cart.map(i => i.id).filter(Boolean);
      const snap = await getDocs(collection(db, "menu"));
      const all = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (!cartIds.includes(doc.id) && !d.isCombo && d.name && d.price && d.available !== false) {
          all.push({ id:doc.id, name:d.name, price:d.price, img:d.img||d.image||'', category:d.category||'other', popularity:d.popularity||0 });
        }
      });
      setSuggestions(all.sort((a,b) => b.popularity - a.popularity).slice(0,4));
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const handleAdd = item => {
    if (!item?.id || !item?.name || !item?.price) return;
    addToCart({ id:item.id, name:item.name, price:item.price, img:item.img||'', category:item.category||'other', isCombo:false, qty:1 });
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="meal-suggestions">
      <h4>🍔 Complete your meal</h4>
      <p className="meal-sub">Popular add-ons from this restaurant</p>
      <div className="meal-items-scroll">
        {suggestions.map(item => (
          <div key={item.id} className="meal-item-card" onClick={() => handleAdd(item)}>
            <div className="meal-item-image">
              {item.img
                ? <img src={item.img} alt={item.name} />
                : <span>🍽️</span>
              }
            </div>
            <p className="meal-item-name">{item.name}</p>
            <div className="meal-item-footer">
              <p className="meal-item-price">₹{item.price}</p>
              <button className="meal-add-btn"
                onClick={e => { e.stopPropagation(); handleAdd(item); }}>
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADDRESS MODAL
══════════════════════════════════════════════════════════ */
function AddressModal({ userId, onAddressSelect, onClose, currentAddress }) {
  const [addresses,       setAddresses]       = useState([]);
  const [selectedId,      setSelectedId]      = useState(currentAddress?.id || null);
  const [showForm,        setShowForm]        = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [formData,        setFormData]        = useState({
    label:'home', street:'', area:'', landmark:'', houseNo:'',
    city:'', state:'', pincode:'', fullAddress:'', coordinates:null, deliveryInfo:null,
  });

  useEffect(() => { if (userId) loadAddresses(); }, [userId]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "userAddresses"), where("userId","==",userId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id:d.id, ...d.data() }));
      setAddresses(list);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAutocompleteSelect = data => {
    if (!data.deliveryInfo?.isDeliverable) {
      alert('❌ We don\'t deliver here yet. Try a nearby address.');
      return;
    }
    setFormData(p => ({
      ...p,
      houseNo:data.components.houseNo, street:data.components.street,
      area:data.components.area, city:data.components.city,
      state:data.components.state, pincode:data.components.pincode,
      fullAddress:data.fullAddress, coordinates:data.coordinates,
      deliveryInfo:data.deliveryInfo,
    }));
  };

  const saveAddress = async () => {
    if (!formData.street.trim() || !formData.area.trim() || !formData.city.trim()) {
      alert('Please fill in Street, Area, and City.');
      return;
    }
    if (formData.deliveryInfo && !formData.deliveryInfo.isDeliverable) {
      alert('❌ We cannot deliver to this address.');
      return;
    }
    try {
      setLoading(true);
      const id = `${userId}_${Date.now()}`;
      const addr = {
        userId, ...formData,
        fullAddress: formData.fullAddress || `${formData.houseNo}, ${formData.street}, ${formData.area}, ${formData.city}`,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, "userAddresses", id), addr);
      const updated = [...addresses, { id, ...addr }];
      setAddresses(updated);
      setSelectedId(id);
      setShowForm(false);
      setFormData({ label:'home', street:'', area:'', landmark:'', houseNo:'', city:'', state:'', pincode:'', fullAddress:'', coordinates:null, deliveryInfo:null });
      alert('✅ Address saved!');
    } catch(e) { alert('❌ Failed: ' + e.message); }
    finally { setLoading(false); }
  };

  const deleteAddress = async id => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "userAddresses", id));
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      if (selectedId === id) setSelectedId(null);
    } catch { alert('❌ Failed to delete'); }
    finally { setLoading(false); }
  };

  const handleConfirm = () => {
    const addr = addresses.find(a => a.id === selectedId);
    addr ? onAddressSelect(addr) : alert('Select an address first');
  };

  const setField = (k,v) => setFormData(p => ({ ...p, [k]:v }));

  return (
    <div className="addr-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="addr-modal-box">

        {/* Header */}
        <div className="addr-modal-header">
          <h3>📍 Select Delivery Address</h3>
          <button className="addr-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="addr-modal-body">
          {loading && addresses.length === 0 ? (
            <p className="addr-loading">Loading addresses…</p>
          ) : (
            <>
              {/* Address list */}
              {addresses.length > 0 && (
                <div className="addr-list">
                  {addresses.map(addr => (
                    <div key={addr.id}
                      className={`addr-card ${selectedId === addr.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(addr.id)}>
                      <div className="addr-card-inner">
                        <div className="addr-card-info">
                          <p className="addr-card-label">
                            {selectedId === addr.id && '✓ '}{addr.label}
                          </p>
                          <p className="addr-card-text">
                            {addr.fullAddress || `${addr.houseNo ? addr.houseNo+', ' : ''}${addr.street}, ${addr.area}, ${addr.city}`}
                          </p>
                          {addr.landmark && <p className="addr-card-landmark">📌 {addr.landmark}</p>}
                          {addr.deliveryInfo?.deliveryTime && (
                            <p className="addr-card-eta">⏱️ Delivery in {addr.deliveryInfo.deliveryTime}</p>
                          )}
                        </div>
                        <button className="addr-delete-btn"
                          onClick={e => { e.stopPropagation(); if(window.confirm('Delete this address?')) deleteAddress(addr.id); }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new button */}
              <button className="addr-add-btn" onClick={() => setShowForm(p => !p)}>
                + {showForm ? 'Cancel' : 'Add New Address'}
              </button>

              {/* Form */}
              {showForm && (
                <div className="addr-form">
                  <div className="addr-form-field">
                    <label>Search Address *</label>
                    <AddressAutocompleteInput
                      onAddressSelect={handleAutocompleteSelect}
                      placeholder="🔍 Type your address…"
                      showDeliveryInfo
                    />
                  </div>

                  <select className="addr-form-select" value={formData.label} onChange={e => setField('label', e.target.value)}>
                    <option value="home">🏠 Home</option>
                    <option value="work">💼 Work</option>
                    <option value="favorite">❤️ Favourite</option>
                  </select>

                  <input className="addr-form-input" type="text" placeholder="House No."
                    value={formData.houseNo} onChange={e => setField('houseNo', e.target.value)} />
                  <input className="addr-form-input" type="text" placeholder="Street Address *"
                    value={formData.street} onChange={e => setField('street', e.target.value)} />
                  <input className="addr-form-input" type="text" placeholder="Area / Locality *"
                    value={formData.area} onChange={e => setField('area', e.target.value)} />
                  <input className="addr-form-input" type="text" placeholder="Landmark (Optional)"
                    value={formData.landmark} onChange={e => setField('landmark', e.target.value)} />

                  <div className="addr-form-grid">
                    <input className="addr-form-input" type="text" placeholder="City *"
                      value={formData.city} onChange={e => setField('city', e.target.value)} />
                    <input className="addr-form-input" type="text" placeholder="State"
                      value={formData.state} onChange={e => setField('state', e.target.value)} />
                  </div>

                  <input className="addr-form-input" type="text" placeholder="Pincode"
                    value={formData.pincode} onChange={e => setField('pincode', e.target.value)} />

                  <button className="addr-save-btn" onClick={saveAddress} disabled={loading}>
                    {loading ? '⏳ Saving…' : 'Save Address'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {addresses.length > 0 && !showForm && (
          <div className="addr-modal-footer">
            <button className={`addr-confirm-btn ${selectedId ? 'active' : ''}`}
              onClick={handleConfirm} disabled={!selectedId}>
              {selectedId ? '✓ Confirm Address' : 'Select an address'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CART PAGE
══════════════════════════════════════════════════════════ */
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, increaseQty, decreaseQty, removeFromCart } = useContext(CartContext);
  const { loyaltyData } = useContext(LoyaltyContext);

  const [currentUser,       setCurrentUser]       = useState(null);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [noContact,         setNoContact]         = useState(false);
  const [suggestion,        setSuggestion]        = useState("");
  const [offers,            setOffers]            = useState([]);
  const [appliedOffer,      setAppliedOffer]      = useState(null);
  const [appliedOfferDiscount, setAppliedOfferDiscount] = useState(0);
  const [appliedVoucher,    setAppliedVoucher]    = useState(null);
  const [couponError,       setCouponError]       = useState("");
  const [canCheckout,       setCanCheckout]       = useState(true);
  const [isUpdating,        setIsUpdating]        = useState(false);
  const [showAddressModal,  setShowAddressModal]  = useState(false);

  // UI state toggles (replaces DOM id style manipulation)
  const [showVouchers,    setShowVouchers]    = useState(false);
  const [showOffers,      setShowOffers]      = useState(false);
  const [showBillDetails, setShowBillDetails] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    getDocs(collection(db, "offers"))
      .then(snap => {
        const data = [];
        snap.forEach(d => { if (d.data().isActive) data.push({ id:d.id, ...d.data() }); });
        setOffers(data);
      })
      .catch(console.error);
  }, []);

  /* ── Pricing ─────────────────────────────────────────── */
  const subtotal       = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const deliveryFee    = cart.length > 0 ? 42 : 0;
  const offerDiscount  = appliedOffer ? appliedOfferDiscount : 0;
  const voucherDiscount = appliedVoucher ? appliedVoucher.amount : 0;
  const totalDiscount  = offerDiscount + voucherDiscount;
  const gstAmount      = cart.length > 0 ? ((subtotal - totalDiscount) * 0.105).toFixed(2) : 0;
  const total          = cart.length > 0 ? (subtotal + deliveryFee - totalDiscount + Number(gstAmount)).toFixed(0) : 0;

  /* ── Offer handlers ──────────────────────────────────── */
  const handleApplyOffer = offer => {
    const d = calculateOfferDiscount(cart, subtotal, offer);
    if (!d.eligible) { setCouponError(`❌ ${d.reason}`); return; }
    setAppliedOffer(offer); setAppliedOfferDiscount(d.discount); setCouponError("");
  };
  const handleRemoveOffer = () => { setAppliedOffer(null); setAppliedOfferDiscount(0); setCouponError(""); };

  const handleApplyVoucher = v => {
    if (new Date(v.expiryDate) < new Date()) { alert("❌ Voucher expired"); return; }
    setAppliedVoucher(v);
    alert(`🎉 Voucher applied! You save ₹${v.amount}`);
  };
  const handleRemoveVoucher = () => setAppliedVoucher(null);

  /* ── Checkout ────────────────────────────────────────── */
  const handleProceedToPayment = () => {
    if (!selectedAddressData) { alert("❌ Please select a delivery address"); return; }
    if (!canCheckout) { alert("⚠️ Some items are unavailable. Adjust your order."); return; }
    navigate("/payment", {
      state: {
        orderId:`ORD-${Date.now()}`, cart, address:selectedAddressData,
        total, noContact, suggestion,
        appliedOffer:appliedOffer?.code||null, offerDiscount,
        appliedVoucher:appliedVoucher?.voucherId||null, voucherDiscount, totalDiscount,
      },
    });
  };

  /* ── WhatsApp message ────────────────────────────────── */
  const buildWhatsAppMsg = () => {
    const items = cart.map(i => `• ${i.qty}x ${i.name} (₹${i.price*i.qty})`).join("\n");
    const addr  = selectedAddressData
      ? selectedAddressData.fullAddress || `${selectedAddressData.street}, ${selectedAddressData.area}, ${selectedAddressData.city}`
      : "Will share shortly";
    return encodeURIComponent(`Hi BlueBliss! 🌿\n\nI'd like to order:\n\n${items}\n\n📦 Subtotal: ₹${subtotal}\n💰 Total: ₹${total}\n\n📍 Address: ${addr}\n\nPlease confirm. Thank you!`);
  };

  /* ── Auth guard ──────────────────────────────────────── */
  if (!currentUser) return (
    <div className="checkout-page">
      <div className="cart-auth-required">
        <span className="cart-auth-icon">🔐</span>
        <h2>Login to continue</h2>
        <button className="cart-auth-btn" onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    </div>
  );

  const eligibleOffers   = getEligibleOffers(cart, subtotal, offers);
  const ineligibleOffers = getIneligibleOffers(cart, subtotal, offers);
  const availableVouchers = loyaltyData?.unlockedVouchers?.filter(v => v.status === "available" && new Date(v.expiryDate) > new Date()) || [];

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="checkout-page">
      <div className="checkout-container">

        <button className="back-to-menu" onClick={() => navigate(-1)}>← Back to Menu</button>

        {/* ── Top Address Bar ── */}
        {selectedAddressData ? (
          <div className="top-address-bar addr-bar-filled">
            <div className="addr-bar-info">
              <p className="addr-bar-delivering">📍 Delivering to</p>
              <p className="addr-bar-location">
                {selectedAddressData.label?.toUpperCase() || 'HOME'} · {selectedAddressData.area}
              </p>
              {selectedAddressData.deliveryInfo?.deliveryTime && (
                <p className="addr-bar-eta">⚡ {selectedAddressData.deliveryInfo.deliveryTime}</p>
              )}
            </div>
            <button className="addr-bar-change-btn" onClick={() => setShowAddressModal(true)}>
              Change
            </button>
          </div>
        ) : (
          <div className="top-address-bar addr-bar-empty" onClick={() => setShowAddressModal(true)}>
            <div className="addr-bar-info">
              <p className="addr-bar-prompt">📍 Select Delivery Address</p>
              <p className="addr-bar-sub">Tap to choose your location</p>
            </div>
            <button className="addr-bar-select-btn">Select</button>
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <AddressModal
            userId={currentUser.uid}
            onAddressSelect={addr => { setSelectedAddressData(addr); setShowAddressModal(false); }}
            onClose={() => setShowAddressModal(false)}
            currentAddress={selectedAddressData}
          />
        )}

        <div className="checkout-wrapper">
          {/* LEFT */}
          <div className="checkout-left">
            {loyaltyData && (
              <div className="section-card loyalty-card">
                <h3 className="section-title loyalty-title">
                  <span className="icon">⭐</span> Loyalty Points
                </h3>
                <div className="loyalty-body">
                  <p className="loyalty-points">{loyaltyData.totalPoints}</p>
                  <p className="loyalty-next">
                    {100 - (loyaltyData.totalPoints % 100)} pts to next voucher
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="checkout-right">
            {/* Order Summary Header */}
            <div className="order-summary-header">
              <h2>Order Summary</h2>
              <span className="item-count">{cart.length} items</span>
            </div>

            {/* Cart Items */}
            <div className="cart-items-card">
              {cart.length > 0 ? cart.map(item => (
                <div className="cart-item-row" key={item.id}>
                  <div className="item-left">
                    <img src={item.img} alt={item.name} className="item-thumb" />
                    <div className="item-info">
                      <p className="cart-item-title">{item.name}</p>
                      {item.isCombo && item.items && (
                        <div className="combo-items-in-cart">
                          {item.items.map((ci,idx) => (
                            <p key={idx} className="combo-item-small">• {ci.name}</p>
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
                      <button onClick={() => {
                        if (isUpdating) return;
                        setIsUpdating(true);
                        if (item.qty === 1 && window.confirm(`Remove ${item.name}?`)) decreaseQty(item.id);
                        else if (item.qty > 1) decreaseQty(item.id);
                        setTimeout(() => setIsUpdating(false), 300);
                      }} disabled={isUpdating}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => {
                        if (isUpdating) return;
                        setIsUpdating(true);
                        increaseQty(item.id);
                        setTimeout(() => setIsUpdating(false), 300);
                      }} disabled={isUpdating}>+</button>
                    </div>
                    <div className="item-price">₹{item.price * item.qty}</div>
                    <button className="item-remove-btn"
                      onClick={() => window.confirm(`Remove ${item.name}?`) && removeFromCart(item.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              )) : (
                <div className="empty-cart">
                  <div className="empty-icon">🛒</div>
                  <p>Your cart is empty</p>
                  <button onClick={() => navigate("/")}>Browse Menu</button>
                </div>
              )}
            </div>

            {/* Instructions */}
            {cart.length > 0 && (
              <div className="instructions-section">
                <h4>📝 Cooking instructions</h4>
                <textarea
                  value={suggestion}
                  onChange={e => setSuggestion(e.target.value)}
                  placeholder="Allergies, cooking requests, delivery notes…"
                  maxLength={200}
                />
                <p className="char-count">{suggestion.length}/200</p>
              </div>
            )}

            {/* Meal suggestions */}
            {cart.length > 0 && <MealSuggestions cart={cart} />}

            {/* Stock validator */}
            {cart.length > 0 && (
              <CartStockValidator cart={cart} onValidationChange={setCanCheckout} />
            )}

            {/* No contact */}
            {cart.length > 0 && (
              <div className="section-card no-contact-card">
                <div className="checkbox-row">
                  <input type="checkbox" id="noContact" checked={noContact}
                    onChange={e => setNoContact(e.target.checked)} />
                  <label htmlFor="noContact">
                    <span className="checkbox-icon">🔒</span>
                    No-contact Delivery
                  </label>
                </div>
              </div>
            )}

            {/* Vouchers */}
            {cart.length > 0 && availableVouchers.length > 0 && (
              <div className="collapse-block">
                <div className="collapse-header" onClick={() => setShowVouchers(p => !p)}>
                  <div className="collapse-header-left">
                    <span>🎟️</span>
                    <span className="collapse-title">
                      {appliedVoucher ? `Voucher Applied · ₹${appliedVoucher.amount} off` : 'Loyalty Vouchers'}
                    </span>
                  </div>
                  <div className="collapse-header-right">
                    {appliedVoucher
                      ? <button className="collapse-remove" onClick={e => { e.stopPropagation(); handleRemoveVoucher(); }}>Remove</button>
                      : <span className="collapse-avail">{availableVouchers.length} available</span>
                    }
                    <span className="collapse-arrow">{showVouchers ? '▼' : '▶'}</span>
                  </div>
                </div>
                {showVouchers && (
                  <div className="collapse-body">
                    <div className="pill-row">
                      {availableVouchers.map(v => (
                        <button key={v.voucherId}
                          className={`voucher-pill ${appliedVoucher?.voucherId === v.voucherId ? 'applied' : ''}`}
                          onClick={() => handleApplyVoucher(v)}>
                          🎁 ₹{v.amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Offers */}
            {cart.length > 0 && (eligibleOffers.length > 0 || ineligibleOffers.length > 0) && (
              <div className="collapse-block">
                <div className="collapse-header" onClick={() => setShowOffers(p => !p)}>
                  <div className="collapse-header-left">
                    <span>🎁</span>
                    <span className="collapse-title">
                      {appliedOffer ? `${appliedOffer.code} Applied · ₹${offerDiscount} off` : 'Smart Offers'}
                    </span>
                  </div>
                  <div className="collapse-header-right">
                    {appliedOffer
                      ? <button className="collapse-remove" onClick={e => { e.stopPropagation(); handleRemoveOffer(); }}>Remove</button>
                      : eligibleOffers.length > 0 && <span className="collapse-avail">{eligibleOffers.length} available</span>
                    }
                    <span className="collapse-arrow">{showOffers ? '▼' : '▶'}</span>
                  </div>
                </div>
                {showOffers && (
                  <div className="collapse-body">
                    {!appliedOffer && eligibleOffers.length > 0 && (
                      <>
                        <p className="collapse-section-label eligible">✨ Eligible</p>
                        <div className="pill-row">
                          {eligibleOffers.map(offer => {
                            const d = calculateOfferDiscount(cart, subtotal, offer);
                            return (
                              <button key={offer.id} className="offer-pill eligible"
                                onClick={() => handleApplyOffer(offer)}>
                                {offer.icon} {offer.code} · Save ₹{d.discount}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {ineligibleOffers.length > 0 && (
                      <>
                        <p className="collapse-section-label locked">🔒 Almost there</p>
                        <div className="pill-row">
                          {ineligibleOffers.slice(0,2).map(offer => (
                            <div key={offer.id} className="offer-pill ineligible">
                              {offer.icon} {offer.code} — {offer.amountNeeded ? `₹${offer.amountNeeded} more` : offer.reason}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bill Details */}
            {cart.length > 0 && (
              <div className="section-card bill-card">
                <div className="bill-toggle" onClick={() => setShowBillDetails(p => !p)}>
                  <h3 className="section-title">
                    <span className="icon">📄</span> Bill Details
                  </h3>
                  <span className="bill-arrow">{showBillDetails ? '▼' : '▶'}</span>
                </div>

                {showBillDetails && (
                  <div className="bill-details">
                    <div className="bill-row"><span>Item Total</span><span>₹{subtotal}</span></div>
                    <div className="bill-row"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                    {offerDiscount > 0 && (
                      <div className="bill-row discount-row">
                        <span>Offer Discount <small>({appliedOffer?.code})</small></span>
                        <span className="discount-amount">−₹{offerDiscount}</span>
                      </div>
                    )}
                    {voucherDiscount > 0 && (
                      <div className="bill-row discount-row">
                        <span>Voucher <small>(Loyalty)</small></span>
                        <span className="discount-amount">−₹{voucherDiscount}</span>
                      </div>
                    )}
                    <div className="bill-row"><span>GST & Charges</span><span>₹{gstAmount}</span></div>
                    <div className="bill-divider" />
                    <div className="bill-row total-row">
                      <strong>TO PAY</strong>
                      <strong className="total-amount">₹{total}</strong>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="savings-notice">✨ You saved ₹{totalDiscount} on this order!</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cancellation */}
            {cart.length > 0 && (
              <div className="cancellation-policy">
                <h4>ℹ️ Cancellation Policy</h4>
                <p>Orders cannot be cancelled once packed for delivery. Refunds for delays, where applicable.</p>
              </div>
            )}

            {/* Pay button */}
            <button className="pay-btn" onClick={handleProceedToPayment}
              disabled={!selectedAddressData || cart.length === 0 || !canCheckout}>
              {!canCheckout
                ? "⚠️ Some Items Unavailable"
                : cart.length === 0
                  ? "Add items to proceed"
                  : !selectedAddressData
                    ? "Select a delivery address"
                    : `PROCEED TO PAY  ₹${total}`}
            </button>

            <p className="secure-payment">🔒 100% Secure Payment · All major cards accepted</p>

            {/* WhatsApp secondary */}
            {cart.length > 0 && (
              <a href={`https://wa.me/917569534271?text=${buildWhatsAppMsg()}`}
                target="_blank" rel="noopener noreferrer"
                className="whatsapp-alt-btn">
                💬 Or order via WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}