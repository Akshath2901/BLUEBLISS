// src/jsx/OrderTracking.jsx — BlueBliss V2.0
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import "./OrderTracking.css";

/* ── Constants ─────────────────────────────────────────────── */
const ACTIVE_STATUSES = [
  "pending","approved","confirmed","preparing","ready",
  "out-for-delivery","out_for_delivery","picked",
];
const COMPLETED_STATUSES = ["completed","delivered"];

const STEPS = [
  { label:"Order Placed", icon:"🧾", statuses:["pending"] },
  { label:"Confirmed",    icon:"✅", statuses:["approved","confirmed"] },
  { label:"Preparing",    icon:"👨‍🍳", statuses:["preparing","ready"] },
  { label:"On the Way",   icon:"🛵", statuses:["out-for-delivery","out_for_delivery","picked"] },
  { label:"Delivered",    icon:"🎉", statuses:["completed","delivered"] },
];

const STATUS_COLOR = {
  pending:"#FF9800", approved:"#2196F3", confirmed:"#2196F3",
  preparing:"#FF5722", ready:"#8BC34A",
  "out-for-delivery":"#F2C35A", out_for_delivery:"#F2C35A", picked:"#F2C35A",
  completed:"#4CAF50", delivered:"#4CAF50",
};

const STATUS_MSG = {
  pending:           "Waiting for the restaurant to confirm your order…",
  approved:          "Confirmed! Being freshly prepared for you. 🍳",
  confirmed:         "Confirmed! Being freshly prepared for you. 🍳",
  preparing:         "Cooking in progress — almost ready! 🔥",
  ready:             "Packed & ready — assigning delivery partner…",
  "out-for-delivery":"On the way! Estimated ~20 mins. 🛵",
  out_for_delivery:  "On the way! Estimated ~20 mins. 🛵",
  picked:            "On the way! Estimated ~20 mins. 🛵",
  completed:         "Delivered! Enjoy your meal. 🎉",
  delivered:         "Delivered! Enjoy your meal. 🎉",
};

