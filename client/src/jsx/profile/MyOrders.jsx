// ============================================
// MyOrders.jsx - CORRECTED VERSION
// ============================================
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./profile.css";

export default function MyOrders({ onRateOrder }) { // ✅ ADD THIS PROP
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("recent"); // recent | all
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeOrders = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setOrders([]);
        return;
      }

      const baseQuery = [
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      ];

      const q =
        view === "recent"
          ? query(...baseQuery, limit(10))
          : query(...baseQuery);

      unsubscribeOrders = onSnapshot(q, (snap) => {
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            items: Array.isArray(data.items) ? data.items : [],
          };
        });

        setOrders(list);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [view]);

  return (
    <div className="orders-premium-container">
      {/* HEADER */}
      <div className="orders-header">
        <h2>My Orders</h2>

        <div className="orders-filter">
          <button
            className={view === "recent" ? "active" : ""}
            onClick={() => setView("recent")}
          >
            Last 10
          </button>
          <button
            className={view === "all" ? "active" : ""}
            onClick={() => setView("all")}
          >
            All Orders
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {orders.length === 0 && (
        <p className="orders-empty">No orders yet 🍔</p>
      )}

      {/* ORDERS LIST */}
      <div className="orders-grid">
        {orders.map((order) => (
          <div
            key={order.id}
            className="order-card-premium"
          >
            {/* HEADER */}
            <div className="order-card-header">
              <div>
                <p className="order-id">Order #{order.orderId}</p>
                <p className="order-date">
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleString()
                    : ""}
                </p>
              </div>

              <span className={`order-status ${order.status}`}>
                {order.status?.toUpperCase()}
              </span>
            </div>

            {/* BODY */}
            <div className="order-card-body">
              <p>
                <strong>Total:</strong> ₹{Number(order.total || 0)}
              </p>
              <p>
                <strong>Items:</strong> {order.items.length}
              </p>
            </div>

            {/* ⭐ RATE ORDER BUTTON - Only show if delivered and not rated */}
            {order.status === "delivered" && !order.rating && onRateOrder && (
              <button
                className="rate-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRateOrder({
                    orderDocId: order.id,
                    orderId: order.orderId,
                  });
                }}
              >
                ⭐ Rate Order
              </button>
            )}

            {/* SHOW RATING IF EXISTS */}
            {order.rating && (
              <div className="order-rating-display">
                <div className="stars-small">
                  {"★".repeat(order.rating.stars)}
                  <span className="stars-empty">
                    {"★".repeat(5 - order.rating.stars)}
                  </span>
                </div>
                {order.rating.review && (
                  <p className="review-snippet">"{order.rating.review}"</p>
                )}
              </div>
            )}

            {/* FOOTER - Track Order */}
            <div 
              className="order-card-footer"
              onClick={() =>
                navigate("/track-order", {
                  state: { orderId: order.orderId },
                })
              }
            >
              Track Order →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}