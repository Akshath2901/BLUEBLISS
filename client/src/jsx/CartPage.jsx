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

// NEW: Meal Suggestions Component
function MealSuggestions({ cart }) {
  const [suggestions, setSuggestions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { addToCart } = useContext(CartContext);

  React.useEffect(() => {
    fetchSuggestions();
  }, [cart]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      
      // Get items already in cart
      const cartItemIds = cart.map(item => item.id).filter(Boolean);
      
      // Fetch menu items from Firestore
      const menuSnapshot = await getDocs(collection(db, "menu"));
      const allItems = [];
      
      menuSnapshot.forEach((doc) => {
        const data = doc.data();
        // Validate required fields before adding
        if (
          !cartItemIds.includes(doc.id) && 
          !data.isCombo && 
          data.name && 
          data.price &&
          data.available !== false
        ) {
          allItems.push({
            id: doc.id,
            name: data.name,
            price: data.price,
            img: data.img || data.image || '/placeholder.jpg',
            category: data.category || 'other',
            popularity: data.popularity || 0,
            available: data.available !== false
          });
        }
      });
      
      // Sort by popularity or price and limit to 4 items
      const suggested = allItems
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 4);
      
      setSuggestions(suggested);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (!item || !item.id || !item.name || !item.price) {
      console.error("Invalid item data:", item);
      return;
    }
    
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      img: item.img || item.image || '/placeholder.jpg',
      category: item.category || 'other',
      isCombo: false,
      qty: 1
    });
  };

  if (loading) {
    return (
      <div className="meal-suggestions">
        <h4>🍔 Complete your meal with</h4>
        <p>Loading suggestions...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="meal-suggestions">
      <h4>🍔 Complete your meal with</h4>
      <p>Popular add-ons from this restaurant</p>
      <div className="meal-items-scroll">
        {suggestions.map((item) => (
          <div 
            key={item.id} 
            className="meal-item-card"
            onClick={() => handleAddToCart(item)}
          >
            <div className="meal-item-image">
              {item.img || item.image ? (
                <img 
                  src={item.img || item.image} 
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <span>🍽️</span>
              )}
            </div>
            <p className="meal-item-name">{item.name}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="meal-item-price">₹{item.price}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
                style={{
                  background: '#ffd700',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: '#000'
                }}
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [canCheckout, setCanCheckout] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false); // 🔥 NEW

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const deliveryFee = cart.length > 0 ? 42 : 0;
  const offerDiscount = appliedOffer ? appliedOfferDiscount : 0;
  const voucherDiscount = appliedVoucher ? appliedVoucher.amount : 0;
  const totalDiscount = offerDiscount + voucherDiscount;
  const gstAmount = cart.length > 0 ? ((subtotal - totalDiscount) * 0.105).toFixed(2) : 0;
  const total = cart.length > 0 ? (subtotal + deliveryFee - totalDiscount + Number(gstAmount)).toFixed(0) : 0;

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

        {selectedAddressData && (
          <div className="top-address-bar" style={{
            position: 'sticky',
            top: '80px',
            zIndex: 100,
            background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.98) 0%, rgba(15, 14, 9, 0.98) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                📍 Delivering to
              </p>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                {selectedAddressData.label?.toUpperCase() || 'HOME'} - {selectedAddressData.area}
              </p>
              {selectedAddressData.deliveryInfo?.deliveryTime && (
                <p style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px', fontWeight: '600' }}>
                  ⚡ {selectedAddressData.deliveryInfo.deliveryTime}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAddressModal(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,215,0,0.1)',
                border: '2px solid rgba(212,175,55,0.4)',
                borderRadius: '8px',
                color: '#ffd700',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,215,0,0.2)';
                e.target.style.borderColor = '#ffd700';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,215,0,0.1)';
                e.target.style.borderColor = 'rgba(212,175,55,0.4)';
              }}
            >
              Change
            </button>
          </div>
        )}

        {!selectedAddressData && (
          <div className="top-address-bar" style={{
            position: 'sticky',
            top: '80px',
            zIndex: 100,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.98) 0%, rgba(15, 14, 9, 0.98) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }} onClick={() => setShowAddressModal(true)}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#ffd700', margin: 0 }}>
                📍 Select Delivery Address
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                Click to choose your delivery location
              </p>
            </div>
            <button
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #ffd700, #d4af37)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Select
            </button>
          </div>
        )}

        {/* 🔥 ADDRESS MODAL */}
        {showAddressModal && (
          <AddressModal
            userId={currentUser.uid}
            onAddressSelect={(addr) => {
              setSelectedAddressData(addr);
              setShowAddressModal(false);
            }}
            onClose={() => setShowAddressModal(false)}
            currentAddress={selectedAddressData}
          />
        )}

        <div className="checkout-wrapper">
          {/* LEFT SECTION */}
          <div className="checkout-left">
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
                            if (item.qty === 1) {
                              if (window.confirm(`Remove ${item.name} from cart?`)) {
                                decreaseQty(item.id);
                              }
                            } else {
                              decreaseQty(item.id);
                            }
                            setTimeout(() => setIsUpdating(false), 300);
                          }}
                          disabled={isUpdating}
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

            {cart.length > 0 && (
              <div className="instructions-section">
                <h4>📝 Add cooking instructions</h4>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Add cooking requests, allergies, or delivery instructions..."
                  maxLength={200}
                />
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: '6px' }}>
                  {suggestion.length}/200
                </p>
              </div>
            )}

            {cart.length > 0 && (
              <MealSuggestions cart={cart} />
            )}

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

            {cart.length > 0 && (
              <div className="section-card bill-card">
                <div 
                  onClick={() => {
                    const billDetails = document.getElementById('bill-details');
                    const arrow = document.getElementById('bill-arrow');
                    if (billDetails.style.display === 'none') {
                      billDetails.style.display = 'block';
                      arrow.textContent = '▼';
                    } else {
                      billDetails.style.display = 'none';
                      arrow.textContent = '▶';
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  <h3 className="section-title" style={{ marginBottom: 0 }}>
                    <span className="icon">📄</span> Bill Details
                  </h3>
                  <span id="bill-arrow" style={{ fontSize: '16px', color: '#ffd700', fontWeight: '700' }}>▼</span>
                </div>

                <div id="bill-details">
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
              </div>
            )}

            {cart.length > 0 && (
              <div className="cancellation-policy">
                <h4>ℹ️ Cancellation Policy</h4>
                <p>
                  Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.
                </p>
              </div>
            )}
{cart.length > 0 && (
              <button
                className="whatsapp-order-btn"
                onClick={() => {
                  const itemsList = cart
                    .map(
                      (item) =>
                        `• ${item.qty}x ${item.name} (₹${item.price * item.qty})`
                    )
                    .join("\n");

                  const message = encodeURIComponent(
                    `Hi BlueBliss! 🌿\n\nI'd like to order:\n\n${itemsList}\n\n📦 Subtotal: ₹${subtotal}\n💰 Total: ₹${total}\n\n📍 Address: ${
                      selectedAddressData
                        ? selectedAddressData.fullAddress ||
                          `${selectedAddressData.street}, ${selectedAddressData.area}, ${selectedAddressData.city}`
                        : "Will share shortly"
                    }\n\nPlease confirm my order. Thank you!`
                  );

                  window.open(
                    `https://wa.me/917569534271?text=${message}`,
                    "_blank"
                  );
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(135deg, #25d366, #128c7e)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 6px 20px rgba(37, 211, 102, 0.3)",
                  transition: "all 0.3s ease",
                  marginBottom: "12px",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 28px rgba(37, 211, 102, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 6px 20px rgba(37, 211, 102, 0.3)";
                }}
              >
                💬 Order via WhatsApp
              </button>
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

// 🔥 NEW: ADDRESS MODAL COMPONENT
function AddressModal({ userId, onAddressSelect, onClose, currentAddress }) {
  const [addresses, setAddresses] = React.useState([]);
  const [selectedAddress, setSelectedAddress] = React.useState(currentAddress?.id || null);
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
    fullAddress: '',
    coordinates: null,
    deliveryInfo: null
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
        fullAddress: formData.fullAddress || `${formData.houseNo}, ${formData.street}, ${formData.area}, ${formData.city}`,
        coordinates: formData.coordinates,
        deliveryInfo: formData.deliveryInfo,
        timestamp: new Date().toISOString()
      };

      const addressDocRef = doc(db, "userAddresses", newAddressId);
      await setDoc(addressDocRef, newAddress);

      const updatedAddresses = [...addresses, { id: newAddressId, ...newAddress }];
      setAddresses(updatedAddresses);

      setSelectedAddress(newAddressId);
      
      setShowAddressForm(false);
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
        setSelectedAddress(null);
      }

      alert('✅ Address deleted successfully!');
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('❌ Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const selected = addresses.find(addr => addr.id === selectedAddress);
    if (selected) {
      onAddressSelect(selected);
    } else {
      alert('Please select an address');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1c1c1c 0%, #0f0e09 100%)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '2px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid rgba(212, 175, 55, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(135deg, #1c1c1c 0%, #0f0e09 100%)',
          zIndex: 1
        }}>
          <h3 style={{ margin: 0, color: '#ffd700', fontSize: '20px', fontWeight: '700' }}>
            📍 Select Delivery Address
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {loading && addresses.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
              ⏳ Loading addresses...
            </div>
          ) : (
            <>
              {/* Address List */}
              {addresses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedAddress === addr.id ? '3px solid #ffd700' : '2px solid rgba(212, 175, 55, 0.3)',
                        background: selectedAddress === addr.id ? 'rgba(255, 215, 0, 0.1)' : 'rgba(28, 28, 28, 0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0, textTransform: 'capitalize' }}>
                            {selectedAddress === addr.id && '✓ '}{addr.label}
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '6px' }}>
                            {addr.fullAddress || `${addr.houseNo ? addr.houseNo + ', ' : ''}${addr.street}, ${addr.area}, ${addr.city}`}
                          </p>
                          {addr.landmark && <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>📌 {addr.landmark}</p>}
                          {addr.deliveryInfo?.deliveryTime && (
                            <p style={{ fontSize: '12px', color: '#4caf50', fontWeight: '600', marginTop: '6px' }}>
                              ⏱️ Delivery in {addr.deliveryInfo.deliveryTime}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this address?')) {
                              deleteAddress(addr.id);
                            }
                          }}
                          style={{
                            background: 'rgba(226, 55, 68, 0.2)',
                            border: '1px solid rgba(226, 55, 68, 0.4)',
                            color: '#e23744',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
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
                  border: '2px dashed rgba(212, 175, 55, 0.4)',
                  background: 'rgba(255, 215, 0, 0.05)',
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
                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(28, 28, 28, 0.5)', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#ffd700' }}>
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
                      style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
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
                      style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                    />

                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                    />

                    <input
                      type="text"
                      placeholder="Area / Locality *"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                    />

                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="City *"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(212, 175, 55, 0.3)', background: 'rgba(28, 28, 28, 0.7)', color: '#fff' }}
                    />

                    <button
                      onClick={saveAddress}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        fontSize: '14px'
                      }}
                    >
                      {loading ? '⏳ Saving...' : 'Save Address'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Confirm Button */}
        {addresses.length > 0 && !showAddressForm && (
          <div style={{
            padding: '20px 24px',
            borderTop: '2px solid rgba(212, 175, 55, 0.2)',
            position: 'sticky',
            bottom: 0,
            background: 'linear-gradient(135deg, #1c1c1c 0%, #0f0e09 100%)'
          }}>
            <button
              onClick={handleConfirm}
              disabled={!selectedAddress}
              style={{
                width: '100%',
                padding: '14px',
                background: selectedAddress ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                cursor: selectedAddress ? 'pointer' : 'not-allowed',
                opacity: selectedAddress ? 1 : 0.5,
                transition: 'all 0.3s ease'
              }}
            >
              {selectedAddress ? '✓ Confirm Address' : 'Select an address'}
            </button>
          </div>
        )}
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
    fullAddress: '',
    coordinates: null,
    deliveryInfo: null
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