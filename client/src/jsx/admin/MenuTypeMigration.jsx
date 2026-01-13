import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// 🍗 Keywords for non-veg detection
const nonVegKeywords = [
  'chicken', 'mutton', 'egg', 'fish', 'prawn', 'beef', 
  'pork', 'meat', 'biryani', 'kebab', 'tikka', 'tandoori',
  'fry', 'masala', 'curry', 'seekh', 'shami', 'keema'
];

export default function FixMenuTypeMigration() {
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedCollections, setSelectedCollections] = useState({
    menu: true,
    Pmenu: true,
    Umenu: true,
    menuItems: true
  });

  const addStatus = (msg) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const determineType = (name) => {
    const itemName = (name || '').toLowerCase();
    const isNonVeg = nonVegKeywords.some(keyword => 
      itemName.includes(keyword.toLowerCase())
    );
    return isNonVeg ? 'nonveg' : 'veg';
  };

  // Migration for OLD structure (menu, Pmenu, Umenu) - items are in an array
  const migrateOldStructure = async (collectionName) => {
    addStatus(`📂 Starting ${collectionName} collection...`);
    
    const collRef = collection(db, collectionName);
    const snapshot = await getDocs(collRef);
    
    addStatus(`   Found ${snapshot.docs.length} category documents`);
    
    let categoryUpdated = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const categoryName = data.category || docSnap.id;
      
      if (!data.items || !Array.isArray(data.items)) {
        addStatus(`   ⚠️ No items array in ${categoryName}`);
        continue;
      }

      let hasChanges = false;
      const updatedItems = data.items.map((item) => {
        // Skip if already has type
        if (item.type) {
          itemsSkipped++;
          return item;
        }

        // Add type
        const type = determineType(item.name);
        itemsUpdated++;
        hasChanges = true;
        
        return {
          ...item,
          type: type
        };
      });

      // Update document if changes were made
      if (hasChanges) {
        await updateDoc(doc(db, collectionName, docSnap.id), {
          items: updatedItems
        });
        categoryUpdated++;
        addStatus(`   ✅ Updated ${categoryName}: ${updatedItems.length} items`);
      }
    }

    addStatus(`✅ ${collectionName} complete: ${itemsUpdated} updated, ${itemsSkipped} skipped`);
    return { updated: itemsUpdated, skipped: itemsSkipped, categories: categoryUpdated };
  };

  // Migration for NEW structure (menuItems) - each item is a document
  const migrateNewStructure = async () => {
    addStatus('📂 Starting menuItems collection...');
    
    const collRef = collection(db, 'menuItems');
    const snapshot = await getDocs(collRef);
    
    addStatus(`   Found ${snapshot.docs.length} item documents`);
    
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Skip if already has type
      if (data.type) {
        itemsSkipped++;
        continue;
      }

      // Add type
      const type = determineType(data.name);
      await updateDoc(doc(db, 'menuItems', docSnap.id), {
        type: type,
        updatedAt: new Date()
      });
      
      itemsUpdated++;
      addStatus(`   ✅ ${data.name} → ${type}`);
    }

    addStatus(`✅ menuItems complete: ${itemsUpdated} updated, ${itemsSkipped} skipped`);
    return { updated: itemsUpdated, skipped: itemsSkipped };
  };

  const runMigration = async () => {
    if (!window.confirm('⚠️ This will add veg/nonveg type to ALL selected collections. Continue?')) {
      return;
    }

    setLoading(true);
    setStatus([]);
    
    const collections = Object.keys(selectedCollections).filter(
      key => selectedCollections[key]
    );

    if (collections.length === 0) {
      alert('Please select at least one collection');
      setLoading(false);
      return;
    }

    addStatus(`🚀 Starting migration for ${collections.length} collection(s)...`);
    
    const results = {};
    let totalUpdated = 0;
    let totalSkipped = 0;

    try {
      for (const collName of collections) {
        setProgress({ current: collections.indexOf(collName) + 1, total: collections.length });
        
        if (collName === 'menuItems') {
          results[collName] = await migrateNewStructure();
        } else {
          results[collName] = await migrateOldStructure(collName);
        }
        
        totalUpdated += results[collName].updated;
        totalSkipped += results[collName].skipped;
      }

      addStatus('');
      addStatus('🎉 MIGRATION COMPLETE!');
      addStatus(`✅ Total updated: ${totalUpdated} items`);
      addStatus(`⏭️ Total skipped: ${totalSkipped} items`);
      
      alert(`✅ Migration complete!\n\nUpdated: ${totalUpdated}\nSkipped: ${totalSkipped}\n\nCheck the log for details.`);

    } catch (error) {
      console.error('Migration error:', error);
      addStatus(`❌ ERROR: ${error.message}`);
      alert('Migration failed! Check the log.');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const toggleCollection = (name) => {
    setSelectedCollections(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const selectedCount = Object.values(selectedCollections).filter(Boolean).length;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔧 Add Veg/NonVeg Types</h1>
        <p style={styles.subtitle}>
          Add food type classification to your existing menu collections
        </p>

        <div style={styles.warning}>
          <strong>⚠️ Important:</strong> This will update your actual menu data. 
          Items that already have a type will be skipped.
        </div>

        {/* Collection Selection */}
        <div style={styles.selectionBox}>
          <h3 style={styles.selectionTitle}>Select Collections to Update:</h3>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={selectedCollections.menu}
              onChange={() => toggleCollection('menu')}
              disabled={loading}
            />
            <span style={styles.checkboxLabel}>
              <strong>menu</strong> (Shrimmers - Your main menu)
            </span>
          </label>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={selectedCollections.Pmenu}
              onChange={() => toggleCollection('Pmenu')}
              disabled={loading}
            />
            <span style={styles.checkboxLabel}>
              <strong>Pmenu</strong> (Peppanizze - Pizza menu)
            </span>
          </label>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={selectedCollections.Umenu}
              onChange={() => toggleCollection('Umenu')}
              disabled={loading}
            />
            <span style={styles.checkboxLabel}>
              <strong>Umenu</strong> (Urban Wrap menu)
            </span>
          </label>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={selectedCollections.menuItems}
              onChange={() => toggleCollection('menuItems')}
              disabled={loading}
            />
            <span style={styles.checkboxLabel}>
              <strong>menuItems</strong> (Unified collection)
            </span>
          </label>
        </div>

        {/* Progress */}
        {loading && progress.total > 0 && (
          <div style={styles.progressBox}>
            <div style={styles.progressText}>
              Processing {progress.current} of {progress.total} collections...
            </div>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${(progress.current / progress.total) * 100}%`
              }} />
            </div>
          </div>
        )}

        <button 
          style={{
            ...styles.button,
            opacity: loading || selectedCount === 0 ? 0.7 : 1,
            cursor: loading || selectedCount === 0 ? 'not-allowed' : 'pointer'
          }} 
          onClick={runMigration}
          disabled={loading || selectedCount === 0}
        >
          {loading 
            ? '⏳ Running Migration...' 
            : `🚀 Update ${selectedCount} Collection${selectedCount !== 1 ? 's' : ''}`
          }
        </button>

        {/* Status Log */}
        {status.length > 0 && (
          <div style={styles.logBox}>
            <div style={styles.logHeader}>
              <span>📝 Migration Log</span>
              <button 
                style={styles.clearBtn}
                onClick={() => setStatus([])}
              >
                Clear
              </button>
            </div>
            <div style={styles.logContent}>
              {status.map((msg, idx) => (
                <div key={idx} style={styles.logLine}>
                  {msg}
                </div>
              ))}
            </div>
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
    alignItems: 'flex-start',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,215,0,0.3)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '800px',
    width: '100%',
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
    lineHeight: '1.6',
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
    padding: '14px',
    marginBottom: '10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: '14px',
    marginLeft: '12px',
    lineHeight: '1.5',
  },
  progressBox: {
    background: 'rgba(33,150,243,0.1)',
    border: '1px solid rgba(33,150,243,0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  progressText: {
    color: '#64b5f6',
    fontSize: '14px',
    marginBottom: '12px',
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2196F3, #64b5f6)',
    transition: 'width 0.3s ease',
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
    transition: 'transform 0.2s',
  },
  logBox: {
    marginTop: '24px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: '700',
  },
  clearBtn: {
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  logContent: {
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  logLine: {
    color: 'rgba(255,255,255,0.9)',
    padding: '4px 0',
    lineHeight: '1.6',
  },
};