import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const { orderId, total, address, suggestion, noContact, cart } =
    location.state || {};

  useEffect(() => {
    async function saveOrder() {
      if (!location.state || saved) return;
      setSaved(true);

      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "orders"), {
        orderId,
        userId: user.uid,
        cart,
        total,
        address,
        suggestion: suggestion || "",
        noContact: !!noContact,
        status: "pending",
        paymentStatus: "paid",
        createdAt: Timestamp.now(),
      });
    }

    saveOrder();
  }, [location.state, saved]);

  if (!location.state) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#ff4d4d" }}>
        ⚠ Order details missing
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

        {/* SUCCESS HEADER */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 80, color: "#d4af37", animation: "bounce 1s" }}>
            ✔
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              background: "linear-gradient(135deg,#ffd700,#d4af37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Order Successful
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            Your food is being prepared
          </p>
        </div>

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
          {cart.map((item) => (
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
              {address.houseNo}, {address.street}, {address.area},{" "}
              {address.city}
            </p>
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
            style={{
              padding: 16,
              background: "#25d366",
              borderRadius: 12,
              border: "none",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            💬 Share WhatsApp
          </button>

          <button
            onClick={() => navigate("/track-order", { state: { orderId } })}
            style={{
              padding: 16,
              background: "linear-gradient(135deg,#ffd700,#d4af37)",
              borderRadius: 12,
              border: "none",
              fontWeight: 700,
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
          }}
        >
          🏠 Continue Shopping
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-16px)}
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
