// server/userContextManager.js
// Tracks user behavior across pages for personalization

class UserContextManager {
  constructor() {
    // Store user sessions in memory (use database in production)
    this.userSessions = new Map();
  }

  // Initialize or get user session
  getOrCreateSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        userId,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        pageVisits: [],
        viewedRestaurants: new Set(),
        cartHistory: [],
        searchQueries: [],
        clickedDishes: new Set(),
        favoriteCategories: new Set(),
        orderHistory: [],
        currentCart: [],
      });
    }
    
    const session = this.userSessions.get(userId);
    session.lastActivityAt = new Date();
    return session;
  }

  // Track page visit
  trackPageVisit(userId, pageName, metadata = {}) {
    const session = this.getOrCreateSession(userId);
    
    session.pageVisits.push({
      page: pageName,
      timestamp: new Date(),
      metadata,
    });

    // Keep only last 20 page visits
    if (session.pageVisits.length > 20) {
      session.pageVisits.shift();
    }

    return session;
  }

  // Track restaurant view
  trackRestaurantView(userId, restaurantName) {
    const session = this.getOrCreateSession(userId);
    session.viewedRestaurants.add(restaurantName);
    return session;
  }

  // Track dish click
  trackDishClick(userId, dishName, restaurantName) {
    const session = this.getOrCreateSession(userId);
    session.clickedDishes.add(`${dishName}-${restaurantName}`);
    return session;
  }

  // Track search query
  trackSearchQuery(userId, query) {
    const session = this.getOrCreateSession(userId);
    session.searchQueries.push({
      query,
      timestamp: new Date(),
    });

    if (session.searchQueries.length > 50) {
      session.searchQueries.shift();
    }

    return session;
  }

  // Update cart
  updateCart(userId, cartItems) {
    const session = this.getOrCreateSession(userId);
    session.currentCart = cartItems;
    session.cartHistory.push({
      timestamp: new Date(),
      items: cartItems,
    });

    if (session.cartHistory.length > 100) {
      session.cartHistory.shift();
    }

    return session;
  }

  // Add order to history
  addOrderToHistory(userId, orderDetails) {
    const session = this.getOrCreateSession(userId);
    session.orderHistory.push({
      ...orderDetails,
      timestamp: new Date(),
    });
    return session;
  }

  // Get user context for AI
  getUserContext(userId) {
    const session = this.getOrCreateSession(userId);

    // Get recent pages (last 5)
    const recentPages = session.pageVisits
      .slice(-5)
      .map(v => v.page);

    // Get favorite restaurants
    const favoriteRestaurants = Array.from(session.viewedRestaurants)
      .slice(-3);

    // Get favorite categories from recent views
    const recentCategories = Array.from(session.favoriteCategories)
      .slice(-3);

    // Get recent search patterns
    const recentSearches = session.searchQueries
      .slice(-5)
      .map(s => s.query);

    // Get current cart items as string
    const cartItems = session.currentCart
      .map(item => `${item.name} x${item.qty}`)
      .join(", ");

    // Get past order summary
    const orderSummary = session.orderHistory
      .slice(-3)
      .map(o => o.items?.length || 0)
      .reduce((a, b) => a + b, 0);

    return {
      userId,
      recentPages,
      viewedRestaurants: favoriteRestaurants,
      cartItems,
      currentCart: session.currentCart,
      favoriteCategories: recentCategories,
      recentSearches,
      totalOrders: session.orderHistory.length,
      pastOrderValue: orderSummary,
      isReturningUser: session.orderHistory.length > 0,
      sessionDuration: (new Date() - session.createdAt) / 1000 / 60, // minutes
    };
  }

  // Get trending info across all users
  getTrendingInsights() {
    const allRestaurants = {};
    const allDishes = {};
    const allCategories = {};

    for (const session of this.userSessions.values()) {
      // Count restaurant views
      for (const restaurant of session.viewedRestaurants) {
        allRestaurants[restaurant] = (allRestaurants[restaurant] || 0) + 1;
      }

      // Count dish clicks
      for (const dish of session.clickedDishes) {
        allDishes[dish] = (allDishes[dish] || 0) + 1;
      }

      // Count categories
      for (const category of session.favoriteCategories) {
        allCategories[category] = (allCategories[category] || 0) + 1;
      }
    }

    return {
      trendingRestaurants: Object.entries(allRestaurants)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name),
      trendingDishes: Object.entries(allDishes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name),
      trendingCategories: Object.entries(allCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name),
    };
  }

  // Clear old sessions (run periodically)
  clearOldSessions(maxAgeMinutes = 1440) {
    const now = new Date();
    for (const [userId, session] of this.userSessions.entries()) {
      const ageMinutes = (now - session.lastActivityAt) / 1000 / 60;
      if (ageMinutes > maxAgeMinutes) {
        this.userSessions.delete(userId);
      }
    }
  }

  // Debug: Get session info
  getSessionInfo(userId) {
    return this.userSessions.get(userId);
  }
}

export default new UserContextManager();