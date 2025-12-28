import express from "express";
import { getPersonalizedAIResponse, generateRealTimeSuggestion } from "../llm.js";
import userContextManager from "../userContextManager.js";

const router = express.Router();

// ===================== TRACK PAGE VISITS =====================
router.post("/track-page", (req, res) => {
  try {
    const { userId, pageName, metadata } = req.body;

    if (!userId || !pageName) {
      return res.status(400).json({
        error: "userId and pageName are required"
      });
    }

    userContextManager.trackPageVisit(userId, pageName, metadata);

    res.json({
      success: true,
      message: `Tracked visit to ${pageName}`
    });
  } catch (error) {
    console.error("Track page error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== TRACK RESTAURANT VIEWS =====================
router.post("/track-restaurant", (req, res) => {
  try {
    const { userId, restaurantName } = req.body;

    if (!userId || !restaurantName) {
      return res.status(400).json({
        error: "userId and restaurantName are required"
      });
    }

    userContextManager.trackRestaurantView(userId, restaurantName);

    res.json({
      success: true,
      message: `Tracked restaurant view: ${restaurantName}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== TRACK DISH CLICKS =====================
router.post("/track-dish", (req, res) => {
  try {
    const { userId, dishName, restaurantName } = req.body;

    if (!userId || !dishName || !restaurantName) {
      return res.status(400).json({
        error: "userId, dishName, and restaurantName are required"
      });
    }

    userContextManager.trackDishClick(userId, dishName, restaurantName);

    res.json({
      success: true,
      message: `Tracked dish click: ${dishName}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== TRACK SEARCH QUERIES =====================
router.post("/track-search", (req, res) => {
  try {
    const { userId, query } = req.body;

    if (!userId || !query) {
      return res.status(400).json({
        error: "userId and query are required"
      });
    }

    userContextManager.trackSearchQuery(userId, query);

    res.json({
      success: true,
      message: `Tracked search: ${query}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== UPDATE CART =====================
router.post("/update-cart", (req, res) => {
  try {
    const { userId, cartItems } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    userContextManager.updateCart(userId, cartItems || []);

    res.json({
      success: true,
      message: "Cart updated"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== PERSONALIZED CHAT =====================
router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "userId and message are required"
      });
    }

    // Get user's personalization context
    const userContext = userContextManager.getUserContext(userId);

    // Get AI response with context
    const aiResponse = await getPersonalizedAIResponse(message, {
      recentPages: userContext.recentPages,
      viewedRestaurants: userContext.viewedRestaurants,
      cartItems: userContext.cartItems,
      previousOrders: `${userContext.totalOrders} past orders`,
    });

    res.json({
      success: true,
      userMessage: message,
      aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================== REAL-TIME PAGE SUGGESTIONS =====================
router.post("/real-time-suggestion", async (req, res) => {
  try {
    const { userId, currentPage } = req.body;

    if (!userId || !currentPage) {
      return res.status(400).json({
        error: "userId and currentPage are required"
      });
    }

    const userContext = userContextManager.getUserContext(userId);

    const suggestion = await generateRealTimeSuggestion({
      currentPage,
      cartItems: userContext.currentCart.map(item => item.name),
      recentPages: userContext.recentPages,
      viewedRestaurants: userContext.viewedRestaurants,
    });

    res.json({
      success: true,
      suggestion,
      page: currentPage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Suggestion error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================== GET USER CONTEXT =====================
router.get("/user-context/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const context = userContextManager.getUserContext(userId);

    res.json({
      success: true,
      context
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== TRENDING INSIGHTS =====================
router.get("/trending-insights", (req, res) => {
  try {
    const insights = userContextManager.getTrendingInsights();

    res.json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== ADD ORDER TO HISTORY =====================
router.post("/add-order", (req, res) => {
  try {
    const { userId, orderDetails } = req.body;

    if (!userId || !orderDetails) {
      return res.status(400).json({
        error: "userId and orderDetails are required"
      });
    }

    userContextManager.addOrderToHistory(userId, orderDetails);

    res.json({
      success: true,
      message: "Order added to history"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== HEALTH CHECK =====================
router.get("/health", (req, res) => {
  res.json({
    status: "✅ AI Service Healthy",
    llm: "Ollama",
    timestamp: new Date().toISOString()
  });
});

export default router;