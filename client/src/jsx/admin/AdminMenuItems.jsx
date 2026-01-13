import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./AdminManagement.css";

export default function AdminMenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");

  // 🔄 FETCH ALL MENU ITEMS IN REAL TIME
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "menu"), (snap) => {
      const list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        // Only add if it has required fields
        if (data && data.name) {
          list.push({ id: doc.id, ...data });
        }
      });
      // Sort safely
      setItems(
        list.sort((a, b) => 
          (a.name || "").localeCompare(b.name || "")
        )
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✏️ UPDATE MENU ITEM STOCK
  const handleUpdateStock = async (id, newStock) => {
    try {
      await updateDoc(doc(db, "menu", id), {
        stock: parseInt(newStock),
      });
      setEditingId(null);
      alert("✅ Menu item stock updated!");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed to update stock");
    }
  };

  // ⏸️ PAUSE/UNPAUSE MENU ITEM
  const handleTogglePause = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "menu", id), {
        isActive: !currentStatus,
      });
      alert(currentStatus ? "⏸️ Item paused!" : "▶️ Item activated!");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed to update status");
    }
  };

  // 🔍 SEARCH FILTER - Safe check for name
  const filteredItems = items.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count stats - Safe checks
  const activeItems = items.filter((i) => i.isActive !== false).length;
  const pausedItems = items.filter((i) => i.isActive === false).length;
  const lowStockItems = items.filter((i) => (i.stock || 0) < 5).length;

  if (loading) {
    return (
      <div className="admin-management-container">
        <div className="loading">⏳ Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-management-container">
      {/* HEADER */}
      <div className="admin-header">
        <h1>🍔 Menu Items Management</h1>
        <p>Update stock and manage availability of menu items</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-icon">📊</span>
          <div>
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{items.length}</span>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">▶️</span>
          <div>
            <span className="stat-label">Active</span>
            <span className="stat-value">{activeItems}</span>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">⏸️</span>
          <div>
            <span className="stat-label">Paused</span>
            <span className="stat-value">{pausedItems}</span>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">⚠️</span>
          <div>
            <span className="stat-label">Low Stock</span>
            <span className="stat-value">{lowStockItems}</span>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* TABLE */}
      {filteredItems.length === 0 ? (
        <div className="empty-message">
          <p>No items found</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-header">
            <div className="col-name">Item Name</div>
            <div className="col-category">Category</div>
            <div className="col-price">Price</div>
            <div className="col-stock">Stock</div>
            <div className="col-status">Status</div>
            <div className="col-action">Action</div>
          </div>

          {filteredItems.map((item) => {
            const stock = item.stock || 0;
            const isLowStock = stock < 5;
            const isPaused = item.isActive === false;

            return (
              <div
                key={item.id}
                className={`table-row ${isPaused ? "paused" : ""} ${
                  isLowStock ? "low-stock" : ""
                }`}
              >
                {/* NAME */}
                <div className="col-name">
                  <strong>{item.name || "Unknown"}</strong>
                </div>

                {/* CATEGORY */}
                <div className="col-category">
                  <span className="badge">{item.category || "N/A"}</span>
                </div>

                {/* PRICE */}
                <div className="col-price">₹{item.price || 0}</div>

                {/* STOCK */}
                <div className="col-stock">
                  {editingId === item.id ? (
                    <div className="inline-edit">
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="edit-input"
                        autoFocus
                      />
                      <button
                        className="btn-save"
                        onClick={() => handleUpdateStock(item.id, editStock)}
                      >
                        ✓
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="stock-cell">
                      <span className={`stock-num ${isLowStock ? "critical" : ""}`}>
                        {stock}
                      </span>
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditStock(stock);
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>

                {/* STATUS */}
                <div className="col-status">
                  {isPaused ? (
                    <span className="status-paused">⏸️ Paused</span>
                  ) : (
                    <span className="status-active">▶️ Active</span>
                  )}
                </div>

                {/* ACTION */}
                <div className="col-action">
                  <button
                    className={`btn-toggle ${isPaused ? "resume" : "pause"}`}
                    onClick={() => handleTogglePause(item.id, item.isActive)}
                  >
                    {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}