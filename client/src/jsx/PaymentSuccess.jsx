// src/jsx/PaymentSuccess.jsx — BlueBliss V2.0
import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { LoyaltyContext } from "../context/LoyaltyContext";
import { CartContext } from "../context/CartContext";
import { deductStockForOrder } from "../lib/services/StockService";
import VoucherUnlockedPopup from "./VoucherUnlockedPopup";
import "./PaymentSuccess.css";

export default function PaymentSuccess() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { addPoints } = useContext(LoyaltyContext);
  const { clearCart } = useContext(CartContext);

  const [processed,        setProcessed]        = useState(false);
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);
  const [unlockedVoucher,  setUnlockedVoucher]  = useState(null);
  const [error,            setError]            = useState(null);
  const [stockError,       setStockError]       = useState(null);
  const [loading,          setLoading]          = useState(true);

  const { orderId, total, address, suggestion, noContact, cart, appliedVoucher } =
    location.state || {};

  useEffect(() => {
    async function processPostPayment() {
      if (!location.state || processed) return;
      setProcessed(true);

      const user = auth.currentUser;
      if (!user) { setError("User not authenticated"); setLoading(false); return; }

      try {
        await clearCart();

        try { await deductStockForOrder(cart); }
        catch (stErr) { setStockError(stErr.message); }

        if (!addPoints) { setError("Loyalty context not available"); setLoading(false); return; }

        const result = await addPoints(orderId, total, { cart, address }, appliedVoucher || null);

        if (result) {
          setUnlockedVoucher({
            amount:           result.voucherAmount  || 0,
            earnedPoints:     result.earnedPoints   || 0,
            vouchersUnlocked: result.rewardsUnlocked || result.vouchersUnlocked || 0,
          });
          setShowVoucherPopup(true);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    processPostPayment();
  }, [location.state, processed, addPoints]);

  const shareWhatsApp = () => {
    const msg = `🎉 Order Placed!\n\nOrder ID: ${orderId}\nTotal: ₹${total}\n\nTrack: ${window.location.origin}/order-tracking`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  /* ── Guards ── */
  if (!location.state) return (
    <div className="success-page">
      <div className="success-error-state">
        <span className="success-error-icon">⚠️</span>
        <p>Order details missing</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="success-page">
      <div className="success-error-state">
        <span className="success-error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="success-page">
      <div className="success-loading">
        <div className="success-spinner" />
        <h2 className="success-loading-title">Processing your order…</h2>
        <p className="success-loading-sub">Please wait while we finalise everything</p>
      </div>
    </div>
  );

  /* ── Success ── */
  return (
    <div className="success-page">
      <div className="success-content">

        {/* ── Animated check ── */}
        <div className="success-header">
          <div className="check-circle-wrap">
            <div className="check-circle">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline className="check-mark" points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="ring-pulse" />
          </div>
          <h1 className="success-title">Payment Successful!</h1>
          <p className="success-subtitle">Your order is confirmed and being prepared</p>
        </div>

        {/* ── Stock warning ── */}
        {stockError && (
          <div className="stock-warning">
            <p className="stock-warning-title">⚠️ Stock Update Warning</p>
            <p className="stock-warning-text">{stockError}</p>
          </div>
        )}

        {/* ── Order card ── */}
        <div className="order-card">

          <div className="order-id-banner">
            <p className="order-id-label">ORDER ID</p>
            <h2 className="order-id-value">#{orderId}</h2>
          </div>

          <div className="order-items">
            {cart?.map(item => (
              <div key={item.id} className="order-item-row">
                <span className="order-item-name">{item.name} × {item.qty}</span>
                <span className="order-item-price">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="order-total-row">
            <span>Total</span>
            <span className="order-total-amount">₹{total}</span>
          </div>

          <div className="delivery-address-box">
            <p className="delivery-address-label">📍 Delivery Address</p>
            <p className="delivery-address-text">
              {address?.fullAddress ||
               `${address?.houseNo ? address.houseNo+', ' : ''}${address?.street}, ${address?.area}, ${address?.city}`}
            </p>
            {address?.landmark && (
              <p className="delivery-address-landmark">📌 {address.landmark}</p>
            )}
          </div>

          {(noContact || suggestion) && (
            <div className="special-notes">
              {noContact  && <div className="note-badge no-contact">🔒 No-contact Delivery Enabled</div>}
              {suggestion && <div className="note-badge suggestion">📝 {suggestion}</div>}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="success-actions">
          <div className="success-actions-row">
            <button className="success-btn wa-btn"    onClick={shareWhatsApp}>💬 Share on WhatsApp</button>
            <button className="success-btn track-btn" onClick={() => navigate("/order-tracking")}>📍 Track Order</button>
          </div>
          <button className="success-btn home-btn" onClick={() => navigate("/")}>🏠 Continue Shopping</button>
        </div>

      </div>

      <VoucherUnlockedPopup
        isOpen={showVoucherPopup}
        onClose={() => setShowVoucherPopup(false)}
        voucherAmount={unlockedVoucher?.amount}
        earnedPoints={unlockedVoucher?.earnedPoints}
        vouchersUnlocked={unlockedVoucher?.vouchersUnlocked}
      />
    </div>
  );
}