// src/admin/AdminOrders.jsx - COMPLETE WORKING VERSION
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./admin.css";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

 // ✅ REAL-TIME LISTENER FOR ALL ORDERS (DEDUPED)
const listenerAttached = React.useRef(false);

useEffect(() => {
  if (listenerAttached.current) {
    console.log("⚠️ Orders listener already attached, skipping...");
    return;
  }

  listenerAttached.current = true;
  console.log("🔄 Setting up orders listener (ONE TIME)");

  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // 🔥 DEDUPE USING UNIQUE orderId
      const uniqueOrdersMap = new Map();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (!data.orderId) {
          console.warn("⚠️ Order missing orderId:", docSnap.id);
          return;
        }

        // Use orderId as the unique key
        uniqueOrdersMap.set(data.orderId, {
          id: docSnap.id,      // Firestore document ID
          ...data,
        });
      });

      const uniqueOrders = Array.from(uniqueOrdersMap.values());

      console.log("✅ Unique orders loaded:", uniqueOrders.length);

      setOrders(uniqueOrders);
      setLoading(false);
    },
    (error) => {
      console.error("❌ Error loading orders:", error);
      setLoading(false);
    }
  );

  return () => {
    console.log("🔴 Cleaning up orders listener");
    unsubscribe();
    listenerAttached.current = false;
  };
}, []);
// ✅ Dedupe orders at render time using unique orderId
const dedupeOrdersByOrderId = (orders) => {
  const uniqueMap = new Map();

  orders.forEach((order) => {
    if (!order.orderId) return;

    // latest occurrence wins (because list is ordered by createdAt desc)
    if (!uniqueMap.has(order.orderId)) {
      uniqueMap.set(order.orderId, order);
    }
  });

  return Array.from(uniqueMap.values());
};

  // Filter orders by active tab
  // 🔥 Deduped orders (render-time)
const dedupedOrders = dedupeOrdersByOrderId(orders);

// 🔥 Then filter by tab
const filteredOrders = dedupedOrders.filter(
  (order) => order.status === activeTab
);


  // ✅ UPDATE ORDER STATUS - Uses Firestore document ID
  const updateOrderStatus = async (firestoreDocId, newStatus) => {
    try {
      console.log(`🔄 Updating order ${firestoreDocId} to ${newStatus}...`);
      
      await updateDoc(doc(db, "orders", firestoreDocId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      console.log(`✅ Order ${firestoreDocId} updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Error updating order:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2>Loading orders...</h2>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      <h1>📋 Orders Management</h1>

      {/* STATUS TABS */}
      <div className="tabs">
        {["pending", "approved", "ready", "completed"].map(tab => {
          const count = orders.filter(o => o.status === tab).length;
          return (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()} <span className="tab-count">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ORDERS GRID */}
      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div style={{ 
            gridColumn: "1 / -1", 
            textAlign: "center", 
            padding: "60px",
            color: "#999"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📭</div>
            <h3>No {activeTab} orders</h3>
            <p>Orders will appear here when customers place them</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>#{order.orderId}</h3>
                <span className={`status-badge ${order.status}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="order-body">
                <p><strong>Customer:</strong> {order.userName || "Guest"}</p>
                <p>
                  <strong>Address:</strong> {order.address?.houseNo && `${order.address.houseNo}, `}
                  {order.address?.street}, {order.address?.area}
                </p>
                <p><strong>Total:</strong> ₹{order.total}</p>

                <div className="items">
                  <strong>Items:</strong>
                  {order.cart?.map((item, idx) => (
                    <div key={idx} className="item">
                      • {item.name} × {item.qty} (₹{item.price * item.qty})
                    </div>
                  ))}
                </div>

                {order.suggestion && (
                  <div style={{ 
                    marginTop: "12px", 
                    padding: "8px", 
                    background: "#fffbf0", 
                    borderRadius: "6px",
                    fontSize: "13px"
                  }}>
                    <strong>📝 Instructions:</strong> {order.suggestion}
                  </div>
                )}

                {order.noContact && (
                  <div style={{ 
                    marginTop: "8px", 
                    fontSize: "13px", 
                    color: "#ff6b6b",
                    fontWeight: "600"
                  }}>
                    🔒 No-contact Delivery Requested
                  </div>
                )}
              </div>

              {/* ✅ ACTION BUTTONS - Pass Firestore doc ID */}
              <div className="order-actions">
                {order.status === "pending" && (
                  <button
                    className="btn btn-accept"
                    onClick={() => updateOrderStatus(order.id, "approved")}
                  >
                    ✅ ACCEPT ORDER
                  </button>
                )}

                {order.status === "approved" && (
                  <button
                    className="btn btn-ready"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                  >
                    👨‍🍳 MARK READY
                  </button>
                )}

                {order.status === "ready" && (
                  <button
                    className="btn btn-complete"
                    onClick={() => updateOrderStatus(order.id, "completed")}
                  >
                    🎉 COMPLETED
                  </button>
                )}

                {order.status === "completed" && (
                  <div style={{ 
                    textAlign: "center", 
                    color: "#51cf66", 
                    fontWeight: "600",
                    padding: "10px"
                  }}>
                    ✅ Order Completed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}