// src/pages/OrderTracking.jsx — with 24h cutoff for stale pending orders

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const ACTIVE_STATUSES = ["pending","approved","confirmed","preparing","ready",
                         "out-for-delivery","out_for_delivery","picked"];
const COMPLETED_STATUSES = ["completed","delivered"];

const STEPS = [
  { label:"Order Placed", icon:"🧾", statuses:["pending"] },
  { label:"Confirmed",    icon:"✅", statuses:["approved","confirmed"] },
  { label:"Preparing",    icon:"👨‍🍳",statuses:["preparing","ready"] },
  { label:"On the Way",   icon:"🛵", statuses:["out-for-delivery","out_for_delivery","picked"] },
  { label:"Delivered",    icon:"🎉", statuses:["completed","delivered"] },
];
function getStepIndex(status) {
  for (let i = STEPS.length-1; i >= 0; i--) {
    if (STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}
const STATUS_COLOR = {
  pending:"#ff9800", approved:"#2196f3", confirmed:"#2196f3",
  preparing:"#ff5722", ready:"#8bc34a",
  "out-for-delivery":"#ffd700", out_for_delivery:"#ffd700", picked:"#ffd700",
  completed:"#4caf50", delivered:"#4caf50",
};
const STATUS_MSG = {
  pending:           "Waiting for the restaurant to confirm your order...",
  approved:          "Confirmed! Being freshly prepared for you.",
  confirmed:         "Confirmed! Being freshly prepared for you.",
  preparing:         "Cooking in progress — almost ready! 🔥",
  ready:             "Packed & ready — assigning delivery partner...",
  "out-for-delivery":"On the way! Estimated ~20 mins. 🛵",
  out_for_delivery:  "On the way! Estimated ~20 mins. 🛵",
  picked:            "On the way! Estimated ~20 mins. 🛵",
  completed:         "Delivered! Enjoy your meal. 🎉",
  delivered:         "Delivered! Enjoy your meal. 🎉",
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [lastOrder, setLastOrder]     = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => { setUser(u); if (!u) setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Only treat as active if it's within 24 hours
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

  if (loading) return (
    <div style={s.centered}>
      <div style={{ fontSize:48, animation:"spin 1.5s linear infinite" }}>🍽️</div>
      <p style={{ color:"#ffd700", marginTop:16, fontSize:15, fontWeight:600 }}>Loading...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return (
    <div style={s.centered}>
      <div style={{ fontSize:52 }}>🔒</div>
      <h2 style={{ color:"#fff", margin:"16px 0 8px" }}>Please log in</h2>
      <button style={s.goldBtn} onClick={() => navigate("/login")}>Log In</button>
    </div>
  );

  if (!activeOrder) return (
    <div style={{ minHeight:"100vh", background:"#0f0e09", paddingBottom:120 }}>
      <div style={{ padding:"24px 20px 0" }}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>
      </div>
      <div style={s.centered}>
        <div style={{ fontSize:64 }}>📦</div>
        <h2 style={{ color:"#fff", margin:"20px 0 8px", fontSize:20 }}>No active orders</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, maxWidth:260, textAlign:"center", lineHeight:1.6 }}>
          Once you place an order it will appear here with live updates.
        </p>
        {lastOrder && (
          <div style={{ marginTop:28, width:"100%", maxWidth:380, background:"rgba(28,28,28,0.8)",
            borderRadius:14, border:"1px solid rgba(255,255,255,0.07)", padding:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#4caf50",
              textTransform:"uppercase", letterSpacing:1, margin:"0 0 10px" }}>
              ✅ Last Order · Delivered
            </p>
            {lastOrder.cart?.slice(0,3).map((item,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
                borderBottom:i<Math.min(lastOrder.cart.length,3)-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{item.qty}× {item.name}</span>
                <span style={{ fontSize:13, color:"#ffd700", fontWeight:700 }}>₹{item.price*item.qty}</span>
              </div>
            ))}
            {lastOrder.cart?.length > 3 && (
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:6 }}>
                +{lastOrder.cart.length-3} more items
              </p>
            )}
            <div style={{ borderTop:"1px solid rgba(212,175,55,0.2)", marginTop:10, paddingTop:10,
              display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>Total paid</span>
              <span style={{ color:"#ffd700", fontWeight:900, fontSize:16 }}>₹{lastOrder.total}</span>
            </div>
          </div>
        )}
        <button style={{ ...s.goldBtn, marginTop:24 }} onClick={() => navigate("/")}>Order Again</button>
      </div>
    </div>
  );

  const status  = activeOrder.status || "pending";
  const stepIdx = getStepIndex(status);
  const color   = STATUS_COLOR[status] || "#ff9800";
  const orderId = (activeOrder.orderId || activeOrder.id || "").toString().slice(-6).toUpperCase();

  return (
    <div style={{ minHeight:"100vh", background:"#0f0e09", paddingBottom:130 }}>
      <div style={{ padding:"20px 20px 0", position:"sticky", top:0, zIndex:10,
        background:"linear-gradient(180deg,#0f0e09 60%,transparent)" }}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
          <div>
            <h1 style={{ color:"#ffd700", fontSize:20, fontWeight:900, margin:0 }}>Live Order</h1>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12, margin:"2px 0 0" }}>#{orderId}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:`${color}18`,
            border:`1px solid ${color}40`, borderRadius:20, padding:"6px 12px" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"block",
              animation:"livePulse 1.5s infinite", boxShadow:`0 0 6px ${color}` }} />
            <span style={{ fontSize:11, fontWeight:800, color, textTransform:"uppercase", letterSpacing:0.5 }}>
              Live
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding:"20px 20px 0" }}>
        {/* Status banner */}
        <div style={{ background:`${color}12`, border:`1.5px solid ${color}35`,
          borderRadius:14, padding:16, marginBottom:16 }}>
          <p style={{ fontSize:22, margin:"0 0 6px" }}>{STEPS[stepIdx].icon}</p>
          <p style={{ fontSize:15, fontWeight:800, color, margin:"0 0 4px" }}>{STEPS[stepIdx].label}</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", margin:0, lineHeight:1.5 }}>
            {STATUS_MSG[status] || "Processing..."}
          </p>
        </div>

        {/* Step tracker */}
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:"18px 12px",
          marginBottom:16, border:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            {STEPS.map((step,i) => {
              const done=i<stepIdx, current=i===stepIdx;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                  alignItems:"center", position:"relative" }}>
                  {i > 0 && <div style={{ position:"absolute", top:15, right:"50%", width:"100%",
                    height:2, zIndex:0, transition:"background 0.5s ease",
                    background:done?"#4caf50":current?`linear-gradient(90deg,#4caf50,${color})`:"rgba(255,255,255,0.06)" }} />}
                  <div style={{ width:32, height:32, borderRadius:"50%", zIndex:1,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:done?13:15, fontWeight:done?800:400,
                    background:done?"rgba(76,175,80,0.18)":current?`${color}18`:"rgba(255,255,255,0.04)",
                    border:`2px solid ${done?"#4caf50":current?color:"rgba(255,255,255,0.08)"}`,
                    color:done?"#4caf50":current?color:"rgba(255,255,255,0.2)",
                    boxShadow:current?`0 0 14px ${color}55`:"none",
                    animation:current?"currentGlow 2s infinite":"none",
                    transition:"all 0.4s ease" }}>
                    {done?"✓":step.icon}
                  </div>
                  <span style={{ fontSize:9, marginTop:6, textAlign:"center", lineHeight:1.3,
                    maxWidth:52, fontWeight:current?800:600,
                    color:done?"rgba(76,175,80,0.7)":current?color:"rgba(255,255,255,0.2)" }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div style={s.card}>
          <p style={s.cardTitle}>🍽️ Your Order</p>
          {activeOrder.cart?.map((item,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"9px 0", borderBottom:i<activeOrder.cart.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div>
                <p style={{ fontSize:13, color:"#fff", margin:0, fontWeight:600 }}>{item.name}</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", margin:"2px 0 0" }}>₹{item.price} × {item.qty}</p>
              </div>
              <span style={{ fontSize:14, fontWeight:800, color:"#ffd700" }}>₹{item.price*item.qty}</span>
            </div>
          ))}
          <div style={{ borderTop:"1px solid rgba(212,175,55,0.2)", marginTop:10, paddingTop:10,
            display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:800, color:"#fff" }}>Total Paid</span>
            <span style={{ fontWeight:900, color:"#ffd700", fontSize:17 }}>₹{activeOrder.total}</span>
          </div>
        </div>

        {activeOrder.address && (
          <div style={{ ...s.card, marginTop:12 }}>
            <p style={s.cardTitle}>📍 Delivering to</p>
            <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 4px", textTransform:"capitalize" }}>
              {activeOrder.address.label || "Home"}
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:0, lineHeight:1.6 }}>
              {activeOrder.address.fullAddress ||
                [activeOrder.address.houseNo,activeOrder.address.street,
                 activeOrder.address.area,activeOrder.address.city].filter(Boolean).join(", ")}
            </p>
            {activeOrder.address.deliveryInfo?.deliveryTime && (
              <p style={{ fontSize:12, color:"#4caf50", fontWeight:700, margin:"6px 0 0" }}>
                ⏱️ Est. {activeOrder.address.deliveryInfo.deliveryTime}
              </p>
            )}
          </div>
        )}

        {activeOrder.noContact && (
          <div style={{ marginTop:12, padding:"12px 16px", background:"rgba(226,55,68,0.07)",
            borderRadius:10, border:"1px solid rgba(226,55,68,0.2)",
            color:"#e23744", fontWeight:700, fontSize:13, textAlign:"center" }}>
            🔒 No-Contact Delivery Requested
          </div>
        )}
      </div>

      <style>{`
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.6)}}
        @keyframes currentGlow{0%,100%{box-shadow:0 0 14px ${color}55}50%{box-shadow:0 0 22px ${color}90}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

const s = {
  centered:{ minHeight:"70vh", display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center", padding:20, textAlign:"center" },
  goldBtn:{ padding:"12px 28px", background:"linear-gradient(135deg,#ffd700,#d4af37)",
    border:"none", borderRadius:10, color:"#000", fontSize:14, fontWeight:800, cursor:"pointer" },
  backBtn:{ background:"rgba(255,255,255,0.06)", border:"none", color:"#fff",
    padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 },
  card:{ background:"rgba(28,28,28,0.6)", borderRadius:14, padding:16,
    border:"1px solid rgba(255,255,255,0.07)" },
  cardTitle:{ fontSize:12, fontWeight:700, color:"#ffd700",
    margin:"0 0 12px", textTransform:"uppercase", letterSpacing:0.5 },
};