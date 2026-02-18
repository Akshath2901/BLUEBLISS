// src/jsx/LiveOrderBar.jsx
// Swiggy-style persistent bottom bar — shows only for orders placed in last 24h

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import "./LiveOrderBar.css";

const ACTIVE_STATUSES = ["pending","approved","confirmed","preparing","ready",
                         "out-for-delivery","out_for_delivery","picked"];

const STATUS_META = {
  pending:             { label: "Confirming your order...",          dot: "#ff9800", step: 0 },
  approved:            { label: "Confirmed! Being prepared 🔥",      dot: "#2196f3", step: 1 },
  confirmed:           { label: "Confirmed! Being prepared 🔥",      dot: "#2196f3", step: 1 },
  preparing:           { label: "Freshly cooking for you 👨‍🍳",     dot: "#ff5722", step: 2 },
  ready:               { label: "Packed & ready 📦",                 dot: "#8bc34a", step: 3 },
  "out-for-delivery":  { label: "On the way • ~20 mins 🛵",          dot: "#ffd700", step: 4 },
  out_for_delivery:    { label: "On the way • ~20 mins 🛵",          dot: "#ffd700", step: 4 },
  picked:              { label: "On the way • ~20 mins 🛵",          dot: "#ffd700", step: 4 },
};

const STEPS = [
  { icon: "🧾", label: "Placed"    },
  { icon: "✅", label: "Confirmed" },
  { icon: "🍳", label: "Preparing" },
  { icon: "📦", label: "Packed"    },
  { icon: "🛵", label: "On way"    },
];

export default function LiveOrderBar() {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [expanded, setExpanded]       = useState(false);
  const [pulse, setPulse]             = useState(false);
  const [prevStatus, setPrevStatus]   = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setActiveOrder(null); return; }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

      const found = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find(o => {
          if (!ACTIVE_STATUSES.includes(o.status)) return false;
          // Only treat as active if placed within last 24 hours
          const createdMs = o.createdAt?.toMillis
            ? o.createdAt.toMillis()
            : o.createdAt?.seconds
              ? o.createdAt.seconds * 1000
              : 0;
          return createdMs > cutoff;
        });

      if (found) {
        if (prevStatus && prevStatus !== found.status) {
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);
        }
        setPrevStatus(found.status);
        setActiveOrder(found);
      } else {
        setActiveOrder(null);
      }
    }, err => console.warn("LiveOrderBar:", err.message));

    return () => unsub();
  }, [user]);

  if (!activeOrder) return null;

  const status  = activeOrder.status || "pending";
  const meta    = STATUS_META[status] || STATUS_META.pending;
  const stepIdx = meta.step;
  const orderId = (activeOrder.orderId || activeOrder.id || "").toString().slice(-6).toUpperCase();
  const total   = activeOrder.total || 0;

  return (
    <div className={`live-order-bar ${expanded ? "expanded" : ""} ${pulse ? "pulse" : ""}`}>

      {/* ── Always-visible strip ── */}
      <div className="lob-strip" onClick={() => setExpanded(p => !p)}>
        <div className="lob-left">
          <span className="lob-dot" style={{ background: meta.dot, boxShadow: `0 0 8px ${meta.dot}` }} />
          <div className="lob-text">
            <span className="lob-eta">{meta.label}</span>
            <span className="lob-id">Order #{orderId} · ₹{total}</span>
          </div>
        </div>
        <div className="lob-right">
          <button className="lob-track-btn"
            onClick={e => { e.stopPropagation(); navigate("/order-tracking"); }}>
            Track
          </button>
          <span className="lob-chevron">{expanded ? "▼" : "▲"}</span>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="lob-expanded">
          <div className="lob-steps">
            {STEPS.map((step, i) => {
              const done    = i < stepIdx;
              const current = i === stepIdx;
              return (
                <div key={i} className={`lob-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                  <div className="lob-step-icon">{done ? "✓" : step.icon}</div>
                  {i < STEPS.length - 1 && <div className={`lob-step-line ${done ? "done" : ""}`} />}
                  <span className="lob-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {activeOrder.cart?.length > 0 && (
            <div className="lob-items">
              <p className="lob-items-label">Your order</p>
              <div className="lob-items-list">
                {activeOrder.cart.slice(0, 3).map((item, i) => (
                  <span key={i} className="lob-item-chip">{item.qty}× {item.name}</span>
                ))}
                {activeOrder.cart.length > 3 && (
                  <span className="lob-item-chip muted">+{activeOrder.cart.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          <button className="lob-full-track-btn" onClick={() => navigate("/order-tracking")}>
            View Full Order Details →
          </button>
        </div>
      )}
    </div>
  );
}