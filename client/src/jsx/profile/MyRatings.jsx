// ============================================
// 3. Updated MyRatings.jsx
// ============================================
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import "./profile.css";

export default function MyRatings() {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const rated = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => o.rating);
      setRatings(rated);
    });

    return () => unsub();
  }, []);

  return (
    <div className="profile-container">
      <h2>My Ratings</h2>

      {ratings.length === 0 && (
        <div className="empty-state">
          <p>You haven't rated any orders yet.</p>
          <p className="empty-hint">
            Rate your delivered orders to help us serve you better!
          </p>
        </div>
      )}

      <div className="ratings-grid">
        {ratings.map((order) => (
          <div key={order.id} className="rating-card">
            <div className="rating-card-header">
              <h4>Order #{order.orderId}</h4>
              <p className="rating-date">
                {order.rating.createdAt?.toDate
                  ? order.rating.createdAt.toDate().toLocaleDateString()
                  : ""}
              </p>
            </div>

            <div className="rating-stars-large">
              {"★".repeat(order.rating.stars)}
              <span className="stars-empty">
                {"★".repeat(5 - order.rating.stars)}
              </span>
            </div>

            {order.rating.review && (
              <div className="rating-review">
                <p>📝 {order.rating.review}</p>
              </div>
            )}

            {order.rating.complaint && (
              <div className="rating-complaint">
                <p>⚠️ {order.rating.complaint}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================
// 4. Add these CSS styles to profile.css
// ============================================

