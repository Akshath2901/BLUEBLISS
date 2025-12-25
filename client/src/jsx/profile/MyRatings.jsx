import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./profile.css";

export default function MyRatings() {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
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
        <p>You haven’t rated any orders yet.</p>
      )}

      {ratings.map((order) => (
        <div key={order.id} className="rating-card">
          <h4>Order #{order.orderId}</h4>
          <p>{"★".repeat(order.rating.stars)}</p>

          {order.rating.review && (
            <p>📝 {order.rating.review}</p>
          )}

          {order.rating.complaint && (
            <p className="complaint">
              ⚠ {order.rating.complaint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
