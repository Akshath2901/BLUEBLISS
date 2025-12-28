import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/aiRoutes.js";
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
app.use("/api/ai", aiRoutes);
app.use("/api/combo", comboRoutes);
app.use("/api/menus", menuRoutes);

// ===================== Health Check =====================
app.get("/health", (req, res) => {
  res.json({
    status: "✅ Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ===================== 404 Handler =====================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
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
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🍕 Combo API: http://localhost:${PORT}/api/combo/combos`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai/chat`);
});