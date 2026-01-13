import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import "./AdminOffers.css";

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 ADVANCED OFFER FORM
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    code: "OFFER",
    icon: "🎁",
    offerType: "flat", // flat, percentage, category, free_item
    discountValue: 0, // 99 or 20 (for percentage)
    minOrderAmount: 0, // Minimum cart amount
    maxDiscount: 0, // Cap on discount (e.g., max ₹250)
    applicableCategory: "", // e.g., "burgers", "pizzas"
    minItemCount: 1,
    bgColor: "#FF6B6B",
    bgColorAlt: "#FF8E8E",
    isActive: true
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const offersRef = collection(db, "offers");
      const offersSnapshot = await getDocs(offersRef);
      const offersData = [];
      
      offersSnapshot.forEach((doc) => {
        offersData.push({ 
          id: doc.id, 
          ...doc.data() 
        });
      });
      
      setOffers(offersData);
      console.log("Loaded offers:", offersData);
    } catch (err) {
      console.error("Error loading offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const addOffer = async () => {
    if (!offerForm.title.trim()) {
      alert("❌ Please enter offer title");
      return;
    }

    if (!offerForm.code.trim()) {
      alert("❌ Please enter offer code");
      return;
    }

    if (offerForm.discountValue <= 0) {
      alert("❌ Please enter discount value");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "offers"), {
        ...offerForm,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setOfferForm({
        title: "",
        description: "",
        code: "OFFER",
        icon: "🎁",
        offerType: "flat",
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscount: 0,
        applicableCategory: "",
        minItemCount: 1,
        bgColor: "#FF6B6B",
        bgColorAlt: "#FF8E8E",
        isActive: true
      });

      loadOffers();
      alert("✅ Offer added successfully!");
    } catch (err) {
      console.error("Error adding offer:", err);
      alert("❌ Failed to add offer");
    } finally {
      setLoading(false);
    }
  };

  const toggleOffer = async (id, isActive) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "offers", id), {
        isActive: !isActive
      });
      loadOffers();
    } catch (err) {
      console.error("Error updating offer:", err);
      alert("❌ Failed to update offer");
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, "offers", id));
        loadOffers();
        alert("✅ Offer deleted!");
      } catch (err) {
        console.error("Error deleting offer:", err);
        alert("❌ Failed to delete offer");
      } finally {
        setLoading(false);
      }
    }
  };

  const activeOffersCount = offers.filter(o => o.isActive).length;

  return (
    <div className="admin-offers-container">
      <div className="offers-header">
        <h1>🎁 Multi-Functional Offers Management</h1>
        <p>Create smart offers with conditions, categories, and smart validation</p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(72, 196, 121, 0.1)', border: '2px solid #48c479', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#48c479', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>ACTIVE OFFERS</p>
          <p style={{ color: '#48c479', fontSize: '32px', margin: 0, fontWeight: '800' }}>{activeOffersCount}</p>
        </div>
        <div style={{ background: 'rgba(255, 215, 0, 0.1)', border: '2px solid #ffd700', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#ffd700', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>TOTAL OFFERS</p>
          <p style={{ color: '#ffd700', fontSize: '32px', margin: 0, fontWeight: '800' }}>{offers.length}</p>
        </div>
        <div style={{ background: 'rgba(100, 150, 255, 0.1)', border: '2px solid #6496ff', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#6496ff', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>OFFER TYPES</p>
          <p style={{ color: '#6496ff', fontSize: '32px', margin: 0, fontWeight: '800' }}>4</p>
        </div>
      </div>

      <div className="offers-content">
        {/* ADD OFFER FORM */}
        <div className="offer-form-section">
          <h2>➕ Add Smart Offer</h2>
          
          <div className="form-grid">
            {/* Title */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Offer Title *</label>
              <input
                type="text"
                placeholder="e.g., Get upto ₹250 off on orders above ₹500"
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                className="form-input"
              />
            </div>

            {/* Offer Code */}
            <div className="form-group">
              <label>Offer Code *</label>
              <input
                type="text"
                placeholder="e.g., 250OFF"
                value={offerForm.code}
                onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                className="form-input"
              />
            </div>

            {/* Icon */}
            <div className="form-group">
              <label>Icon (Emoji)</label>
              <input
                type="text"
                placeholder="💰"
                maxLength="2"
                value={offerForm.icon}
                onChange={(e) => setOfferForm({ ...offerForm, icon: e.target.value })}
                className="form-input emoji-input"
              />
            </div>

            {/* Offer Type */}
            <div className="form-group">
              <label>Offer Type *</label>
              <select
                value={offerForm.offerType}
                onChange={(e) => setOfferForm({ ...offerForm, offerType: e.target.value })}
                className="form-input"
              >
                <option value="flat">💳 Flat Discount (₹99 off)</option>
                <option value="percentage">📊 Percentage (20% off)</option>
                <option value="category">🍕 Category-Specific (Off on Burgers)</option>
                <option value="free_item">🎁 Free Item (Free dessert)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div className="form-group">
              <label>Discount Value *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder={offerForm.offerType === "percentage" ? "20" : "99"}
                  value={offerForm.discountValue}
                  onChange={(e) => setOfferForm({ ...offerForm, discountValue: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
                <span style={{ padding: '8px 12px', background: '#333', borderRadius: '6px', color: '#ffd700', fontWeight: '700' }}>
                  {offerForm.offerType === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </div>

            {/* Min Order Amount */}
            <div className="form-group">
              <label>Min Order Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g., 500"
                value={offerForm.minOrderAmount}
                onChange={(e) => setOfferForm({ ...offerForm, minOrderAmount: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
            </div>

            {/* Max Discount Cap */}
            <div className="form-group">
              <label>Max Discount Cap (₹)</label>
              <input
                type="number"
                placeholder="e.g., 250"
                value={offerForm.maxDiscount}
                onChange={(e) => setOfferForm({ ...offerForm, maxDiscount: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
            </div>

            {/* Category */}
            {offerForm.offerType === "category" && (
              <div className="form-group">
                <label>Applicable Category</label>
                <select
                  value={offerForm.applicableCategory}
                  onChange={(e) => setOfferForm({ ...offerForm, applicableCategory: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select category...</option>
                  <option value="burgers">Burgers</option>
                  <option value="pizzas">Pizzas</option>
                  <option value="wraps">Wraps</option>
                  <option value="desserts">Desserts</option>
                  <option value="drinks">Drinks</option>
                </select>
              </div>
            )}

            {/* Description */}
            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label>Description</label>
              <input
                type="text"
                placeholder="Additional details about this offer"
                value={offerForm.description}
                onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                className="form-input"
              />
            </div>

            {/* Colors */}
            <div className="form-group">
              <label>Primary Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={offerForm.bgColor}
                  onChange={(e) => setOfferForm({ ...offerForm, bgColor: e.target.value })}
                  className="color-picker"
                />
                <span style={{ padding: '8px 12px', background: '#333', borderRadius: '6px', color: '#fff', flex: 1 }}>
                  {offerForm.bgColor}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Secondary Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={offerForm.bgColorAlt}
                  onChange={(e) => setOfferForm({ ...offerForm, bgColorAlt: e.target.value })}
                  className="color-picker"
                />
                <span style={{ padding: '8px 12px', background: '#333', borderRadius: '6px', color: '#fff', flex: 1 }}>
                  {offerForm.bgColorAlt}
                </span>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="form-group checkbox-group" style={{ gridColumn: 'span 3' }}>
              <label>
                <input
                  type="checkbox"
                  checked={offerForm.isActive}
                  onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                />
                <span>Active (Show on all pages)</span>
              </label>
            </div>
          </div>

          <button
            onClick={addOffer}
            disabled={loading}
            className="btn-add-offer"
          >
            {loading ? "⏳ Adding..." : "+ Add Smart Offer"}
          </button>
        </div>

        {/* OFFERS LIST */}
        <div className="offers-list-section">
          <h2>All Offers ({offers.length})</h2>
          
          {offers.length === 0 ? (
            <div className="empty-state">
              <p>📭 No offers yet. Create your first offer above!</p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.map((offer) => (
                <div key={offer.id} className="offer-list-card" style={{ opacity: offer.isActive ? 1 : 0.6 }}>
                  <div
                    className="offer-preview-mini"
                    style={{
                      background: `linear-gradient(135deg, ${offer.bgColor} 0%, ${offer.bgColorAlt} 100%)`
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{offer.icon}</span>
                    <p>{offer.code}</p>
                  </div>

                  <div className="offer-list-details">
                    <h3>{offer.icon} {offer.title}</h3>
                    <p>{offer.description || "No description"}</p>
                    
                    <div style={{ fontSize: '12px', color: '#999', margin: '10px 0', lineHeight: '1.6' }}>
                      {offer.offerType === "flat" && <p>💳 ₹{offer.discountValue} off</p>}
                      {offer.offerType === "percentage" && <p>📊 {offer.discountValue}% off</p>}
                      {offer.offerType === "category" && <p>🍕 Off on {offer.applicableCategory}</p>}
                      {offer.offerType === "free_item" && <p>🎁 Free item</p>}
                      {offer.minOrderAmount > 0 && <p>📦 Min order: ₹{offer.minOrderAmount}</p>}
                      {offer.maxDiscount > 0 && <p>📊 Max cap: ₹{offer.maxDiscount}</p>}
                    </div>

                    <div className="offer-list-meta">
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        Code: <strong>{offer.code}</strong>
                      </span>
                      <span className={`status ${offer.isActive ? "active" : "inactive"}`}>
                        {offer.isActive ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="offer-list-actions">
                    <button
                      onClick={() => toggleOffer(offer.id, offer.isActive)}
                      disabled={loading}
                      className={`btn-toggle ${offer.isActive ? "active" : "inactive"}`}
                    >
                      {offer.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      disabled={loading}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}