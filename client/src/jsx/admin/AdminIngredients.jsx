import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./AdminStockManagement.css";

// 🔥 ID GENERATOR
function generateIngredientId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "_");
}

export default function AdminIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "pieces",
    stock: 0,
  });

  // 🔄 FETCH ALL INGREDIENTS IN REAL TIME
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "ingredients"), (snap) => {
      const list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        // Only add if it has a name
        if (data && data.name) {
          list.push({ id: doc.id, ...data });
        }
      });
      // Safe sort - check if name exists
      setIngredients(
        list.sort((a, b) => 
          (a.name || "").localeCompare(b.name || "")
        )
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✏️ UPDATE INGREDIENT STOCK
  const handleUpdateStock = async (id, newStock) => {
    try {
      await updateDoc(doc(db, "ingredients", id), {
        stock: parseInt(newStock),
      });
      setEditingId(null);
      alert("✅ Ingredient stock updated!");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed to update stock");
    }
  };

  // ➕ ADD NEW INGREDIENT
  const handleAddIngredient = async () => {
    if (!formData.name.trim()) {
      alert("Enter ingredient name");
      return;
    }

    try {
      await addDoc(collection(db, "ingredients"), {
        name: formData.name,
        unit: formData.unit,
        stock: parseInt(formData.stock) || 0,
        createdAt: serverTimestamp(),
      });
      setFormData({ name: "", unit: "pieces", stock: 0 });
      setShowAddForm(false);
      alert("✅ Ingredient added!");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed to add ingredient");
    }
  };

  // 🔍 SEARCH FILTER - Safe check
  const filteredIngredients = ingredients.filter((ing) =>
    (ing.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count stats - Safe checks
  const lowStockIngredients = ingredients.filter((i) => (i.stock || 0) < 10).length;

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
        <h1>🧂 Ingredients Stock</h1>
        <p>Update stock of all ingredients used in menu items</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-icon">📊</span>
          <div>
            <span className="stat-label">Total Ingredients</span>
            <span className="stat-value">{ingredients.length}</span>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">⚠️</span>
          <div>
            <span className="stat-label">Low Stock</span>
            <span className="stat-value">{lowStockIngredients}</span>
          </div>
        </div>
      </div>

      {/* ADD BUTTON & SEARCH */}
      <div className="controls-section">
        <input
          type="text"
          placeholder="🔍 Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
          className="btn-add-new"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "✕ Cancel" : "➕ Add Ingredient"}
        </button>
      </div>

      {/* ADD INGREDIENT FORM */}
      {showAddForm && (
        <div className="add-form-card">
          <h3>Add New Ingredient</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Ingredient name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="form-input"
            >
              <option value="pieces">Pieces</option>
              <option value="kg">KG</option>
              <option value="grams">Grams</option>
              <option value="liters">Liters</option>
              <option value="ml">ML</option>
            </select>
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="form-input"
            />
            <button className="btn-save" onClick={handleAddIngredient}>
              ✓ Add
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {filteredIngredients.length === 0 ? (
        <div className="empty-message">
          <p>No ingredients found</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-header">
            <div className="col-name">Ingredient Name</div>
            <div className="col-unit">Unit</div>
            <div className="col-stock">Stock</div>
            <div className="col-action">Action</div>
          </div>

          {filteredIngredients.map((ingredient) => {
            const stock = ingredient.stock || 0;
            const isLowStock = stock < 10;

            return (
              <div
                key={ingredient.id}
                className={`table-row ${isLowStock ? "low-stock" : ""}`}
              >
                {/* NAME */}
                <div className="col-name">
                  <strong>{ingredient.name || "Unknown"}</strong>
                </div>

                {/* UNIT */}
                <div className="col-unit">
                  <span className="unit-badge">{ingredient.unit || "N/A"}</span>
                </div>

                {/* STOCK */}
                <div className="col-stock">
                  {editingId === ingredient.id ? (
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
                        onClick={() =>
                          handleUpdateStock(ingredient.id, editStock)
                        }
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
                      <span
                        className={`stock-num ${isLowStock ? "critical" : ""}`}
                      >
                        {stock}
                      </span>
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditingId(ingredient.id);
                          setEditStock(stock);
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>

                {/* STATUS INDICATOR */}
                <div className="col-action">
                  {isLowStock && (
                    <span className="status-warning">⚠️ Low Stock</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}