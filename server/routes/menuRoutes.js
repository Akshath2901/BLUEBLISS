import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON files
const loadMenuJSON = (filename) => {
  try {
    const filePath = path.join(__dirname, `../ai/menus/${filename}`);
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return [];
  }
};

// Get all menus combined
router.get("/", (req, res) => {
  try {
    const peppanizze = loadMenuJSON("Peppanizze.json");
    const shimmers = loadMenuJSON("Shimmers.json");
    const urbanwrap = loadMenuJSON("Urbanwrap.json");

    const allMenus = [
      ...peppanizze.map(item => ({ ...item, restaurant: "Peppanizze" })),
      ...shimmers.map(item => ({ ...item, restaurant: "Shimmers" })),
      ...urbanwrap.map(item => ({ ...item, restaurant: "Urbanwrap" }))
    ];

    res.json(allMenus);
  } catch (error) {
    console.error("Error loading menus:", error);
    res.status(500).json({ error: "Failed to load menus" });
  }
});

// Get Peppanizze menu
router.get("/peppanizze", (req, res) => {
  try {
    const menu = loadMenuJSON("Peppanizze.json");
    res.json(menu.map(item => ({ ...item, restaurant: "Peppanizze" })));
  } catch (error) {
    res.status(500).json({ error: "Failed to load Peppanizze menu" });
  }
});

// Get Shimmers menu
router.get("/shimmers", (req, res) => {
  try {
    const menu = loadMenuJSON("Shimmers.json");
    res.json(menu.map(item => ({ ...item, restaurant: "Shimmers" })));
  } catch (error) {
    res.status(500).json({ error: "Failed to load Shimmers menu" });
  }
});

// Get Urbanwrap menu
router.get("/urbanwrap", (req, res) => {
  try {
    const menu = loadMenuJSON("Urbanwrap.json");
    res.json(menu.map(item => ({ ...item, restaurant: "Urbanwrap" })));
  } catch (error) {
    res.status(500).json({ error: "Failed to load Urbanwrap menu" });
  }
});

// Get flattened list of all dishes
router.get("/all-dishes", (req, res) => {
  try {
    const peppanizze = loadMenuJSON("Peppanizze.json");
    const shimmers = loadMenuJSON("Shimmers.json");
    const urbanwrap = loadMenuJSON("Urbanwrap.json");

    const allDishes = [];

    // Flatten Peppanizze
    peppanizze.forEach(category => {
      category.items.forEach(item => {
        allDishes.push({
          ...item,
          category: category.category,
          restaurant: "Peppanizze"
        });
      });
    });

    // Flatten Shimmers
    shimmers.forEach(category => {
      category.items.forEach(item => {
        allDishes.push({
          ...item,
          category: category.category,
          restaurant: "Shimmers"
        });
      });
    });

    // Flatten Urbanwrap
    urbanwrap.forEach(category => {
      category.items.forEach(item => {
        allDishes.push({
          ...item,
          category: category.category,
          restaurant: "Urbanwrap"
        });
      });
    });

    res.json(allDishes);
  } catch (error) {
    console.error("Error loading all dishes:", error);
    res.status(500).json({ error: "Failed to load dishes" });
  }
});

export default router;