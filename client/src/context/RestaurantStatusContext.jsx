// src/context/RestaurantStatusContext.jsx
// ✅ UPDATED: Per-brand open/close support added alongside global kitchen toggle

import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const RestaurantStatusContext = createContext(null);

const DEFAULT_STATUS = {
  isOpen: true,
  manualOverride: false,
  openTime: "11:00",
  closeTime: "04:00",
  closedMessage: "We're currently closed. We'll be back soon!",
  brands: {
    shrimmers: true,
    peppanizze: true,
    urbanwrap: true,
  },
  updatedAt: null,
};

export function RestaurantStatusProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "restaurantConfig", "status");
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        await setDoc(ref, { ...DEFAULT_STATUS, updatedAt: serverTimestamp() });
      } else {
        const data = snap.data();
        if (!data.brands) {
          await updateDoc(ref, { brands: DEFAULT_STATUS.brands });
        }
        setStatus(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isWithinKitchenHours = () => {
    const hour = new Date().getHours();
    return hour >= 11 || hour < 4;
  };

  // Global kitchen open = staff toggle ON + within hours
  const isKitchenOpen = status
    ? status.isOpen && isWithinKitchenHours()
    : false;

  // Brand open = global kitchen open AND brand's own toggle is ON
  const isBrandOpen = (brandKey) => {
    if (!isKitchenOpen) return false;
    if (!status?.brands) return true;
    return status.brands[brandKey] !== false;
  };

  const getNextOpenMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      const hoursLeft = 11 - hour;
      return `Opens in ${hoursLeft} hour${hoursLeft > 1 ? "s" : ""} (11:00 AM)`;
    }
    return "Opens at 11:00 AM";
  };

  return (
    <RestaurantStatusContext.Provider value={{
      status,
      isKitchenOpen,
      isBrandOpen,
      isWithinKitchenHours,
      getNextOpenMessage,
      loading,
    }}>
      {children}
    </RestaurantStatusContext.Provider>
  );
}

export function useRestaurantStatus() {
  const ctx = useContext(RestaurantStatusContext);
  if (!ctx) throw new Error("useRestaurantStatus must be used inside RestaurantStatusProvider");
  return ctx;
}