import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Award, Target } from "lucide-react";
import "./AdminSales.css";

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [timeRange, setTimeRange] = useState("daily"); // daily, weekly, monthly
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setOrders(list);
    });
    return () => unsub();
  }, []);

  // ===================== DATE UTILITIES =====================
  const today = new Date();
  const getDateRange = () => {
    if (timeRange === "daily") {
      return { start: new Date(today.getFullYear(), today.getMonth(), today.getDate()), label: "Today" };
    } else if (timeRange === "weekly") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, label: "This Week" };
    } else {
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), label: "This Month" };
    }
  };

  const { start: dateStart } = getDateRange();

  const getOrdersInRange = () => {
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const oDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return oDate >= dateStart && o.status === "delivered";
    });
  };

  const ordersInRange = getOrdersInRange();

  // ===================== REVENUE CALCULATIONS =====================
  const totalRevenue = ordersInRange.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = ordersInRange.length > 0 ? (totalRevenue / ordersInRange.length).toFixed(2) : 0;
  const totalOrders = ordersInRange.length;

  // ===================== HOURLY SALES (TODAY) =====================
  const getHourlySales = () => {
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: `${i}:00`, orders: 0, revenue: 0 };
    }

    orders.forEach(o => {
      if (!o.createdAt || o.status !== "delivered") return;
      const oDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      if (oDate.toDateString() === today.toDateString()) {
        const hour = oDate.getHours();
        hourlyData[hour].orders += 1;
        hourlyData[hour].revenue += o.total || 0;
      }
    });

    return Object.values(hourlyData);
  };

  // ===================== DAILY SALES (WEEK/MONTH) =====================
  const getDailySales = () => {
    const days = timeRange === "weekly" ? 7 : 30;
    const dailyData = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyData[dateStr] = { date: dateStr, orders: 0, revenue: 0 };
    }

    orders.forEach(o => {
      if (!o.createdAt || o.status !== "delivered") return;
      const oDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const dateStr = oDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyData[dateStr]) {
        dailyData[dateStr].orders += 1;
        dailyData[dateStr].revenue += o.total || 0;
      }
    });

    return Object.values(dailyData);
  };

  // ===================== ITEM ANALYTICS =====================
  const getItemAnalytics = () => {
    const items = {};
    ordersInRange.forEach(o => {
      o.cart?.forEach(item => {
        if (!items[item.name]) {
          items[item.name] = { name: item.name, quantity: 0, revenue: 0, orders: 0 };
        }
        items[item.name].quantity += item.qty;
        items[item.name].revenue += item.price * item.qty;
        items[item.name].orders += 1;
      });
    });

    return Object.values(items).sort((a, b) => b.revenue - a.revenue);
  };

  // ===================== BRAND ANALYTICS =====================
  const getBrandAnalytics = () => {
    const brands = {
      "Shrimmers": { name: "Shrimmers", revenue: 0, orders: 0, items: 0, icon: "✨" },
      "Peppanizze": { name: "Peppanizze", revenue: 0, orders: 0, items: 0, icon: "🌶️" },
      "UrbanWrap": { name: "UrbanWrap", revenue: 0, orders: 0, items: 0, icon: "🌯" }
    };

    ordersInRange.forEach(o => {
      o.cart?.forEach(item => {
        // Basic brand detection (you can improve this)
        const brand = Object.keys(brands).find(b => item.name.toLowerCase().includes(b.toLowerCase())) || "Shrimmers";
        brands[brand].revenue += item.price * item.qty;
        brands[brand].items += item.qty;
      });
      Object.keys(brands).forEach(b => {
        if (o.cart?.some(item => item.name.toLowerCase().includes(b.toLowerCase()))) {
          brands[b].orders += 1;
        }
      });
    });

    return Object.values(brands).sort((a, b) => b.revenue - a.revenue);
  };

  // ===================== TOP ITEMS =====================
  const topItems = getItemAnalytics().slice(0, 5);
  const brandAnalytics = getBrandAnalytics();
  const hourlySalesData = getHourlySales();
  const dailySalesData = getDailySales();

  // ===================== GROWTH CALCULATION =====================
  const getPreviousRevenue = () => {
    const days = timeRange === "daily" ? 1 : timeRange === "weekly" ? 7 : 30;
    const prevStart = new Date(dateStart);
    prevStart.setDate(prevStart.getDate() - days);
    const prevEnd = new Date(dateStart);

    return orders
      .filter(o => {
        if (!o.createdAt || o.status !== "delivered") return false;
        const oDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate >= prevStart && oDate < prevEnd;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
  };

  const previousRevenue = getPreviousRevenue();
  const revenueGrowth = previousRevenue > 0 ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1) : 0;
  const isGrowthPositive = revenueGrowth >= 0;

  return (
    <div className="admin-sales-container">
      
      {/* HEADER */}
      <div className="sales-header">
        <div>
          <h1>📊 Sales Analytics</h1>
          <p>Real-time business insights and performance metrics</p>
        </div>
        <div className="time-filters">
          {["daily", "weekly", "monthly"].map(t => (
            <button
              key={t}
              className={`filter-btn ${timeRange === t ? "active" : ""}`}
              onClick={() => setTimeRange(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <h4>Total Revenue</h4>
            <span className="kpi-icon">💰</span>
          </div>
          <p className="kpi-value">₹{totalRevenue.toFixed(0)}</p>
          <div className={`kpi-growth ${isGrowthPositive ? "positive" : "negative"}`}>
            {isGrowthPositive ? "📈" : "📉"} {Math.abs(revenueGrowth)}% from last period
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>Total Orders</h4>
            <span className="kpi-icon">📦</span>
          </div>
          <p className="kpi-value">{totalOrders}</p>
          <p className="kpi-subtext">Completed deliveries</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>Avg Order Value</h4>
            <span className="kpi-icon">💵</span>
          </div>
          <p className="kpi-value">₹{avgOrderValue}</p>
          <p className="kpi-subtext">Per order average</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>Items Sold</h4>
            <span className="kpi-icon">🛒</span>
          </div>
          <p className="kpi-value">{ordersInRange.reduce((sum, o) => sum + (o.cart?.reduce((s, i) => s + i.qty, 0) || 0), 0)}</p>
          <p className="kpi-subtext">Total items delivered</p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-section">
        
        {/* HOURLY SALES CHART */}
        {timeRange === "daily" && (
          <div className="chart-card">
            <h3>⏰ Hourly Sales Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="hour" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #ddd", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="#ffd700" name="Revenue (₹)" />
                <Bar dataKey="orders" fill="#4caf50" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* DAILY SALES CHART */}
        <div className="chart-card">
          <h3>{timeRange === "daily" ? "📅 Today's Timeline" : timeRange === "weekly" ? "📊 Weekly Trend" : "📈 Monthly Trend"}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #ddd", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#ffd700" strokeWidth={2} name="Revenue (₹)" />
              <Line type="monotone" dataKey="orders" stroke="#4caf50" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BRAND DISTRIBUTION */}
        <div className="chart-card">
          <h3>🏪 Brand Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={brandAnalytics}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                <Cell fill="#ffd700" />
                <Cell fill="#ff6b6b" />
                <Cell fill="#4caf50" />
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP PERFORMERS */}
      <div className="performers-section">
        
        {/* TOP ITEMS */}
        <div className="performer-card">
          <h3>🏆 Top 5 Items</h3>
          <div className="performer-list">
            {topItems.map((item, idx) => (
              <div key={idx} className="performer-item">
                <div className="performer-rank">#{idx + 1}</div>
                <div className="performer-info">
                  <p className="performer-name">{item.name}</p>
                  <p className="performer-stats">{item.quantity} sold • {item.orders} orders</p>
                </div>
                <div className="performer-revenue">₹{item.revenue.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP BRANDS */}
        <div className="performer-card">
          <h3>⭐ Brand Performance</h3>
          <div className="performer-list">
            {brandAnalytics.map((brand, idx) => {
              const prevBrandRevenue = getPreviousRevenue() * (brand.revenue / totalRevenue || 0);
              const brandGrowth = prevBrandRevenue > 0 ? (((brand.revenue - prevBrandRevenue) / prevBrandRevenue) * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="performer-item brand-item">
                  <div className="brand-icon">{brand.icon}</div>
                  <div className="performer-info">
                    <p className="performer-name">{brand.name}</p>
                    <p className="performer-stats">{brand.orders} orders • {brand.items} items</p>
                  </div>
                  <div className="brand-metrics">
                    <div className="performer-revenue">₹{brand.revenue.toFixed(0)}</div>
                    <div className={`growth-badge ${brandGrowth >= 0 ? "positive" : "negative"}`}>
                      {brandGrowth >= 0 ? "📈" : "📉"} {Math.abs(brandGrowth)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED ORDERS TABLE */}
      <div className="orders-table-section">
        <h3>📋 Recent Delivered Orders</h3>
        <div className="table-wrapper">
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
              {ordersInRange.slice(0, 15).map(o => (
                <tr key={o.id}>
                  <td>#{o.orderId || o.id.slice(-6)}</td>
                  <td>
                    {o.createdAt && (
                      new Date(o.createdAt.seconds * 1000).toLocaleTimeString()
                    )}
                  </td>
                  <td>{o.cart?.length || 0} items</td>
                  <td className="revenue-cell">₹{o.total?.toFixed(0) || 0}</td>
                  <td><span className="status-badge delivered">✅ Delivered</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}