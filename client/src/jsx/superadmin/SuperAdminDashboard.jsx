// src/jsx/superadmin/SuperAdminDashboard.jsx
// 👑 Super Admin v3 — 15 Tabs, Full Owner Control
// ✅ UPDATED: Offers management moved here from Admin panel with full CRUD + edit

import React, { useEffect, useState } from "react";
import {
  collection, onSnapshot, doc, updateDoc, setDoc, addDoc, deleteDoc,
  query, orderBy, serverTimestamp, limit, writeBatch
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./SuperAdminDashboard.css";

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPER_PIN = "1234"; // ← Change before going live

const BRANDS = [
  { key: "shrimmers",  label: "Shrimmers",  icon: "✨", color: "#ffd700", col: "menu"  },
  { key: "peppanizze", label: "Peppanizze", icon: "🌶️", color: "#ff6b35", col: "Pmenu" },
  { key: "urbanwrap",  label: "Urban Wrap", icon: "🌯", color: "#4caf50", col: "Umenu" },
];

const TABS = [
  { key: "overview",     label: "📊 Overview"        },
  { key: "finance",      label: "💰 Finance"         },
  { key: "analytics",    label: "📈 Analytics"       },
  { key: "customers",    label: "👥 Customers"       },
  { key: "menueditor",   label: "🍽️ Menu Editor"     },
  { key: "offers",       label: "🎁 Offers"          }, // ✅ NEW — moved from Admin panel
  { key: "promos",       label: "🏷️ Promo Codes"     },
  { key: "notifications",label: "🔔 Notifications"  },
  { key: "refunds",      label: "↩️ Refunds"         },
  { key: "kitchen",      label: "🍳 Kitchen"         },
  { key: "operations",   label: "⚙️ Operations"      },
  { key: "locations",    label: "📍 Locations"       },
  { key: "appsettings",  label: "🛠️ App Settings"   },
  { key: "security",     label: "🔐 Security"        },
  { key: "staff",        label: "👨‍💼 Staff"           },
];

const DAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const OFFER_TYPES = [
  { value: "flat",       label: "Flat Discount",      icon: "💳", desc: "e.g. ₹99 off" },
  { value: "percentage", label: "Percentage Off",     icon: "📊", desc: "e.g. 20% off" },
  { value: "category",   label: "Category Specific",  icon: "🍕", desc: "e.g. Off on Burgers" },
  { value: "free_item",  label: "Free Item",          icon: "🎁", desc: "e.g. Free dessert" },
];

const OFFER_CATEGORIES = ["burgers", "pizzas", "wraps", "desserts", "drinks", "sides"];

const BLANK_OFFER = {
  title: "",
  description: "",
  code: "",
  icon: "🎁",
  offerType: "flat",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  applicableCategory: "",
  minItemCount: 1,
  bgColor: "#FF6B6B",
  bgColorAlt: "#FF8E8E",
  isActive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const timeAgo = (ts) => {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [pin, setPin]             = useState("");
  const [pinErr, setPinErr]       = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [auth, setAuth]           = useState(sessionStorage.getItem("sa_v3") === "true");
  const [tab, setTab]             = useState("overview");

  // ── Core data ─────────────────────────────────────────────────────────────
  const [orders, setOrders]                   = useState([]);
  const [kitchen, setKitchen]                 = useState(null);
  const [ingredients, setIngredients]         = useState([]);
  const [staff, setStaff]                     = useState([]);
  const [promos, setPromos]                   = useState([]);
  const [offers, setOffers]                   = useState([]);   // ✅ NEW
  const [auditLog, setAuditLog]               = useState([]);
  const [secLog, setSecLog]                   = useState([]);
  const [reviews, setReviews]                 = useState([]);
  const [disputes, setDisputes]               = useState([]);
  const [locations, setLocations]             = useState([]);
  const [notifications, setNotifications]     = useState([]);
  const [menuDocs, setMenuDocs]               = useState({});
  const [expenses, setExpenses]               = useState([]);
  const [ingredientLogs, setIngredientLogs]   = useState([]);

  // ── Config docs ───────────────────────────────────────────────────────────
  const [broadcast, setBroadcast]       = useState({ message: "", active: false, type: "info" });
  const [deliveryConf, setDeliveryConf] = useState({ radius: 5, baseCharge: 30, freeAbove: 300 });
  const [schedule, setSchedule]         = useState({ autoClose: false, openHour: 11, closeHour: 4 });
  const [appSettings, setAppSettings]   = useState({ maintenanceMode: false, version: "1.0.0", allowOrders: true, allowReviews: true, minOrderValue: 0, featurePromos: true, featureTracking: true });
  const [goalConf, setGoalConf]         = useState({ monthlyTarget: 100000, weeklyTarget: 25000 });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving]           = useState(null);
  const [toast, setToast]             = useState("");
  const [revenueAnim, setRevenueAnim] = useState(0);

  // ── Offers UI state ───────────────────────────────────────────────────────
  const [offerForm, setOfferForm]         = useState(BLANK_OFFER);
  const [editingOffer, setEditingOffer]   = useState(null); // null = add mode, id = edit mode
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerSearch, setOfferSearch]     = useState("");
  const [offerFilter, setOfferFilter]     = useState("all"); // all, active, inactive

  // ── Other forms ───────────────────────────────────────────────────────────
  const [newStaff, setNewStaff]               = useState({ name: "", email: "", role: "staff", phone: "" });
  const [showAddStaff, setShowAddStaff]       = useState(false);
  const [newPromo, setNewPromo]               = useState({ code: "", discount: 10, type: "percent", maxUses: 100, minOrder: 0, expiry: "", description: "" });
  const [showAddPromo, setShowAddPromo]       = useState(false);
  const [newExpense, setNewExpense]           = useState({ name: "", amount: 0, category: "ingredients", date: new Date().toISOString().slice(0, 10) });
  const [showAddExpense, setShowAddExpense]   = useState(false);
  const [newLocation, setNewLocation]         = useState({ name: "", address: "", phone: "", manager: "", isOpen: true });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newNotif, setNewNotif]               = useState({ title: "", body: "", type: "push", audience: "all" });
  const [costMargin, setCostMargin]           = useState(40);
  const [activeBrand, setActiveBrand]         = useState("shrimmers");
  const [priceEdits, setPriceEdits]           = useState({});
  const [searchMenu, setSearchMenu]           = useState("");

  // ── Listeners ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;
    const subs = [
      onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), s =>
        setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(doc(db, "restaurantConfig", "status"), s => { if (s.exists()) setKitchen(s.data()); }),
      onSnapshot(collection(db, "ingredients"), s =>
        setIngredients(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "admins"), s =>
        setStaff(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "promoCodes"), orderBy("createdAt", "desc")), s =>
        setPromos(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      // ✅ NEW: Offers listener
      onSnapshot(query(collection(db, "offers"), orderBy("createdAt", "desc")), s =>
        setOffers(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "auditLog"), orderBy("timestamp", "desc"), limit(150)), s =>
        setAuditLog(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "securityLog"), orderBy("timestamp", "desc"), limit(60)), s =>
        setSecLog(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), s =>
        setReviews(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "disputes"), orderBy("createdAt", "desc")), s =>
        setDisputes(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "locations"), s =>
        setLocations(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "notifications"), orderBy("sentAt", "desc"), limit(50)), s =>
        setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), s =>
        setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "ingredientLog"), orderBy("timestamp", "desc"), limit(60)), s =>
        setIngredientLogs(s.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    const configSubs = [
      onSnapshot(doc(db, "restaurantConfig", "broadcast"),   s => { if (s.exists()) setBroadcast(s.data()); }),
      onSnapshot(doc(db, "restaurantConfig", "delivery"),    s => { if (s.exists()) setDeliveryConf(s.data()); }),
      onSnapshot(doc(db, "restaurantConfig", "schedule"),    s => { if (s.exists()) setSchedule(s.data()); }),
      onSnapshot(doc(db, "restaurantConfig", "appSettings"), s => { if (s.exists()) setAppSettings(s.data()); }),
      onSnapshot(doc(db, "restaurantConfig", "goals"),       s => { if (s.exists()) setGoalConf(s.data()); }),
    ];
    const menuSubs = BRANDS.map(b =>
      onSnapshot(collection(db, b.col), s => {
        setMenuDocs(prev => ({ ...prev, [b.key]: s.docs.map(d => ({ docId: d.id, ...d.data() })) }));
      })
    );
    return () => { [...subs, ...configSubs, ...menuSubs].forEach(u => u()); };
  }, [auth]);

  // Revenue ticker animation
  const totalRev = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
  useEffect(() => {
    if (!auth) return;
    let start = revenueAnim;
    const end = totalRev;
    if (start === end) return;
    const step = Math.max(1, Math.floor((end - start) / 30));
    const t = setInterval(() => {
      start = Math.min(start + step, end);
      setRevenueAnim(start);
      if (start >= end) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [totalRev, auth]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };

  const logAction = async (action, details = {}) => {
    try {
      await addDoc(collection(db, "auditLog"), {
        action, details, actor: "Super Admin",
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent.slice(0, 100),
      });
    } catch {}
  };

  const save = async (key, fn, successMsg) => {
    setSaving(key);
    try { await fn(); showToast(successMsg); logAction(key.toUpperCase()); }
    catch { showToast("❌ Failed. Try again."); }
    finally { setSaving(null); }
  };

  // ── PIN ───────────────────────────────────────────────────────────────────
  const handlePin = async () => {
    if (pin === SUPER_PIN) {
      sessionStorage.setItem("sa_v3", "true"); setAuth(true);
      await addDoc(collection(db, "securityLog"), { event: "LOGIN_SUCCESS", timestamp: serverTimestamp(), userAgent: navigator.userAgent.slice(0, 100) });
    } else {
      const n = failCount + 1; setFailCount(n); setPinErr(true); setTimeout(() => setPinErr(false), 2000);
      await addDoc(collection(db, "securityLog"), { event: "LOGIN_FAILED", attemptNumber: n, timestamp: serverTimestamp(), userAgent: navigator.userAgent.slice(0, 100) });
    }
    setPin("");
  };
  const logout = async () => { await logAction("LOGOUT"); sessionStorage.removeItem("sa_v3"); setAuth(false); };

  // ── Kitchen toggles ───────────────────────────────────────────────────────
  const toggleGlobal = () => {
    if (kitchen?.isOpen) {
      if (!window.confirm("⚠️ Are you sure you want to CLOSE the kitchen?\n\nThis will stop all 3 brands from accepting orders immediately.")) return;
    }
    save("kitchen_global", () =>
      updateDoc(doc(db, "restaurantConfig", "status"), { isOpen: !kitchen?.isOpen, updatedAt: new Date() }),
      kitchen?.isOpen ? "🔴 Kitchen closed" : "✅ Kitchen opened");
  };

  const toggleBrand = (bk) => {
    const brandCurrentlyOn = kitchen?.brands?.[bk] !== false;
    if (brandCurrentlyOn) {
      const brand = BRANDS.find(b => b.key === bk);
      if (!window.confirm(`⚠️ Are you sure you want to CLOSE ${brand?.label}?\n\nCustomers will no longer be able to order from this brand.`)) return;
    }
    save(`brand_${bk}`, () =>
      updateDoc(doc(db, "restaurantConfig", "status"), { [`brands.${bk}`]: !brandCurrentlyOn, updatedAt: new Date() }),
      "✅ Brand updated");
  };

  // ── Price editor ──────────────────────────────────────────────────────────
  const queuePriceEdit = (docId, itemIdx, newPrice) => {
    setPriceEdits(prev => ({ ...prev, [`${docId}__${itemIdx}`]: Number(newPrice) }));
  };

  const saveAllPrices = async () => {
    const brand = BRANDS.find(b => b.key === activeBrand);
    setSaving("prices");
    try {
      const batch = writeBatch(db);
      const docs = menuDocs[activeBrand] || [];
      const grouped = {};
      Object.entries(priceEdits).forEach(([k, price]) => {
        const [docId, idx] = k.split("__");
        if (!grouped[docId]) grouped[docId] = {};
        grouped[docId][idx] = price;
      });
      docs.forEach(catDoc => {
        if (!grouped[catDoc.docId]) return;
        const updatedItems = (catDoc.items || []).map((item, i) => {
          const newP = grouped[catDoc.docId]?.[String(i)];
          return newP !== undefined ? { ...item, price: newP } : item;
        });
        batch.update(doc(db, brand.col, catDoc.docId), { items: updatedItems });
      });
      await batch.commit();
      await logAction("PRICES_UPDATED", { brand: activeBrand, changes: Object.keys(priceEdits).length });
      setPriceEdits({});
      showToast(`✅ ${Object.keys(priceEdits).length} prices saved`);
    } catch { showToast("❌ Failed to save prices"); }
    finally { setSaving(null); }
  };

  // ── Promos ────────────────────────────────────────────────────────────────
  const genCode = () => {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
  };
  const addPromo = async () => {
    if (!newPromo.code.trim()) { showToast("❌ Code required"); return; }
    await save("promo", () => addDoc(collection(db, "promoCodes"), { ...newPromo, code: newPromo.code.toUpperCase(), usedCount: 0, active: true, createdAt: serverTimestamp() }), "✅ Promo created");
    setNewPromo({ code: "", discount: 10, type: "percent", maxUses: 100, minOrder: 0, expiry: "", description: "" });
    setShowAddPromo(false);
  };

  // ── ✅ OFFERS CRUD ────────────────────────────────────────────────────────
  const openAddOffer = () => {
    setEditingOffer(null);
    setOfferForm(BLANK_OFFER);
    setShowOfferForm(true);
  };

  const openEditOffer = (offer) => {
    setEditingOffer(offer.id);
    setOfferForm({ ...BLANK_OFFER, ...offer });
    setShowOfferForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelOfferForm = () => {
    setShowOfferForm(false);
    setEditingOffer(null);
    setOfferForm(BLANK_OFFER);
  };

  const validateOffer = () => {
    if (!offerForm.title.trim())  { showToast("❌ Title is required");          return false; }
    if (!offerForm.code.trim())   { showToast("❌ Offer code is required");     return false; }
    if (offerForm.discountValue <= 0) { showToast("❌ Discount value must be > 0"); return false; }
    if (offerForm.offerType === "percentage" && offerForm.discountValue > 100) {
      showToast("❌ Percentage can't exceed 100%"); return false;
    }
    return true;
  };

  const saveOffer = async () => {
    if (!validateOffer()) return;
    const payload = { ...offerForm, code: offerForm.code.toUpperCase() };

    if (editingOffer) {
      // Edit mode
      await save("offer_update", async () => {
        await updateDoc(doc(db, "offers", editingOffer), { ...payload, updatedAt: serverTimestamp() });
        await logAction("OFFER_UPDATED", { code: payload.code });
      }, "✅ Offer updated!");
    } else {
      // Add mode — check for duplicate code
      const dupCode = offers.find(o => o.code === offerForm.code.toUpperCase());
      if (dupCode) { showToast("❌ Offer code already exists"); return; }
      await save("offer_add", async () => {
        await addDoc(collection(db, "offers"), { ...payload, usageCount: 0, createdAt: serverTimestamp() });
        await logAction("OFFER_CREATED", { code: payload.code });
      }, "✅ Offer created!");
    }
    cancelOfferForm();
  };

  const toggleOfferActive = async (id, isActive) => {
    try {
      await updateDoc(doc(db, "offers", id), { isActive: !isActive, updatedAt: serverTimestamp() });
      showToast(isActive ? "🔴 Offer deactivated" : "✅ Offer activated");
      logAction("OFFER_TOGGLED", { id, newState: !isActive });
    } catch { showToast("❌ Failed to update offer"); }
  };

  const deleteOffer = async (id, code) => {
    if (!window.confirm(`Delete offer "${code}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "offers", id));
      await logAction("OFFER_DELETED", { code });
      showToast("✅ Offer deleted");
    } catch { showToast("❌ Failed to delete offer"); }
  };

  const duplicateOffer = async (offer) => {
    const newCode = offer.code + "_COPY";
    const dup = offers.find(o => o.code === newCode);
    if (dup) { showToast("❌ Duplicate already exists"); return; }
    try {
      await addDoc(collection(db, "offers"), {
        ...offer, id: undefined, code: newCode,
        title: offer.title + " (Copy)", isActive: false,
        usageCount: 0, createdAt: serverTimestamp(),
      });
      showToast("✅ Offer duplicated (inactive)");
      logAction("OFFER_DUPLICATED", { original: offer.code });
    } catch { showToast("❌ Failed to duplicate"); }
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const sendNotification = async () => {
    if (!newNotif.title || !newNotif.body) { showToast("❌ Title and body required"); return; }
    await save("notif", () => addDoc(collection(db, "notifications"), {
      ...newNotif, sentAt: serverTimestamp(), status: "sent",
      recipientCount: newNotif.audience === "all" ? orders.length : "—",
    }), "✅ Notification logged");
    setNewNotif({ title: "", body: "", type: "push", audience: "all" });
  };

  // ── Disputes ──────────────────────────────────────────────────────────────
  const resolveDispute = (id, resolution) => save(`dispute_${id}`, () =>
    updateDoc(doc(db, "disputes", id), { status: resolution, resolvedAt: serverTimestamp(), resolvedBy: "Super Admin" }),
    `✅ Dispute ${resolution}`);

  // ── Locations ─────────────────────────────────────────────────────────────
  const addLocation = async () => {
    if (!newLocation.name) { showToast("❌ Name required"); return; }
    await save("location", () => addDoc(collection(db, "locations"), { ...newLocation, createdAt: serverTimestamp() }), "✅ Location added");
    setNewLocation({ name: "", address: "", phone: "", manager: "", isOpen: true });
    setShowAddLocation(false);
  };
  const toggleLocation = (id, isOpen) => save(`loc_${id}`, () =>
    updateDoc(doc(db, "locations", id), { isOpen: !isOpen }), "✅ Location updated");
  const deleteLocation = async (id, name) => {
    if (!window.confirm(`Delete location "${name}"?`)) return;
    await deleteDoc(doc(db, "locations", id));
    await logAction("LOCATION_DELETED", { name });
    showToast("✅ Location deleted");
  };

  // ── Expenses ──────────────────────────────────────────────────────────────
  const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount) { showToast("❌ Fill all fields"); return; }
    await save("expense", () => addDoc(collection(db, "expenses"), { ...newExpense, amount: Number(newExpense.amount), createdAt: serverTimestamp() }), "✅ Expense added");
    setNewExpense({ name: "", amount: 0, category: "ingredients", date: new Date().toISOString().slice(0, 10) });
    setShowAddExpense(false);
  };
  const deleteExpense = async (id) => { await deleteDoc(doc(db, "expenses", id)); showToast("✅ Removed"); };

  // ── Staff ─────────────────────────────────────────────────────────────────
  const addStaff = async () => {
    if (!newStaff.name || !newStaff.email) { showToast("❌ Name & email required"); return; }
    await save("staff", () => addDoc(collection(db, "admins"), { ...newStaff, createdAt: serverTimestamp() }), "✅ Staff added");
    setNewStaff({ name: "", email: "", role: "staff", phone: "" }); setShowAddStaff(false);
  };
  const removeStaff = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    await deleteDoc(doc(db, "admins", id)); await logAction("STAFF_REMOVED", { name }); showToast("✅ Removed");
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const now = Date.now();
  const todayStr = new Date().toDateString();
  const delivered = orders.filter(o => o.status === "delivered");
  const todayRev    = delivered.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d?.toDateString?.() === todayStr; }).reduce((s, o) => s + (o.total || 0), 0);
  const weekRev     = delivered.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d && now - d < 7 * 864e5; }).reduce((s, o) => s + (o.total || 0), 0);
  const monthRev    = delivered.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d && now - d < 30 * 864e5; }).reduce((s, o) => s + (o.total || 0), 0);
  const prevWeekRev = delivered.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d && now - d >= 7 * 864e5 && now - d < 14 * 864e5; }).reduce((s, o) => s + (o.total || 0), 0);
  const weekGrowth  = prevWeekRev > 0 ? Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 100) : null;
  const avgOV       = delivered.length ? Math.round(totalRev / delivered.length) : 0;

  const custMap = {};
  orders.forEach(o => {
    const k = o.userEmail || o.userId || "guest";
    if (!custMap[k]) custMap[k] = { email: k, name: o.userName || "Guest", orders: 0, spent: 0, lastOrder: null };
    custMap[k].orders++;
    if (o.status === "delivered") custMap[k].spent += o.total || 0;
    const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
    if (!custMap[k].lastOrder || d > custMap[k].lastOrder) custMap[k].lastOrder = d;
  });
  const customers = Object.values(custMap).sort((a, b) => b.spent - a.spent);
  const repeatCust = customers.filter(c => c.orders >= 2).length;

  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  orders.forEach(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); if (d) heatmap[d.getDay()][d.getHours()]++; });
  const maxHeat = Math.max(...heatmap.flat(), 1);

  const topItemsMap = {};
  BRANDS.forEach(b => {
    const itemCount = {};
    orders.forEach(o => { (o.cart || []).forEach(item => { if (!item.name) return; itemCount[item.name] = (itemCount[item.name] || 0) + (item.quantity || 1); }); });
    topItemsMap[b.key] = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  });

  const totalExpenses   = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const estimatedCost   = (totalRev * costMargin) / 100;
  const netProfit       = totalRev - totalExpenses;
  const grossProfit     = totalRev - estimatedCost;
  const profitMargin    = totalRev > 0 ? Math.round((grossProfit / totalRev) * 100) : 0;
  const monthlyExpenses = expenses.filter(e => { const d = new Date(e.date); return d && now - d < 30 * 864e5; }).reduce((s, e) => s + (e.amount || 0), 0);

  const monthGoalPct = Math.min((monthRev / (goalConf.monthlyTarget || 1)) * 100, 100);
  const weekGoalPct  = Math.min((weekRev  / (goalConf.weeklyTarget  || 1)) * 100, 100);

  const lowStock  = ingredients.filter(i => (i.currentStock || 0) < (i.minThreshold || 20));
  const critStock = lowStock.filter(i => (i.currentStock || 0) < (i.minThreshold || 20) * 0.5);

  const isWithinHours = (() => { const h = new Date().getHours(); return h >= 11 || h < 4; })();
  const isGlobalOpen  = kitchen?.isOpen && isWithinHours;
  const currentBrandDocs = menuDocs[activeBrand] || [];

  // ── Offers computed ───────────────────────────────────────────────────────
  const activeOffers   = offers.filter(o => o.isActive);
  const inactiveOffers = offers.filter(o => !o.isActive);
  const filteredOffers = offers.filter(o => {
    const matchSearch = !offerSearch ||
      o.title?.toLowerCase().includes(offerSearch.toLowerCase()) ||
      o.code?.toLowerCase().includes(offerSearch.toLowerCase());
    const matchFilter = offerFilter === "all" || (offerFilter === "active" ? o.isActive : !o.isActive);
    return matchSearch && matchFilter;
  });

  const roleColors = { admin: "#f44336", manager: "#ff9800", chef: "#9c27b0", staff: "#2196f3", delivery: "#4caf50" };
  const catColors  = { ingredients: "#ff9800", packaging: "#2196f3", utilities: "#9c27b0", salaries: "#f44336", marketing: "#4caf50", maintenance: "#00bcd4", other: "#607d8b" };

  const offerTypeColor = { flat: "#ffd700", percentage: "#4fc3f7", category: "#ff8a65", free_item: "#81c784" };
  const offerTypeIcon  = { flat: "💳", percentage: "📊", category: "🍕", free_item: "🎁" };

  // ═══════════════════ PIN GATE ═════════════════════════════════════════════
  if (!auth) {
    const locked = failCount >= 5;
    return (
      <div className="sa-pin-page">
        <div className="sa-pin-card">
          <div className="sa-pin-crown">👑</div>
          <h2 className="sa-pin-title">Super Admin</h2>
          <p className="sa-pin-sub">BlueBliss Owner Panel v3</p>
          {locked ? (
            <p className="sa-locked-msg">🔒 Too many failed attempts. Refresh to retry.</p>
          ) : (
            <>
              <div className="sa-pin-dots">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`sa-pin-dot ${pin.length > i ? "filled" : ""}`} />
                ))}
              </div>
              {pinErr && <p className="sa-pin-err">❌ Wrong PIN — {5 - failCount} attempts left</p>}
              <div className="sa-pin-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
                  <button
                    key={i}
                    className={`sa-pin-key ${k === "" ? "hidden" : ""}`}
                    onClick={() => {
                      if (k === "⌫") setPin(p => p.slice(0, -1));
                      else if (k !== "" && pin.length < 4) setPin(p => p + k);
                    }}
                  >{k}</button>
                ))}
              </div>
              <button className="sa-pin-submit" onClick={handlePin} disabled={pin.length < 4}>Unlock →</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════ DASHBOARD ═══════════════════════════════════════════
  return (
    <div className="sa-page">
      {toast && <div className="sa-toast">{toast}</div>}

      {/* Topbar */}
      <div className="sa-topbar">
        <div className="sa-topbar-left">
          <span className="sa-topbar-icon">👑</span>
          <div>
            <h1 className="sa-top-title">Super Admin</h1>
            <p className="sa-top-sub">BlueBliss Owner Panel</p>
          </div>
        </div>
        <div className="sa-topbar-right">
          <div className="sa-pill sa-pill-revenue">💰 {fmt(revenueAnim)}</div>
          {appSettings.maintenanceMode && <div className="sa-pill sa-pill-maintenance">🚧 Maintenance</div>}
          <div className="sa-pill" style={{ background: isGlobalOpen ? "rgba(76,175,80,0.15)" : "rgba(244,67,54,0.15)", border: `1px solid ${isGlobalOpen ? "#4caf5055" : "#f4433655"}`, color: isGlobalOpen ? "#4caf50" : "#f44336" }}>
            {isGlobalOpen ? "● Open" : "● Closed"}
          </div>
          <button className="sa-logout-btn" onClick={logout}>🚪 Exit</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sa-tab-bar">
        {TABS.map(t => (
          <button key={t.key} className={`sa-tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "offers" && activeOffers.length > 0 && (
              <span className="sa-green-dot">{activeOffers.length}</span>
            )}
            {t.key === "refunds" && disputes.filter(d => d.status === "open").length > 0 && (
              <span className="sa-red-dot">{disputes.filter(d => d.status === "open").length}</span>
            )}
            {t.key === "security" && secLog.filter(l => l.event === "LOGIN_FAILED").length > 0 && (
              <span className="sa-red-dot" />
            )}
          </button>
        ))}
      </div>

      <div className="sa-content">

        {/* ══════ OVERVIEW ══════ */}
        {tab === "overview" && (
          <div>
            <div className="sa-grid4">
              {[
                { label: "Today",       val: fmt(todayRev),        sub: `${orders.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d?.toDateString?.() === todayStr; }).length} orders`, color: "#ffd700" },
                { label: "This Week",   val: fmt(weekRev),         sub: weekGrowth !== null ? `${weekGrowth >= 0 ? "+" : ""}${weekGrowth}% vs last week` : "vs last week", color: weekGrowth >= 0 ? "#4caf50" : "#f44336" },
                { label: "This Month",  val: fmt(monthRev),        sub: `Goal: ${Math.round(monthGoalPct)}%`, color: "#2196f3" },
                { label: "All Time",    val: fmt(revenueAnim),     sub: `${delivered.length} orders`, color: "#9c27b0" },
                { label: "Avg Order",   val: fmt(avgOV),           sub: "Per delivery", color: "#ff9800" },
                { label: "Customers",   val: customers.length,     sub: `${repeatCust} repeat`, color: "#00bcd4" },
                { label: "Pending",     val: orders.filter(o => o.status === "pending").length, sub: "Needs action", color: "#f44336" },
                { label: "Active Offers", val: activeOffers.length, sub: `${offers.length} total`, color: "#ffd700" },
              ].map((k, i) => (
                <div key={i} className="sa-kpi-card" style={{ borderColor: k.color }}>
                  <p className="sa-kpi-label">{k.label}</p>
                  <p className="sa-kpi-val" style={{ color: k.color }}>{k.val}</p>
                  <p className="sa-kpi-sub">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Goal trackers */}
            <div className="sa-card">
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">🎯 Revenue Goals</h3>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#555", marginRight: "8px" }}>Monthly Target</span>
                    <input type="number" value={goalConf.monthlyTarget} onChange={e => setGoalConf(p => ({ ...p, monthlyTarget: Number(e.target.value) }))} className="sa-inline-input" style={{ width: "100px" }} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#555", marginRight: "8px" }}>Weekly Target</span>
                    <input type="number" value={goalConf.weeklyTarget} onChange={e => setGoalConf(p => ({ ...p, weeklyTarget: Number(e.target.value) }))} className="sa-inline-input" style={{ width: "100px" }} />
                  </div>
                  <button className="sa-primary-btn" onClick={() => save("goals", () => setDoc(doc(db, "restaurantConfig", "goals"), { ...goalConf, updatedAt: serverTimestamp() }), "✅ Goals saved")}>Save</button>
                </div>
              </div>
              {[
                { label: "Monthly Goal", current: monthRev, target: goalConf.monthlyTarget, pct: monthGoalPct, color: "#2196f3" },
                { label: "Weekly Goal",  current: weekRev,  target: goalConf.weeklyTarget,  pct: weekGoalPct,  color: "#4caf50" },
              ].map((g2, i) => (
                <div key={i} className="sa-goal-bar-wrap">
                  <div className="sa-goal-bar-header">
                    <span className="sa-goal-bar-label">{g2.label}</span>
                    <span className="sa-goal-bar-value" style={{ color: g2.pct >= 100 ? "#4caf50" : g2.color }}>
                      {fmt(g2.current)} / {fmt(g2.target)} ({Math.round(g2.pct)}%)
                    </span>
                  </div>
                  <div className="sa-goal-bar-track">
                    <div className="sa-goal-bar-fill" style={{ width: `${g2.pct}%`, background: g2.pct >= 100 ? "#4caf50" : g2.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="sa-card">
              <h3 className="sa-card-title">📊 This Week vs Last Week</h3>
              <div className="sa-week-comparison-grid">
                {[
                  { label: "Revenue", thisVal: weekRev, lastVal: prevWeekRev, isMoney: true },
                  { label: "Orders",  thisVal: orders.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d && now - d < 7 * 864e5; }).length, lastVal: orders.filter(o => { const d = o.createdAt?.toDate?.() || new Date(o.createdAt); return d && now - d >= 7 * 864e5 && now - d < 14 * 864e5; }).length, isMoney: false },
                  { label: "Avg Order", thisVal: avgOV, lastVal: null, isMoney: true },
                ].map((row, i) => {
                  const diff = row.lastVal != null ? Math.round(((row.thisVal - row.lastVal) / (row.lastVal || 1)) * 100) : null;
                  return (
                    <div key={i} className="sa-week-box">
                      <p className="sa-week-box-label">{row.label}</p>
                      <div className="sa-week-box-inner">
                        <div>
                          <p className="sa-week-this-label">This week</p>
                          <p className="sa-week-this-val">{row.isMoney ? fmt(row.thisVal) : row.thisVal}</p>
                        </div>
                        {row.lastVal != null && (
                          <div>
                            <p className="sa-week-last-label">Last week</p>
                            <p className="sa-week-last-val">{row.isMoney ? fmt(row.lastVal) : row.lastVal}</p>
                          </div>
                        )}
                      </div>
                      {diff != null && (
                        <div className="sa-week-diff">
                          <span className="sa-week-diff-pct" style={{ color: diff >= 0 ? "#4caf50" : "#f44336" }}>{diff >= 0 ? "▲" : "▼"} {Math.abs(diff)}%</span>
                          <span className="sa-week-diff-sub">vs last week</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sa-card">
              <h3 className="sa-card-title">🏆 Top Selling Items</h3>
              <div className="sa-top-items-grid">
                {BRANDS.map(b => (
                  <div key={b.key}>
                    <p className="sa-top-items-brand-label" style={{ color: b.color }}>{b.icon} {b.label}</p>
                    {(topItemsMap[b.key] || []).length === 0 ? <p style={{ color: "#333", fontSize: "12px" }}>No data yet</p> : (
                      topItemsMap[b.key].map(([name, count], i) => (
                        <div key={i} className="sa-top-item-row">
                          <div className="sa-top-item-name-row">
                            <span className="sa-top-item-name">{name}</span>
                            <span className="sa-top-item-count" style={{ color: b.color }}>{count}×</span>
                          </div>
                          <div className="sa-top-item-bar-track">
                            <div className="sa-top-item-bar-fill" style={{ width: `${(count / (topItemsMap[b.key][0]?.[1] || 1)) * 100}%`, background: b.color }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>

            {critStock.length > 0 && (
              <div className="sa-card" style={{ borderColor: "rgba(244,67,54,0.3)" }}>
                <h3 className="sa-card-title" style={{ color: "#f44336" }}>🚨 Critical Stock ({critStock.length})</h3>
                <div className="sa-crit-tags">
                  {critStock.map(i => <span key={i.id} className="sa-crit-tag">{i.name} ({i.currentStock} {i.unit})</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ FINANCE ══════ */}
        {tab === "finance" && (
          <div>
            <div className="sa-grid4">
              {[
                { label: "Total Revenue",   val: fmt(totalRev),       color: "#4caf50" },
                { label: "Total Expenses",  val: fmt(totalExpenses),  color: "#f44336" },
                { label: "Net Profit",      val: fmt(netProfit),      color: netProfit >= 0 ? "#ffd700" : "#f44336" },
                { label: "Profit Margin",   val: `${profitMargin}%`,  color: profitMargin >= 30 ? "#4caf50" : profitMargin >= 15 ? "#ff9800" : "#f44336" },
                { label: "Month Revenue",   val: fmt(monthRev),       color: "#2196f3" },
                { label: "Month Expenses",  val: fmt(monthlyExpenses),color: "#ff9800" },
                { label: "Month Net",       val: fmt(monthRev - monthlyExpenses), color: (monthRev - monthlyExpenses) >= 0 ? "#4caf50" : "#f44336" },
                { label: "Cost Ratio",      val: `${costMargin}%`,    color: "#9c27b0" },
              ].map((k, i) => (
                <div key={i} className="sa-kpi-card" style={{ borderColor: k.color }}>
                  <p className="sa-kpi-label">{k.label}</p>
                  <p className="sa-kpi-val" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">📊 P&L Analysis</h3>
              <div className="sa-pl-slider-row">
                <label className="sa-pl-slider-label">Estimated cost % of revenue:</label>
                <input type="range" min={10} max={80} value={costMargin} onChange={e => setCostMargin(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="sa-pl-slider-val">{costMargin}%</span>
              </div>
              <div className="sa-grid4">
                {[
                  { label: "Revenue",        val: fmt(totalRev),      color: "#4caf50" },
                  { label: "Est. Cost",       val: fmt(estimatedCost), color: "#f44336" },
                  { label: "Gross Profit",    val: fmt(grossProfit),   color: "#ffd700" },
                  { label: "Net (after exp)", val: fmt(netProfit),     color: netProfit >= 0 ? "#4caf50" : "#f44336" },
                ].map((item, i) => (
                  <div key={i} className="sa-kpi-card" style={{ borderColor: item.color, padding: "14px" }}>
                    <p className="sa-kpi-label">{item.label}</p>
                    <p className="sa-kpi-val" style={{ color: item.color, fontSize: "20px" }}>{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="sa-card">
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">💸 Expense Tracker</h3>
                <button className="sa-primary-btn" onClick={() => setShowAddExpense(!showAddExpense)}>{showAddExpense ? "✕ Cancel" : "+ Add Expense"}</button>
              </div>
              {showAddExpense && (
                <div className="sa-form-box">
                  <div className="sa-form-grid-4">
                    <div><label className="sa-lbl">Expense Name</label><input value={newExpense.name} onChange={e => setNewExpense(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Oil purchase" className="sa-inp" /></div>
                    <div><label className="sa-lbl">Amount (₹)</label><input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Category</label>
                      <select value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} className="sa-inp">
                        {["ingredients","packaging","utilities","salaries","marketing","maintenance","other"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className="sa-lbl">Date</label><input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} className="sa-inp" /></div>
                  </div>
                  <button className="sa-primary-btn" onClick={addExpense}>✅ Add Expense</button>
                </div>
              )}
              <div className="sa-cat-grid">
                {["ingredients","packaging","utilities","salaries","marketing","maintenance","other"].map(cat => {
                  const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
                  if (!catTotal) return null;
                  return (
                    <div key={cat} className="sa-cat-box" style={{ border: `1px solid ${catColors[cat]}33` }}>
                      <p className="sa-cat-box-label">{cat}</p>
                      <p className="sa-cat-box-val" style={{ color: catColors[cat] }}>{fmt(catTotal)}</p>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
              {expenses.length === 0 ? <p className="sa-empty">No expenses logged yet.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {expenses.slice(0, 20).map(e => (
                    <div key={e.id} className="sa-expense-row">
                      <span className="sa-expense-date">{e.date}</span>
                      <span className="sa-expense-name">{e.name}</span>
                      <span className="sa-expense-cat-badge">{e.category}</span>
                      <span className="sa-expense-amount">{fmt(e.amount)}</span>
                      <button className="sa-icon-btn" style={{ color: "#f44336" }} onClick={() => deleteExpense(e.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "16px" }}>
                <button className="sa-export-btn" onClick={() => exportCSV(expenses.map(e => ({ date: e.date, name: e.name, category: e.category, amount: e.amount })), `expenses_${Date.now()}.csv`)}>⬇️ Export Expenses CSV</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ ANALYTICS ══════ */}
        {tab === "analytics" && (
          <div>
            <div className="sa-card">
              <h3 className="sa-card-title">🕐 Order Heatmap — Hour × Day</h3>
              <p className="sa-card-sub">Identify your busiest hours and slowest periods.</p>
              <div className="sa-heatmap-scroll">
                <div className="sa-heatmap-grid">
                  <div />
                  {HOURS.map(h => (
                    <div key={h} className="sa-heatmap-hour-label">
                      {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                    </div>
                  ))}
                  {DAYS.map((day, di) => (
                    <React.Fragment key={day}>
                      <div className="sa-heatmap-day-label">{day}</div>
                      {HOURS.map(h => {
                        const val = heatmap[di][h];
                        const pct = val / maxHeat;
                        return (
                          <div key={h} className="sa-heatmap-cell" title={`${day} ${h}:00 — ${val} orders`}
                            style={{ background: pct === 0 ? "rgba(255,255,255,0.04)" : `rgba(255,215,0,${Math.max(0.1, pct)})`, color: pct > 0.5 ? "#000" : "transparent" }}>
                            {val > 0 ? val : ""}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="sa-heatmap-legend">
                <span>Low</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => <div key={v} className="sa-heatmap-legend-swatch" style={{ background: `rgba(255,215,0,${v})` }} />)}
                <span>High</span>
              </div>
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">📅 Daily Revenue — Last 7 Days</h3>
              <div className="sa-bar-chart">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(now - (6 - i) * 864e5);
                  const dayRev = delivered.filter(o => { const od = o.createdAt?.toDate?.() || new Date(o.createdAt); return od?.toDateString?.() === d.toDateString(); }).reduce((s, o) => s + (o.total || 0), 0);
                  const prevDayRev = delivered.filter(o => { const od = o.createdAt?.toDate?.() || new Date(o.createdAt); return od?.toDateString?.() === new Date(now - (7 + 6 - i) * 864e5).toDateString(); }).reduce((s, o) => s + (o.total || 0), 0);
                  const maxDay = Math.max(...Array.from({ length: 7 }, (_, j) => delivered.filter(o => { const od = o.createdAt?.toDate?.() || new Date(o.createdAt); return od?.toDateString?.() === new Date(now - (6 - j) * 864e5).toDateString(); }).reduce((s, o) => s + (o.total || 0), 0)), 1);
                  const pct = (dayRev / maxDay) * 100;
                  const prevPct = (prevDayRev / maxDay) * 100;
                  return (
                    <div key={i} className="sa-bar-col">
                      <span className="sa-bar-val-label">{dayRev > 0 ? `₹${Math.round(dayRev / 100) * 100}` : ""}</span>
                      <div className="sa-bar-track">
                        {prevPct > 0 && <div className="sa-bar-prev" style={{ height: `${prevPct}%` }} />}
                        <div className="sa-bar-fill" style={{ height: `${pct}%` }} />
                      </div>
                      <span className="sa-bar-day-label">{DAYS[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
              <p className="sa-chart-note">Light bars = same day last week</p>
            </div>
          </div>
        )}

        {/* ══════ CUSTOMERS ══════ */}
        {tab === "customers" && (
          <div>
            <div className="sa-grid4">
              {[
                { label: "Total Customers",  val: customers.length,   color: "#ffd700" },
                { label: "Repeat Customers", val: repeatCust,         color: "#4caf50" },
                { label: "Avg LTV",          val: fmt(customers.length ? Math.round(totalRev / customers.length) : 0), color: "#2196f3" },
                { label: "Avg Order Value",  val: fmt(avgOV),         color: "#ff9800" },
              ].map((k, i) => (
                <div key={i} className="sa-kpi-card" style={{ borderColor: k.color }}>
                  <p className="sa-kpi-label">{k.label}</p>
                  <p className="sa-kpi-val" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">🏆 Top Customers by Lifetime Value</h3>
              <div className="sa-cust-table-wrap">
                <div className="sa-tr header" style={{ gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr" }}>
                  <span>Rank</span><span>Customer</span><span>Email</span><span>Orders</span><span>LTV</span><span>Last Order</span>
                </div>
                {customers.slice(0, 15).map((c, i) => (
                  <div key={i} className="sa-tr" style={{ gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr" }}>
                    <span style={{ color: i < 3 ? ["#ffd700","#aaa","#cd7f32"][i] : "#444", fontWeight: "800" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</span>
                    <span style={{ fontWeight: "700" }}>{c.name}</span>
                    <span style={{ color: "#555", fontSize: "12px" }}>{c.email}</span>
                    <span style={{ color: "#2196f3", fontWeight: "700" }}>{c.orders}</span>
                    <span style={{ color: "#4caf50", fontWeight: "800" }}>{fmt(c.spent)}</span>
                    <span style={{ color: "#555", fontSize: "12px" }}>{c.lastOrder?.toLocaleDateString?.()}</span>
                  </div>
                ))}
                {customers.length === 0 && <p className="sa-empty">No customer data yet.</p>}
              </div>
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">⭐ Reviews & Ratings</h3>
              {reviews.length === 0 ? <p className="sa-empty">No reviews yet.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="sa-rating-summary">
                    <span className="sa-avg-rating">{(reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)} ★</span>
                    <div>
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        return (
                          <div key={star} className="sa-star-row">
                            <span className="sa-star-label">{star}★</span>
                            <div className="sa-star-bar-track"><div className="sa-star-bar-fill" style={{ width: `${(count / reviews.length) * 100}%` }} /></div>
                            <span className="sa-star-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {reviews.map(r => (
                    <div key={r.id} className="sa-review-card">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span className="sa-review-name">{r.userName || "Anonymous"}</span>
                          <span className="sa-review-stars">{Array.from({ length: r.rating || 0 }, () => "★").join("")}</span>
                          <span className="sa-review-time">{timeAgo(r.createdAt)}</span>
                        </div>
                        <p className="sa-review-comment">{r.comment || "No comment"}</p>
                      </div>
                      <button className="sa-icon-btn" style={{ color: "#f44336" }}
                        onClick={async () => { if (window.confirm("Delete this review?")) { await deleteDoc(doc(db, "reviews", r.id)); showToast("✅ Review removed"); } }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ MENU EDITOR ══════ */}
        {tab === "menueditor" && (
          <div>
            <div className="sa-brand-selector">
              {BRANDS.map(b => (
                <button key={b.key} className="sa-brand-tab"
                  style={{ borderColor: activeBrand === b.key ? b.color : "rgba(255,255,255,0.1)", background: activeBrand === b.key ? `${b.color}18` : "rgba(255,255,255,0.03)", color: activeBrand === b.key ? b.color : "#666" }}
                  onClick={() => { setActiveBrand(b.key); setPriceEdits({}); }}>
                  {b.icon} {b.label}
                </button>
              ))}
              {Object.keys(priceEdits).length > 0 && (
                <button className="sa-primary-btn" style={{ marginLeft: "auto" }} onClick={saveAllPrices} disabled={saving === "prices"}>
                  {saving === "prices" ? "Saving..." : "💾 Save All Prices"}
                </button>
              )}
            </div>
            <input value={searchMenu} onChange={e => setSearchMenu(e.target.value)} placeholder="🔍 Search items..." className="sa-inp" style={{ width: "100%", marginBottom: "16px" }} />
            {currentBrandDocs.length === 0 ? <p className="sa-empty">Loading menu...</p> : (
              currentBrandDocs.map(catDoc => {
                const items = (catDoc.items || []).filter(item => !searchMenu || item.name?.toLowerCase().includes(searchMenu.toLowerCase()));
                if (!items.length) return null;
                const activeBrandObj = BRANDS.find(b => b.key === activeBrand);
                return (
                  <div key={catDoc.docId} style={{ marginBottom: "20px" }}>
                    <div className="sa-menu-category-header" style={{ border: `1px solid ${activeBrandObj?.color}33` }}>
                      <span className="sa-menu-category-name" style={{ color: activeBrandObj?.color }}>{catDoc.category}</span>
                      <span className="sa-menu-category-count">{items.length} items</span>
                    </div>
                    <div className="sa-menu-items-grid">
                      {items.map((item, i) => {
                        const origIdx = (catDoc.items || []).findIndex(it => it.name === item.name && it.price === item.price);
                        const editKey = `${catDoc.docId}__${origIdx}`;
                        const isEdited = priceEdits[editKey] !== undefined;
                        return (
                          <div key={i} className={`sa-menu-item-card ${isEdited ? "edited" : ""}`}>
                            {item.img && <img src={item.img} alt="" className="sa-menu-item-img" />}
                            <div className="sa-menu-item-info">
                              <p className="sa-menu-item-name">{item.name}</p>
                              <div className="sa-menu-price-row">
                                <span className="sa-menu-currency">₹</span>
                                <input type="number" defaultValue={item.price} onChange={e => queuePriceEdit(catDoc.docId, origIdx, e.target.value)}
                                  className={`sa-inp sa-price-inp ${isEdited ? "edited" : ""}`} />
                                {isEdited && <span className="sa-price-edited-badge">edited</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
            {Object.keys(priceEdits).length > 0 && (
              <div className="sa-save-float">
                <button className="sa-secondary-btn" onClick={() => setPriceEdits({})}>✕ Discard</button>
                <button className="sa-primary-btn" onClick={saveAllPrices} disabled={saving === "prices"}>
                  {saving === "prices" ? "Saving..." : `💾 Save ${Object.keys(priceEdits).length} Prices`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            🎁  OFFERS  — Full management, moved from Admin panel
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === "offers" && (
          <div>
            {/* ── Stats row ── */}
            <div className="sa-grid4" style={{ marginBottom: "28px" }}>
              {[
                { label: "Active Offers",   val: activeOffers.length,   color: "#4caf50", sub: "Live on platform" },
                { label: "Inactive",        val: inactiveOffers.length, color: "#888",    sub: "Paused / draft" },
                { label: "Total Offers",    val: offers.length,         color: "#ffd700", sub: "All time" },
                { label: "Offer Types",     val: new Set(offers.map(o => o.offerType)).size, color: "#9c27b0", sub: "Distinct types in use" },
              ].map((k, i) => (
                <div key={i} className="sa-kpi-card" style={{ borderColor: k.color }}>
                  <p className="sa-kpi-label">{k.label}</p>
                  <p className="sa-kpi-val" style={{ color: k.color }}>{k.val}</p>
                  <p className="sa-kpi-sub">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Type breakdown ── */}
            {offers.length > 0 && (
              <div className="sa-card" style={{ marginBottom: "20px" }}>
                <h3 className="sa-card-title">📊 Offer Type Breakdown</h3>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {OFFER_TYPES.map(type => {
                    const count = offers.filter(o => o.offerType === type.value).length;
                    const pct   = offers.length ? Math.round((count / offers.length) * 100) : 0;
                    return (
                      <div key={type.value} style={{
                        flex: 1, minWidth: "120px", background: `${offerTypeColor[type.value]}12`,
                        border: `1px solid ${offerTypeColor[type.value]}44`,
                        borderRadius: "10px", padding: "14px", textAlign: "center",
                      }}>
                        <p style={{ fontSize: "20px", margin: "0 0 4px" }}>{type.icon}</p>
                        <p style={{ fontSize: "11px", color: offerTypeColor[type.value], fontWeight: "700", textTransform: "uppercase", margin: "0 0 6px" }}>{type.label}</p>
                        <p style={{ fontSize: "22px", fontWeight: "800", color: offerTypeColor[type.value], margin: "0 0 2px" }}>{count}</p>
                        <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>{pct}% of all</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Add / Edit form ── */}
            <div className="sa-card" style={{ marginBottom: "20px", borderColor: showOfferForm ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.06)" }}>
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">
                  {showOfferForm ? (editingOffer ? "✏️ Edit Offer" : "➕ Add New Offer") : "🎁 Offer Management"}
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  {showOfferForm && (
                    <button className="sa-secondary-btn" onClick={cancelOfferForm}>✕ Cancel</button>
                  )}
                  <button className="sa-primary-btn" onClick={showOfferForm ? saveOffer : openAddOffer} disabled={saving === "offer_add" || saving === "offer_update"}>
                    {saving === "offer_add" || saving === "offer_update" ? "Saving..." :
                      showOfferForm ? (editingOffer ? "💾 Save Changes" : "✅ Create Offer") : "+ New Offer"}
                  </button>
                </div>
              </div>

              {showOfferForm && (
                <div>
                  {/* Row 1: Title + Code + Icon */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "14px", marginBottom: "14px" }}>
                    <div>
                      <label className="sa-lbl">Offer Title *</label>
                      <input value={offerForm.title} onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Flat ₹99 off on orders above ₹499" className="sa-inp" />
                    </div>
                    <div>
                      <label className="sa-lbl">Offer Code *</label>
                      <input value={offerForm.code} onChange={e => setOfferForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                        placeholder="SAVE99" className="sa-inp" />
                    </div>
                    <div>
                      <label className="sa-lbl">Icon</label>
                      <input value={offerForm.icon} onChange={e => setOfferForm(p => ({ ...p, icon: e.target.value }))}
                        maxLength="2" className="sa-inp" style={{ width: "60px", fontSize: "22px", textAlign: "center" }} />
                    </div>
                  </div>

                  {/* Row 2: Offer type selection — card style */}
                  <div style={{ marginBottom: "14px" }}>
                    <label className="sa-lbl">Offer Type *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "6px" }}>
                      {OFFER_TYPES.map(type => (
                        <button key={type.value} onClick={() => setOfferForm(p => ({ ...p, offerType: type.value }))}
                          style={{
                            padding: "12px 8px", border: `2px solid ${offerForm.offerType === type.value ? offerTypeColor[type.value] : "rgba(255,255,255,0.08)"}`,
                            borderRadius: "10px", background: offerForm.offerType === type.value ? `${offerTypeColor[type.value]}18` : "rgba(255,255,255,0.03)",
                            cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                          }}>
                          <p style={{ fontSize: "20px", margin: "0 0 4px" }}>{type.icon}</p>
                          <p style={{ fontSize: "12px", fontWeight: "700", color: offerForm.offerType === type.value ? offerTypeColor[type.value] : "#666", margin: "0 0 2px" }}>{type.label}</p>
                          <p style={{ fontSize: "10px", color: "#444", margin: 0 }}>{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: Values */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "14px" }}>
                    <div>
                      <label className="sa-lbl">
                        Discount Value * {offerForm.offerType === "percentage" ? "(%)" : "(₹)"}
                      </label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="number" value={offerForm.discountValue} min="0"
                          max={offerForm.offerType === "percentage" ? 100 : undefined}
                          onChange={e => setOfferForm(p => ({ ...p, discountValue: Number(e.target.value) }))}
                          className="sa-inp" style={{ flex: 1 }} />
                        <span style={{ padding: "10px 12px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "6px", color: "#ffd700", fontWeight: "800", whiteSpace: "nowrap" }}>
                          {offerForm.offerType === "percentage" ? "%" : "₹"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="sa-lbl">Min Order Amount (₹)</label>
                      <input type="number" value={offerForm.minOrderAmount} min="0"
                        onChange={e => setOfferForm(p => ({ ...p, minOrderAmount: Number(e.target.value) }))}
                        placeholder="0 = no minimum" className="sa-inp" />
                    </div>
                    <div>
                      <label className="sa-lbl">Max Discount Cap (₹)</label>
                      <input type="number" value={offerForm.maxDiscount} min="0"
                        onChange={e => setOfferForm(p => ({ ...p, maxDiscount: Number(e.target.value) }))}
                        placeholder="0 = no cap" className="sa-inp" />
                    </div>
                  </div>

                  {/* Category field — only when type is "category" */}
                  {offerForm.offerType === "category" && (
                    <div style={{ marginBottom: "14px" }}>
                      <label className="sa-lbl">Applicable Category *</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                        {OFFER_CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setOfferForm(p => ({ ...p, applicableCategory: cat }))}
                            style={{
                              padding: "7px 16px", border: `2px solid ${offerForm.applicableCategory === cat ? "#ff8a65" : "rgba(255,255,255,0.1)"}`,
                              borderRadius: "20px", background: offerForm.applicableCategory === cat ? "rgba(255,138,101,0.15)" : "rgba(255,255,255,0.03)",
                              cursor: "pointer", fontSize: "13px", fontWeight: "700",
                              color: offerForm.applicableCategory === cat ? "#ff8a65" : "#555",
                            }}>{cat}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Description */}
                  <div style={{ marginBottom: "14px" }}>
                    <label className="sa-lbl">Description (shown to customers)</label>
                    <input value={offerForm.description} onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="e.g. Use code SAVE99 to get ₹99 off on your first order" className="sa-inp" />
                  </div>

                  {/* Row 5: Colors + Preview */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    <div>
                      <label className="sa-lbl">Card Color (Primary)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="color" value={offerForm.bgColor} onChange={e => setOfferForm(p => ({ ...p, bgColor: e.target.value }))}
                          style={{ width: "48px", height: "40px", border: "2px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer" }} />
                        <span style={{ flex: 1, padding: "10px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
                          {offerForm.bgColor}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="sa-lbl">Card Color (Secondary)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="color" value={offerForm.bgColorAlt} onChange={e => setOfferForm(p => ({ ...p, bgColorAlt: e.target.value }))}
                          style={{ width: "48px", height: "40px", border: "2px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer" }} />
                        <span style={{ flex: 1, padding: "10px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
                          {offerForm.bgColorAlt}
                        </span>
                      </div>
                    </div>
                    {/* Live mini preview */}
                    <div>
                      <label className="sa-lbl">Live Preview</label>
                      <div style={{
                        height: "60px", borderRadius: "10px", padding: "0 16px",
                        background: `linear-gradient(135deg, ${offerForm.bgColor}, ${offerForm.bgColorAlt})`,
                        display: "flex", alignItems: "center", gap: "10px",
                      }}>
                        <span style={{ fontSize: "22px" }}>{offerForm.icon || "🎁"}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: "rgba(0,0,0,0.7)" }}>{offerForm.code || "CODE"}</p>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#000", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {offerForm.title || "Offer title here"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Active toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <button onClick={() => setOfferForm(p => ({ ...p, isActive: !p.isActive }))}
                      style={{
                        width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                        background: offerForm.isActive ? "#4caf50" : "#333", position: "relative", transition: "all 0.3s",
                      }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                        position: "absolute", top: "3px", transition: "all 0.3s",
                        left: offerForm.isActive ? "23px" : "3px",
                      }} />
                    </button>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: offerForm.isActive ? "#4caf50" : "#888" }}>
                        {offerForm.isActive ? "✅ Active — Visible to customers" : "⏸️ Inactive — Hidden from customers"}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>Toggle to control visibility without deleting</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Search + Filter bar ── */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              <input value={offerSearch} onChange={e => setOfferSearch(e.target.value)}
                placeholder="🔍 Search offers by title or code..."
                className="sa-inp" style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: "6px" }}>
                {["all", "active", "inactive"].map(f => (
                  <button key={f} onClick={() => setOfferFilter(f)}
                    style={{
                      padding: "9px 16px", border: "1px solid", borderRadius: "8px", cursor: "pointer",
                      fontSize: "12px", fontWeight: "700", textTransform: "capitalize", transition: "all 0.2s",
                      borderColor: offerFilter === f ? "#ffd700" : "rgba(255,255,255,0.1)",
                      background: offerFilter === f ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.03)",
                      color: offerFilter === f ? "#ffd700" : "#555",
                    }}>{f === "all" ? `All (${offers.length})` : f === "active" ? `Active (${activeOffers.length})` : `Inactive (${inactiveOffers.length})`}</button>
                ))}
              </div>
              {offers.length > 0 && (
                <button className="sa-export-btn" onClick={() => exportCSV(offers.map(o => ({
                  code: o.code, title: o.title, type: o.offerType,
                  discount: o.discountValue, minOrder: o.minOrderAmount,
                  maxDiscount: o.maxDiscount, active: o.isActive,
                })), `offers_${Date.now()}.csv`)}>⬇️ Export</button>
              )}
            </div>

            {/* ── Offers list ── */}
            {filteredOffers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "2px dashed rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🎁</p>
                <p style={{ color: "#555", fontSize: "16px", margin: 0 }}>
                  {offers.length === 0 ? "No offers yet — create your first one above!" : "No offers match your search"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {filteredOffers.map(offer => (
                  <div key={offer.id} style={{
                    background: "rgba(255,255,255,0.03)", border: `2px solid ${offer.isActive ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "14px", padding: "20px", display: "flex", gap: "18px", alignItems: "flex-start",
                    opacity: offer.isActive ? 1 : 0.65, transition: "all 0.2s",
                  }}>
                    {/* Color preview card */}
                    <div style={{
                      width: "110px", minWidth: "110px", height: "110px", borderRadius: "12px", flexShrink: 0,
                      background: `linear-gradient(135deg, ${offer.bgColor || "#FF6B6B"}, ${offer.bgColorAlt || "#FF8E8E"})`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
                    }}>
                      <span style={{ fontSize: "28px" }}>{offer.icon || "🎁"}</span>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: "rgba(0,0,0,0.7)", textAlign: "center", padding: "0 6px" }}>{offer.code}</p>
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffd700" }}>{offer.title}</h3>
                        <span style={{
                          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                          background: offer.isActive ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.06)",
                          color: offer.isActive ? "#4caf50" : "#666",
                          border: `1px solid ${offer.isActive ? "rgba(76,175,80,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                          {offer.isActive ? "● Active" : "● Inactive"}
                        </span>
                        <span style={{
                          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                          background: `${offerTypeColor[offer.offerType] || "#888"}18`,
                          color: offerTypeColor[offer.offerType] || "#888",
                          border: `1px solid ${offerTypeColor[offer.offerType] || "#888"}44`,
                        }}>
                          {offerTypeIcon[offer.offerType]} {OFFER_TYPES.find(t => t.value === offer.offerType)?.label || offer.offerType}
                        </span>
                      </div>

                      {offer.description && (
                        <p style={{ margin: "0 0 10px", color: "#666", fontSize: "13px" }}>{offer.description}</p>
                      )}

                      {/* Offer details chips */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {[
                          offer.offerType === "flat" && `💳 ₹${offer.discountValue} off`,
                          offer.offerType === "percentage" && `📊 ${offer.discountValue}% off`,
                          offer.offerType === "category" && `🍕 On ${offer.applicableCategory || "selected category"}`,
                          offer.offerType === "free_item" && `🎁 Free item included`,
                          offer.minOrderAmount > 0 && `📦 Min ₹${offer.minOrderAmount}`,
                          offer.maxDiscount > 0 && `🔒 Cap ₹${offer.maxDiscount}`,
                          offer.usageCount > 0 && `🔢 Used ${offer.usageCount}×`,
                        ].filter(Boolean).map((chip, ci) => (
                          <span key={ci} style={{
                            padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "6px", fontSize: "12px", color: "#888",
                          }}>{chip}</span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                      <button onClick={() => openEditOffer(offer)}
                        style={{
                          padding: "8px 16px", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "8px",
                          background: "rgba(255,215,0,0.08)", color: "#ffd700", cursor: "pointer",
                          fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap",
                        }}>✏️ Edit</button>
                      <button onClick={() => toggleOfferActive(offer.id, offer.isActive)}
                        style={{
                          padding: "8px 16px", border: `1px solid ${offer.isActive ? "rgba(255,152,0,0.3)" : "rgba(76,175,80,0.3)"}`,
                          borderRadius: "8px",
                          background: offer.isActive ? "rgba(255,152,0,0.08)" : "rgba(76,175,80,0.08)",
                          color: offer.isActive ? "#ff9800" : "#4caf50",
                          cursor: "pointer", fontSize: "12px", fontWeight: "700",
                        }}>
                        {offer.isActive ? "⏸ Pause" : "▶ Activate"}
                      </button>
                      <button onClick={() => duplicateOffer(offer)}
                        style={{
                          padding: "8px 16px", border: "1px solid rgba(100,150,255,0.3)", borderRadius: "8px",
                          background: "rgba(100,150,255,0.06)", color: "#6496ff", cursor: "pointer",
                          fontSize: "12px", fontWeight: "700",
                        }}>⧉ Clone</button>
                      <button onClick={() => deleteOffer(offer.id, offer.code)}
                        style={{
                          padding: "8px 16px", border: "1px solid rgba(244,67,54,0.3)", borderRadius: "8px",
                          background: "rgba(244,67,54,0.06)", color: "#f44336", cursor: "pointer",
                          fontSize: "12px", fontWeight: "700",
                        }}>🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ══════════════════════════════════════════════════════════════════════ */}

        {/* ══════ PROMOS ══════ */}
        {tab === "promos" && (
          <div>
            <div className="sa-card">
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">🏷️ Promo Codes</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="sa-secondary-btn" onClick={() => setNewPromo(p => ({ ...p, code: genCode() }))}>🎲 Generate</button>
                  <button className="sa-primary-btn" onClick={() => setShowAddPromo(!showAddPromo)}>{showAddPromo ? "✕ Cancel" : "+ New"}</button>
                </div>
              </div>
              {showAddPromo && (
                <div className="sa-form-box">
                  <div className="sa-form-grid-2">
                    <div><label className="sa-lbl">Code *</label><input value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Description</label><input value={newPromo.description} onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Type</label><select value={newPromo.type} onChange={e => setNewPromo(p => ({ ...p, type: e.target.value }))} className="sa-inp"><option value="percent">% off</option><option value="flat">₹ off</option></select></div>
                    <div><label className="sa-lbl">Value</label><input type="number" value={newPromo.discount} onChange={e => setNewPromo(p => ({ ...p, discount: Number(e.target.value) }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Max Uses</label><input type="number" value={newPromo.maxUses} onChange={e => setNewPromo(p => ({ ...p, maxUses: Number(e.target.value) }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Min Order (₹)</label><input type="number" value={newPromo.minOrder} onChange={e => setNewPromo(p => ({ ...p, minOrder: Number(e.target.value) }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Expiry</label><input type="date" value={newPromo.expiry} onChange={e => setNewPromo(p => ({ ...p, expiry: e.target.value }))} className="sa-inp" /></div>
                  </div>
                  <button className="sa-primary-btn" onClick={addPromo}>✅ Create Promo</button>
                </div>
              )}
              {promos.length === 0 ? <p className="sa-empty">No promos yet.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {promos.map(p => {
                    const expired = p.expiry && new Date(p.expiry) < new Date();
                    const usePct = Math.min((p.usedCount || 0) / (p.maxUses || 1) * 100, 100);
                    const badgeBg = expired ? "rgba(244,67,54,0.15)" : p.active ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)";
                    const badgeColor = expired ? "#f44336" : p.active ? "#4caf50" : "#ff9800";
                    return (
                      <div key={p.id} className={`sa-promo-card ${p.active && !expired ? "active" : ""} ${expired ? "expired" : ""}`}>
                        <div className="sa-promo-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="sa-promo-code">{p.code}</span>
                            <span className="sa-promo-badge" style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}33` }}>
                              {expired ? "EXPIRED" : p.active ? "ACTIVE" : "PAUSED"}
                            </span>
                          </div>
                          <div className="sa-promo-actions">
                            <button className="sa-icon-btn" style={{ color: p.active ? "#ff9800" : "#4caf50" }}
                              onClick={() => { updateDoc(doc(db, "promoCodes", p.id), { active: !p.active }); showToast(p.active ? "🔴 Paused" : "✅ Enabled"); }}>
                              {p.active ? "Pause" : "Enable"}
                            </button>
                            <button className="sa-icon-btn" style={{ color: "#f44336" }}
                              onClick={async () => { if (window.confirm(`Delete ${p.code}?`)) { await deleteDoc(doc(db, "promoCodes", p.id)); showToast("✅ Deleted"); } }}>🗑️</button>
                          </div>
                        </div>
                        <div className="sa-promo-meta">
                          <span>💸 {p.type === "percent" ? `${p.discount}%` : `₹${p.discount}`} off</span>
                          <span>🛒 Min: {fmt(p.minOrder || 0)}</span>
                          <span>📊 Used: {p.usedCount || 0}/{p.maxUses}</span>
                          {p.expiry && <span>📅 {p.expiry}</span>}
                          {p.description && <span>📝 {p.description}</span>}
                        </div>
                        <div className="sa-promo-bar-track">
                          <div className="sa-promo-bar-fill" style={{ width: `${usePct}%`, background: usePct >= 90 ? "#f44336" : "#ffd700" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ NOTIFICATIONS ══════ */}
        {tab === "notifications" && (
          <div>
            <div className="sa-card">
              <h3 className="sa-card-title">🔔 Send Notification</h3>
              <p className="sa-card-sub">Log notifications sent via your push/SMS/email provider.</p>
              <div className="sa-form-grid-2" style={{ marginBottom: "14px" }}>
                <div className="sa-form-full"><label className="sa-lbl">Title *</label><input value={newNotif.title} onChange={e => setNewNotif(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 🎉 Weekend Special Offer!" className="sa-inp" /></div>
                <div className="sa-form-full"><label className="sa-lbl">Message Body *</label><textarea value={newNotif.body} onChange={e => setNewNotif(p => ({ ...p, body: e.target.value }))} rows={3} className="sa-inp" style={{ resize: "vertical" }} /></div>
                <div><label className="sa-lbl">Channel</label>
                  <select value={newNotif.type} onChange={e => setNewNotif(p => ({ ...p, type: e.target.value }))} className="sa-inp">
                    <option value="push">📱 Push Notification</option>
                    <option value="sms">💬 SMS</option>
                    <option value="email">📧 Email</option>
                    <option value="in-app">🔔 In-App Banner</option>
                  </select>
                </div>
                <div><label className="sa-lbl">Audience</label>
                  <select value={newNotif.audience} onChange={e => setNewNotif(p => ({ ...p, audience: e.target.value }))} className="sa-inp">
                    <option value="all">All Customers</option>
                    <option value="repeat">Repeat Customers Only</option>
                    <option value="new">New Customers Only</option>
                    <option value="inactive">Inactive (30+ days)</option>
                  </select>
                </div>
              </div>
              <button className="sa-primary-btn" onClick={sendNotification} disabled={saving === "notif"}>{saving === "notif" ? "Sending..." : "📤 Send Notification"}</button>
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">📋 Notification History</h3>
              {notifications.length === 0 ? <p className="sa-empty">No notifications sent yet.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {notifications.map(n => (
                    <div key={n.id} className="sa-notif-card">
                      <span className="sa-notif-icon">{n.type === "push" ? "📱" : n.type === "sms" ? "💬" : n.type === "email" ? "📧" : "🔔"}</span>
                      <div style={{ flex: 1 }}>
                        <p className="sa-notif-title">{n.title}</p>
                        <p className="sa-notif-body">{n.body}</p>
                        <div className="sa-notif-meta">
                          <span>👥 {n.audience}</span><span>📡 {n.type}</span>
                          {n.recipientCount && <span>📬 {n.recipientCount} recipients</span>}
                          <span>⏰ {timeAgo(n.sentAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ REFUNDS ══════ */}
        {tab === "refunds" && (
          <div>
            <div className="sa-grid4">
              {[
                { label: "Open Disputes", val: disputes.filter(d => d.status === "open").length,     color: "#f44336" },
                { label: "Resolved",      val: disputes.filter(d => d.status === "resolved").length, color: "#4caf50" },
                { label: "Refunded",      val: disputes.filter(d => d.status === "refunded").length, color: "#ff9800" },
                { label: "Total",         val: disputes.length,                                       color: "#2196f3" },
              ].map((k, i) => (
                <div key={i} className="sa-kpi-card" style={{ borderColor: k.color }}>
                  <p className="sa-kpi-label">{k.label}</p>
                  <p className="sa-kpi-val" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">↩️ Order Disputes & Refunds</h3>
              {disputes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>
                  <p style={{ fontSize: "36px", margin: "0 0 8px" }}>✅</p><p>No disputes filed yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {disputes.map(d => {
                    const sc = { open: "#f44336", resolved: "#4caf50", refunded: "#ff9800", rejected: "#555" };
                    const c = sc[d.status] || "#555";
                    return (
                      <div key={d.id} className="sa-dispute-card" style={{ border: `1px solid ${c}33` }}>
                        <div className="sa-dispute-header">
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                              <span className="sa-dispute-name">{d.userName || "Customer"}</span>
                              <span className="sa-dispute-status-badge" style={{ background: `${c}22`, color: c, border: `1px solid ${c}44` }}>{d.status}</span>
                            </div>
                            <p className="sa-dispute-meta">Order: #{d.orderId?.slice(-6) || "—"} · {timeAgo(d.createdAt)}</p>
                            <p className="sa-dispute-reason">{d.reason || "No reason provided"}</p>
                            {d.amount && <p className="sa-dispute-amount">Refund requested: {fmt(d.amount)}</p>}
                          </div>
                          {d.status === "open" && (
                            <div className="sa-dispute-actions">
                              {[
                                { label: "💸 Refund", res: "refunded", color: "#ff9800" },
                                { label: "✅ Resolve", res: "resolved", color: "#4caf50" },
                                { label: "❌ Reject",  res: "rejected", color: "#f44336" },
                              ].map(btn => (
                                <button key={btn.res} className="sa-dispute-action-btn"
                                  style={{ color: btn.color, borderColor: `${btn.color}33` }}
                                  onClick={() => resolveDispute(d.id, btn.res)}>{btn.label}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        {d.resolvedAt && <p className="sa-dispute-resolved-note">Resolved {timeAgo(d.resolvedAt)} by {d.resolvedBy}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ KITCHEN ══════ */}
        {tab === "kitchen" && (
          <div>
            {(() => {
              const closedBrands = BRANDS.filter(b => kitchen?.brands?.[b.key] === false);
              const globalClosed = !kitchen?.isOpen;
              const hasAlert = globalClosed || closedBrands.length > 0;
              const todayStr2 = new Date().toDateString();
              const openEvents = auditLog.filter(l => {
                const d = l.timestamp?.toDate?.() || new Date(l.timestamp);
                return d?.toDateString?.() === todayStr2 && l.action === "KITCHEN_GLOBAL";
              });
              const lastOpenLog = openEvents[0];
              return (
                <div className="sa-card" style={{ borderColor: hasAlert ? "rgba(244,67,54,0.4)" : "rgba(76,175,80,0.25)" }}>
                  <div className="sa-card-header-row">
                    <h3 className="sa-card-title" style={{ color: hasAlert ? "#f44336" : "#4caf50" }}>
                      {hasAlert ? "🚨 Store Status Alerts" : "✅ Store Status — All Good"}
                    </h3>
                    <div style={{ fontSize: "11px", color: "#444" }}>
                      {lastOpenLog
                        ? `🕐 Opened today at ${lastOpenLog.timestamp?.toDate?.()?.toLocaleTimeString?.("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : isGlobalOpen ? "🕐 Opened — time not recorded" : "⏸️ Has not opened today"}
                    </div>
                  </div>
                  {globalClosed && (
                    <div className="sa-store-alert-banner">
                      <span className="alert-icon">🔴</span>
                      <div>
                        <p className="sa-store-alert-title">All Kitchens CLOSED</p>
                        <p className="sa-store-alert-sub">Global kitchen toggle is OFF — no brand is accepting orders.</p>
                      </div>
                      <button className="sa-store-alert-open-btn" onClick={toggleGlobal}>Open Now</button>
                    </div>
                  )}
                  {closedBrands.map(b => (
                    <div key={b.key} className="sa-store-alert-banner" style={{ background: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.25)" }}>
                      <span className="alert-icon">{b.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p className="sa-store-alert-title">{b.label} is CLOSED</p>
                        <p className="sa-store-alert-sub">This brand's toggle is OFF — customers cannot order from it.</p>
                      </div>
                      <button style={{ marginLeft: "auto", padding: "7px 14px", fontSize: "11px", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer", background: `linear-gradient(135deg,${b.color},${b.color}cc)`, color: "#000" }}
                        onClick={() => toggleBrand(b.key)}>Open {b.label}</button>
                    </div>
                  ))}
                  <div className="sa-store-status-mini-grid">
                    {[
                      { label: "Global Status", val: kitchen?.isOpen ? "ON" : "OFF",          color: kitchen?.isOpen ? "#4caf50" : "#f44336" },
                      { label: "Time Window",   val: isWithinHours ? "In Hours" : "Off Hours", color: isWithinHours ? "#2196f3" : "#ff9800" },
                      ...BRANDS.map(b => ({ label: b.label, val: (kitchen?.brands?.[b.key] !== false) ? "Open" : "Closed", color: (kitchen?.brands?.[b.key] !== false) ? "#4caf50" : "#f44336" })),
                    ].slice(0, 4).map((s, i) => (
                      <div key={i} className="sa-store-status-mini-box" style={{ border: `1px solid ${s.color}33` }}>
                        <p className="sa-store-status-mini-label">{s.label}</p>
                        <p className="sa-store-status-mini-val" style={{ color: s.color }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="sa-card">
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">🌐 Global Kitchen</h3>
                <div className="sa-pill" style={{ background: isGlobalOpen ? "rgba(76,175,80,0.15)" : "rgba(244,67,54,0.15)", border: `1px solid ${isGlobalOpen ? "#4caf5055" : "#f4433655"}`, color: isGlobalOpen ? "#4caf50" : "#f44336" }}>
                  <span className={`sa-live-dot ${isGlobalOpen ? "open" : "closed"}`} /> {isGlobalOpen ? "OPEN" : "CLOSED"}
                </div>
              </div>
              <div className="sa-kitchen-status-grid">
                {[
                  { label: "Customer View", val: isGlobalOpen ? "OPEN" : "CLOSED",       color: isGlobalOpen ? "#4caf50" : "#f44336" },
                  { label: "Time Window",   val: isWithinHours ? "IN HOURS" : "OFF HOURS", color: isWithinHours ? "#2196f3" : "#ff9800" },
                  { label: "Staff Toggle",  val: kitchen?.isOpen ? "ON" : "OFF",          color: kitchen?.isOpen ? "#4caf50" : "#f44336" },
                ].map((s, i) => (
                  <div key={i} className="sa-kitchen-status-box" style={{ borderColor: s.color }}>
                    <p className="sa-kpi-label">{s.label}</p>
                    <p className="sa-kpi-val" style={{ color: s.color, fontSize: "16px" }}>{s.val}</p>
                  </div>
                ))}
              </div>
              {!isWithinHours && kitchen?.isOpen && (
                <div className="sa-warning-note">⏰ Outside kitchen hours (11 AM – 4 AM). Customers see it as closed even though staff toggle is ON.</div>
              )}
              <button className="sa-full-btn" onClick={toggleGlobal} disabled={saving === "kitchen_global"}
                style={{ background: kitchen?.isOpen ? "linear-gradient(135deg,#f44336,#c62828)" : "linear-gradient(135deg,#4caf50,#2e7d32)", marginBottom: "0" }}>
                {saving === "kitchen_global" ? "Updating..." : kitchen?.isOpen ? "🔴 Close All Kitchens" : "✅ Open All Kitchens"}
              </button>
            </div>

            <div className="sa-card">
              <h3 className="sa-card-title">🏪 Per-Brand Control</h3>
              {!kitchen?.isOpen && <div className="sa-info-note">💡 Enable global kitchen first to control brands.</div>}
              <div className="sa-brand-grid">
                {BRANDS.map(b => {
                  const brandOn    = kitchen?.brands?.[b.key] !== false;
                  const brandOpen  = isGlobalOpen && brandOn;
                  const blocked    = !kitchen?.isOpen || !isWithinHours;
                  return (
                    <div key={b.key} className="sa-brand-card"
                      style={{ borderColor: brandOpen ? `${b.color}55` : "#f4433644", background: brandOpen ? `${b.color}0a` : "rgba(244,67,54,0.04)", opacity: blocked ? 0.5 : 1 }}>
                      <div className="sa-brand-card-header">
                        <span className="sa-brand-icon">{b.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p className="sa-brand-name" style={{ color: b.color }}>{b.label}</p>
                          <p className="sa-brand-status-text" style={{ color: brandOpen ? "#4caf50" : "#f44336" }}>
                            {blocked ? "Kitchen globally closed" : brandOpen ? "● Live" : "● Offline"}
                          </p>
                        </div>
                        <span className="sa-brand-status-dot" style={{ background: brandOpen ? "#4caf50" : "#f44336", boxShadow: brandOpen ? "0 0 8px #4caf50" : "none" }} />
                      </div>
                      <button className="sa-brand-toggle-btn" onClick={() => toggleBrand(b.key)} disabled={saving === `brand_${b.key}` || blocked}
                        style={{ background: brandOn ? "linear-gradient(135deg,#f44336,#c62828)" : `linear-gradient(135deg,${b.color},${b.color}cc)`, color: brandOn ? "#fff" : "#000" }}>
                        {saving === `brand_${b.key}` ? "..." : brandOn ? `Close ${b.label}` : `Open ${b.label}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              {(!kitchen?.isOpen || !isWithinHours) && <p className="sa-block-note">💡 Enable the global kitchen toggle above to control individual brands.</p>}
            </div>

            <div className="sa-card" style={{ borderColor: critStock.length > 0 ? "rgba(244,67,54,0.3)" : "rgba(255,255,255,0.06)" }}>
              <h3 className="sa-card-title">📦 Inventory Reorder Alerts</h3>
              {lowStock.length === 0 ? (
                <p style={{ color: "#4caf50", textAlign: "center", padding: "20px" }}>✅ All ingredients are well stocked!</p>
              ) : (
                <div>
                  {critStock.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ color: "#f44336", fontWeight: "800", fontSize: "13px", marginBottom: "10px" }}>🚨 Critical — Order Immediately ({critStock.length})</p>
                      <div className="sa-inv-grid">
                        {critStock.map(item => (
                          <div key={item.id} className="sa-inv-card critical">
                            <div className="sa-inv-card-row"><span className="sa-inv-name">{item.name}</span><span className="sa-inv-qty-crit">{item.currentStock} {item.unit}</span></div>
                            <div className="sa-inv-bar-track"><div className="sa-inv-bar-fill-crit" style={{ width: `${Math.min((item.currentStock / (item.maxStock || 100)) * 100, 100)}%` }} /></div>
                            <p className="sa-inv-threshold">Min: {item.minThreshold} {item.unit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sa-card">
              <h3 className="sa-card-title">⏰ Auto-Schedule</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div><label className="sa-lbl">Auto-Enforce</label><select value={schedule.autoClose ? "yes" : "no"} onChange={e => setSchedule(p => ({ ...p, autoClose: e.target.value === "yes" }))} className="sa-inp"><option value="yes">Enabled</option><option value="no">Manual Only</option></select></div>
                <div><label className="sa-lbl">Open Hour (24h)</label><input type="number" min={0} max={23} value={schedule.openHour} onChange={e => setSchedule(p => ({ ...p, openHour: Number(e.target.value) }))} className="sa-inp" /></div>
                <div><label className="sa-lbl">Close Hour (24h)</label><input type="number" min={0} max={23} value={schedule.closeHour} onChange={e => setSchedule(p => ({ ...p, closeHour: Number(e.target.value) }))} className="sa-inp" /></div>
              </div>
              <button className="sa-primary-btn" onClick={() => save("schedule", () => setDoc(doc(db, "restaurantConfig", "schedule"), { ...schedule, updatedAt: serverTimestamp() }), "✅ Schedule saved")} disabled={saving === "schedule"}>{saving === "schedule" ? "Saving..." : "💾 Save Schedule"}</button>
            </div>
          </div>
        )}

        {/* ══════ OPERATIONS ══════ */}
        {tab === "operations" && (
          <div>
            <div className="sa-card">
              <h3 className="sa-card-title">📢 Broadcast Message</h3>
              <div className="sa-form-grid-2" style={{ marginBottom: "14px" }}>
                <div className="sa-form-full"><label className="sa-lbl">Message</label><input value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} placeholder="🎉 Free delivery above ₹299 today!" className="sa-inp" /></div>
                <div><label className="sa-lbl">Type</label>
                  <select value={broadcast.type} onChange={e => setBroadcast(p => ({ ...p, type: e.target.value }))} className="sa-inp">
                    <option value="info">Info (Blue)</option><option value="success">Success (Green)</option>
                    <option value="warning">Warning (Orange)</option><option value="promo">Promo (Gold)</option>
                  </select>
                </div>
                <div><label className="sa-lbl">Status</label>
                  <select value={broadcast.active ? "yes" : "no"} onChange={e => setBroadcast(p => ({ ...p, active: e.target.value === "yes" }))} className="sa-inp">
                    <option value="yes">Active</option><option value="no">Inactive</option>
                  </select>
                </div>
              </div>
              <button className="sa-primary-btn" onClick={() => save("broadcast", () => setDoc(doc(db, "restaurantConfig", "broadcast"), { ...broadcast, updatedAt: serverTimestamp() }), "✅ Broadcast saved")} disabled={saving === "broadcast"}>{saving === "broadcast" ? "Saving..." : "📢 Save Broadcast"}</button>
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">🛵 Delivery Zone Config</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div><label className="sa-lbl">Radius (km)</label><input type="number" value={deliveryConf.radius} onChange={e => setDeliveryConf(p => ({ ...p, radius: Number(e.target.value) }))} className="sa-inp" /></div>
                <div><label className="sa-lbl">Base Charge (₹)</label><input type="number" value={deliveryConf.baseCharge} onChange={e => setDeliveryConf(p => ({ ...p, baseCharge: Number(e.target.value) }))} className="sa-inp" /></div>
                <div><label className="sa-lbl">Free Above (₹)</label><input type="number" value={deliveryConf.freeAbove} onChange={e => setDeliveryConf(p => ({ ...p, freeAbove: Number(e.target.value) }))} className="sa-inp" /></div>
              </div>
              <button className="sa-primary-btn" onClick={() => save("delivery", () => setDoc(doc(db, "restaurantConfig", "delivery"), { ...deliveryConf, updatedAt: serverTimestamp() }), "✅ Delivery saved")} disabled={saving === "delivery"}>{saving === "delivery" ? "Saving..." : "💾 Save Delivery Config"}</button>
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">⬇️ Export Data</h3>
              <div className="sa-export-grid">
                {[
                  { label: "📋 All Orders",  sub: `${orders.length} records`,      fn: () => { exportCSV(orders.map(o => ({ id: o.id, customer: o.userName || "Guest", email: o.userEmail || "", total: o.total || 0, status: o.status, date: o.createdAt?.toDate?.()?.toLocaleDateString?.() })), `orders_${Date.now()}.csv`); showToast("✅ Exported"); } },
                  { label: "💰 Revenue",     sub: "7/14/30 day breakdown",          fn: () => { exportCSV([{ period: "7d", revenue: weekRev }, { period: "30d", revenue: monthRev }, { period: "all", revenue: totalRev }], `revenue_${Date.now()}.csv`); showToast("✅ Exported"); } },
                  { label: "👥 Customers",   sub: `${customers.length} customers`,  fn: () => { exportCSV(customers.map(c => ({ name: c.name, email: c.email, orders: c.orders, totalSpent: c.spent })), `customers_${Date.now()}.csv`); showToast("✅ Exported"); } },
                  { label: "🎁 Offers",      sub: `${offers.length} offers`,        fn: () => { exportCSV(offers.map(o => ({ code: o.code, title: o.title, type: o.offerType, discount: o.discountValue, active: o.isActive })), `offers_${Date.now()}.csv`); showToast("✅ Exported"); } },
                ].map((item, i) => (
                  <button key={i} className="sa-export-tile" onClick={item.fn}>
                    <p className="sa-export-tile-title">{item.label}</p>
                    <p className="sa-export-tile-sub">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ LOCATIONS ══════ */}
        {tab === "locations" && (
          <div>
            <div className="sa-card">
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">📍 Locations & Outlets</h3>
                <button className="sa-primary-btn" onClick={() => setShowAddLocation(!showAddLocation)}>{showAddLocation ? "✕ Cancel" : "+ Add Location"}</button>
              </div>
              {showAddLocation && (
                <div className="sa-form-box">
                  <div className="sa-form-grid-2">
                    <div><label className="sa-lbl">Location Name *</label><input value={newLocation.name} onChange={e => setNewLocation(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Hyderabad Central" className="sa-inp" /></div>
                    <div><label className="sa-lbl">Manager Name</label><input value={newLocation.manager} onChange={e => setNewLocation(p => ({ ...p, manager: e.target.value }))} className="sa-inp" /></div>
                    <div className="sa-form-full"><label className="sa-lbl">Address</label><input value={newLocation.address} onChange={e => setNewLocation(p => ({ ...p, address: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Phone</label><input value={newLocation.phone} onChange={e => setNewLocation(p => ({ ...p, phone: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Status</label><select value={newLocation.isOpen ? "yes" : "no"} onChange={e => setNewLocation(p => ({ ...p, isOpen: e.target.value === "yes" }))} className="sa-inp"><option value="yes">Open</option><option value="no">Closed</option></select></div>
                  </div>
                  <button className="sa-primary-btn" onClick={addLocation}>✅ Add Location</button>
                </div>
              )}
              {locations.length === 0 ? (
                <div className="sa-location-empty"><p style={{ fontSize: "36px", margin: "0 0 8px" }}>📍</p><p>No locations added yet.</p></div>
              ) : (
                <div className="sa-locations-grid">
                  {locations.map(loc => (
                    <div key={loc.id} className="sa-location-card" style={{ borderColor: loc.isOpen ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)" }}>
                      <div className="sa-location-card-header">
                        <div>
                          <p className="sa-location-name">{loc.name}</p>
                          <p className="sa-location-status" style={{ color: loc.isOpen ? "#4caf50" : "#f44336" }}>{loc.isOpen ? "● Open" : "● Closed"}</p>
                        </div>
                        <button className="sa-icon-btn" style={{ color: "#f44336" }} onClick={() => deleteLocation(loc.id, loc.name)}>🗑️</button>
                      </div>
                      {loc.address  && <p className="sa-location-meta">📍 {loc.address}</p>}
                      {loc.phone    && <p className="sa-location-meta">📞 {loc.phone}</p>}
                      {loc.manager  && <p className="sa-location-meta">👤 {loc.manager}</p>}
                      <button className="sa-location-toggle-btn" onClick={() => toggleLocation(loc.id, loc.isOpen)}
                        style={{ background: loc.isOpen ? "linear-gradient(135deg,#f44336,#c62828)" : "linear-gradient(135deg,#4caf50,#2e7d32)" }}>
                        {loc.isOpen ? "🔴 Close Location" : "✅ Open Location"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ APP SETTINGS ══════ */}
        {tab === "appsettings" && (
          <div>
            <div className="sa-card">
              <h3 className="sa-card-title">🛠️ App Settings & Feature Flags</h3>
              <p className="sa-card-sub">Control your app's global settings and feature flags in real-time.</p>
              <div className="sa-settings-list">
                {[
                  { key: "maintenanceMode", label: "🚧 Maintenance Mode",    sub: "Takes app offline for all customers",         danger: true },
                  { key: "allowOrders",     label: "🛒 Allow Ordering",      sub: "Enable/disable the entire ordering system" },
                  { key: "allowReviews",    label: "⭐ Allow Reviews",       sub: "Customers can submit ratings and reviews" },
                  { key: "featurePromos",   label: "🏷️ Promo Codes",        sub: "Enable promo code redemption at checkout" },
                  { key: "featureOffers",   label: "🎁 Offers Display",      sub: "Show offer banners on user-facing pages" },
                  { key: "featureTracking", label: "📍 Order Tracking",      sub: "Show live order tracking to customers" },
                ].map(f => (
                  <div key={f.key} className={`sa-setting-row ${appSettings[f.key] && f.danger ? "danger-active" : ""}`}>
                    <div>
                      <p className={`sa-setting-label ${appSettings[f.key] && f.danger ? "danger" : ""}`}>{f.label}</p>
                      <p className="sa-setting-sub">{f.sub}</p>
                    </div>
                    <button className={`sa-toggle-btn ${appSettings[f.key] ? (f.danger ? "danger-on" : "on") : ""}`}
                      onClick={() => setAppSettings(p => ({ ...p, [f.key]: !p[f.key] }))}>
                      <div className={`sa-toggle-knob ${appSettings[f.key] ? "on" : "off"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="sa-settings-grid-2">
                <div><label className="sa-lbl">App Version</label><input value={appSettings.version} onChange={e => setAppSettings(p => ({ ...p, version: e.target.value }))} className="sa-inp" /></div>
                <div><label className="sa-lbl">Minimum Order Value (₹)</label><input type="number" value={appSettings.minOrderValue} onChange={e => setAppSettings(p => ({ ...p, minOrderValue: Number(e.target.value) }))} className="sa-inp" /></div>
              </div>
              {appSettings.maintenanceMode && (
                <div className="sa-maintenance-alert">
                  <p className="sa-maintenance-title">⚠️ Maintenance Mode is ACTIVE</p>
                  <p className="sa-maintenance-sub">All customers are seeing the maintenance screen. Disable this as soon as you're done.</p>
                </div>
              )}
              <button className="sa-primary-btn" onClick={() => save("appsettings", () => setDoc(doc(db, "restaurantConfig", "appSettings"), { ...appSettings, updatedAt: serverTimestamp() }), "✅ Settings saved")} disabled={saving === "appsettings"}>{saving === "appsettings" ? "Saving..." : "💾 Save All Settings"}</button>
            </div>
          </div>
        )}

        {/* ══════ SECURITY ══════ */}
        {tab === "security" && (
          <div>
            <div className="sa-grid4">
              {[
                { label: "Successful Logins", val: secLog.filter(l => l.event === "LOGIN_SUCCESS").length, color: "#4caf50" },
                { label: "Failed Attempts",   val: secLog.filter(l => l.event === "LOGIN_FAILED").length,  color: "#f44336" },
                { label: "Actions Logged",    val: auditLog.length,                                         color: "#ffd700" },
                { label: "Active Session",    val: "1",                                                      color: "#2196f3" },
              ].map((k, i) => (
                <div key={i} className="sa-kpi-card" style={{ borderColor: k.color }}>
                  <p className="sa-kpi-label">{k.label}</p>
                  <p className="sa-kpi-val" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>
            {secLog.filter(l => l.event === "LOGIN_FAILED").length > 0 && (
              <div className="sa-card" style={{ borderColor: "rgba(244,67,54,0.3)" }}>
                <h3 className="sa-card-title" style={{ color: "#f44336" }}>⚠️ Failed Login Attempts</h3>
                {secLog.filter(l => l.event === "LOGIN_FAILED").slice(0, 8).map((log, i) => (
                  <div key={i} className="sa-tr" style={{ gridTemplateColumns: "1fr 3fr 1fr" }}>
                    <span style={{ color: "#f44336", fontSize: "12px", fontWeight: "700" }}>Attempt #{log.attemptNumber || "?"}</span>
                    <span style={{ color: "#555", fontSize: "11px" }}>{log.userAgent?.slice(0, 70)}...</span>
                    <span style={{ color: "#555", fontSize: "11px" }}>{timeAgo(log.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="sa-card">
              <h3 className="sa-card-title">📋 Activity Log</h3>
              <div className="sa-tr header" style={{ gridTemplateColumns: "1fr 2fr 1fr" }}><span>Action</span><span>Details</span><span>Time</span></div>
              {auditLog.slice(0, 30).map((log, i) => (
                <div key={i} className="sa-tr" style={{ gridTemplateColumns: "1fr 2fr 1fr" }}>
                  <span style={{ color: "#ffd700", fontSize: "12px", fontWeight: "700" }}>{log.action}</span>
                  <span style={{ color: "#555", fontSize: "11px" }}>{JSON.stringify(log.details || {})}</span>
                  <span style={{ color: "#444", fontSize: "11px" }}>{timeAgo(log.timestamp)}</span>
                </div>
              ))}
              {auditLog.length === 0 && <p className="sa-empty">No activity yet.</p>}
            </div>
            <div className="sa-card">
              <h3 className="sa-card-title">🖥️ Access Log</h3>
              {secLog.map((log, i) => (
                <div key={i} className="sa-access-log-row">
                  <span style={{ color: log.event === "LOGIN_SUCCESS" ? "#4caf50" : log.event === "LOGIN_FAILED" ? "#f44336" : "#ff9800", fontSize: "12px", fontWeight: "700" }}>
                    {log.event === "LOGIN_SUCCESS" ? "✅ Login" : log.event === "LOGIN_FAILED" ? "❌ Failed" : "🚪 Logout"}
                  </span>
                  <span style={{ color: "#444", fontSize: "11px" }}>{log.userAgent?.slice(0, 80)}</span>
                  <span style={{ color: "#444", fontSize: "11px" }}>{timeAgo(log.timestamp)}</span>
                </div>
              ))}
              {secLog.length === 0 && <p className="sa-empty">No access records yet.</p>}
            </div>
          </div>
        )}

        {/* ══════ STAFF ══════ */}
        {tab === "staff" && (
          <div>
            <div className="sa-card">
              <div className="sa-card-header-row">
                <h3 className="sa-card-title">👨‍💼 Staff & Admin Accounts</h3>
                <button className="sa-primary-btn" onClick={() => setShowAddStaff(!showAddStaff)}>{showAddStaff ? "✕ Cancel" : "+ Add Staff"}</button>
              </div>
              {showAddStaff && (
                <div className="sa-form-box">
                  <div className="sa-form-grid-2">
                    <div><label className="sa-lbl">Full Name *</label><input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Email *</label><input value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Phone</label><input value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} className="sa-inp" /></div>
                    <div><label className="sa-lbl">Role</label>
                      <select value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))} className="sa-inp">
                        {["staff","manager","admin","chef","delivery"].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className="sa-primary-btn" onClick={addStaff}>✅ Add Staff Member</button>
                </div>
              )}
              {staff.length === 0 ? <p className="sa-empty">No staff members yet.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {staff.map(m => (
                    <div key={m.id} className="sa-staff-card">
                      <div className="sa-staff-avatar">{(m.name || "?")[0].toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <p className="sa-staff-name">{m.name}</p>
                        <p className="sa-staff-email">{m.email}</p>
                        {m.phone && <p className="sa-staff-phone">📞 {m.phone}</p>}
                      </div>
                      <div className="sa-staff-actions">
                        <span className="sa-role-badge" style={{ background: `${roleColors[m.role] || "#555"}22`, color: roleColors[m.role] || "#aaa", border: `1px solid ${roleColors[m.role] || "#555"}44` }}>{m.role}</span>
                        {m.createdAt?.toDate && <p className="sa-staff-date">{m.createdAt.toDate().toLocaleDateString()}</p>}
                        <button className="sa-remove-btn" onClick={() => removeStaff(m.id, m.name)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        .sa-green-dot {
          display: inline-flex; align-items: center; justify-content: center;
          background: #4caf50; color: #000; border-radius: 10px;
          font-size: 10px; font-weight: 800; padding: 1px 6px; margin-left: 6px;
        }
      `}</style>
    </div>
  );
}