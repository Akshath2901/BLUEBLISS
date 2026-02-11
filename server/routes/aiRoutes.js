// server/routes/smartAiRoutes.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import userContextManager from '../userContextManager.js';
import { predefinedCombos, trendingDishes } from '../data/comboData.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all menu data
let allDishes = [];

const loadAllMenus = () => {
  try {
    const loadMenuJSON = (filename) => {
      const filePath = path.join(__dirname, `../ai/menus/${filename}`);
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    };

    const peppanizze = loadMenuJSON('Peppanizze.json');
    const shimmers = loadMenuJSON('Shrimmers.json');
    const urbanwrap = loadMenuJSON('Urbanwrap.json');

    // Flatten and add restaurant info
    allDishes = [];

    peppanizze.forEach(cat => {
      cat.items?.forEach(item => {
        allDishes.push({
          ...item,
          category: cat.category,
          restaurant: 'Peppanizze'
        });
      });
    });

    shimmers.forEach(cat => {
      cat.items?.forEach(item => {
        allDishes.push({
          ...item,
          category: cat.category,
          restaurant: 'Shimmers'
        });
      });
    });

    urbanwrap.forEach(cat => {
      cat.items?.forEach(item => {
        allDishes.push({
          ...item,
          category: cat.category,
          restaurant: 'Urbanwrap'
        });
      });
    });

    console.log(`✅ Smart AI loaded ${allDishes.length} dishes from all restaurants`);
  } catch (error) {
    console.error('Error loading menus:', error);
  }
};

// Initialize menus on startup
loadAllMenus();

// Parse user query for filters
const parseUserQuery = (query) => {
  const lower = query.toLowerCase();
  
  return {
    query: lower,
    maxPrice: extractPrice(lower),
    minPrice: extractMinPrice(lower),
    category: extractCategory(lower),
    restaurant: extractRestaurant(lower),
    spicy: lower.includes('spicy') || lower.includes('peri peri') || lower.includes('tandoori'),
    cheese: lower.includes('cheese') || lower.includes('cheesy'),
    paneer: lower.includes('paneer'),
    chicken: lower.includes('chicken'),
    nonVeg: lower.includes('chicken') || lower.includes('mutton') || lower.includes('lamb') || lower.includes('egg'),
    veg: lower.includes('veg') || lower.includes('vegetarian'),
    trending: lower.includes('trending') || lower.includes('popular'),
    combo: lower.includes('combo')
  };
};

const extractPrice = (query) => {
  const match = query.match(/under\s+(\d+)|below\s+(\d+)|less\s+than\s+(\d+)|₹?\s*(\d+)/);
  if (match) {
    return parseInt(match[1] || match[2] || match[3] || match[4]);
  }
  return null;
};

const extractMinPrice = (query) => {
  const match = query.match(/above\s+(\d+)|over\s+(\d+)|more\s+than\s+(\d+)|atleast\s+(\d+)/);
  if (match) {
    return parseInt(match[1] || match[2] || match[3] || match[4]);
  }
  return null;
};

const extractCategory = (query) => {
  const categories = ['pizza', 'burger', 'wrap', 'fries', 'shake', 'mojito', 'sandwich', 'pasta', 'wings', 'bread'];
  return categories.find(cat => query.includes(cat));
};

const extractRestaurant = (query) => {
  if (query.includes('peppanizze')) return 'Peppanizze';
  if (query.includes('shimmers')) return 'Shimmers';
  if (query.includes('urbanwrap')) return 'Urbanwrap';
  return null;
};

// Filter dishes based on criteria
const filterDishes = (filters) => {
  let results = allDishes;

  // Price filtering
  if (filters.maxPrice) {
    results = results.filter(d => d.price <= filters.maxPrice);
  }
  if (filters.minPrice) {
    results = results.filter(d => d.price >= filters.minPrice);
  }

  // Category filtering
  if (filters.category) {
    results = results.filter(d => 
      d.category?.toLowerCase().includes(filters.category)
    );
  }

  // Restaurant filtering
  if (filters.restaurant) {
    results = results.filter(d => d.restaurant === filters.restaurant);
  }

  // Ingredient preferences
  if (filters.spicy) {
    results = results.filter(d => 
      d.name?.toUpperCase().includes('PERI PERI') ||
      d.name?.toUpperCase().includes('TANDOORI') ||
      d.name?.toUpperCase().includes('SPICY')
    );
  }

  if (filters.cheese) {
    results = results.filter(d => 
      d.name?.toUpperCase().includes('CHEESE') ||
      d.name?.toUpperCase().includes('CHEEZY')
    );
  }

  if (filters.paneer) {
    results = results.filter(d => d.name?.toUpperCase().includes('PANEER'));
  }

  if (filters.chicken && !filters.nonVeg) {
    results = results.filter(d => d.name?.toUpperCase().includes('CHICKEN'));
  }

  if (filters.nonVeg && !filters.chicken) {
    results = results.filter(d => 
      d.name?.toUpperCase().includes('CHICKEN') ||
      d.name?.toUpperCase().includes('MUTTON') ||
      d.name?.toUpperCase().includes('LAMB') ||
      d.name?.toUpperCase().includes('EGG')
    );
  }

  // Sort by rating (descending)
  results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return results;
};

