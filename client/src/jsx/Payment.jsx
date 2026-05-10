// src/jsx/Payment.jsx — BlueBliss V2.0
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import "./Payment.css";

const RESTAURANT_INFO = {
  name: "Blue Bliss",
  address: "opp. chikalguda, Railway Colony, police station, Secunderabad, Telangana 500061",
  coordinates: { lat: 17.430833225925735, lng: 78.5133938400985 },
  phone: "+91-7569534271",
};

export default function Payment() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [loading,       setLoading]       = useState(false);
  const [userData,      setUserData]      = useState(null);
  const [fetchingUser,  setFetchingUser]  = useState(true);

  const {
    total, address, suggestion, noContact, cart, orderId,
    appliedOffer, offerDiscount, appliedVoucher, voucherDiscount, totalDiscount,
  } = location.state || {};

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) { setFetchingUser(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setUserData(snap.exists()
          ? snap.data()
          : { name: user.displayName || "User", email: user.email, phone: user.phoneNumber || "" }
        );
      } catch {
        setUserData({ name: user.displayName || "User", email: user.email, phone: "" });
      } finally { setFetchingUser(false); }
    };
    fetchUser();
  }, []);

  const handlePayment = async () => {
    if (!cart?.length) { alert("Your cart is empty!"); return; }
    if (!address)      { alert("Please select a delivery address"); return; }

    setLoading(true);
    const finalOrderId = orderId || `ORD-${Date.now()}`;
    const user = auth.currentUser;

    setTimeout(async () => {
      try {
        const orderData = {
          orderId: finalOrderId, userId: user?.uid || "guest",
          status: "pending",
          createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
          cart, total: Number(total),
          address: {
            label: address.label || "home",
            fullAddress: address.fullAddress ||
              `${address.houseNo ? address.houseNo+', ' : ''}${address.street}, ${address.area}, ${address.city}`,
            houseNo: address.houseNo || "", street: address.street || "",
            area: address.area || "", city: address.city || "",
            state: address.state || "", pincode: address.pincode || "",
            landmark: address.landmark || "",
            coordinates: address.coordinates || null,
            deliveryInfo: address.deliveryInfo || null,
          },
          restaurant: RESTAURANT_INFO,
          customer: {
            name:   userData?.name  || user?.displayName || "Guest",
            phone:  userData?.phone || user?.phoneNumber || "",
            email:  userData?.email || user?.email || "guest@example.com",
            userId: user?.uid || "guest",
          },
          delivery: {
            partner: null, taskId: null, trackingUrl: null, currentLocation: null,
            estimatedDelivery: null,
            agent: { name:null, phone:null, vehicleNo:null },
            partnerStatus: null, assignedAt: null, pickedUpAt: null, deliveredAt: null,
            deliveryFee: 42, partnerCharges: null, failureReason: null,
          },
          payment: {
            method: "online", status: "completed",
            transactionId: `TXN-${Date.now()}`, codAmount: 0,
          },
          suggestion: suggestion || "", noContact: noContact || false,
          appliedOffer: appliedOffer || null, offerDiscount: offerDiscount || 0,
          appliedVoucher: appliedVoucher || null, voucherDiscount: voucherDiscount || 0,
          totalDiscount: totalDiscount || 0,
        };

        const docRef = await addDoc(collection(db, "orders"), orderData);

        navigate("/payment-success", {
          state: {
            orderId: finalOrderId, total, address, cart,
            suggestion, noContact, firestoreId: docRef.id,
          },
        });
      } catch(err) {
        console.error(err);
        alert("Failed to create order. Please try again.");
        setLoading(false);
      }
    }, 1500);
  };

  /* ── Loading user data ── */
  if (fetchingUser) return (
    <div className="payment-page">
      <div className="payment-loading">
        <div className="payment-spinner" />
        <p>Loading…</p>
      </div>
    </div>
  );

  /* ── Main ── */
  return (
    <div className="payment-page">
      <h1 className="payment-title">Secure Payment</h1>

      <div className="payment-wrapper">
        {/* LEFT — Order Summary */}
        <div className="payment-left">
          <div className="payment-card">
            <h2 className="payment-card-heading">Order Summary</h2>

            {/* Customer info */}
            {userData && (
              <div className="payment-customer-box">
                <p className="payment-customer-label">👤 Ordering As</p>
                <p className="payment-customer-name">{userData.name}</p>
                <p className="payment-customer-meta">📧 {userData.email}</p>
                {userData.phone && (
                  <p className="payment-customer-meta">📱 {userData.phone}</p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="items-list">
              {cart?.map(item => (
                <div key={item.id} className="payment-item">
                  <div>
                    <p className="payment-item-label">{item.name}</p>
                    <p className="payment-item-sub">₹{item.price} × {item.qty}</p>
                  </div>
                  <span className="payment-item-price">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="payment-total-row">
              <span className="payment-total-label">Total</span>
              <span className="payment-total-amount">₹{total}</span>
            </div>

            {/* Address */}
            <div className="payment-address-box">
              <h3 className="payment-address-heading">📍 Delivery Address</h3>
              <p className="payment-address-text">
                {address?.fullAddress ||
                 `${address?.houseNo ? address.houseNo+', ' : ''}${address?.street}, ${address?.area}, ${address?.city}`}
              </p>
              {address?.landmark && (
                <p className="payment-address-landmark">📌 {address.landmark}</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Payment options */}
        <div className="payment-right">
          <div className="payment-card">
            <h2 className="payment-card-heading">Payment Options</h2>

            <label className="payment-option selected">
              <input type="radio" name="pay" defaultChecked />
              <span className="payment-option-inner">
                <span className="payment-option-icon">💳</span>
                <span>UPI (Google Pay / PhonePe)</span>
              </span>
            </label>

            <label className="payment-option">
              <input type="radio" name="pay" />
              <span className="payment-option-inner">
                <span className="payment-option-icon">💰</span>
                <span>Cash on Delivery</span>
              </span>
            </label>

            <button className="pay-now-btn"
              onClick={handlePayment}
              disabled={loading || !cart?.length}>
              {loading ? "Processing…" : `PAY  ₹${total}`}
            </button>

            <p className="secure-badge">🔒 Your payment is 100% secure</p>
          </div>
        </div>
      </div>
    </div>
  );
}