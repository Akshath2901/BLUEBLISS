import { formatMenusForAI } from "./menuLoader.js";

const menuContext = formatMenusForAI();
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "mistral:7b";

export async function getAIResponse(userMessage, userContext = {}) {
  try {
    const systemPrompt = `You are a helpful AI assistant for BlueBLISS, a cloud kitchen delivery service with exactly 3 restaurants.

${menuContext}

USER CONTEXT:
${userContext.recentPages ? `- Recently browsing: ${userContext.recentPages.join(", ")}` : ""}
${userContext.viewedRestaurants ? `- Favorite restaurants: ${userContext.viewedRestaurants.join(", ")}` : ""}
${userContext.cartItems ? `- Cart items: ${userContext.cartItems}` : ""}
${userContext.previousOrders ? `- Past orders: ${userContext.previousOrders}` : ""}

IMPORTANT RULES:
1. ONLY recommend dishes that are listed in the menus above
2. ALWAYS use the exact names, prices, and descriptions from the menus
3. Do NOT create, invent, or make up any dishes
4. Do NOT mention any restaurant names other than: Peppanizze, Shimmers, Urbanwrap
5. When recommending, always specify which restaurant the dish is from
6. Include the exact price in rupees (₹) for each recommendation
7. If asked about something not on the menu, politely say it's not available
8. Be friendly, concise, and helpful (max 2 sentences)
9. HYPING: Actively promote trending offers, combos, and limited-time deals
10. PERSONALIZATION: Use user's browsing history to make tailored suggestions`;

    console.log("🤖 [Ollama] Processing message...");

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${systemPrompt}\n\nCustomer: ${userMessage}\n\nAssistant:`,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("❌ Ollama Error:", response.status, response.statusText);
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ [Ollama] Response received");
    
    return data.response.trim();
  } catch (error) {
    console.error("❌ Ollama Error:", error.message);
    console.error("⚠️ Make sure Ollama is running: ollama serve");
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

// Enhanced function with full user context
export async function getPersonalizedAIResponse(userMessage, userContextData) {
  return getAIResponse(userMessage, userContextData);
}

// Function to generate real-time suggestions based on current page
export async function generateRealTimeSuggestion(pageContext) {
  const { currentPage, cartItems, recentPages, viewedRestaurants } = pageContext;

  let suggestionPrompt = "";

  if (currentPage === "home") {
    suggestionPrompt = `Create a SHORT (1 sentence max) exciting message to encourage exploring BlueBLISS menu. Be enthusiastic!`;
  } else if (currentPage === "menu") {
    const restaurantName = viewedRestaurants?.[0] || "our menus";
    suggestionPrompt = `Customer is browsing ${restaurantName}. Create ONE sentence highlighting the BEST dish. Make it sound delicious!`;
  } else if (currentPage === "cart") {
    if (cartItems && cartItems.length > 0) {
      suggestionPrompt = `Customer has ${cartItems.length} items in cart. Create ONE sentence combo suggestion that saves them money!`;
    } else {
      suggestionPrompt = `Cart is empty. Create ONE sentence to inspire them to add items. Be appetizing!`;
    }
  } else if (currentPage === "search") {
    suggestionPrompt = `Customer is searching. Create ONE sentence suggesting our trending combos!`;
  } else {
    suggestionPrompt = `Create ONE sentence personalized suggestion for a BlueBLISS customer!`;
  }

  return getAIResponse(suggestionPrompt, {
    recentPages,
    viewedRestaurants,
    cartItems: cartItems?.join(", "),
  });
}