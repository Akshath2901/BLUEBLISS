import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getLowStockIngredients } from "../../lib/services/StockService";


export default function UnifiedStockDashboard() {
  const [ingredients, setIngredients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [lowStockWarnings, setLowStockWarnings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "pieces",
    currentStock: 0,
    averageUsage: 0,
    minThreshold: 20,
    maxStock: 200,
  });

  // Real-time fetch
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "ingredients"),
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data && data.name) {
            list.push({ id: doc.id, ...data });
          }
        });
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setIngredients(list);
        checkLowStock(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching ingredients:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const checkLowStock = (items) => {
    const warnings = items.filter(
      (item) => (item.currentStock || 0) < (item.minThreshold || 20)
    );
    setLowStockWarnings(warnings);
  };

  const handleUpdateStock = async (id, newStock) => {
    try {
      await updateDoc(doc(db, "ingredients", id), {
        currentStock: parseFloat(newStock) || 0,
        lastUpdated: new Date(),
      });
      setEditingId(null);
      alert("✅ Stock updated successfully!");
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("❌ Error updating stock!");
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) {
      alert("Please enter ingredient name!");
      return;
    }

    try {
      await addDoc(collection(db, "ingredients"), {
        name: newIngredient.name,
        unit: newIngredient.unit,
        currentStock: parseFloat(newIngredient.currentStock) || 0,
        averageUsage: parseFloat(newIngredient.averageUsage) || 0,
        minThreshold: parseFloat(newIngredient.minThreshold) || 20,
        maxStock: parseFloat(newIngredient.maxStock) || 200,
        lastUpdated: new Date(),
      });

      setNewIngredient({
        name: "",
        unit: "pieces",
        currentStock: 0,
        averageUsage: 0,
        minThreshold: 20,
        maxStock: 200,
      });
      setShowModal(false);
      alert("✅ Ingredient added successfully!");
    } catch (error) {
      console.error("Error adding ingredient:", error);
      alert("❌ Error adding ingredient!");
    }
  };

  const handleDeleteIngredient = async (id) => {
    if (window.confirm("Are you sure you want to delete this ingredient?")) {
      try {
        await deleteDoc(doc(db, "ingredients", id));
        alert("✅ Ingredient deleted!");
      } catch (error) {
        console.error("Error deleting ingredient:", error);
        alert("❌ Error deleting ingredient!");
      }
    }
  };

  const getStockStatus = (current, threshold, average) => {
    const curr = current || 0;
    const thresh = threshold || 20;
    const avg = average || 0;
    if (curr < thresh) return { status: "critical", color: "#f44336" };
    if (curr < avg) return { status: "warning", color: "#ff9800" };
    return { status: "good", color: "#4caf50" };
  };

  let displayedIngredients = filterLowStock
    ? ingredients.filter((i) => (i.currentStock || 0) < (i.minThreshold || 20))
    : ingredients;

  if (searchTerm.trim()) {
    displayedIngredients = displayedIngredients.filter((i) =>
      (i.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={{ color: "#fff" }}>⏳ Loading Stock Data...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📦 Stock Management</h1>
          <p style={styles.subtitle}>Real-time inventory with automatic deduction</p>
        </div>
      </div>

      {/* LOW STOCK ALERT */}
      {lowStockWarnings.length > 0 && (
        <div style={styles.alertBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "32px" }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>LOW STOCK ALERT!</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
                {lowStockWarnings.length} item(s) running below minimum threshold
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lowStockWarnings.map((item) => (
              <span key={item.id} style={styles.alertBadge}>
                {item.name || "Unknown"} ({item.currentStock || 0} {item.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div style={styles.controls}>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Ingredient
        </button>
        <input
          type="text"
          placeholder="🔍 Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <button
          style={{
            ...styles.btnFilter,
            background: filterLowStock
              ? "linear-gradient(135deg, #f44336, #e53935)"
              : "rgba(255,255,255,0.1)",
            border: filterLowStock ? "2px solid #f44336" : "2px solid rgba(255,255,255,0.2)",
          }}
          onClick={() => setFilterLowStock(!filterLowStock)}
        >
          {filterLowStock ? "Show All" : "⚠️ Low Stock Only"}
        </button>
      </div>

      {/* STOCK GRID */}
      {displayedIngredients.length === 0 ? (
        <div style={styles.emptyState}>
          <p>
            {searchTerm
              ? "No ingredients found matching your search"
              : "No ingredients found. Add one to get started!"}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {displayedIngredients.map((item) => {
            const current = item.currentStock || 0;
            const threshold = item.minThreshold || 20;
            const average = item.averageUsage || 0;
            const max = item.maxStock || 200;
            const { status, color } = getStockStatus(current, threshold, average);
            const stockPercentage = (current / max) * 100;
            const isEditing = editingId === item.id;
            const daysRemaining = average > 0 ? Math.floor(current / average) : "∞";

            return (
              <div key={item.id} style={{ ...styles.card, borderLeft: `4px solid ${color}` }}>
                {/* HEADER */}
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>{item.name || "Unknown"}</h3>
                    <p style={styles.cardUnit}>Unit: {item.unit || "N/A"}</p>
                  </div>
                  {current < threshold && <span style={{ fontSize: "24px" }}>🔔</span>}
                </div>

                {/* PROGRESS BAR */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Current Stock</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color }}>
                      {current} {item.unit || "unit"}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(stockPercentage, 100)}%`,
                        background: color,
                      }}
                    ></div>
                  </div>
                </div>

                {/* INFO GRID */}
                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <div style={styles.infoLabel}>Avg. Usage</div>
                    <div style={styles.infoValue}>{average}/day</div>
                  </div>
                  <div style={styles.infoBox}>
                    <div style={styles.infoLabel}>Min. Threshold</div>
                    <div style={styles.infoValue}>{threshold}</div>
                  </div>
                  <div style={styles.infoBox}>
                    <div style={styles.infoLabel}>Max Capacity</div>
                    <div style={styles.infoValue}>{max}</div>
                  </div>
                  <div style={styles.infoBox}>
                    <div style={styles.infoLabel}>Days Left</div>
                    <div style={styles.infoValue}>{daysRemaining}</div>
                  </div>
                </div>

                {/* UPDATE SECTION */}
                {isEditing ? (
                  <div style={styles.updateSection}>
                    <input
                      type="number"
                      value={editValues[item.id] || current}
                      onChange={(e) => setEditValues({ ...editValues, [item.id]: e.target.value })}
                      style={styles.stockInput}
                      placeholder="New stock"
                    />
                    <button
                      style={styles.btnSave}
                      onClick={() => handleUpdateStock(item.id, editValues[item.id] || current)}
                    >
                      Save
                    </button>
                    <button style={styles.btnCancel} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    style={styles.btnUpdate}
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValues({ [item.id]: current });
                    }}
                  >
                    📝 Update Stock
                  </button>
                )}

                {/* DELETE */}
                <button onClick={() => handleDeleteIngredient(item.id)} style={styles.btnDelete}>
                  🗑️ Delete
                </button>

                {/* LAST UPDATED */}
                <div style={styles.lastUpdated}>
                  Last updated:{" "}
                  {item.lastUpdated ? new Date(item.lastUpdated.seconds * 1000).toLocaleTimeString() : "N/A"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>Add New Ingredient</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.modalForm}>
              <input
                type="text"
                placeholder="Ingredient name (e.g., Burger Patties)"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                style={styles.formInput}
              />

              <select
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                style={styles.formInput}
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="grams">Grams (g)</option>
                <option value="liters">Liters (L)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="dozen">Dozen</option>
                <option value="box">Box</option>
              </select>

              <input
                type="number"
                placeholder="Current stock"
                value={newIngredient.currentStock}
                onChange={(e) => setNewIngredient({ ...newIngredient, currentStock: e.target.value })}
                style={styles.formInput}
              />

              <input
                type="number"
                placeholder="Average daily usage"
                value={newIngredient.averageUsage}
                onChange={(e) => setNewIngredient({ ...newIngredient, averageUsage: e.target.value })}
                style={styles.formInput}
              />

              <input
                type="number"
                placeholder="Minimum threshold (alert)"
                value={newIngredient.minThreshold}
                onChange={(e) => setNewIngredient({ ...newIngredient, minThreshold: e.target.value })}
                style={styles.formInput}
              />

              <input
                type="number"
                placeholder="Maximum capacity"
                value={newIngredient.maxStock}
                onChange={(e) => setNewIngredient({ ...newIngredient, maxStock: e.target.value })}
                style={styles.formInput}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnConfirm} onClick={handleAddIngredient}>
                Add Ingredient
              </button>
              <button style={styles.btnCancelModal} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
    padding: "40px 20px",
    color: "#fff",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
  },
  header: {
    marginBottom: "40px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #ffd700, #ffed4e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    margin: 0,
    fontSize: "14px",
  },
  alertBanner: {
    background: "linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(251, 140, 0, 0.15))",
    border: "2px solid #ff9800",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "30px",
  },
  alertBadge: {
    background: "rgba(0,0,0,0.3)",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  controls: {
    display: "flex",
    gap: "16px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #ffd700, #ffed4e)",
    border: "none",
    borderRadius: "10px",
    color: "#000",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },
  searchInput: {
    flex: 1,
    minWidth: "250px",
    padding: "14px 20px",
    border: "2px solid rgba(255,215,0,0.3)",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
  },
  btnFilter: {
    padding: "14px 24px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    color: "#fff",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "rgba(255,255,255,0.5)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 6px 0",
  },
  cardUnit: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
    margin: 0,
  },
  progressBar: {
    height: "8px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "20px",
  },
  infoBox: {
    background: "rgba(0,0,0,0.3)",
    padding: "12px",
    borderRadius: "8px",
  },
  infoLabel: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
    marginBottom: "4px",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: "700",
  },
  updateSection: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  stockInput: {
    flex: 1,
    padding: "10px",
    border: "2px solid rgba(255,215,0,0.3)",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    fontSize: "14px",
  },
  btnSave: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #4caf50, #45a049)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnCancel: {
    padding: "10px 20px",
    background: "rgba(244,67,54,0.2)",
    border: "1px solid #f44336",
    borderRadius: "8px",
    color: "#f44336",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnUpdate: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,215,0,0.15)",
    border: "2px solid rgba(255,215,0,0.3)",
    borderRadius: "8px",
    color: "#ffd700",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "12px",
  },
  btnDelete: {
    width: "100%",
    padding: "10px",
    background: "rgba(244,67,54,0.15)",
    border: "1px solid rgba(244,67,54,0.3)",
    borderRadius: "8px",
    color: "#f44336",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "12px",
  },
  lastUpdated: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "linear-gradient(135deg, #1c1c1c, #262626)",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    border: "2px solid rgba(255,215,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid rgba(255,255,255,0.1)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    padding: "4px",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  },
  formInput: {
    padding: "14px",
    border: "2px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    fontSize: "14px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
  },
  btnConfirm: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #4caf50, #45a049)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },
  btnCancelModal: {
    flex: 1,
    padding: "14px",
    background: "rgba(244,67,54,0.2)",
    border: "1px solid #f44336",
    borderRadius: "10px",
    color: "#f44336",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },
};