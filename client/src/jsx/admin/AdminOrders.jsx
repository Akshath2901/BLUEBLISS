// src/admin/AdminOrders.jsx - ENHANCED WITH FULL USER DETAILS
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./admin.css";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  // ✅ REAL-TIME LISTENER
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
        const uniqueOrdersMap = new Map();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          if (!data.orderId) {
            console.warn("⚠️ Order missing orderId:", docSnap.id);
            return;
          }

          uniqueOrdersMap.set(data.orderId, {
            id: docSnap.id,
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

  // ✅ Dedupe orders
  const dedupeOrdersByOrderId = (orders) => {
    const uniqueMap = new Map();
    orders.forEach((order) => {
      if (!order.orderId) return;
      if (!uniqueMap.has(order.orderId)) {
        uniqueMap.set(order.orderId, order);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const dedupedOrders = dedupeOrdersByOrderId(orders);
  const filteredOrders = dedupedOrders.filter(
    (order) => order.status === activeTab
  );

  // ✅ UPDATE ORDER STATUS
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
        {["pending", "approved", "ready", "delivered"].map(tab => {
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
            <div key={order.id} className="order-card enhanced-order-card">
              {/* ✅ ENHANCED HEADER WITH ORDER ID & STATUS */}
              <div className="order-header" style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                padding: "16px",
                borderRadius: "12px 12px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <h3 style={{ margin: 0, fontSize: "20px", color: "#1c1c1c", fontWeight: "800" }}>
                  #{order.orderId}
                </h3>
                <span className={`status-badge ${order.status}`} style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  background: order.status === "pending" ? "#ff9800" :
                             order.status === "approved" ? "#2196f3" :
                             order.status === "ready" ? "#9c27b0" :
                             "#4caf50",
                  color: "#fff"
                }}>
                  {order.status}
                </span>
              </div>

              <div className="order-body">
                {/* ✅ CUSTOMER DETAILS - PETPOOJA STYLE */}
                <div style={{
                  background: "rgba(76, 175, 80, 0.05)",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  border: "2px solid rgba(76, 175, 80, 0.2)"
                }}>
                  <h4 style={{ 
                    fontSize: "14px", 
                    color: "#4caf50", 
                    marginBottom: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span>👤</span> CUSTOMER DETAILS
                  </h4>
                  
                  <div style={{ display: "grid", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1c1c1c" }}>
                      {order.customer?.name || order.userName || "Guest"}
                    </p>
                    
                    <p style={{ margin: 0, fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📧</span>
                      {order.customer?.email || "No email"}
                    </p>
                    
                    {order.customer?.phone && (
                      <p style={{ margin: 0, fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📱</span>
                        <a href={`tel:${order.customer.phone}`} style={{ color: "#2196f3", textDecoration: "none", fontWeight: "600" }}>
                          {order.customer.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* ✅ DELIVERY ADDRESS */}
                <div style={{
                  background: "rgba(33, 150, 243, 0.05)",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  border: "2px solid rgba(33, 150, 243, 0.2)"
                }}>
                  <h4 style={{ 
                    fontSize: "14px", 
                    color: "#2196f3", 
                    marginBottom: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span>📍</span> DELIVERY ADDRESS
                  </h4>
                  
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#333" }}>
                    <strong>{order.address?.label?.toUpperCase() || "HOME"}:</strong><br />
                    {order.address?.fullAddress || 
                     `${order.address?.houseNo ? order.address.houseNo + ', ' : ''}${order.address?.street}, ${order.address?.area}, ${order.address?.city}`}
                  </p>
                  
                  {order.address?.landmark && (
                    <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📌</span> {order.address.landmark}
                    </p>
                  )}
                  
                  {order.address?.pincode && (
                    <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#666" }}>
                      <strong>PIN:</strong> {order.address.pincode}
                    </p>
                  )}
                </div>

                {/* ✅ ORDER DETAILS */}
                <div style={{
                  background: "#f5f5f5",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: "2px solid #e0e0e0"
                  }}>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                      <span>💰</span> Total
                    </p>
                    <p style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#ff5722" }}>
                      ₹{order.total}
                    </p>
                  </div>

                  <div className="items">
                    <strong style={{ fontSize: "14px", color: "#666", marginBottom: "8px", display: "block" }}>
                      ORDER ITEMS:
                    </strong>
                    {order.cart?.map((item, idx) => (
                      <div key={idx} className="item" style={{
                        padding: "10px",
                        background: "#fff",
                        borderRadius: "6px",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #e0e0e0"
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                            {item.name}
                          </p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#999" }}>
                            Qty: {item.qty}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#4caf50" }}>
                          ₹{item.price * item.qty}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ✅ SPECIAL INSTRUCTIONS */}
                {(order.suggestion || order.noContact) && (
                  <div style={{ marginBottom: "16px" }}>
                    {order.suggestion && (
                      <div style={{ 
                        padding: "12px", 
                        background: "#fffbf0", 
                        borderRadius: "8px",
                        fontSize: "13px",
                        marginBottom: "8px",
                        border: "1px solid #ffe0b2"
                      }}>
                        <strong style={{ color: "#ff9800" }}>📝 Instructions:</strong>
                        <p style={{ margin: "6px 0 0 0" }}>{order.suggestion}</p>
                      </div>
                    )}

                    {order.noContact && (
                      <div style={{ 
                        padding: "10px", 
                        fontSize: "13px", 
                        color: "#d32f2f",
                        fontWeight: "600",
                        background: "#ffebee",
                        borderRadius: "8px",
                        border: "1px solid #ef9a9a"
                      }}>
                        🔒 No-contact Delivery Requested
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ ORDER TIMESTAMP */}
                <div style={{ 
                  fontSize: "12px", 
                  color: "#999", 
                  textAlign: "right",
                  marginBottom: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e0e0e0"
                }}>
                  🕒 Placed on: {order.createdAt?.toDate ? 
                    order.createdAt.toDate().toLocaleString('en-IN', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    }) : 'N/A'}
                </div>
              </div>

              {/* ✅ ACTION BUTTONS */}
              <div className="order-actions">
                {order.status === "pending" && (
                  <button
                    className="btn btn-accept"
                    onClick={() => updateOrderStatus(order.id, "approved")}
                    style={{
                      background: "linear-gradient(135deg, #4caf50, #45a049)",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      width: "100%",
                      transition: "all 0.3s ease"
                    }}
                  >
                    ✅ ACCEPT ORDER
                  </button>
                )}

                {order.status === "approved" && (
                  <button
                    className="btn btn-ready"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    style={{
                      background: "linear-gradient(135deg, #2196f3, #1976d2)",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    👨‍🍳 MARK READY
                  </button>
                )}

                {order.status === "ready" && (
                  <button
                    className="btn btn-complete"
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    style={{
                      background: "linear-gradient(135deg, #9c27b0, #7b1fa2)",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    🚚 MARK DELIVERED
                  </button>
                )}

                {order.status === "delivered" && (
                  <div style={{ 
                    textAlign: "center", 
                    color: "#4caf50", 
                    fontWeight: "700",
                    padding: "14px",
                    background: "rgba(76, 175, 80, 0.1)",
                    borderRadius: "10px",
                    border: "2px solid rgba(76, 175, 80, 0.3)"
                  }}>
                    ✅ Order Delivered Successfully
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