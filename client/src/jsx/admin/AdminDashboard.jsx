// src/jsx/admin/AdminDashboard.jsx
// ✅ UPDATED: Per-brand open/close toggles added to Kitchen Control card

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useRestaurantStatus } from "../../context/RestaurantStatusContext";
import "./AdminDashboard.css";

const BRANDS = [
  { key: "shrimmers",  label: "Shrimmers",   icon: "✨", color: "#ffd700" },
  { key: "peppanizze", label: "Peppanizze",  icon: "🌶️", color: "#ff6b35" },
  { key: "urbanwrap",  label: "Urban Wrap",  icon: "🌯", color: "#4caf50" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { status, isKitchenOpen, isBrandOpen, isWithinKitchenHours } = useRestaurantStatus();
  const [saving, setSaving] = useState(null);
  const [toggleMsg, setToggleMsg] = useState("");

  const [stats, setStats] = useState({
    newOrders: 0, preparing: 0, ready: 0, completed: 0, todayRevenue: 0,
  });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const orders = [];
      snap.forEach((d) => orders.push(d.data()));
      const today = new Date().toDateString();
      setStats({
        newOrders: orders.filter(o => o.status === "pending").length,
        preparing: orders.filter(o => o.status === "preparing").length,
        ready: orders.filter(o => o.status === "ready").length,
        completed: orders.filter(o => o.status === "delivered").length,
        todayRevenue: orders
          .filter(o => {
            if (!o.createdAt) return false;
            const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return d.toDateString() === today && o.status === "delivered";
          })
          .reduce((sum, o) => sum + (o.total || 0), 0),
      });
    });
    return () => unsub();
  }, []);

  // ─── Toggle global kitchen ─────────────────────────────────────────────────
  const handleKitchenToggle = async () => {
    if (!status) return;

    const isCurrentlyOpen = status.isOpen;

    // ✅ Confirm before closing
    if (isCurrentlyOpen) {
      const confirmed = window.confirm(
        "⚠️ Are you sure you want to CLOSE the kitchen?\n\nThis will stop all 3 brands from accepting orders immediately."
      );
      if (!confirmed) return;
    }

    setSaving("global");
    try {
      const newIsOpen = !isCurrentlyOpen;
      await updateDoc(doc(db, "restaurantConfig", "status"), {
        isOpen: newIsOpen,
        updatedAt: new Date(),
      });
      showMsg(newIsOpen ? "✅ Kitchen is now OPEN" : "🔴 Kitchen is now CLOSED");
    } catch (e) {
      showMsg("❌ Failed to update. Try again.");
    } finally {
      setSaving(null);
    }
  };

  // ─── Toggle a single brand ─────────────────────────────────────────────────
  const handleBrandToggle = async (brandKey) => {
    if (!status) return;

    const currentBrands = status.brands || { shrimmers: true, peppanizze: true, urbanwrap: true };
    const isCurrentlyOpen = currentBrands[brandKey] !== false;
    const brand = BRANDS.find(b => b.key === brandKey);

    // ✅ Confirm before closing
    if (isCurrentlyOpen) {
      const confirmed = window.confirm(
        `⚠️ Are you sure you want to CLOSE ${brand.label}?\n\nCustomers will no longer be able to order from this brand.`
      );
      if (!confirmed) return;
    }

    setSaving(brandKey);
    try {
      const newBrandState = !isCurrentlyOpen;
      await updateDoc(doc(db, "restaurantConfig", "status"), {
        [`brands.${brandKey}`]: newBrandState,
        updatedAt: new Date(),
      });
      showMsg(newBrandState ? `✅ ${brand.label} is now OPEN` : `🔴 ${brand.label} is now CLOSED`);
    } catch (e) {
      showMsg("❌ Failed to update. Try again.");
    } finally {
      setSaving(null);
    }
  };

  const showMsg = (msg) => {
    setToggleMsg(msg);
    setTimeout(() => setToggleMsg(""), 3000);
  };

  const isTimeOpen = isWithinKitchenHours ? isWithinKitchenHours() : false;

  const mainMenu = [
    { id: 1,  icon: "📋", title: "Orders",          subtitle: "Manage Orders",      link: "/admin/orders",            count: stats.newOrders },
    { id: 2,  icon: "🕐", title: "Online Orders",   subtitle: "Online Delivery",    link: "/admin/orders",            count: 0 },
    { id: 3,  icon: "📋", title: "KOTs",            subtitle: "Kitchen Tickets",    link: "/admin/orders",            count: 0 },
    { id: 4,  icon: "💳", title: "Cash Flow",       subtitle: "Payment Tracking",   link: "/admin/sales",             count: 0 },
    { id: 5,  icon: "📊", title: "Reports",         subtitle: "Sales & Analytics",  link: "/admin/sales",             count: 0 },
    { id: 6,  icon: "📊", title: "Expense",         subtitle: "Expense Tracking",   link: "/admin/sales",             count: 0 },
    { id: 7,  icon: "💰", title: "Withdrawal",      subtitle: "Fund Management",    link: "/admin/sales",             count: 0 },
    { id: 8,  icon: "📦", title: "Stock Mgmt",      subtitle: "Manage Inventory",   link: "/admin/stock",             count: 0 },
    { id: 9,  icon: "🧂", title: "Ingredients",     subtitle: "Manage Raw Stock",   link: "/admin/ingredients",       count: 0 },
    { id: 10, icon: "🔴", title: "Menu Stock",      subtitle: "Item Availability",  link: "/admin/menu-stock",        count: 0 },
  ];

  const configMenu = [
    { id: 10, icon: "🍽️", title: "Menu",             subtitle: "Manage Menu Items",  link: "/admin/settings" },
    { id: 11, icon: "🖨️", title: "Bill / KOT Print", subtitle: "Printer Settings",   link: "/admin/settings" },
    { id: 12, icon: "📋", title: "Tax",              subtitle: "Tax Configuration",  link: "/admin/settings" },
    { id: 13, icon: "⚙️", title: "Settings",         subtitle: "System Settings",    link: "/admin/settings" },
    { id: 14, icon: "🎁", title: "Offers",           subtitle: "Manage Promotions",  link: "/admin/offers"   },
    { id: 15, icon: "🎁", title: "Discount",         subtitle: "Manage Discounts",   link: "/admin/settings" },
    { id: 16, icon: "🖼️", title: "Billing Screen",   subtitle: "Display Settings",   link: "/admin/settings" },
    { id: 17, icon: "⚙️", title: "Advanced",         subtitle: "System Config",      link: "/admin/settings" },
    { id: 18, icon: "🔔", title: "Notification",     subtitle: "Alert Settings",     link: "/admin/settings" },
  ];

  return (
    <div className="admin-dashboard-grid">

      {/* HEADER */}
      <div className="dashboard-grid-header">
        <div className="header-brand"><h1>BlueBliss</h1><p>Management System</p></div>
        <div className="header-info"><p>Main Server</p><p className="server-name">Cloud Kitchen</p></div>
        <div className="header-contact"><p>📞 9999912483</p><p>📧 support@bluebliss.com</p></div>
      </div>

      {/* QUICK STATS */}
      <div className="quick-stats">
        <div className="quick-stat-item"><span className="stat-icon">📋</span><span className="stat-label">New Orders</span><span className="stat-number">{stats.newOrders}</span></div>
        <div className="quick-stat-item"><span className="stat-icon">👨‍🍳</span><span className="stat-label">Preparing</span><span className="stat-number">{stats.preparing}</span></div>
        <div className="quick-stat-item"><span className="stat-icon">✅</span><span className="stat-label">Ready</span><span className="stat-number">{stats.ready}</span></div>
        <div className="quick-stat-item"><span className="stat-icon">💰</span><span className="stat-label">Today Revenue</span><span className="stat-number">₹{stats.todayRevenue}</span></div>
      </div>

      {/* ── KITCHEN CONTROL CARD ── */}
      <div style={ks.card}>

        {/* Card header */}
        <div style={ks.cardHeader}>
          <span style={{ fontSize: "22px" }}>🍳</span>
          <h3 style={ks.cardTitle}>Kitchen Control</h3>
          <div style={{
            ...ks.livePill,
            background: isKitchenOpen ? "rgba(76,175,80,0.15)" : "rgba(244,67,54,0.15)",
            border: `1px solid ${isKitchenOpen ? "#4caf50" : "#f44336"}`,
            color: isKitchenOpen ? "#4caf50" : "#f44336",
          }}>
            <span style={{ ...ks.liveDot, background: isKitchenOpen ? "#4caf50" : "#f44336", animation: isKitchenOpen ? "pulse 2s infinite" : "none" }} />
            {isKitchenOpen ? "OPEN" : "CLOSED"}
          </div>
        </div>

        {/* ── GLOBAL STATUS ROW ── */}
        <div style={ks.statusRow}>
          <div style={{ ...ks.statusBox, borderColor: isKitchenOpen ? "#4caf50" : "#f44336" }}>
            <p style={ks.sLabel}>Customer View</p>
            <p style={{ ...ks.sValue, color: isKitchenOpen ? "#4caf50" : "#f44336" }}>{isKitchenOpen ? "OPEN" : "CLOSED"}</p>
          </div>
          <div style={{ ...ks.statusBox, borderColor: isTimeOpen ? "#2196f3" : "#ff9800" }}>
            <p style={ks.sLabel}>Time Window</p>
            <p style={{ ...ks.sValue, color: isTimeOpen ? "#2196f3" : "#ff9800" }}>{isTimeOpen ? "IN HOURS" : "OFF HOURS"}</p>
          </div>
          <div style={{ ...ks.statusBox, borderColor: status?.isOpen ? "#4caf50" : "#f44336" }}>
            <p style={ks.sLabel}>Staff Toggle</p>
            <p style={{ ...ks.sValue, color: status?.isOpen ? "#4caf50" : "#f44336" }}>{status?.isOpen ? "ON" : "OFF"}</p>
          </div>
        </div>

        {/* Off-hours warning */}
        {!isTimeOpen && status?.isOpen && (
          <div style={ks.warning}>
            ⏰ Outside kitchen hours (11 AM – 4 AM). Customers see it as closed even though staff toggle is ON.
          </div>
        )}

        {/* Global toggle button */}
        <button
          onClick={handleKitchenToggle}
          disabled={saving === "global" || !status}
          style={{
            ...ks.globalToggleBtn,
            background: status?.isOpen
              ? "linear-gradient(135deg, #f44336, #c62828)"
              : "linear-gradient(135deg, #4caf50, #2e7d32)",
            opacity: saving === "global" ? 0.7 : 1,
            cursor: saving === "global" ? "not-allowed" : "pointer",
          }}
        >
          {saving === "global" ? "Updating..." : status?.isOpen ? "🔴  Close All Kitchens" : "✅  Open All Kitchens"}
        </button>

        {/* ── DIVIDER ── */}
        <div style={ks.divider}>
          <span style={ks.dividerText}>Per Brand Control</span>
        </div>

        {/* ── BRAND TOGGLES ── */}
        <div style={ks.brandGrid}>
          {BRANDS.map((brand) => {
            const brandIsOpen = isBrandOpen(brand.key);
            const brandToggleOn = status?.brands?.[brand.key] !== false;
            const isSaving = saving === brand.key;
            const isBlocked = !status?.isOpen || !isTimeOpen;

            return (
              <div
                key={brand.key}
                style={{
                  ...ks.brandCard,
                  borderColor: brandIsOpen ? brand.color + "55" : "rgba(244,67,54,0.4)",
                  background: brandIsOpen ? `${brand.color}08` : "rgba(244,67,54,0.05)",
                  opacity: isBlocked ? 0.55 : 1,
                }}
              >
                {/* Brand header */}
                <div style={ks.brandCardHeader}>
                  <span style={{ fontSize: "22px" }}>{brand.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...ks.brandName, color: brand.color }}>{brand.label}</p>
                    <p style={ks.brandStatus}>
                      {isBlocked
                        ? "Kitchen globally closed"
                        : brandIsOpen ? "Accepting orders" : "Not accepting orders"}
                    </p>
                  </div>
                  <span style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: brandIsOpen ? "#4caf50" : "#f44336",
                    boxShadow: brandIsOpen ? "0 0 8px #4caf50" : "none",
                    flexShrink: 0,
                  }} />
                </div>

                {/* Brand toggle button */}
                <button
                  onClick={() => handleBrandToggle(brand.key)}
                  disabled={isSaving || isBlocked}
                  title={isBlocked ? "Enable global kitchen first" : ""}
                  style={{
                    ...ks.brandToggleBtn,
                    background: brandToggleOn
                      ? "linear-gradient(135deg, #f44336, #c62828)"
                      : `linear-gradient(135deg, ${brand.color}, ${brand.color}bb)`,
                    opacity: isSaving || isBlocked ? 0.5 : 1,
                    cursor: isSaving || isBlocked ? "not-allowed" : "pointer",
                    color: brandToggleOn ? "#fff" : "#000",
                  }}
                >
                  {isSaving ? "..." : brandToggleOn ? `Close ${brand.label}` : `Open ${brand.label}`}
                </button>
              </div>
            );
          })}
        </div>

        {(!status?.isOpen || !isTimeOpen) && (
          <p style={ks.blockNote}>
            💡 Enable the global kitchen toggle above to control individual brands.
          </p>
        )}

        {toggleMsg && <p style={ks.msg}>{toggleMsg}</p>}
        <p style={ks.hours}>⏱️ &nbsp; Operating hours: 11:00 AM – 4:00 AM daily</p>
      </div>

      {/* MAIN OPERATIONS */}
      <div className="menu-section">
        <h3 className="menu-title">Main Operations</h3>
        <div className="menu-grid">
          {mainMenu.map(item => (
            <div key={item.id} className="menu-item" onClick={() => navigate(item.link)}>
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-text">
                <p className="menu-title-text">{item.title}</p>
                <p className="menu-subtitle">{item.subtitle}</p>
              </div>
              {item.count > 0 && <div className="menu-badge">{item.count}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CONFIGURATION */}
      <div className="menu-section">
        <h3 className="menu-title">Set the configuration for your restaurant</h3>
        <div className="menu-grid">
          {configMenu.map(item => (
            <div key={item.id} className="menu-item" onClick={() => navigate(item.link)}>
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-text">
                <p className="menu-title-text">{item.title}</p>
                <p className="menu-subtitle">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="dashboard-grid-footer">
        <p>BlueBliss Cloud Kitchen Management • Version 1.0</p>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.6); }
          70% { box-shadow: 0 0 0 8px rgba(76,175,80,0); }
          100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); }
        }
      `}</style>
    </div>
  );
}

// ─── Kitchen card styles ──────────────────────────────────────────────────────
const ks = {
  card: {
    background: "#1a1a1a", border: "2px solid rgba(255,215,0,0.2)",
    borderRadius: "16px", padding: "24px 28px", margin: "0 0 28px",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  cardTitle: { fontSize: "18px", fontWeight: "800", color: "#ffd700", margin: 0, flex: 1 },
  livePill: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
  },
  liveDot: { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" },
  statusRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" },
  statusBox: {
    background: "rgba(255,255,255,0.03)", border: "2px solid",
    borderRadius: "10px", padding: "14px", textAlign: "center",
  },
  sLabel: { fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" },
  sValue: { fontSize: "15px", fontWeight: "800", margin: 0 },
  warning: {
    background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.3)",
    borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#ff9800",
    lineHeight: "1.5", marginBottom: "16px",
  },
  globalToggleBtn: {
    width: "100%", padding: "16px", borderRadius: "12px", border: "none",
    fontSize: "15px", fontWeight: "800", color: "#fff", marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)", transition: "all 0.3s ease",
  },
  divider: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  dividerText: {
    fontSize: "11px", fontWeight: "700", color: "#444",
    textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap",
    padding: "0 8px", background: "#1a1a1a", position: "relative",
    borderTop: "1px solid #333",
  },
  brandGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" },
  brandCard: {
    border: "2px solid", borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
    transition: "all 0.2s ease",
  },
  brandCardHeader: { display: "flex", alignItems: "center", gap: "10px" },
  brandName: { fontSize: "13px", fontWeight: "800", margin: "0 0 2px" },
  brandStatus: { fontSize: "11px", color: "#555", margin: 0 },
  brandToggleBtn: {
    width: "100%", padding: "10px", border: "none",
    borderRadius: "8px", fontSize: "12px", fontWeight: "800",
    transition: "all 0.2s ease",
  },
  blockNote: { fontSize: "12px", color: "#555", textAlign: "center", marginBottom: "8px" },
  msg: { textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#4caf50", margin: "0 0 8px" },
  hours: { textAlign: "center", fontSize: "12px", color: "#444", margin: 0 },
};