import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Load user's cart from Firebase
        await loadCartFromFirebase(user.uid);
      } else {
        // User logged out - clear cart
        setCart([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ⭐ LOAD CART FROM FIREBASE
  const loadCartFromFirebase = async (userId) => {
    try {
      setLoading(true);
      const cartDocRef = doc(db, "userCarts", userId);
      const cartSnapshot = await getDoc(cartDocRef);

      if (cartSnapshot.exists()) {
        setCart(cartSnapshot.data().items || []);
      } else {
        // No cart exists yet, start with empty
        setCart([]);
      }
    } catch (err) {
      console.error("Error loading cart from Firebase:", err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ SAVE CART TO FIREBASE
  const saveCartToFirebase = async (updatedCart) => {
    if (!currentUser) return;

    try {
      const cartDocRef = doc(db, "userCarts", currentUser.uid);
      await setDoc(cartDocRef, {
        items: updatedCart,
        userId: currentUser.uid,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error saving cart to Firebase:", err);
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      let updatedCart;

      if (existing) {
        updatedCart = prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        updatedCart = [...prev, { ...item, qty: 1 }];
      }

      // Save to Firebase
      saveCartToFirebase(updatedCart);
      return updatedCart;
    });
  };

  const increaseQty = (id) => {
    setCart((prev) => {
      const updatedCart = prev.map((i) =>
        i.id === id ? { ...i, qty: i.qty + 1 } : i
      );

      // Save to Firebase
      saveCartToFirebase(updatedCart);
      return updatedCart;
    });
  };

  const decreaseQty = (id) => {
    setCart((prev) => {
      const updatedCart = prev
        .map((i) =>
          i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i
        )
        .filter((i) => i.qty > 0);

      // Save to Firebase
      saveCartToFirebase(updatedCart);
      return updatedCart;
    });
  };

  const getItemQty = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.qty : 0;
  };

  // ⭐ CLEAR CART (optional - useful for after order placement)
  const clearCart = async () => {
    if (!currentUser) return;

    try {
      setCart([]);
      const cartDocRef = doc(db, "userCarts", currentUser.uid);
      await deleteDoc(cartDocRef);
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQty,
        decreaseQty,
        getItemQty,
        clearCart,
        loading,
        currentUser
      }}
    >
      {children}
    </CartContext.Provider>
  );
}