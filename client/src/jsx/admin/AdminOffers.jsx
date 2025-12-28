import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import "./AdminOffers.css";

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 UNIVERSAL OFFER FORM
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    code: "OFFER",
    icon: "🎁",
    bgColor: "#FF6B6B",
    bgColorAlt: "#FF8E8E",
    isActive: true
  });

  useEffect(() => {
    loadOffers();
  }, []);

  // 🔥 LOAD ALL OFFERS FROM 'offers' COLLECTION
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

  // 🔥 ADD OFFER TO 'offers' COLLECTION
  const addOffer = async () => {
    if (!offerForm.title.trim()) {
      alert("❌ Please enter offer title");
      return;
    }

    if (!offerForm.code.trim()) {
      alert("❌ Please enter offer code");
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

  // 🔥 TOGGLE OFFER ACTIVE/INACTIVE
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

  // 🔥 DELETE OFFER
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
  const inactiveOffersCount = offers.filter(o => !o.isActive).length;

  return (
    <div className="admin-offers-container">
      
      {/* HEADER */}
      <div className="offers-header">
        <h1>🎁 Universal Offers Management</h1>
        <p>Create offers that appear on Home Page, Navbar, Menu Page & Cart Page</p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(72, 196, 121, 0.1)', border: '2px solid #48c479', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#48c479', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>ACTIVE OFFERS</p>
          <p style={{ color: '#48c479', fontSize: '32px', margin: 0, fontWeight: '800' }}>{activeOffersCount}</p>
        </div>
        <div style={{ background: 'rgba(255, 215, 0, 0.1)', border: '2px solid #ffd700', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#ffd700', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>INACTIVE OFFERS</p>
          <p style={{ color: '#ffd700', fontSize: '32px', margin: 0, fontWeight: '800' }}>{inactiveOffersCount}</p>
        </div>
        <div style={{ background: 'rgba(100, 150, 255, 0.1)', border: '2px solid #6496ff', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#6496ff', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>TOTAL OFFERS</p>
          <p style={{ color: '#6496ff', fontSize: '32px', margin: 0, fontWeight: '800' }}>{offers.length}</p>
        </div>
      </div>

      {/* 🔥 ADD OFFER FORM */}
      <div className="offers-content">
        <div className="offer-form-section">
          <h2>➕ Add New Universal Offer</h2>
          <p className="form-subtitle">Appears on: Home Page • Navbar Banner • Menu Page • Cart Page</p>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Offer Title *</label>
              <input
                type="text"
                placeholder="e.g., Get upto ₹250 off on orders above ₹500"
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="e.g., Enjoy maximum ₹250 discount on orders of ₹500 or more"
                value={offerForm.description}
                onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                className="form-input"
              />
            </div>

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

            <div className="form-group">
              <label>Primary Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={offerForm.bgColor}
                  onChange={(e) => setOfferForm({ ...offerForm, bgColor: e.target.value })}
                  className="color-picker"
                />
                <span className="color-value">{offerForm.bgColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Secondary Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={offerForm.bgColorAlt}
                  onChange={(e) => setOfferForm({ ...offerForm, bgColorAlt: e.target.value })}
                  className="color-picker"
                />
                <span className="color-value">{offerForm.bgColorAlt}</span>
              </div>
            </div>

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
            {loading ? "⏳ Adding..." : "+ Add Universal Offer"}
          </button>
        </div>

        {/* 🔥 CURRENT OFFERS LIST */}
        <div className="offers-list-section">
          <h2>All Universal Offers ({offers.length})</h2>
          
          {offers.length === 0 ? (
            <div className="empty-state">
              <p>📭 No offers yet. Create your first offer above!</p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.map((offer) => (
                <div key={offer.id} className="offer-list-card" style={{ opacity: offer.isActive ? 1 : 0.6 }}>
                  {/* Preview Card */}
                  <div
                    className="offer-preview-mini"
                    style={{
                      background: `linear-gradient(135deg, ${offer.bgColor} 0%, ${offer.bgColorAlt} 100%)`
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{offer.icon}</span>
                    <p>{offer.code}</p>
                  </div>

                  {/* Details */}
                  <div className="offer-list-details">
                    <h3>{offer.icon} {offer.title}</h3>
                    <p>{offer.description || "No description"}</p>
                    <div className="offer-list-meta">
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        Code: <strong>{offer.code}</strong>
                      </span>
                      <span className={`status ${offer.isActive ? "active" : "inactive"}`}>
                        {offer.isActive ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
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