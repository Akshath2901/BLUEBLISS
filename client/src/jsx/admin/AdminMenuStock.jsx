// src/jsx/admin/AdminMenuStock.jsx
// ✅ UPDATED: All 3 brands in one page with easy tab switching
// Shrimmers → "menu" | Peppanizze → "Pmenu" | UrbanWrap → "Umenu"

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// ─── Brand config ─────────────────────────────────────────────────────────────
const BRANDS = [
  {
    key: "shrimmers",
    label: "Shrimmers",
    icon: "✨",
    collection: "menu",
    color: "#ffd700",
  },
  {
    key: "peppanizze",
    label: "Peppanizze",
    icon: "🌶️",
    collection: "Pmenu",
    color: "#ff6b35",
  },
  {
    key: "urbanwrap",
    label: "Urban Wrap",
    icon: "🌯",
    collection: "Umenu",
    color: "#4caf50",
  },
];

export default function AdminMenuStock() {
  const [activeBrand, setActiveBrand] = useState(BRANDS[0]);
  const [menuDocs, setMenuDocs] = useState({});   // { brandKey: [...docs] }
  const [loading, setLoading] = useState({});
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState("");
  const [filterUnavailable, setFilterUnavailable] = useState(false);
  const [toast, setToast] = useState("");

  // ─── Subscribe to all 3 brands on mount ────────────────────────────────────
  useEffect(() => {
    const unsubs = BRANDS.map((brand) => {
      setLoading((prev) => ({ ...prev, [brand.key]: true }));

      return onSnapshot(collection(db, brand.collection), (snap) => {
        const docs = [];
        snap.forEach((d) => docs.push({ docId: d.id, ...d.data() }));
        setMenuDocs((prev) => ({ ...prev, [brand.key]: docs }));
        setLoading((prev) => ({ ...prev, [brand.key]: false }));
      });
    });

    return () => unsubs.forEach((u) => u());
  }, []);

  // ─── Toggle a single item ──────────────────────────────────────────────────
  const handleToggle = async (docId, itemIndex, currentAvailability) => {
    const key = `${docId}-${itemIndex}`;
    setSaving(key);
    try {
      const docs = menuDocs[activeBrand.key] || [];
      const categoryDoc = docs.find((d) => d.docId === docId);
      if (!categoryDoc) return;

      const updatedItems = (categoryDoc.items || []).map((item, idx) =>
        idx === itemIndex ? { ...item, isAvailable: !currentAvailability } : item
      );

      await updateDoc(doc(db, activeBrand.collection, docId), { items: updatedItems });
      showToast(!currentAvailability ? "✅ Marked as Available" : "🔴 Marked as Out of Stock");
    } catch (e) {
      showToast("❌ Failed to update. Try again.");
    } finally {
      setSaving(null);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ─── Current brand data ────────────────────────────────────────────────────
  const currentDocs = menuDocs[activeBrand.key] || [];
  const isLoading = loading[activeBrand.key];

  const allItems = currentDocs.flatMap((d) =>
    (d.items || []).map((item, ii) => ({
      ...item,
      docId: d.docId,
      itemIndex: ii,
      category: d.category,
    }))
  );

  const totalItems = allItems.length;
  const unavailableCount = allItems.filter((i) => i.isAvailable === false).length;
  const availableCount = totalItems - unavailableCount;

  // ─── Filter docs for display ───────────────────────────────────────────────
  const filteredDocs = currentDocs
    .map((catDoc) => ({
      ...catDoc,
      items: (catDoc.items || [])
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter((item) => {
          const matchSearch = !search.trim() ||
            item.name?.toLowerCase().includes(search.toLowerCase());
          const matchFilter = !filterUnavailable || item.isAvailable === false;
          return matchSearch && matchFilter;
        }),
    }))
    .filter((d) => d.items.length > 0);

  return (
    <div style={styles.container}>

      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Page header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🔴 Menu Stock Control</h1>
        <p style={styles.subtitle}>Toggle items on/off per brand — updates instantly for customers</p>
      </div>

      {/* ── BRAND TABS ── */}
      <div style={styles.brandTabs}>
        {BRANDS.map((brand) => {
          const brandDocs = menuDocs[brand.key] || [];
          const brandItems = brandDocs.flatMap((d) => d.items || []);
          const outCount = brandItems.filter((i) => i.isAvailable === false).length;
          const isActive = activeBrand.key === brand.key;

          return (
            <button
              key={brand.key}
              onClick={() => { setActiveBrand(brand); setSearch(""); setFilterUnavailable(false); }}
              style={{
                ...styles.brandTab,
                background: isActive ? brand.color : "rgba(255,255,255,0.04)",
                border: `2px solid ${isActive ? brand.color : "rgba(255,255,255,0.1)"}`,
                color: isActive ? "#000" : "#aaa",
                transform: isActive ? "translateY(-2px)" : "none",
                boxShadow: isActive ? `0 4px 20px ${brand.color}44` : "none",
              }}
            >
              <span style={styles.brandTabIcon}>{brand.icon}</span>
              <span style={styles.brandTabLabel}>{brand.label}</span>
              {outCount > 0 && (
                <span style={{
                  ...styles.outBadge,
                  background: isActive ? "rgba(0,0,0,0.25)" : "rgba(244,67,54,0.2)",
                  color: isActive ? "#000" : "#f44336",
                }}>
                  {outCount} off
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── STATS ROW ── */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statBox, borderColor: "#4caf50" }}>
          <p style={{ ...styles.statNum, color: "#4caf50" }}>{availableCount}</p>
          <p style={styles.statLabel}>Available</p>
        </div>
        <div style={{ ...styles.statBox, borderColor: "#f44336" }}>
          <p style={{ ...styles.statNum, color: "#f44336" }}>{unavailableCount}</p>
          <p style={styles.statLabel}>Out of Stock</p>
        </div>
        <div style={{ ...styles.statBox, borderColor: activeBrand.color }}>
          <p style={{ ...styles.statNum, color: activeBrand.color }}>{totalItems}</p>
          <p style={styles.statLabel}>Total Items</p>
        </div>
        <div style={{ ...styles.statBox, borderColor: "#2196f3" }}>
          <p style={{ ...styles.statNum, color: "#2196f3" }}>{currentDocs.length}</p>
          <p style={styles.statLabel}>Categories</p>
        </div>
      </div>

      {/* ── CONTROLS ── */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder={`🔍 Search ${activeBrand.label} items...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <button
          onClick={() => setFilterUnavailable(!filterUnavailable)}
          style={{
            ...styles.filterBtn,
            background: filterUnavailable ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.04)",
            border: filterUnavailable ? "2px solid #f44336" : "2px solid rgba(255,255,255,0.1)",
            color: filterUnavailable ? "#f44336" : "#888",
          }}
        >
          {filterUnavailable ? "Show All" : "🔴 Out of Stock Only"}
        </button>
      </div>

      {/* Warning banner */}
      {unavailableCount > 0 && (
        <div style={styles.warningBanner}>
          ⚠️ <strong>{unavailableCount} item{unavailableCount > 1 ? "s" : ""}</strong> in <strong>{activeBrand.label}</strong> are currently out of stock — customers cannot order these.
        </div>
      )}

      {/* ── LOADING ── */}
      {isLoading ? (
        <div style={styles.loadingBox}>
          <p>⏳ Loading {activeBrand.label} menu...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: "48px" }}>{activeBrand.icon}</p>
          <p>No items found{search ? ` for "${search}"` : ""}.</p>
        </div>
      ) : (
        /* ── CATEGORIES ── */
        filteredDocs.map((catDoc) => (
          <div key={catDoc.docId} style={styles.categorySection}>

            {/* Category header */}
            <div style={{ ...styles.categoryHeader, borderColor: activeBrand.color + "44" }}>
              <span style={{ ...styles.categoryName, color: activeBrand.color }}>
                {catDoc.category}
              </span>
              <span style={styles.categoryCount}>{catDoc.items.length} items</span>
            </div>

            {/* Items grid */}
            <div style={styles.itemsGrid}>
              {catDoc.items.map((item) => {
                const isAvailable = item.isAvailable !== false;
                const saveKey = `${catDoc.docId}-${item.originalIndex}`;
                const isSaving = saving === saveKey;

                return (
                  <div
                    key={item.originalIndex}
                    style={{
                      ...styles.itemCard,
                      borderColor: isAvailable ? "rgba(255,255,255,0.07)" : "#f44336",
                      background: isAvailable ? "rgba(255,255,255,0.02)" : "rgba(244,67,54,0.04)",
                    }}
                  >
                    {/* Image */}
                    {item.img && (
                      <div style={styles.imgWrap}>
                        <img
                          src={item.img}
                          alt={item.name}
                          style={{
                            ...styles.itemImg,
                            filter: isAvailable ? "none" : "grayscale(70%)",
                          }}
                        />
                        {!isAvailable && (
                          <div style={styles.outOverlay}>OUT OF STOCK</div>
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div style={styles.itemInfo}>
                      {/* Veg/nonveg dot */}
                      <div style={styles.itemNameRow}>
                        <span style={{
                          width: "10px", height: "10px", borderRadius: "2px", flexShrink: 0,
                          border: `2px solid ${item.type === "veg" || item.isVeg ? "#4caf50" : "#f44336"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{
                            width: "4px", height: "4px", borderRadius: "50%",
                            background: item.type === "veg" || item.isVeg ? "#4caf50" : "#f44336",
                          }} />
                        </span>
                        <p style={styles.itemName}>{item.name}</p>
                      </div>
                      <p style={styles.itemPrice}>₹{item.price}</p>
                    </div>

                    {/* Toggle button — big and easy to tap */}
                    <button
                      onClick={() => handleToggle(catDoc.docId, item.originalIndex, isAvailable)}
                      disabled={isSaving}
                      style={{
                        ...styles.toggleBtn,
                        background: isAvailable
                          ? "linear-gradient(135deg, #4caf50, #388e3c)"
                          : "linear-gradient(135deg, #f44336, #c62828)",
                        opacity: isSaving ? 0.6 : 1,
                        cursor: isSaving ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSaving ? "..." : isAvailable ? "🟢 Available" : "🔴 Out of Stock"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
    padding: "32px 24px",
    color: "#fff",
    position: "relative",
  },
  toast: {
    position: "fixed", top: "20px", right: "20px", zIndex: 9999,
    background: "#1e1e1e", border: "2px solid rgba(255,215,0,0.3)",
    borderRadius: "12px", padding: "14px 20px",
    fontSize: "14px", fontWeight: "700", color: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  header: { marginBottom: "28px" },
  title: {
    fontSize: "28px", fontWeight: "800", margin: "0 0 6px",
    background: "linear-gradient(135deg, #ffd700, #ffed4e)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#555", margin: 0, fontSize: "13px" },

  // Brand tabs
  brandTabs: {
    display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap",
  },
  brandTab: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "14px 22px", borderRadius: "14px",
    fontSize: "15px", fontWeight: "700", cursor: "pointer",
    transition: "all 0.2s ease", border: "2px solid",
  },
  brandTabIcon: { fontSize: "20px" },
  brandTabLabel: {},
  outBadge: {
    padding: "2px 8px", borderRadius: "20px",
    fontSize: "11px", fontWeight: "800",
  },

  // Stats
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px",
  },
  statBox: {
    background: "rgba(255,255,255,0.03)", border: "2px solid",
    borderRadius: "12px", padding: "16px", textAlign: "center",
  },
  statNum: { fontSize: "26px", fontWeight: "800", margin: "0 0 4px" },
  statLabel: { fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px", margin: 0 },

  // Controls
  controls: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  searchInput: {
    flex: 1, minWidth: "220px", padding: "12px 16px",
    background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "#fff", fontSize: "14px",
  },
  filterBtn: {
    padding: "12px 20px", borderRadius: "10px",
    fontWeight: "700", fontSize: "13px", cursor: "pointer",
  },
  warningBanner: {
    background: "rgba(244,67,54,0.07)", border: "1px solid rgba(244,67,54,0.25)",
    borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#ff8a80",
    marginBottom: "20px", lineHeight: "1.6",
  },
  loadingBox: { textAlign: "center", padding: "60px", color: "#555" },
  emptyBox: { textAlign: "center", padding: "60px", color: "#555" },

  // Category
  categorySection: { marginBottom: "28px" },
  categoryHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "rgba(255,255,255,0.03)", border: "2px solid",
    borderRadius: "10px", padding: "12px 18px", marginBottom: "12px",
  },
  categoryName: { fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" },
  categoryCount: { fontSize: "12px", color: "#555" },

  // Items
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "12px",
  },
  itemCard: {
    border: "1px solid", borderRadius: "12px", padding: "14px",
    display: "flex", flexDirection: "column", gap: "10px",
    transition: "all 0.2s ease",
  },
  imgWrap: {
    position: "relative", borderRadius: "8px",
    overflow: "hidden", height: "110px",
  },
  itemImg: { width: "100%", height: "100%", objectFit: "cover" },
  outOverlay: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: "800", color: "#f44336", letterSpacing: "1px",
  },
  itemInfo: { flex: 1 },
  itemNameRow: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" },
  itemName: { fontSize: "13px", fontWeight: "700", color: "#fff", margin: 0 },
  itemPrice: { fontSize: "13px", color: "#ffd700", fontWeight: "600", margin: 0 },

  // Big easy toggle button
  toggleBtn: {
    width: "100%", padding: "12px", border: "none",
    borderRadius: "10px", fontSize: "13px", fontWeight: "800",
    color: "#fff", transition: "all 0.2s ease",
  },
};