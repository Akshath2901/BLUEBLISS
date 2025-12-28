import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let menuData = null;

export function loadMenus() {
  if (menuData) return menuData; // Cache menus

  try {
    // menusPath should be: /Users/akshathtogari/Desktop/BLUEBLISS/server/ai/menus
    const menusPath = path.join(__dirname, "ai", "menus");

    const peppannize = JSON.parse(
      fs.readFileSync(path.join(menusPath, "Peppanizze.json"), "utf8")
    );
    const shimmers = JSON.parse(
      fs.readFileSync(path.join(menusPath, "Shrimmers.json"), "utf8")
    );
    const urbanwrap = JSON.parse(
      fs.readFileSync(path.join(menusPath, "Urbanwrap.json"), "utf8")
    );

    menuData = {
      peppannize,
      shimmers,
      urbanwrap,
    };

    console.log("✅ Menus loaded successfully");
    return menuData;
  } catch (error) {
    console.error("❌ Error loading menus:", error.message);
    throw error;
  }
}

export function formatMenusForAI() {
  const menus = loadMenus();

  let formattedText = "\n\n=== AVAILABLE MENUS ===\n\n";

  // Format Peppannize
  formattedText += "🍕 PEPPANNIZE (Pizza Restaurant)\n";
  formattedText += "================================\n";
  menus.peppannize.forEach((category) => {
    formattedText += `\n${category.category}:\n`;
    category.items.forEach((item) => {
      formattedText += `  - ${item.name}: ₹${item.price} (${item.desc}) - Rating: ${item.rating}/5\n`;
    });
  });

  // Format Shimmers
  formattedText += "\n\n🍤 SHIMMERS (Seafood Restaurant)\n";
  formattedText += "================================\n";
  menus.shimmers.forEach((category) => {
    formattedText += `\n${category.category}:\n`;
    category.items.forEach((item) => {
      formattedText += `  - ${item.name}: ₹${item.price} (${item.desc}) - Rating: ${item.rating}/5\n`;
    });
  });

  // Format Urbanwrap
  formattedText += "\n\n🌯 URBANWRAP (Wraps & Rolls Restaurant)\n";
  formattedText += "======================================\n";
  menus.urbanwrap.forEach((category) => {
    formattedText += `\n${category.category}:\n`;
    category.items.forEach((item) => {
      formattedText += `  - ${item.name}: ₹${item.price} (${item.desc}) - Rating: ${item.rating}/5\n`;
    });
  });

  return formattedText;
}