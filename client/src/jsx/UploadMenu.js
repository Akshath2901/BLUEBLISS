// uploadMenu.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// ✅ Step 1: Your Firebase configuration (replace with your actual values)
const firebaseConfig = {
   apiKey: "AIzaSyBE013NRiCGJqPa-SEPbu-GDMFVNZf24Lc",
  authDomain: "bluebliss-813db.firebaseapp.com",
  projectId: "bluebliss-813db",
  storageBucket: "bluebliss-813db.firebasestorage.app",
  messagingSenderId: "125399707723",
  appId: "1:125399707723:web:73e4414c4ef8a5ac87ddce",
  measurementId: "G-EPG9VGF22D"
};

// ✅ Step 2: Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Step 3: Read your JSON file (shrimmers_menu.json must be in the same folder)
const menuData = JSON.parse(fs.readFileSync("./shrimmers_menu.json", "utf-8"));

// ✅ Step 4: Upload each category as a Firestore document
async function uploadMenu() {
  for (const category of menuData) {
    const docId = category.category.replace(/\s+/g, "_").toLowerCase(); // e.g. "VEG BURGERS" → "veg_burgers"
    const docRef = doc(collection(db, "menu"), docId);
    await setDoc(docRef, category);
    console.log(`✅ Uploaded: ${category.category}`);
  }
  console.log("🔥 All menu items uploaded successfully!");
}

// ✅ Step 5: Run the uploader
uploadMenu().catch(console.error);
