import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import "./Profile.css";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(list);
    }

    loadOrders();
  }, []);

  return (
    <div className="orders-premium-container">
      <h2 className="orders-title">My Orders</h2>

      {orders.length === 0 && (
        <p className="orders-empty">No orders yet. Start your food journey! 🍔✨</p>
      )}

      <div className="orders-grid">
        {orders.map((order) => (
          <Link to={`/order-details/${order.id}`} key={order.id} className="order-card-premium">
            
            <div className="order-card-header">
              <div>
                <p className="order-id">Order #{order.orderId}</p>
                <p className="order-date">
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleString()
                    : ""}
                </p>
              </div>

              <span className={`order-status ${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>

            <div className="order-card-body">
              <p><strong>Total:</strong> ₹{order.total}</p>
              <p><strong>Items:</strong> {order.items?.length}</p>
            </div>

            <div className="order-card-footer">
              View Details →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
