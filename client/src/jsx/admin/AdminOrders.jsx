import React, { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, AlertCircle, TrendingUp, Phone, MapPin, ChefHat } from "lucide-react";
import "./admin.css";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("new");
  const alarmRef = useRef(null);
  const prevPlacedCount = useRef(0);

  // Initialize alarm
  useEffect(() => {
    alarmRef.current = new Audio("/alarm-beep.mp3");
    alarmRef.current.volume = 0.7;
  }, []);

  // Real-time orders listener
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setOrders(list);

      // Play alarm for new orders
      const newOrders = list.filter((o) => o.status === "pending");
      if (newOrders.length > prevPlacedCount.current && prevPlacedCount.current !== 0) {
        try {
          alarmRef.current.play();
        } catch (e) {
          console.log("Autoplay blocked");
        }
      }
      prevPlacedCount.current = newOrders.length;
    });

    return () => unsub();
  }, []);

  // Stats calculation
  const stats = {
    newOrders: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "delivered").length,
    todayRevenue: orders
      .filter(o => {
        if (!o.createdAt) return false;
        const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return orderDate.toDateString() === new Date().toDateString() && o.status === "delivered";
      })
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  // Filter orders by tab
  const filteredOrders = orders.filter(o => {
    if (activeTab === "new") return o.status === "pending";
    if (activeTab === "preparing") return o.status === "preparing";
    if (activeTab === "ready") return o.status === "ready";
    if (activeTab === "completed") return o.status === "delivered";
    return true;
  });

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      console.log(`✅ Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return "#ff6b6b";
      case "preparing": return "#ffd700";
      case "ready": return "#51cf66";
      case "delivered": return "#4caf50";
      default: return "#999";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "pending": return "📋";
      case "preparing": return "👨‍🍳";
      case "ready": return "✅";
      case "delivered": return "🎉";
      default: return "📦";
    }
  };

  return (
    <div className="admin-dashboard-container">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📊 BlueBliss Order Management</h1>
          <p>Real-time order processing system</p>
        </div>
        <div className="header-right">
          <div className="time-display">
            🕐 {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* STATS GRID - PetPooja Style */}
      <div className="stats-grid">
        <div className="stat-card new-orders">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h4>New Orders</h4>
            <p className="stat-number">{stats.newOrders}</p>
          </div>
        </div>

        <div className="stat-card preparing">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-content">
            <h4>Preparing</h4>
            <p className="stat-number">{stats.preparing}</p>
          </div>
        </div>

        <div className="stat-card ready">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h4>Ready</h4>
            <p className="stat-number">{stats.ready}</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <h4>Completed Today</h4>
            <p className="stat-number">{stats.completed}</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h4>Today's Revenue</h4>
            <p className="stat-number">₹{stats.todayRevenue}</p>
          </div>
        </div>
      </div>

      {/* TABS - PetPooja Style */}
      <div className="tabs-section">
        <div className="tabs">
          {[
            { id: "new", label: "NEW ORDERS", icon: "📋", count: stats.newOrders },
            { id: "preparing", label: "PREPARING", icon: "👨‍🍳", count: stats.preparing },
            { id: "ready", label: "READY", icon: "✅", count: stats.ready },
            { id: "completed", label: "COMPLETED", icon: "🎉", count: stats.completed }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS BOX GRID - PetPooja Style */}
      <div className="orders-section">
        <div className="section-header">
          <h2>Orders ({filteredOrders.length})</h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>🎊 No orders in this category</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order.id} className="order-box">
                
                {/* ORDER BOX HEADER */}
                <div className="order-box-header" style={{ borderTopColor: getStatusColor(order.status) }}>
                  <div className="order-box-title">
                    <span className="order-number">#{order.orderId}</span>
                    <span className="order-time">
                      {order.createdAt && (
                        new Date(order.createdAt.seconds * 1000).toLocaleTimeString()
                      )}
                    </span>
                  </div>
                  <div className="order-status-badge" style={{ background: getStatusColor(order.status) }}>
                    {getStatusIcon(order.status)} {order.status.toUpperCase()}
                  </div>
                </div>

                {/* ORDER BOX BODY */}
                <div className="order-box-body">
                  
                  {/* CUSTOMER INFO */}
                  <div className="order-info-section">
                    <p className="info-label">👤 Customer</p>
                    <p className="info-value">{order.address?.label || "Customer"}</p>
                  </div>

                  {/* ADDRESS */}
                  <div className="order-info-section">
                    <p className="info-label">📍 Address</p>
                    <p className="info-value">{order.address?.street}, {order.address?.area}</p>
                    {order.address?.landmark && (
                      <p className="info-subtext">📌 Near: {order.address.landmark}</p>
                    )}
                  </div>

                  {/* ORDER ITEMS */}
                  <div className="order-items">
                    <p className="info-label">📦 Items</p>
                    <div className="items-box">
                      {order.cart && order.cart.map((item, idx) => (
                        <div key={idx} className="item-row">
                          <span className="item-qty">{item.qty}x</span>
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SPECIAL INSTRUCTIONS */}
                  {order.suggestion && (
                    <div className="order-info-section">
                      <p className="info-label">📝 Instructions</p>
                      <p className="info-value instruction-text">{order.suggestion}</p>
                    </div>
                  )}

                  {/* NO CONTACT */}
                  {order.noContact && (
                    <div className="no-contact-badge">
                      🔒 No-contact Delivery
                    </div>
                  )}
                </div>

                {/* ORDER BOX FOOTER */}
                <div className="order-box-footer">
                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-amount">₹{order.total}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="order-box-actions">
                  {order.status === "pending" && (
                    <button
                      className="action-btn accept-btn"
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                    >
                      ✅ ACCEPT
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      className="action-btn ready-btn"
                      onClick={() => updateOrderStatus(order.id, "ready")}
                    >
                      ✨ READY
                    </button>
                  )}

                  {order.status === "ready" && (
                    <button
                      className="action-btn complete-btn"
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                    >
                      🎉 DELIVERED
                    </button>
                  )}

                  {order.status === "delivered" && (
                    <button className="action-btn completed-btn" disabled>
                      ✓ COMPLETED
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}