// PaymentSuccess.jsx - UPDATED VERSION WITH ANIMATIONS
// ⚠️ REMOVED duplicate order creation - Payment.jsx already creates it

import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { LoyaltyContext } from "../context/LoyaltyContext";
import { deductStockForOrder } from "../lib/services/StockService";
import VoucherUnlockedPopup from "./VoucherUnlockedPopup";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addPoints } = useContext(LoyaltyContext);
  
  const [processed, setProcessed] = useState(false);
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);
  const [unlockedVoucher, setUnlockedVoucher] = useState(null);
  const [error, setError] = useState(null);
  const [stockError, setStockError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { orderId, total, address, suggestion, noContact, cart, appliedVoucher } =
    location.state || {};

  useEffect(() => {
    async function processPostPayment() {
      // ⚠️ DON'T create order again - Payment.jsx already did it!
      if (!location.state || processed) return;
      setProcessed(true);

      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        console.log("📝 Processing post-payment tasks for order:", orderId);
        
        // ✅ ORDER ALREADY SAVED BY Payment.jsx - Just do stock & loyalty

        // 1️⃣ DEDUCT STOCK FROM INGREDIENTS
        try {
          console.log("📦 Deducting stock for items...");
          const stockResult = await deductStockForOrder(cart);
          console.log("✅ Stock deducted successfully:", stockResult);
        } catch (stError) {
          console.error("⚠️ Stock deduction error:", stError);
          setStockError(stError.message);
          // Continue - don't block the flow
        }

        // 2️⃣ ADD LOYALTY POINTS
        if (!addPoints) {
          setError("Loyalty context not available");
          setLoading(false);
          return;
        }

        const loyaltyResult = await addPoints(
          orderId,
          total,
          { cart, address }
        );

        console.log("⭐ Loyalty Result:", loyaltyResult);

        // 3️⃣ SHOW POPUP FOR EARNED POINTS AND UNLOCKED VOUCHERS
        if (loyaltyResult) {
          setUnlockedVoucher({
            amount: loyaltyResult.voucherAmount || 0,
            earnedPoints: loyaltyResult.earnedPoints || 0,
            vouchersUnlocked: loyaltyResult.vouchersUnlocked || 0,
          });
          setShowVoucherPopup(true);
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Error in post-payment processing:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    processPostPayment();
  }, [location.state, processed, addPoints]);

  if (!location.state) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#ff4d4d" }}>
        ⚠ Order details missing
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#ff4d4d" }}>
        ⚠ Error: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0f0e09,#1c1c1c)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" style={{
            width: 60,
            height: 60,
            border: "4px solid rgba(212,175,55,0.2)",
            borderTop: "4px solid #d4af37",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite"
          }}></div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Processing your order...</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Please wait while we finalize everything</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0f0e09,#1c1c1c)",
        padding: "40px 20px",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* SUCCESS HEADER WITH ANIMATED TICK */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          {/* Animated Success Circle with Tick */}
          <div className="success-checkmark" style={{
            width: 120,
            height: 120,
            margin: "0 auto 30px",
            position: "relative"
          }}>
            {/* Outer Circle with Scale Animation */}
            <div className="check-icon-circle" style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(34, 197, 94, 0.4)",
              animation: "scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
            }}>
              {/* Checkmark with Draw Animation */}
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 30,
                    animation: "drawCheck 0.6s 0.3s ease-out forwards"
                  }}
                />
              </svg>
            </div>
            {/* Success Ring Pulse */}
            <div className="success-ring" style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "3px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "50%",
              animation: "ringPulse 2s infinite"
            }}></div>
          </div>

          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              background: "linear-gradient(135deg,#ffd700,#d4af37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 10,
              animation: "fadeInUp 0.6s 0.5s backwards"
            }}
          >
            Payment Successful!
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 16,
            animation: "fadeInUp 0.6s 0.7s backwards"
          }}>
            Your order is confirmed and being prepared
          </p>
        </div>

        {/* STOCK ERROR WARNING (if any) */}
        {stockError && (
          <div
            style={{
              background: "linear-gradient(135deg, #ff6b6b, #ee5a6f)",
              border: "2px solid #ff3333",
              borderRadius: 12,
              padding: 16,
              marginBottom: 30,
              color: "#fff",
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: 8 }}>
              ⚠️ Stock Update Warning
            </p>
            <p style={{ margin: 0, fontSize: 14 }}>
              {stockError}
            </p>
          </div>
        )}

        {/* CARD */}
        <div
          style={{
            background: "linear-gradient(135deg,#1c1c1c,#0f0e09)",
            borderRadius: 18,
            padding: 30,
            border: "2px solid rgba(212,175,55,0.25)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* ORDER ID */}
          <div
            style={{
              background: "linear-gradient(135deg,#ffd700,#d4af37)",
              padding: 20,
              borderRadius: 14,
              textAlign: "center",
              marginBottom: 30,
              color: "#000",
            }}
          >
            <p style={{ fontSize: 13 }}>ORDER ID</p>
            <h2 style={{ fontSize: 30, margin: 0 }}>#{orderId}</h2>
          </div>

          {/* ITEMS */}
          {cart && cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 14,
                background: "#111",
                borderRadius: 10,
                marginBottom: 10,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span>{item.name} × {item.qty}</span>
              <span style={{ color: "#ffd700" }}>
                ₹{item.price * item.qty}
              </span>
            </div>
          ))}

          {/* TOTAL */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "2px solid rgba(212,175,55,0.3)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span style={{ color: "#ff4d4d" }}>₹{total}</span>
          </div>

          {/* ADDRESS */}
          <div
            style={{
              marginTop: 25,
              background: "#111",
              padding: 16,
              borderRadius: 10,
              borderLeft: "4px solid #d4af37",
            }}
          >
            <p style={{ fontWeight: 600 }}>📍 Delivery Address</p>
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              {address?.fullAddress || 
               `${address?.houseNo}, ${address?.street}, ${address?.area}, ${address?.city}`}
            </p>
            {address?.landmark && (
              <p style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                📌 {address.landmark}
              </p>
            )}
          </div>

          {/* NOTES */}
          {(noContact || suggestion) && (
            <div style={{ marginTop: 20 }}>
              {noContact && (
                <div
                  style={{
                    background: "#1a1a1a",
                    border: "2px solid #ff4d4d",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                >
                  🔒 No-contact Delivery Enabled
                </div>
              )}
              {suggestion && (
                <div
                  style={{
                    background: "#1a1a1a",
                    border: "2px solid #ffd700",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  📝 {suggestion}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 15,
            marginTop: 30,
          }}
        >
          <button
            onClick={() => {
              const message = `🎉 Order Placed!\n\nOrder ID: ${orderId}\nTotal: ₹${total}\n\nTrack your order: ${window.location.origin}/track-order`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }}
            style={{
              padding: 16,
              background: "#25d366",
              borderRadius: 12,
              border: "none",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            💬 Share WhatsApp
          </button>

          <button
            onClick={() => navigate("/order-tracking", { state: { orderId } })}
            style={{
              padding: 16,
              background: "linear-gradient(135deg,#ffd700,#d4af37)",
              borderRadius: 12,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📍 Track Order
          </button>
        </div>

        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 16,
            background: "#111",
            border: "2px solid #ffd700",
            borderRadius: 12,
            color: "#ffd700",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🏠 Continue Shopping
        </button>
      </div>

      {/* VOUCHER POPUP */}
      <VoucherUnlockedPopup
        isOpen={showVoucherPopup}
        onClose={() => setShowVoucherPopup(false)}
        voucherAmount={unlockedVoucher?.amount}
        earnedPoints={unlockedVoucher?.earnedPoints}
        vouchersUnlocked={unlockedVoucher?.vouchersUnlocked}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ringPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-16px)}
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;