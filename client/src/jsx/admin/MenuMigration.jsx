// MenuMigration.jsx - Migrate ALL restaurant menus at once
import React, { useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function MenuMigration() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrated, setMigrated] = useState({});
  const [selectedRestaurants, setSelectedRestaurants] = useState({
    shrimmers: true,
    peppanizze: true,
    urbanwrap: true,
  });

  // Restaurant configurations
  const restaurantConfigs = [
    { 
      id: 'shrimmers',
      name: 'Shrimmers', 
      collection: 'menu',
      displayName: 'Shrimmers (Burgers & Fast Food)'
    },
    { 
      id: 'peppanizze',
      name: 'Peppanizze', 
      collection: 'Pmenu',
      displayName: 'Peppanizze (Pizza)'
    },
    { 
      id: 'urbanwrap',
      name: 'Urban Wrap', 
      collection: 'Umenu',
      displayName: 'Urban Wrap (Wraps & Sandwiches)'
    },
  ];

  const toggleRestaurant = (id) => {
    setSelectedRestaurants(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const migrateAllMenus = async () => {
    setLoading(true);
    setStatus('🚀 Starting migration...');
    const allMigrated = {};

    try {
      // Get selected restaurants only
      const selectedConfigs = restaurantConfigs.filter(
        config => selectedRestaurants[config.id]
      );

      if (selectedConfigs.length === 0) {
        setStatus('⚠️ Please select at least one restaurant');
        setLoading(false);
        return;
      }

      setStatus(`📋 Processing ${selectedConfigs.length} restaurant(s)...`);

      // Process each selected restaurant
      for (const config of selectedConfigs) {
        setStatus(`🏪 Processing ${config.name}...`);
        
        try {
          const menuSnapshot = await getDocs(collection(db, config.collection));
          const items = [];

          if (menuSnapshot.empty) {
            setStatus(`⚠️ No data found in ${config.collection}`);
            allMigrated[config.name] = [];
            continue;
          }

          setStatus(`📦 Found ${menuSnapshot.size} categories in ${config.name}`);

          // Process each category document
          for (const docSnap of menuSnapshot.docs) {
            const categoryData = docSnap.data();
            const category = categoryData.category;

            if (!categoryData.items || categoryData.items.length === 0) {
              console.warn(`⚠️ No items in category: ${category}`);
              continue;
            }

            // Migrate each item
            for (const item of categoryData.items) {
              try {
                const menuItemData = {
                  name: item.name,
                  restaurant: config.name, // NEW: Track which restaurant
                  category: category,
                  price: item.price || 0,
                  rating: item.rating || 4.0,
                  desc: item.desc || '',
                  img: item.img || '',
                  stock: item.stock || 100, // Default stock
                  isActive: item.isActive !== false, // Default active
                  ingredients: [], // Empty initially
                  originalCollection: config.collection,
                  originalCategoryDocId: docSnap.id,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                };

                await addDoc(collection(db, 'menuItems'), menuItemData);
                items.push(item.name);
                setStatus(`✅ ${config.name}: ${item.name}`);
                
              } catch (err) {
                console.error(`Error migrating ${item.name}:`, err);
                setStatus(`❌ Failed: ${item.name}`);
              }
            }
          }

          allMigrated[config.name] = items;
          setStatus(`✅ ${config.name} complete: ${items.length} items`);

        } catch (err) {
          console.error(`Error processing ${config.name}:`, err);
          setStatus(`❌ Failed to process ${config.name}: ${err.message}`);
          allMigrated[config.name] = [];
        }
      }

      setMigrated(allMigrated);
      
      const totalItems = Object.values(allMigrated).reduce(
        (sum, items) => sum + items.length, 
        0
      );
      
      setStatus(`🎉 Migration complete! ${totalItems} total items migrated.`);
      
    } catch (error) {
      console.error('Migration error:', error);
      setStatus(`❌ Migration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = Object.values(selectedRestaurants).filter(Boolean).length;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔄 Multi-Restaurant Menu Migration</h1>
        <p style={styles.subtitle}>
          Migrate menu items from all restaurants to the unified 'menuItems' collection
        </p>

        <div style={styles.warning}>
          <strong>⚠️ Warning:</strong> Run this only ONCE per restaurant. Check your 'menuItems' collection first to avoid duplicates.
        </div>

        {/* RESTAURANT SELECTION */}
        <div style={styles.selectionBox}>
          <h3 style={styles.selectionTitle}>Select Restaurants to Migrate:</h3>
          {restaurantConfigs.map((config) => (
            <label key={config.id} style={styles.checkbox}>
              <input
                type="checkbox"
                checked={selectedRestaurants[config.id]}
                onChange={() => toggleRestaurant(config.id)}
                disabled={loading}
              />
              <span style={styles.checkboxLabel}>
                {config.displayName}
                <span style={styles.collectionName}>({config.collection})</span>
              </span>
            </label>
          ))}
        </div>

        <button 
          style={{
            ...styles.button,
            opacity: totalSelected === 0 ? 0.5 : 1,
            cursor: totalSelected === 0 || loading ? 'not-allowed' : 'pointer'
          }} 
          onClick={migrateAllMenus}
          disabled={loading || totalSelected === 0}
        >
          {loading 
            ? '⏳ Migrating...' 
            : `🚀 Migrate ${totalSelected} Restaurant${totalSelected !== 1 ? 's' : ''}`
          }
        </button>

        {status && (
          <div style={styles.statusBox}>
            <p style={styles.statusText}>{status}</p>
          </div>
        )}

        {Object.keys(migrated).length > 0 && (
          <div style={styles.resultsContainer}>
            {Object.entries(migrated).map(([restaurant, items]) => (
              <div key={restaurant} style={styles.resultBox}>
                <h3 style={styles.resultTitle}>
                  ✅ {restaurant} ({items.length} items)
                </h3>
                {items.length > 0 ? (
                  <ul style={styles.list}>
                    {items.slice(0, 10).map((itemName, idx) => (
                      <li key={idx} style={styles.listItem}>• {itemName}</li>
                    ))}
                    {items.length > 10 && (
                      <li style={styles.listItem}>... and {items.length - 10} more</li>
                    )}
                  </ul>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0' }}>
                    No items migrated
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,215,0,0.3)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffd700',
    margin: '0 0 10px 0',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 24px 0',
    fontSize: '14px',
  },
  warning: {
    background: 'rgba(255,152,0,0.15)',
    border: '2px solid #ff9800',
    borderRadius: '12px',
    padding: '16px',
    color: '#fff',
    marginBottom: '24px',
    fontSize: '14px',
  },
  selectionBox: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  selectionTitle: {
    color: '#ffd700',
    fontSize: '16px',
    margin: '0 0 16px 0',
    fontWeight: '700',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: '14px',
    marginLeft: '12px',
    fontWeight: '600',
  },
  collectionName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    marginLeft: '8px',
    fontWeight: '400',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
    border: 'none',
    borderRadius: '12px',
    color: '#000',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  statusBox: {
    marginTop: '24px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  statusText: {
    color: '#fff',
    margin: 0,
    fontSize: '13px',
    fontFamily: 'monospace',
    lineHeight: '1.6',
  },
  resultsContainer: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultBox: {
    background: 'rgba(76,175,80,0.15)',
    border: '2px solid #4caf50',
    borderRadius: '12px',
    padding: '20px',
  },
  resultTitle: {
    color: '#4caf50',
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  listItem: {
    color: 'rgba(255,255,255,0.9)',
    padding: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px',
  },
};