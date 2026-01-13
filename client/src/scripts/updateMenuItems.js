// src/scripts/updateMenuItems.js
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 🍗 Keywords for non-veg detection
const nonVegKeywords = [
  'chicken', 'mutton', 'egg', 'fish', 'prawn', 'beef', 
  'pork', 'meat', 'biryani', 'kebab', 'tikka', 'tandoori',
  'fry', 'masala', 'curry', 'seekh', 'shami', 'keema'
];

/**
 * 🔥 Main Migration Function
 * Updates all menu items with veg/nonveg type
 */
async function updateMenuWithFoodTypes() {
  try {
    console.log('🚀 Starting menu migration...\n');
    
    const menuRef = collection(db, 'menu');
    const snapshot = await getDocs(menuRef);
    
    console.log(`📊 Found ${snapshot.docs.length} menu documents\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const menuDoc of snapshot.docs) {
      const data = menuDoc.data();
      const docId = menuDoc.id;
      
      console.log(`\n📂 Processing: ${data.category || docId}`);
      console.log(`   Items: ${data.items?.length || 0}`);

      // Check if document has items array
      if (!data.items || !Array.isArray(data.items)) {
        console.log(`   ⚠️  Skipped: No items array found`);
        continue;
      }

      // Update each item in the items array
      const updatedItems = data.items.map((item, index) => {
        // Skip if already has type
        if (item.type) {
          console.log(`   ⏭️  Item ${index + 1}: ${item.name} - Already has type: ${item.type}`);
          totalSkipped++;
          return item;
        }

        // Determine type based on name
        const itemName = (item.name || '').toLowerCase();
        const isNonVeg = nonVegKeywords.some(keyword => 
          itemName.includes(keyword.toLowerCase())
        );
        
        const type = isNonVeg ? 'nonveg' : 'veg';
        
        console.log(`   ✅ Item ${index + 1}: ${item.name} → ${type}`);
        totalUpdated++;

        return {
          ...item,
          type: type
        };
      });

      // Update the document with modified items array
      await updateDoc(doc(db, 'menu', docId), {
        items: updatedItems
      });
      
      console.log(`   💾 Saved: ${data.category || docId}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${totalUpdated} items`);
    console.log(`⏭️  Skipped: ${totalSkipped} items (already had type)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    console.error('Error details:', error.message);
  }
}

// 🚀 Export the function
export default updateMenuWithFoodTypes;

// If running directly with node
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMenuWithFoodTypes();
}