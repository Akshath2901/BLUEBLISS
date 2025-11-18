import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoginModal from "../jsx/LoginModal"; // adjust path if needed

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (loading) return <div>Loading...</div>;

  // If user NOT logged in → show login modal
  if (!user) {
    if (!showModal) setShowModal(true);
    return (
      <>
        {showModal && <LoginModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // If logged in → show protected page
  return children;
}

export default ProtectedRoute;
