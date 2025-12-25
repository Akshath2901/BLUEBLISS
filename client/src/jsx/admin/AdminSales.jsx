import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AdminSales.css";

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [timeRange, setTimeRange] = useState("daily");

  /* ================= REAL-TIME ORDERS ================= */
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setOrders(list);
    });
    return () => unsub();
  }, []);

  /* ================= STATUS HANDLER ================= */
  const isDelivered = (status) =>
    status === "completed" || status === "delivered";

  /* ================= DATE HELPERS ================= */
  const today = new Date();

  const getStartDate = () => {
    if (timeRange === "daily")
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (timeRange === "weekly") {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay());
      return d;
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const startDate = getStartDate();

  /* ================= FILTERED ORDERS ================= */
  const ordersInRange = orders.filter((o) => {
    if (!o.createdAt || !isDelivered(o.status)) return false;
    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return d >= startDate;
  });

  /* ================= KPI CALCULATIONS ================= */
  const totalRevenue = ordersInRange.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const totalOrders = ordersInRange.length;

  const avgOrderValue =
    totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";

  const totalItemsSold = ordersInRange.reduce(
    (sum, o) =>
      sum + (o.cart?.reduce((s, item) => s + Number(item.qty || 0), 0) || 0),
    0
  );

  /* ================= HOURLY SALES ================= */
  const getHourlySales = () => {
    const map = {};
    for (let i = 0; i < 24; i++)
      map[i] = { hour: `${i}:00`, orders: 0, revenue: 0 };

    orders.forEach((o) => {
      if (!o.createdAt || !isDelivered(o.status)) return;
      const d = o.createdAt.toDate();
      if (d.toDateString() === today.toDateString()) {
        const h = d.getHours();
        map[h].orders += 1;
        map[h].revenue += Number(o.total || 0);
      }
    });

    return Object.values(map);
  };

  /* ================= DAILY SALES ================= */
  const getDailySales = () => {
    const days = timeRange === "weekly" ? 7 : 30;
    const data = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      data[key] = { date: key, orders: 0, revenue: 0 };
    }

    orders.forEach((o) => {
      if (!o.createdAt || !isDelivered(o.status)) return;
      const d = o.createdAt.toDate();
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (data[key]) {
        data[key].orders += 1;
        data[key].revenue += Number(o.total || 0);
      }
    });

    return Object.values(data);
  };

  const hourlyData = getHourlySales();
  const dailyData = getDailySales();

  /* ================= PREVIOUS PERIOD ================= */
  const getPreviousRevenue = () => {
    const days = timeRange === "daily" ? 1 : timeRange === "weekly" ? 7 : 30;
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    return orders
      .filter((o) => {
        if (!o.createdAt || !isDelivered(o.status)) return false;
        const d = o.createdAt.toDate();
        return d >= prevStart && d < startDate;
      })
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  };

  const prevRevenue = getPreviousRevenue();
  const growth =
    prevRevenue > 0
      ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
      : "0.0";

  /* ================= UI ================= */
  return (
    <div className="admin-sales-container">
      {/* HEADER */}
      <div className="sales-header">
        <div>
          <h1>📊 Sales Analytics</h1>
          <p>Real-time business insights</p>
        </div>
        <div className="time-filters">
          {["daily", "weekly", "monthly"].map((t) => (
            <button
              key={t}
              className={`filter-btn ${timeRange === t ? "active" : ""}`}
              onClick={() => setTimeRange(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>Total Revenue</h4>
          <p className="kpi-value">₹{Number(totalRevenue).toFixed(0)}</p>
          <span className={growth >= 0 ? "positive" : "negative"}>
            {growth >= 0 ? "📈" : "📉"} {Math.abs(growth)}%
          </span>
        </div>

        <div className="kpi-card">
          <h4>Total Orders</h4>
          <p className="kpi-value">{totalOrders}</p>
        </div>

        <div className="kpi-card">
          <h4>Avg Order Value</h4>
          <p className="kpi-value">₹{avgOrderValue}</p>
        </div>

        <div className="kpi-card">
          <h4>Items Sold</h4>
          <p className="kpi-value">{totalItemsSold}</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-section">
        {timeRange === "daily" && (
          <div className="chart-card">
            <h3>⏰ Hourly Sales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#ffd700" />
                <Bar dataKey="orders" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="chart-card">
          <h3>📈 Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="revenue" stroke="#ffd700" />
              <Line dataKey="orders" stroke="#4caf50" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ORDER HISTORY */}
      <div className="orders-table-section">
        <h3>📋 Completed Orders</h3>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Time</th>
              <th>Items</th>
              <th>Revenue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ordersInRange.slice(0, 15).map((o) => (
              <tr key={o.id}>
                <td>#{o.orderId || o.id.slice(-6)}</td>
                <td>{o.createdAt?.toDate().toLocaleTimeString()}</td>
                <td>{o.cart?.length || 0}</td>
                <td>₹{Number(o.total || 0).toFixed(0)}</td>
                <td>
                  <span className="status-badge delivered">✅ Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
