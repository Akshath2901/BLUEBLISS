// src/jsx/KitchenClosed.jsx
// ✅ STEP 2: Shown on all menu pages when kitchen is closed

import React, { useEffect, useState } from "react";
import { useRestaurantStatus } from "../context/RestaurantStatusContext";

function getCountdown() {
  const now = new Date();
  const hour = now.getHours();
  const opensAt = new Date();

  if (hour >= 4 && hour < 11) {
    opensAt.setHours(11, 0, 0, 0);
  } else {
    opensAt.setDate(opensAt.getDate() + 1);
    opensAt.setHours(11, 0, 0, 0);
  }

  const diff = Math.max(0, opensAt - now);
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function KitchenClosed() {
  const { status } = useRestaurantStatus();
  const [countdown, setCountdown] = useState(getCountdown());
  const isManuallyClosed = status && !status.isOpen;

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.iconRing}>🍽️</div>
        <h1 style={styles.title}>Kitchen is Closed</h1>

        {isManuallyClosed ? (
          <p style={styles.subtitle}>
            We're temporarily closed right now.<br />
            Please check back soon or reach us on WhatsApp.
          </p>
        ) : (
          <p style={styles.subtitle}>
            We serve from <strong style={{ color: "#ffd700" }}>11:00 AM</strong> to{" "}
            <strong style={{ color: "#ffd700" }}>4:00 AM</strong> daily.<br />
            Come back and we'll serve you fresh! 🔥
          </p>
        )}

        {!isManuallyClosed && (
          <div style={styles.countdownWrap}>
            <p style={styles.countdownLabel}>Opens in</p>
            <div style={styles.boxes}>
              {[
                { val: countdown.hours, unit: "hrs" },
                { val: countdown.minutes, unit: "min" },
                { val: countdown.seconds, unit: "sec" },
              ].map(({ val, unit }, i) => (
                <React.Fragment key={unit}>
                  {i > 0 && <span style={styles.colon}>:</span>}
                  <div style={styles.box}>
                    <span style={styles.num}>{String(val).padStart(2, "0")}</span>
                    <span style={styles.unit}>{unit}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div style={styles.divider} />
        <p style={styles.hours}>🕚 &nbsp;Mon – Sun &nbsp;|&nbsp; 11:00 AM – 4:00 AM</p>

        <a
          href={`https://wa.me/917569534271?text=${encodeURIComponent("Hi BlueBliss! When will you be open next?")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.waBtn}
        >
          💬 Ask us on WhatsApp
        </a>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    minHeight: "80vh", display: "flex", alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0d0d0d 0%, #1a1200 100%)",
    padding: "24px",
  },
  card: {
    background: "rgba(255,215,0,0.04)", border: "2px solid rgba(255,215,0,0.2)",
    borderRadius: "24px", padding: "48px 40px", maxWidth: "460px", width: "100%",
    textAlign: "center", backdropFilter: "blur(12px)",
    boxShadow: "0 0 60px rgba(255,215,0,0.07)",
  },
  iconRing: {
    width: "88px", height: "88px", background: "rgba(255,215,0,0.1)",
    border: "2px solid rgba(255,215,0,0.3)", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "40px", margin: "0 auto 24px",
  },
  title: { fontSize: "26px", fontWeight: "800", color: "#ffd700", margin: "0 0 12px" },
  subtitle: { fontSize: "15px", color: "#aaa", lineHeight: "1.8", margin: "0 0 28px" },
  countdownWrap: { marginBottom: "28px" },
  countdownLabel: {
    fontSize: "12px", color: "#666", textTransform: "uppercase",
    letterSpacing: "1px", marginBottom: "12px",
  },
  boxes: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
  box: {
    background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)",
    borderRadius: "12px", padding: "12px 14px",
    display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px",
  },
  num: { fontSize: "26px", fontWeight: "800", color: "#ffd700", lineHeight: 1 },
  unit: { fontSize: "10px", color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px" },
  colon: { fontSize: "26px", fontWeight: "800", color: "#ffd700", marginBottom: "14px" },
  divider: { height: "1px", background: "rgba(255,215,0,0.15)", margin: "0 0 20px" },
  hours: { fontSize: "14px", color: "#bbb", marginBottom: "24px" },
  waBtn: {
    display: "inline-block", background: "linear-gradient(135deg, #25d366, #128c7e)",
    color: "#fff", padding: "14px 28px", borderRadius: "50px",
    fontSize: "14px", fontWeight: "700", textDecoration: "none",
    boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
  },
};