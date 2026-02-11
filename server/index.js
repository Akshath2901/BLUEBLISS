import dotenv from "dotenv";
dotenv.config();

console.log('🔍 DEBUG: HUGGING_FACE_API_KEY =', process.env.HUGGING_FACE_API_KEY);
console.log('🔍 DEBUG: HF_API_TOKEN =', process.env.HF_API_TOKEN);
console.log('🔍 DEBUG: PORT =', process.env.PORT);

import express from "express";
import cors from "cors";
import smartAiRoutes from "./routes/aiRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";

const app = express();

// ===================== CORS Configuration =====================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ===================== Middleware =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== Routes =====================
// Smart AI routes (menu-aware, user personalization)
app.use("/api/ai", smartAiRoutes);

// Combo routes (predefined combo suggestions)
app.use("/api/combo", comboRoutes);

// Menu routes (fetch menu items)
app.use("/api/menus", menuRoutes);

// ===================== Health Check =====================
app.get("/health", (req, res) => {
  res.json({
    status: "✅ Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    ai: "🤖 Smart AI enabled"
  });
});

// ===================== Welcome Route =====================
app.get("/", (req, res) => {
  res.json({
    message: "🍕 Welcome to BlueBLISS API",
    version: "2.0",
    endpoints: {
      ai: "/api/ai/chat - Smart AI chat with menu awareness",
      search: "/api/ai/search - Advanced search with filters",
      combos: "/api/combo/combos - Get all combo deals",
      menu: "/api/menus - Get all menu items",
      health: "/health - Health check"
    }
  });
});

// ===================== 404 Handler =====================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
    availableEndpoints: {
      POST: ["/api/ai/chat", "/api/ai/search", "/api/ai/update-cart", "/api/ai/track-page"],
      GET: ["/health", "/api/menus", "/api/menus/all-dishes", "/api/combo/combos"]
    }
  });
});

// ===================== Error Handler =====================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  console.error("Stack:", err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    status: err.status || 500,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// ===================== Server Start =====================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   ✅ BlueBLISS Server Started          ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Chat: http://localhost:${PORT}/api/ai/chat`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/ai/search`);
  console.log(`🍕 Combos: http://localhost:${PORT}/api/combo/combos`);
  console.log(`📋 Menus: http://localhost:${PORT}/api/menus\n`);
});