import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function MenuIngredientsManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    restaurant: 'Shrimmers',
    category: 'burgers',
    price: 0,
    ingredients: []
  });

  // Fetch menu items and ingredients in real-time
  useEffect(() => {
    setLoading(true);
    
    const unsubMenu = onSnapshot(collection(db, 'menuItems'), (snap) => {
      const items = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setMenuItems(items.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setLoading(false);
    });

    const unsubIngredients = onSnapshot(collection(db, 'ingredients'), (snap) => {
      const list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data && data.name) {
          list.push({ id: doc.id, ...data });
        }
      });
      setIngredients(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    });

    return () => {
      unsubMenu();
      unsubIngredients();
    };
  }, []);

  // Add ingredient to form
  const addIngredientToForm = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { ingredientId: '', ingredientName: '', quantity: 0, unit: '' }
      ]
    });
  };

  // Update ingredient in form
  const updateFormIngredient = (index, field, value) => {
    const updated = [...formData.ingredients];
    
    if (field === 'ingredientId') {
      const selectedIng = ingredients.find(i => i.id === value);
      if (selectedIng) {
        updated[index] = {
          ...updated[index],
          ingredientId: value,
          ingredientName: selectedIng.name,
          unit: selectedIng.unit
        };
      }
    } else {
      updated[index][field] = value;
    }
    
    setFormData({ ...formData, ingredients: updated });
  };

  // Remove ingredient from form
  const removeFormIngredient = (index) => {
    const updated = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: updated });
  };

  // Save menu item
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter menu item name');
      return;
    }

    if (formData.ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    const invalidIngredient = formData.ingredients.find(
      ing => !ing.ingredientId || !ing.quantity || ing.quantity <= 0
    );

    if (invalidIngredient) {
      alert('Please complete all ingredient details with valid quantities');
      return;
    }

    try {
      const data = {
        name: formData.name,
        restaurant: formData.restaurant,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        ingredients: formData.ingredients,
        updatedAt: serverTimestamp()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), data);
        alert('✅ Menu item updated!');
      } else {
        await addDoc(collection(db, 'menuItems'), {
          ...data,
          createdAt: serverTimestamp()
        });
        alert('✅ Menu item added!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('❌ Failed to save menu item');
    }
  };

  // Edit menu item
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      restaurant: item.restaurant || 'Shrimmers',
      category: item.category || 'burgers',
      price: item.price || 0,
      ingredients: item.ingredients || []
    });
    setShowModal(true);
  };

  // Delete menu item
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteDoc(doc(db, 'menuItems', id));
        alert('✅ Menu item deleted!');
      } catch (error) {
        console.error('Error deleting:', error);
        alert('❌ Failed to delete');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      restaurant: 'Shrimmers',
      category: 'burgers',
      price: 0,
      ingredients: []
    });
    setEditingItem(null);
    setShowModal(false);
  };

  // Filter menu items by search and restaurant
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRestaurant = selectedRestaurant === 'all' || item.restaurant === selectedRestaurant;
    return matchesSearch && matchesRestaurant;
  });

  // Group items by restaurant
  const groupedItems = filteredItems.reduce((acc, item) => {
    const restaurant = item.restaurant || 'Other';
    if (!acc[restaurant]) acc[restaurant] = [];
    acc[restaurant].push(item);
    return acc;
  }, {});

  // Get restaurant counts
  const restaurantCounts = {
    all: menuItems.length,
    Shrimmers: menuItems.filter(i => i.restaurant === 'Shrimmers').length,
    Peppanizze: menuItems.filter(i => i.restaurant === 'Peppanizze').length,
    'Urban Wrap': menuItems.filter(i => i.restaurant === 'Urban Wrap').length,
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>⏳ Loading Menu Items...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🍔 Menu Items & Ingredients</h1>
          <p style={styles.subtitle}>Link ingredients to menu items for automatic stock deduction</p>
        </div>
      </div>

      {/* RESTAURANT FILTER TABS */}
      <div style={styles.filterTabs}>
        {[
          { value: 'all', label: 'All Restaurants', icon: '🏪' },
          { value: 'Shrimmers', label: 'Shrimmers', icon: '🍔' },
          { value: 'Peppanizze', label: 'Peppanizze', icon: '🍕' },
          { value: 'Urban Wrap', label: 'Urban Wrap', icon: '🌯' },
        ].map((tab) => (
          <button
            key={tab.value}
            style={{
              ...styles.filterTab,
              ...(selectedRestaurant === tab.value ? styles.filterTabActive : {})
            }}
            onClick={() => setSelectedRestaurant(tab.value)}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span style={styles.tabLabel}>{tab.label}</span>
            <span style={styles.tabCount}>({restaurantCounts[tab.value] || 0})</span>
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div style={styles.controls}>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Menu Item
        </button>
        <input
          type="text"
          placeholder="🔍 Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* MENU ITEMS GROUPED BY RESTAURANT */}
      {Object.keys(groupedItems).length === 0 ? (
        <div style={styles.emptyState}>
          <p>No menu items found. {selectedRestaurant !== 'all' ? 'Try selecting a different restaurant.' : 'Add one to get started!'}</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([restaurant, items]) => (
          <div key={restaurant} style={styles.restaurantSection}>
            {/* Restaurant Header */}
            <div style={styles.restaurantHeader}>
              <h2 style={styles.restaurantTitle}>
                {restaurant === 'Shrimmers' && '🍔'}
                {restaurant === 'Peppanizze' && '🍕'}
                {restaurant === 'Urban Wrap' && '🌯'}
                {!['Shrimmers', 'Peppanizze', 'Urban Wrap'].includes(restaurant) && '🏪'}
                {' '}{restaurant}
              </h2>
              <span style={styles.itemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Items Grid */}
            <div style={styles.grid}>
              {items.map((item) => (
                <div key={item.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>{item.name}</h3>
                      <p style={styles.category}>
                        {item.category || 'uncategorized'} • ₹{item.price || 0}
                      </p>
                      <span style={styles.restaurantBadge}>{item.restaurant}</span>
                    </div>
                  </div>

                  {/* INGREDIENTS LIST */}
                  <div style={styles.ingredientsList}>
                    <h4 style={styles.sectionTitle}>Required Ingredients:</h4>
                    {item.ingredients && item.ingredients.length > 0 ? (
                      item.ingredients.map((ing, idx) => (
                        <div key={idx} style={styles.ingredientRow}>
                          <span style={styles.ingredientName}>• {ing.ingredientName}</span>
                          <span style={styles.ingredientQty}>
                            {ing.quantity} {ing.unit}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={styles.noIngredients}>No ingredients added</p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div style={styles.cardActions}>
                    <button style={styles.btnEdit} onClick={() => handleEdit(item)}>
                      ✏️ Edit
                    </button>
                    <button style={styles.btnDelete} onClick={() => handleDelete(item.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={resetForm}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button onClick={resetForm} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalForm}>
              {/* BASIC INFO */}
              <input
                type="text"
                placeholder="Menu item name (e.g., Classic Burger)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.formInput}
              />

              <select
                value={formData.restaurant}
                onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                style={styles.formInput}
              >
                <option value="Shrimmers">🍔 Shrimmers</option>
                <option value="Peppanizze">🍕 Peppanizze</option>
                <option value="Urban Wrap">🌯 Urban Wrap</option>
              </select>

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={styles.formInput}
              >
                <option value="burgers">Burgers</option>
                <option value="pizzas">Pizzas</option>
                <option value="wraps">Wraps</option>
                <option value="sandwiches">Sandwiches</option>
                <option value="beverages">Beverages</option>
                <option value="desserts">Desserts</option>
                <option value="sides">Sides</option>
              </select>

              <input
                type="number"
                placeholder="Price (₹)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={styles.formInput}
              />

              {/* INGREDIENTS SECTION */}
              <div style={styles.ingredientsSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Ingredients Required</h3>
                  <button onClick={addIngredientToForm} style={styles.btnAddIngredient}>
                    + Add Ingredient
                  </button>
                </div>

                {formData.ingredients.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                    No ingredients added yet
                  </p>
                ) : (
                  formData.ingredients.map((ing, index) => (
                    <div key={index} style={styles.ingredientFormRow}>
                      <select
                        value={ing.ingredientId}
                        onChange={(e) => updateFormIngredient(index, 'ingredientId', e.target.value)}
                        style={{ ...styles.formInput, flex: 2, margin: 0 }}
                      >
                        <option value="">Select ingredient</option>
                        {ingredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={(e) => updateFormIngredient(index, 'quantity', e.target.value)}
                        style={{ ...styles.formInput, flex: 1, margin: 0 }}
                        min="0"
                        step="0.1"
                      />

                      <button
                        onClick={() => removeFormIngredient(index)}
                        style={styles.btnRemoveIngredient}
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnConfirm} onClick={handleSave}>
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button style={styles.btnCancelModal} onClick={resetForm}>
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
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    padding: '40px 20px',
    color: '#fff',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#fff',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
    fontSize: '14px',
  },
  filterTabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  filterTab: {
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s',
  },
  filterTabActive: {
    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
    border: '2px solid #ffd700',
    color: '#000',
  },
  tabIcon: {
    fontSize: '18px',
  },
  tabLabel: {
    fontSize: '14px',
  },
  tabCount: {
    fontSize: '12px',
    opacity: 0.8,
  },
  controls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
    border: 'none',
    borderRadius: '10px',
    color: '#000',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
  },
  searchInput: {
    flex: 1,
    minWidth: '250px',
    padding: '14px 20px',
    border: '2px solid rgba(255,215,0,0.3)',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '15px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'rgba(255,255,255,0.5)',
  },
  restaurantSection: {
    marginBottom: '50px',
  },
  restaurantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid rgba(255,215,0,0.3)',
  },
  restaurantTitle: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#ffd700',
  },
  itemCount: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
    borderLeft: '4px solid #ffd700',
  },
  cardHeader: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 6px 0',
  },
  category: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 8px 0',
    textTransform: 'capitalize',
  },
  restaurantBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    background: 'rgba(255,215,0,0.15)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#ffd700',
    fontWeight: '600',
  },
  ingredientsList: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: 'rgba(255,255,255,0.8)',
  },
  ingredientRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  ingredientName: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
  },
  ingredientQty: {
    fontSize: '13px',
    color: '#ffd700',
    fontWeight: '600',
  },
  noIngredients: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
  },
  btnEdit: {
    flex: 1,
    padding: '10px',
    background: 'rgba(255,215,0,0.15)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: '8px',
    color: '#ffd700',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnDelete: {
    flex: 1,
    padding: '10px',
    background: 'rgba(244,67,54,0.15)',
    border: '1px solid rgba(244,67,54,0.3)',
    borderRadius: '8px',
    color: '#f44336',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1c1c1c, #262626)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '2px solid rgba(255,215,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid rgba(255,255,255,0.1)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  formInput: {
    padding: '14px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: '14px',
  },
  ingredientsSection: {
    background: 'rgba(0,0,0,0.2)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  btnAddIngredient: {
    padding: '8px 16px',
    background: 'rgba(76,175,80,0.2)',
    border: '1px solid #4caf50',
    borderRadius: '8px',
    color: '#4caf50',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  ingredientFormRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'center',
  },
  btnRemoveIngredient: {
    padding: '10px 14px',
    background: 'rgba(244,67,54,0.2)',
    border: '1px solid rgba(244,67,54,0.3)',
    borderRadius: '8px',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '16px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  btnConfirm: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #4caf50, #45a049)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
  },
  btnCancelModal: {
    flex: 1,
    padding: '14px',
    background: 'rgba(244,67,54,0.2)',
    border: '1px solid #f44336',
    borderRadius: '10px',
    color: '#f44336',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
  },
};