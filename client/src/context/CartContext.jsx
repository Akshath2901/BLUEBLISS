// src/context/CartContext.jsx - FIXED VERSION
import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     AUTH LISTENER
  ========================= */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);

      if (user) {
        // Logged in → load cart from Firebase
        await loadCartFromFirebase(user.uid);
      } else {
        // Logged out → load cart from localStorage
        loadCartFromLocalStorage();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* =========================
     LOCAL STORAGE
  ========================= */
const loadCartFromLocalStorage = () => {
  try {
    if (typeof window === "undefined") return;

    const savedCart = window.localStorage.getItem("cart");
    setCart(savedCart ? JSON.parse(savedCart) : []);
  } catch (error) {
    console.error("❌ localStorage error:", error);
    setCart([]);
  }
};


  const saveCartToLocalStorage = (updatedCart) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  /* =========================
     FIREBASE
  ========================= */
const loadCartFromFirebase = async (userId) => {
  try {
    const cartRef = doc(db, "userCarts", userId);
    const snapshot = await getDoc(cartRef);

    if (snapshot.exists()) {
      setCart(snapshot.data().items || []);
    } else {
      setCart([]);
    }
  } catch (err) {
    console.error("❌ Error loading cart:", err);
    setCart([]);
  }
};

  const saveCartToFirebase = async (updatedCart) => {
    if (!currentUser) return;

    try {
      const cartRef = doc(db, "userCarts", currentUser.uid);
      await setDoc(cartRef, {
        items: updatedCart,
        userId: currentUser.uid,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ Error saving cart:", err);
    }
  };

  /* =========================
     CART ACTIONS - FIXED
  ========================= */
  
  // 🔥 FIX: Separate sync function that doesn't trigger state update
 const syncCart = (updatedCart) => {
  if (!Array.isArray(updatedCart)) return;

  if (currentUser?.uid) {
    saveCartToFirebase(updatedCart);
  } else {
    saveCartToLocalStorage(updatedCart);
  }
};

  // 🔥 FIX: Removed syncCart from inside setCart callback
  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    let updatedCart;

    if (existing) {
      updatedCart = cart.map((i) =>
        i.id === item.id ? { ...i, qty: i.qty + 1 } : i
      );
    } else {
      updatedCart = [...cart, { ...item, qty: 1 }];
    }

    setCart(updatedCart);
    syncCart(updatedCart); // Sync separately after state update
  };

  // 🔥 FIX: Removed syncCart from inside setCart callback
  const increaseQty = (id) => {
    const updatedCart = cart.map((i) =>
      i.id === id ? { ...i, qty: i.qty + 1 } : i
    );

    setCart(updatedCart);
    syncCart(updatedCart); // Sync separately after state update
  };

  // 🔥 FIX: Removed syncCart from inside setCart callback
  const decreaseQty = (id) => {
    const updatedCart = cart
      .map((i) =>
        i.id === id ? { ...i, qty: i.qty - 1 } : i
      )
      .filter((i) => i.qty > 0); // Remove item if qty is 0

    setCart(updatedCart);
    syncCart(updatedCart); // Sync separately after state update
  };

  // 🔥 FIX: Removed syncCart from inside setCart callback
  const removeFromCart = (id) => {
    const updatedCart = cart.filter((i) => i.id !== id);
    
    setCart(updatedCart);
    syncCart(updatedCart); // Sync separately after state update
  };

  const getItemQty = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.qty : 0;
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem("cart");

    if (currentUser) {
      try {
        const cartRef = doc(db, "userCarts", currentUser.uid);
        await deleteDoc(cartRef);
      } catch (err) {
        console.error("❌ Error clearing Firebase cart:", err);
      }
    }
  };

  /* =========================
     PROVIDER
  ========================= */
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQty,
        decreaseQty,
        removeFromCart,
        getItemQty,
        clearCart,
        loading,
        currentUser,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}