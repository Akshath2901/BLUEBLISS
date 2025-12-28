import React, { createContext, useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

export const HomeOffersContext = createContext();

export function HomeOffersProvider({ children }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const offersRef = collection(db, "homeOffers");
      const q = query(offersRef, where("isActive", "==", true));

      // Real-time updates
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
      console.error("Error loading home offers:", err);
      setLoading(false);
    }
  }, []);

  return (
    <HomeOffersContext.Provider value={{ offers, loading }}>
      {children}
    </HomeOffersContext.Provider>
  );
}