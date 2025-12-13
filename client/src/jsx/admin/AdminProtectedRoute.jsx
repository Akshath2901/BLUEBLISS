import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      // fetch firebase user role
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().role === "admin") {
        setAllowed(true);
      } else {
        setAllowed(false);
      }

      setChecking(false);
    });

    return () => unsub();
  }, []);

  if (checking) return <p>Checking admin access...</p>;
  if (!allowed) return <Navigate to="/admin-login" replace />;

  return children;
}
