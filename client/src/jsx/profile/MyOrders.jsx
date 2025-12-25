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

export default function MyOrders() {
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
            // 🔐 GUARANTEE items is always an array
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
            onClick={() =>
              navigate("/track-order", {
                state: { orderId: order.orderId },
              })
            }
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

            {/* ⭐ RATE ORDER */}
            {order.status === "delivered" && !order.rating && (
              <button
                className="rate-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/rate-order", {
                    state: { orderDocId: order.id },
                  });
                }}
              >
                ⭐ Rate Order
              </button>
            )}

            {/* FOOTER */}
            <div className="order-card-footer">
              Track Order →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
