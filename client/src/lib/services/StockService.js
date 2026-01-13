// src/lib/services/StockService.js
// Updated to work with your existing cart structure

import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  writeBatch,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Deduct stock for entire cart/order
 * @param {Array} cart - Cart items array with structure: [{id, name, price, qty}]
 * @returns {Promise<Object>} - Result with success status
 */
export async function deductStockForOrder(cart) {
  try {
    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    console.log('🔍 Processing cart items:', cart);

    const results = {
      success: true,
      deductedItems: [],
      errors: [],
      insufficientStock: [],
      warnings: []
    };

    // Map to track total ingredient requirements
    const ingredientDeductions = new Map();

    // Step 1: Collect all ingredient requirements from cart items
    for (const cartItem of cart) {
      console.log(`📦 Processing: ${cartItem.name} (qty: ${cartItem.qty})`);
      
      // Find menu item in Firebase by matching name
      // Note: It's better to use cartItem.menuItemId if available
      const menuItemsRef = collection(db, 'menuItems');
      const q = query(menuItemsRef, where('name', '==', cartItem.name));
      const menuItemSnap = await getDocs(q);

      if (menuItemSnap.empty) {
        console.warn(`⚠️ Menu item not found in database: ${cartItem.name}`);
        results.warnings.push(`Menu item "${cartItem.name}" has no ingredient mapping`);
        continue;
      }

      const menuItemDoc = menuItemSnap.docs[0];
      const menuItem = menuItemDoc.data();

      if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
        console.warn(`⚠️ No ingredients configured for: ${cartItem.name}`);
        results.warnings.push(`No ingredients configured for "${cartItem.name}"`);
        continue;
      }

      // Calculate total ingredient requirements for this cart item
      for (const ingredient of menuItem.ingredients) {
        const totalRequired = ingredient.quantity * cartItem.qty;
        const key = ingredient.ingredientId;

        if (ingredientDeductions.has(key)) {
          const existing = ingredientDeductions.get(key);
          ingredientDeductions.set(key, {
            ...existing,
            totalQuantity: existing.totalQuantity + totalRequired
          });
        } else {
          ingredientDeductions.set(key, {
            ingredientId: ingredient.ingredientId,
            ingredientName: ingredient.ingredientName,
            totalQuantity: totalRequired,
            unit: ingredient.unit
          });
        }
      }
    }

    // If no ingredients to deduct, return with warning
    if (ingredientDeductions.size === 0) {
      return {
        success: true,
        warnings: ['No ingredients configured for any items in cart'],
        deductedItems: []
      };
    }

    console.log('📊 Total ingredients to deduct:', Array.from(ingredientDeductions.values()));

    // Step 2: Check stock availability before deducting
    for (const [ingredientId, deduction] of ingredientDeductions) {
      const ingredientRef = doc(db, 'ingredients', ingredientId);
      const ingredientSnap = await getDoc(ingredientRef);

      if (!ingredientSnap.exists()) {
        results.errors.push(`Ingredient not found: ${deduction.ingredientName}`);
        results.success = false;
        continue;
      }

      const ingredientData = ingredientSnap.data();
      // Support both field names
      const currentStock = ingredientData.currentStock ?? ingredientData.stock ?? 0;

      console.log(`📦 ${deduction.ingredientName}: Stock=${currentStock}, Required=${deduction.totalQuantity}`);

      if (currentStock < deduction.totalQuantity) {
        results.insufficientStock.push({
          name: deduction.ingredientName,
          required: deduction.totalQuantity,
          available: currentStock,
          unit: deduction.unit
        });
        results.success = false;
      }
    }

    // If insufficient stock, return error
    if (results.insufficientStock.length > 0) {
      console.error('❌ Insufficient stock:', results.insufficientStock);
      const errorMsg = results.insufficientStock
        .map(i => `${i.name}: need ${i.required}${i.unit}, have ${i.available}${i.unit}`)
        .join('; ');
      throw new Error(`Insufficient stock - ${errorMsg}`);
    }

    // Step 3: Use batch write to deduct all ingredients atomically
    const batch = writeBatch(db);

    for (const [ingredientId, deduction] of ingredientDeductions) {
      const ingredientRef = doc(db, 'ingredients', ingredientId);
      
      // Get current data to determine which field to update
      const ingredientSnap = await getDoc(ingredientRef);
      const ingredientData = ingredientSnap.data();
      
      const updateData = {
        lastUpdated: new Date()
      };

      // Update the field that exists
      if (ingredientData.hasOwnProperty('currentStock')) {
        updateData.currentStock = increment(-deduction.totalQuantity);
      }
      if (ingredientData.hasOwnProperty('stock')) {
        updateData.stock = increment(-deduction.totalQuantity);
      }

      batch.update(ingredientRef, updateData);

      results.deductedItems.push({
        ingredientId,
        name: deduction.ingredientName,
        deducted: deduction.totalQuantity,
        unit: deduction.unit
      });
    }

    // Commit the batch
    await batch.commit();
    console.log('✅ Stock deducted successfully');

    // Step 4: Log the stock deduction in history
    try {
      await addDoc(collection(db, 'stockHistory'), {
        type: 'deduction',
        source: 'order',
        items: results.deductedItems,
        cartItems: cart.map(item => ({
          name: item.name,
          quantity: item.qty,
          price: item.price
        })),
        timestamp: serverTimestamp(),
        warnings: results.warnings
      });
    } catch (historyError) {
      console.warn('⚠️ Could not log stock history:', historyError);
      // Don't fail the whole operation if logging fails
    }

    return results;

  } catch (error) {
    console.error('❌ Error in deductStockForOrder:', error);
    throw error; // Re-throw to be caught in PaymentSuccess
  }
}