function getStepIndex(status) {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

/* ══════════════════════════════════════════════════════════ */
export default function OrderTracking() {
  const navigate = useNavigate();
  const [user,        setUser]        = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [lastOrder,   setLastOrder]   = useState(null);
  const [loading,     setLoading]     = useState(true);

  /* ── Auth ── */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ── Real-time orders ── */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const active = all.find(o => {
        if (!ACTIVE_STATUSES.includes(o.status)) return false;
        const ms = o.createdAt?.toMillis
          ? o.createdAt.toMillis()
          : (o.createdAt?.seconds ? o.createdAt.seconds * 1000 : 0);
        return ms > cutoff;
      });

      setActiveOrder(active || null);
      setLastOrder(all.find(o => COMPLETED_STATUSES.includes(o.status)) || null);
      setLoading(false);
    }, err => { console.error("OrderTracking:", err.message); setLoading(false); });

    return () => unsub();
  }, [user]);

  /* ── Loading ── */
  if (loading) return (
    <div className="ot-page ot-centered">
      <span className="ot-spin-emoji">🍽️</span>
      <p className="ot-loading-text">Loading…</p>
    </div>
  );

  /* ── Auth guard ── */
  if (!user) return (
    <div className="ot-page ot-centered">
      <span className="ot-state-icon">🔒</span>
      <h2 className="ot-state-title">Please log in</h2>
      <button className="ot-gold-btn" onClick={() => navigate("/login")}>Log In</button>
    </div>
  );

  /* ── No active order ── */
  if (!activeOrder) return (
    <div className="ot-page">
      <div className="ot-top-bar">
        <button className="ot-back" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="ot-centered">
        <span className="ot-state-icon">📦</span>
        <h2 className="ot-state-title">No active orders</h2>
        <p className="ot-state-sub">
          Once you place an order it will appear here with live updates.
        </p>

        {/* Last delivered order preview */}
        {lastOrder && (
          <div className="ot-last-order-card">
            <p className="ot-last-order-label">✅ Last Order · Delivered</p>
            {lastOrder.cart?.slice(0, 3).map((item, i) => (
              <div key={i} className={`ot-last-item ${i < Math.min(lastOrder.cart.length, 3) - 1 ? 'bordered' : ''}`}>
                <span className="ot-last-item-name">{item.qty}× {item.name}</span>
                <span className="ot-last-item-price">₹{item.price * item.qty}</span>
              </div>
            ))}
            {lastOrder.cart?.length > 3 && (
              <p className="ot-last-more">+{lastOrder.cart.length - 3} more items</p>
            )}
            <div className="ot-last-total">
              <span>Total paid</span>
              <span className="ot-last-total-amount">₹{lastOrder.total}</span>
            </div>
          </div>
        )}

        <button className="ot-gold-btn" onClick={() => navigate("/")}>Order Again</button>
      </div>
    </div>
  );

  /* ── Active order ── */
  const status  = activeOrder.status || "pending";
  const stepIdx = getStepIndex(status);
  const color   = STATUS_COLOR[status] || "#FF9800";
  const orderId = (activeOrder.orderId || activeOrder.id || "")
    .toString().slice(-6).toUpperCase();

  return (
    // CSS variable for dynamic status color — single source of truth
    <div className="ot-page" style={{ "--oc": color, "--oc-glow": `${color}55` }}>

      {/* ── Sticky header ── */}
      <div className="ot-sticky-header">
        <button className="ot-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="ot-header-row">
          <div>
            <h1 className="ot-live-title">Live Order</h1>
            <p className="ot-order-id">#{orderId}</p>
          </div>
          <div className="ot-live-badge">
            <span className="ot-live-dot" />
            <span className="ot-live-label">Live</span>
          </div>
        </div>
      </div>

      <div className="ot-body">

        {/* ── Status banner ── */}
        <div className="ot-status-banner">
          <p className="ot-banner-icon">{STEPS[stepIdx].icon}</p>
          <p className="ot-banner-label">{STEPS[stepIdx].label}</p>
          <p className="ot-banner-msg">{STATUS_MSG[status] || "Processing…"}</p>
        </div>

        {/* ── Step tracker ── */}
        <div className="ot-step-tracker">
          {STEPS.map((step, i) => {
            const done    = i < stepIdx;
            const current = i === stepIdx;
            return (
              <div key={i} className="ot-step-item">
                {/* Connector line */}
                {i > 0 && (
                  <div className={`ot-connector ${done ? 'done' : current ? 'partial' : ''}`} />
                )}
                {/* Circle */}
                <div className={`ot-step-circle ${done ? 'done' : current ? 'current' : ''}`}>
                  {done ? '✓' : step.icon}
                </div>
                {/* Label */}
                <span className={`ot-step-label ${done ? 'done' : current ? 'current' : ''}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Order items ── */}
        <div className="ot-card">
          <p className="ot-card-title">🍽️ Your Order</p>
          {activeOrder.cart?.map((item, i) => (
            <div key={i}
              className={`ot-item-row ${i < activeOrder.cart.length - 1 ? 'bordered' : ''}`}>
              <div className="ot-item-info">
                <p className="ot-item-name">{item.name}</p>
                <p className="ot-item-qty">₹{item.price} × {item.qty}</p>
              </div>
              <span className="ot-item-total">₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="ot-total-row">
            <span className="ot-total-label">Total Paid</span>
            <span className="ot-total-amount">₹{activeOrder.total}</span>
          </div>
        </div>

        {/* ── Address ── */}
        {activeOrder.address && (
          <div className="ot-card">
            <p className="ot-card-title">📍 Delivering to</p>
            <p className="ot-address-label">{activeOrder.address.label || "Home"}</p>
            <p className="ot-address-text">
              {activeOrder.address.fullAddress ||
                [activeOrder.address.houseNo, activeOrder.address.street,
                 activeOrder.address.area, activeOrder.address.city]
                  .filter(Boolean).join(", ")}
            </p>
            {activeOrder.address.deliveryInfo?.deliveryTime && (
              <p className="ot-address-eta">
                ⏱️ Est. {activeOrder.address.deliveryInfo.deliveryTime}
              </p>
            )}
          </div>
        )}

        {/* ── No-contact ── */}
        {activeOrder.noContact && (
          <div className="ot-no-contact">
            🔒 No-Contact Delivery Requested
          </div>
        )}
      </div>
    </div>
  );
}