// src/jsx/BroadcastBanner.jsx
// Drop this at the top of SwiggyStyleMenu, Peppapage, and Urbanpage
// Reads the broadcast message set from Super Admin and shows it as a banner

import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

const COLORS = {
  info:    { bg: "rgba(33,150,243,0.12)",  border: "#2196f344", text: "#64b5f6" },
  success: { bg: "rgba(76,175,80,0.12)",   border: "#4caf5044", text: "#81c784" },
  warning: { bg: "rgba(255,152,0,0.12)",   border: "#ff980044", text: "#ffb74d" },
  promo:   { bg: "rgba(255,215,0,0.12)",   border: "#ffd70044", text: "#ffd700" },
};

export default function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "restaurantConfig", "broadcast"), (snap) => {
      if (snap.exists()) setBroadcast(snap.data());
    });
    return () => unsub();
  }, []);

  if (!broadcast?.active || !broadcast?.message || dismissed) return null;

  const c = COLORS[broadcast.type] || COLORS.info;

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: "10px",
      padding: "12px 16px",
      margin: "8px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "13px",
      fontWeight: "600",
      color: c.text,
      gap: "12px",
    }}>
      <span>📢 {broadcast.message}</span>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: "none", border: "none", color: c.text, fontSize: "16px", cursor: "pointer", flexShrink: 0, opacity: 0.7 }}
      >
        ✕
      </button>
    </div>
  );
}