// Main smart chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get user context for personalization
    const userCtx = userContextManager.getUserContext(userId);
    
    // Track search query
    userContextManager.trackSearchQuery(userId, message);

    // Parse the query
    const filters = parseUserQuery(message);

    // Get matching dishes
    const matchedDishes = filterDishes(filters);

    let aiResponse = '';

    // Handle different query types
    if (filters.combo) {
      // Recommend combos
      const relevantCombos = predefinedCombos.slice(0, 3);
      aiResponse = `🎉 Here are our popular combos:\n\n`;
      relevantCombos.forEach((combo, i) => {
        aiResponse += `${i + 1}. **${combo.name}** - ₹${combo.comboPrice} (Save ₹${combo.savings})\n   ${combo.description_long}\n\n`;
      });
      aiResponse += `Which combo interests you?`;
    } 
    else if (filters.trending) {
      // Show trending items
      aiResponse = `🔥 Trending now:\n\n`;
      trendingDishes.slice(0, 5).forEach((dish, i) => {
        aiResponse += `${i + 1}. **${dish.name}** from ${dish.restaurant}\n   ${dish.reason}\n\n`;
      });
    }
    else if (matchedDishes.length > 0) {
      // Show filtered results
      const topResults = matchedDishes.slice(0, 5);
      const priceInfo = filters.maxPrice ? ` under ₹${filters.maxPrice}` : '';
      const catInfo = filters.category ? ` ${filters.category}s` : '';

      aiResponse = `✨ Found ${matchedDishes.length} items${catInfo}${priceInfo}! Here are the top picks:\n\n`;
      
      topResults.forEach((dish, i) => {
        const rating = dish.rating ? `⭐ ${dish.rating}` : '';
        aiResponse += `${i + 1}. **${dish.name}** - ₹${dish.price} ${rating}\n   ${dish.desc || ''} | From ${dish.restaurant}\n\n`;
      });

      if (matchedDishes.length > 5) {
        aiResponse += `\n💡 Showing top 5 of ${matchedDishes.length} items. Want to see more or refine your search?`;
      }
    }
    else {
      // No exact match - provide helpful guidance
      aiResponse = `🤔 Hmm, I couldn't find exactly that. Let me help!\n\n`;
      aiResponse += `Try asking for:\n`;
      aiResponse += `• Items by price: "Show me burgers under 299"\n`;
      aiResponse += `• By type: "Pizza with paneer", "Spicy wraps"\n`;
      aiResponse += `• By restaurant: "Peppanizze pizzas"\n`;
      aiResponse += `• Trending: "What's trending today?"\n`;
      aiResponse += `• Combos: "Show me combo deals"\n\n`;
      aiResponse += `Or browse our restaurants: Peppanizze 🍕 | Shimmers 🍔 | Urbanwrap 🌯`;
    }

    // Add personalization if returning user
    if (userCtx.isReturningUser && matchedDishes.length > 0) {
      aiResponse += `\n\n💡 **Personalized tip**: Based on your previous orders, you might also like dishes with ${userCtx.favoriteCategories[0] || 'paneer'}!`;
    }

    res.json({
      success: true,
      aiResponse,
      matchedCount: matchedDishes.length,
      suggestions: matchedDishes.slice(0, 5)
    });

  } catch (error) {
    console.error('❌ Smart AI error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update cart with tracking
router.post('/update-cart', (req, res) => {
  try {
    const { userId, cartItems } = req.body;
    
    userContextManager.updateCart(userId, cartItems);

    // Track dish clicks
    cartItems?.forEach(item => {
      userContextManager.trackDishClick(userId, item.name, item.restaurant);
    });

    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track page visits
router.post('/track-page', (req, res) => {
  try {
    const { userId, pageName } = req.body;
    userContextManager.trackPageVisit(userId, pageName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get menu endpoint
router.get('/menu', (req, res) => {
  try {
    res.json({
      success: true,
      dishes: allDishes,
      count: allDishes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search endpoint for advanced queries
router.post('/search', (req, res) => {
  try {
    const { query, maxPrice, minPrice, category, restaurant } = req.body;

    let results = allDishes;

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(d => 
        d.name?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.desc?.toLowerCase().includes(q)
      );
    }

    if (maxPrice) {
      results = results.filter(d => d.price <= maxPrice);
    }

    if (minPrice) {
      results = results.filter(d => d.price >= minPrice);
    }

    if (category) {
      results = results.filter(d => d.category?.toLowerCase().includes(category.toLowerCase()));
    }

    if (restaurant) {
      results = results.filter(d => d.restaurant === restaurant);
    }

    // Sort by rating
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    res.json({
      success: true,
      results,
      count: results.length
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real-time suggestion endpoint (for global suggestions)
router.post('/real-time-suggestion', (req, res) => {
  try {
    const { userId } = req.body;
    const userCtx = userContextManager.getUserContext(userId);

    if (!userCtx.currentCart || userCtx.currentCart.length === 0) {
      return res.json({ success: true, suggestion: null });
    }

    // Generate combo suggestion based on cart
    const cartTotal = userCtx.currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const itemNames = userCtx.currentCart.map(item => item.name).join(', ');

    let suggestion = '';
    if (userCtx.currentCart.length >= 2) {
      const savings = Math.floor(cartTotal * 0.15);
      suggestion = `💡 You're buying multiple items! You could save ₹${savings} with our combo deals!`;
    }

    res.json({
      success: true,
      suggestion: suggestion || null
    });

  } catch (error) {
    console.error('Suggestion error:', error);
    res.json({ success: false, error: error.message });
  }
});

export default router;