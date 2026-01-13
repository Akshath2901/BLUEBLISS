import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';

// 🍗 Keywords for non-veg detection
const nonVegKeywords = [
  'chicken', 'mutton', 'egg', 'fish', 'prawn', 'beef', 
  'pork', 'meat', 'biryani', 'kebab', 'tikka', 'tandoori',
  'fry', 'masala', 'curry', 'seekh', 'shami', 'keema'
];

export default function UnifiedMenuTypeMigration() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ updated: 0, skipped: 0, total: 0 });

  const addTypesToMenuItems = async () => {
    if (!window.confirm('⚠️ This will update ALL items in the menuItems collection. Continue?')) {
      return;
    }

    setLoading(true);
    setStatus('🚀 Starting migration...');
    
    let totalUpdated = 0;
    let totalSkipped = 0;

    try {
      // Get all documents from menuItems collection
      const menuItemsRef = collection(db, 'menuItems');
      const snapshot = await getDocs(menuItemsRef);
      
      setStatus(`📊 Found ${snapshot.docs.length} menu items`);
      setStats(prev => ({ ...prev, total: snapshot.docs.length }));

      // Process each document
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const docId = docSnap.id;

        // Skip if already has type
        if (data.type) {
          setStatus(`⏭️ Skipped: ${data.name} (already has type: ${data.type})`);
          totalSkipped++;
          setStats(prev => ({ ...prev, skipped: totalSkipped }));
          continue;
        }

        // Determine type based on name
        const itemName = (data.name || '').toLowerCase();
        const isNonVeg = nonVegKeywords.some(keyword => 
          itemName.includes(keyword.toLowerCase())
        );
        const type = isNonVeg ? 'nonveg' : 'veg';

        // Update document
        await updateDoc(doc(db, 'menuItems', docId), {
          type: type,
          updatedAt: new Date()
        });

        totalUpdated++;
        setStats(prev => ({ ...prev, updated: totalUpdated }));
        setStatus(`✅ Updated: ${data.name} → ${type} (${data.restaurant})`);
      }

      setStatus(`🎉 Migration complete! Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
      
    } catch (error) {
      console.error('Migration error:', error);
      setStatus(`❌ Migration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔄 Add Veg/NonVeg Types to Menu Items</h1>
        <p style={styles.subtitle}>
          This will add food type classification to all items in the unified 'menuItems' collection
        </p>

        <div style={styles.warning}>
          <strong>⚠️ Warning:</strong> This will update ALL documents in the 'menuItems' collection.
          Items that already have a type will be skipped.
        </div>

        {/* Stats Box */}
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total Items</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{stats.updated}</div>
            <div style={styles.statLabel}>Updated</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{stats.skipped}</div>
            <div style={styles.statLabel}>Skipped</div>
          </div>
        </div>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>📋 What it does:</h3>
          <ul style={styles.infoList}>
            <li>Scans all documents in 'menuItems' collection</li>
            <li>Analyzes item names for non-veg keywords</li>
            <li>Adds type: "veg" or "nonveg" to each item</li>
            <li>Skips items that already have a type</li>
            <li>Updates the updatedAt timestamp</li>
          </ul>
        </div>

        <button 
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }} 
          onClick={addTypesToMenuItems}
          disabled={loading}
        >
          {loading ? '⏳ Migrating...' : '🚀 Start Migration'}
        </button>

        {status && (
          <div style={styles.statusBox}>
            <div style={styles.statusHeader}>📝 Status Log:</div>
            <p style={styles.statusText}>{status}</p>
          </div>
        )}

        {stats.updated > 0 && !loading && (
          <div style={styles.successBox}>
            <p style={styles.successText}>
              ✅ Successfully updated {stats.updated} items!
            </p>
            <p style={styles.successSubtext}>
              Check your Firebase Console to verify the changes.
            </p>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statBox: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffd700',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  infoBox: {
    background: 'rgba(33,150,243,0.1)',
    border: '1px solid rgba(33,150,243,0.3)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  infoTitle: {
    color: '#64b5f6',
    fontSize: '16px',
    margin: '0 0 12px 0',
    fontWeight: '700',
  },
  infoList: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    lineHeight: '1.8',
    margin: 0,
    paddingLeft: '20px',
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
  statusBox: {
    marginTop: '24px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  statusHeader: {
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  statusText: {
    color: '#fff',
    margin: 0,
    fontSize: '13px',
    fontFamily: 'monospace',
    lineHeight: '1.6',
  },
  successBox: {
    marginTop: '24px',
    background: 'rgba(76,175,80,0.15)',
    border: '2px solid #4caf50',
    borderRadius: '12px',
    padding: '20px',
  },
  successText: {
    color: '#4caf50',
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '700',
  },
  successSubtext: {
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
    fontSize: '13px',
  },
};