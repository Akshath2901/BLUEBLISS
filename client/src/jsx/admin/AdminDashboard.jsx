import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    newOrders: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    todayRevenue: 0,
  });

  // Real-time stats listener
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const orders = [];
      snap.forEach((d) => orders.push(d.data()));

      const today = new Date().toDateString();
      const newOrders = orders.filter(o => o.status === "pending").length;
      const preparing = orders.filter(o => o.status === "preparing").length;
      const ready = orders.filter(o => o.status === "ready").length;
      const completed = orders.filter(o => o.status === "delivered").length;
      const todayRevenue = orders
        .filter(o => {
          if (!o.createdAt) return false;
          const oDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return oDate.toDateString() === today && o.status === "delivered";
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      setStats({ newOrders, preparing, ready, completed, todayRevenue });
    });

    return () => unsub();
  }, []);

  // 🔥 MAIN MENU (UPDATED)
  const mainMenu = [
    {
      id: 1,
      icon: "📋",
      title: "Orders",
      subtitle: "Manage Orders",
      link: "/admin/orders",
      count: stats.newOrders
    },
    {
      id: 2,
      icon: "🕐",
      title: "Online Orders",
      subtitle: "Online Delivery",
      link: "/admin/orders",
      count: 0
    },
    {
      id: 3,
      icon: "📋",
      title: "KOTs",
      subtitle: "Kitchen Tickets",
      link: "/admin/orders",
      count: 0
    },
    {
      id: 4,
      icon: "💳",
      title: "Cash Flow",
      subtitle: "Payment Tracking",
      link: "/admin/sales",
      count: 0
    },
    {
      id: 5,
      icon: "📊",
      title: "Reports",
      subtitle: "Sales & Analytics",
      link: "/admin/sales",
      count: 0
    },
    {
      id: 6,
      icon: "📊",
      title: "Expense",
      subtitle: "Expense Tracking",
      link: "/admin/sales",
      count: 0
    },
    {
      id: 7,
      icon: "💰",
      title: "Withdrawal",
      subtitle: "Fund Management",
      link: "/admin/sales",
      count: 0
    },
    {
      id: 8,
      icon: "📦",
      title: "Stock Management",
      subtitle: "Manage Inventory",
      link: "/admin/stock",
      count: 0
    },

    // ✅ NEW INGREDIENTS TILE
    {
      id: 9,
      icon: "🧂",
      title: "Ingredients",
      subtitle: "Manage Raw Stock",
      link: "/admin/ingredients",
      count: 0
    }
  ];

  const configMenu = [
    { id: 10, icon: "🍽️", title: "Menu", subtitle: "Manage Menu Items", link: "/admin/settings" },
    { id: 11, icon: "🖨️", title: "Bill / KOT Print", subtitle: "Printer Settings", link: "/admin/settings" },
    { id: 12, icon: "📋", title: "Tax", subtitle: "Tax Configuration", link: "/admin/settings" },
    { id: 13, icon: "⚙️", title: "Settings", subtitle: "System Settings", link: "/admin/settings" },
    { id: 14, icon: "🎁", title: "Offers", subtitle: "Manage Promotions", link: "/admin/offers" },
    { id: 15, icon: "🎁", title: "Discount", subtitle: "Manage Discounts", link: "/admin/settings" },
    { id: 16, icon: "🖼️", title: "Billing Screen", subtitle: "Display Settings", link: "/admin/settings" },
    { id: 17, icon: "⚙️", title: "Advanced Settings", subtitle: "System Config", link: "/admin/settings" },
    { id: 18, icon: "🔔", title: "Notification", subtitle: "Alert Settings", link: "/admin/settings" },
  ];

  const handleMenuClick = (link) => {
    navigate(link);
  };

  return (
    <div className="admin-dashboard-grid">
      
      {/* HEADER */}
      <div className="dashboard-grid-header">
        <div className="header-brand">
          <h1>BlueBliss</h1>
          <p>Management System</p>
        </div>
        <div className="header-info">
          <p>Main Server</p>
          <p className="server-name">Cloud Kitchen</p>
        </div>
        <div className="header-contact">
          <p>📞 9999912483</p>
          <p>📧 support@bluebliss.com</p>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="quick-stats">
        <div className="quick-stat-item">
          <span className="stat-icon">📋</span>
          <span className="stat-label">New Orders</span>
          <span className="stat-number">{stats.newOrders}</span>
        </div>
        <div className="quick-stat-item">
          <span className="stat-icon">👨‍🍳</span>
          <span className="stat-label">Preparing</span>
          <span className="stat-number">{stats.preparing}</span>
        </div>
        <div className="quick-stat-item">
          <span className="stat-icon">✅</span>
          <span className="stat-label">Ready</span>
          <span className="stat-number">{stats.ready}</span>
        </div>
        <div className="quick-stat-item">
          <span className="stat-icon">💰</span>
          <span className="stat-label">Today Revenue</span>
          <span className="stat-number">₹{stats.todayRevenue}</span>
        </div>
      </div>

      {/* MAIN MENU GRID */}
      <div className="menu-section">
        <h3 className="menu-title">Main Operations</h3>
        <div className="menu-grid">
          {mainMenu.map(item => (
            <div
              key={item.id}
              className="menu-item"
              onClick={() => handleMenuClick(item.link)}
            >
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-text">
                <p className="menu-title-text">{item.title}</p>
                <p className="menu-subtitle">{item.subtitle}</p>
              </div>
              {item.count > 0 && <div className="menu-badge">{item.count}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CONFIG MENU GRID */}
      <div className="menu-section">
        <h3 className="menu-title">Set the configuration for your restaurant</h3>
        <div className="menu-grid">
          {configMenu.map(item => (
            <div
              key={item.id}
              className="menu-item"
              onClick={() => handleMenuClick(item.link)}
            >
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-text">
                <p className="menu-title-text">{item.title}</p>
                <p className="menu-subtitle">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="dashboard-grid-footer">
        <p>BlueBliss Cloud Kitchen Management • Version 1.0</p>
      </div>
    </div>
  );
}
