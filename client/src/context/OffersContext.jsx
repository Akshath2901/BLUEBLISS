import React, { createContext, useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

export const OffersContext = createContext();

export function OffersProvider({ children }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const offersRef = collection(db, "offers");
      const q = query(offersRef, where("isActive", "==", true));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeOffers = [];
        snapshot.forEach((doc) => {
          activeOffers.push({ id: doc.id, ...doc.data() });
        });
        setOffers(activeOffers);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error loading offers:", err);
      setLoading(false);
    }
  }, []);

  return (
    <OffersContext.Provider value={{ offers, loading }}>
      {children}
    </OffersContext.Provider>
  );
}