/**
 * Check if cart items can be fulfilled with current stock
 * @param {Array} cart - Cart items
 * @returns {Promise<Object>} - Availability status
 */
export async function checkStockAvailability(cart) {
  try {
    const ingredientRequirements = new Map();

    // Collect all ingredient requirements
    for (const cartItem of cart) {
      const menuItemsRef = collection(db, 'menuItems');
      const q = query(menuItemsRef, where('name', '==', cartItem.name));
      const menuItemSnap = await getDocs(q);

      if (menuItemSnap.empty) continue;

      const menuItem = menuItemSnap.docs[0].data();
      if (!menuItem.ingredients) continue;

      for (const ingredient of menuItem.ingredients) {
        const totalRequired = ingredient.quantity * cartItem.qty;
        const key = ingredient.ingredientId;

        if (ingredientRequirements.has(key)) {
          const existing = ingredientRequirements.get(key);
          ingredientRequirements.set(key, {
            ...existing,
            totalQuantity: existing.totalQuantity + totalRequired
          });
        } else {
          ingredientRequirements.set(key, {
            ingredientId: ingredient.ingredientId,
            ingredientName: ingredient.ingredientName,
            totalQuantity: totalRequired,
            unit: ingredient.unit
          });
        }
      }
    }

    // Check current stock levels
    const unavailableItems = [];

    for (const [ingredientId, requirement] of ingredientRequirements) {
      const ingredientRef = doc(db, 'ingredients', ingredientId);
      const ingredientSnap = await getDoc(ingredientRef);

      if (!ingredientSnap.exists()) {
        unavailableItems.push({
          name: requirement.ingredientName,
          reason: 'Ingredient not found in database'
        });
        continue;
      }

      const ingredientData = ingredientSnap.data();
      const currentStock = ingredientData.currentStock ?? ingredientData.stock ?? 0;

      if (currentStock < requirement.totalQuantity) {
        unavailableItems.push({
          name: requirement.ingredientName,
          required: requirement.totalQuantity,
          available: currentStock,
          unit: requirement.unit
        });
      }
    }

    return {
      canFulfill: unavailableItems.length === 0,
      unavailableItems
    };

  } catch (error) {
    console.error('Error checking stock availability:', error);
    return {
      canFulfill: false,
      error: error.message
    };
  }
}

/**
 * Get low stock ingredients
 * @returns {Promise<Array>} - List of low stock items
 */
export async function getLowStockIngredients() {
  try {
    const ingredientsRef = collection(db, 'ingredients');
    const snapshot = await getDocs(ingredientsRef);
    
    const lowStockItems = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const currentStock = data.currentStock ?? data.stock ?? 0;
      const minThreshold = data.minThreshold ?? 20;
      
      if (currentStock < minThreshold) {
        lowStockItems.push({
          id: doc.id,
          name: data.name,
          currentStock,
          minThreshold,
          unit: data.unit,
          status: currentStock === 0 ? 'out-of-stock' : 'low-stock'
        });
      }
    });
    
    return lowStockItems;
    
  } catch (error) {
    console.error('Error getting low stock ingredients:', error);
    return [];
  }
}