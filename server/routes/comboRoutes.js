// Server-side: server/routes/comboRoutes.js
import express from "express";
import { getAIResponse } from "../llm.js";
import { predefinedCombos, trendingDishes, comboSuggestionRules } from "../data/comboData.js";

const router = express.Router();

// Get all predefined combos
router.get("/combos", (req, res) => {
  try {
    res.json({
      success: true,
      combos: predefinedCombos,
      count: predefinedCombos.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get combo by ID
router.get("/combos/:id", (req, res) => {
  try {
    const combo = predefinedCombos.find(c => c.id === req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, error: "Combo not found" });
    }
    res.json({ success: true, combo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trending dishes for suggestions
router.get("/trending", (req, res) => {
  try {
    res.json({
      success: true,
      trending: trendingDishes,
      count: trendingDishes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze cart and get AI-powered suggestions
router.post("/analyze-cart", async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({
        error: "Invalid request. 'cartItems' array is required."
      });
    }

    // Calculate total price and item count
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const itemCount = cartItems.length;

    // Build cart context for AI
    const itemNames = cartItems.map(item => item.name).join(", ");
    const categories = [...new Set(cartItems.map(item => item.category || "Unknown"))];

    // Check for combo suggestions based on rules
    let suggestedCombo = null;
    let suggestionReason = "";

    // Check multiple items trigger
    if (itemCount >= 2) {
      const matchedCombos = predefinedCombos.filter(combo => {
        const comboItemNames = combo.items.map(i => i.name.toLowerCase());
        const matchCount = cartItems.filter(ci => 
          comboItemNames.some(cn => ci.name.toLowerCase() === cn)
        ).length;
        return matchCount >= 2;
      });

      if (matchedCombos.length > 0) {
        suggestedCombo = matchedCombos[0];
        const savings = suggestedCombo.originalPrice - suggestedCombo.comboPrice;
        suggestionReason = `You could save ₹${savings} by choosing our "${suggestedCombo.name}" combo!`;
      }
    }

    // Check for trending items
    const trendingMatch = cartItems.find(item => 
      trendingDishes.some(td => td.name.toLowerCase() === item.name.toLowerCase())
    );

    // Create AI prompt for smart suggestions
    const aiPrompt = `
You are a friendly food recommendation AI for BlueBLISS, a cloud kitchen. 
A customer has added these items to their cart: ${itemNames}
Categories: ${categories.join(", ")}
Total items: ${itemCount}
Current cart value: ₹${totalPrice}

Based on their selections, provide ONE personalized suggestion that would enhance their order. 
Your suggestion should:
1. Be specific and mention the dish name
2. Explain WHY it would pair well with their current selection
3. Be conversational and friendly
4. Include any relevant trending info if available
5. Be 1-2 sentences max

Examples of good suggestions:
- "The Peri Peri Fries would be a perfect spicy complement to your pizza!"
- "Going with multiple items? Our Pizza Lover's Delight combo saves you ₹78!"
- "Yesterday's craze for the Crispy Chicken Burger was amazing - you should try it!"

Provide only the suggestion, no additional text.
`;

    const aiSuggestion = await getAIResponse(aiPrompt);

    res.json({
      success: true,
      cartAnalysis: {
        itemCount,
        totalPrice,
        categories
      },
      suggestedCombo: suggestedCombo || null,
      aiSuggestion,
      savingsPotential: suggestedCombo ? suggestedCombo.originalPrice - suggestedCombo.comboPrice : null
    });

  } catch (error) {
    console.error("Cart Analysis Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI-powered combo recommendation
router.post("/recommend-combo", async (req, res) => {
  try {
    const { preferences, budget } = req.body;

    if (!preferences || typeof preferences !== "string") {
      return res.status(400).json({
        error: "Invalid request. 'preferences' string is required."
      });
    }

    const budgetNum = budget || 500;

    const aiPrompt = `
You are a food recommendation AI for BlueBLISS cloud kitchen.
User preferences: ${preferences}
Budget: ₹${budgetNum}

Available combos:
${predefinedCombos.map(c => `- ${c.name} (₹${c.comboPrice}): ${c.description_long}`).join("\n")}

Recommend the BEST combo for this user based on their preferences and budget.
Include:
1. Combo name
2. Why it's perfect for them
3. The price and savings
Keep response concise (3-4 sentences).
`;

    const recommendation = await getAIResponse(aiPrompt);

    res.json({
      success: true,
      recommendation,
      availableCombos: predefinedCombos.filter(c => c.comboPrice <= budgetNum)
    });

  } catch (error) {
    console.error("Recommendation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat endpoint (for regular chat, keeps original functionality)
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Invalid request. 'message' field is required."
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        error: "Message cannot be empty."
      });
    }

    const aiResponse = await getAIResponse(message.trim());

    res.json({
      success: true,
      userMessage: message,
      aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chat Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

export default router;