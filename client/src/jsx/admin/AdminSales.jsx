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
  ComposedChart,
} from "recharts";
import "./AdminSales.css";

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [timeRange, setTimeRange] = useState("daily");
  const [selectedBrand, setSelectedBrand] = useState("all");

  // Your 3 brands
  const BRANDS = ["Shrimmers", "Peppanizze", "Urban Wrap"];
  const BRAND_COLORS = {
    "Shrimmers": "#FF6B6B",
    "Peppanizze": "#4ECDC4",
    "Urban Wrap": "#FFD93D",
  };

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

  /* ================= MULTI-BRAND ORDER ANALYSIS ================= */
  // Analyze orders by brand (handles multi-brand orders)
  const analyzeBrandData = () => {
    const brandData = {};
    BRANDS.forEach(brand => {
      brandData[brand] = {
        name: brand,
        revenue: 0,
        orders: 0,
        items: 0,
        avgOrderValue: 0,
        orderIds: new Set(), // Track unique orders
      };
    });

    ordersInRange.forEach((order) => {
      const orderBrands = new Set();
      
      // Check cart items for brand information
      order.cart?.forEach((item) => {
        const itemBrand = item.brand || order.brand;
        if (itemBrand && BRANDS.includes(itemBrand)) {
          orderBrands.add(itemBrand);
          brandData[itemBrand].items += Number(item.qty || 0);
          // Allocate revenue by item
          const itemTotal = Number(item.price || 0) * Number(item.qty || 0);
          brandData[itemBrand].revenue += itemTotal;
        }
      });

      // Count order for each brand present
      orderBrands.forEach(brand => {
        brandData[brand].orderIds.add(order.id);
      });

      // If no brand info in cart, use order-level brand
      if (orderBrands.size === 0 && order.brand && BRANDS.includes(order.brand)) {
        brandData[order.brand].revenue += Number(order.total || 0);
        brandData[order.brand].orderIds.add(order.id);
        brandData[order.brand].items += order.cart?.reduce((s, item) => s + Number(item.qty || 0), 0) || 0;
      }
    });

    // Calculate orders count and avg order value
    Object.values(brandData).forEach(brand => {
      brand.orders = brand.orderIds.size;
      brand.avgOrderValue = brand.orders > 0 ? (brand.revenue / brand.orders).toFixed(0) : 0;
      delete brand.orderIds; // Clean up
    });

    return Object.values(brandData).sort((a, b) => b.revenue - a.revenue);
  };

  /* ================= LOCATION ANALYTICS ================= */
  const analyzeLocationData = () => {
    const locationMap = {};

    ordersInRange.forEach((order) => {
      // Extract location from order (adjust field names based on your data structure)
      const location = order.address?.area || 
                      order.address?.locality || 
                      order.location ||
                      order.address?.city ||
                      "Unknown";

      if (!locationMap[location]) {
        locationMap[location] = {
          location: location,
          orders: 0,
          revenue: 0,
          customers: new Set(),
        };
      }

      locationMap[location].orders += 1;
      locationMap[location].revenue += Number(order.total || 0);
      if (order.userId) {
        locationMap[location].customers.add(order.userId);
      }
    });

    return Object.values(locationMap)
      .map(loc => ({
        ...loc,
        customers: loc.customers.size,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 locations
  };

  /* ================= CROSS-BRAND ORDER ANALYSIS ================= */
  const analyzeCrossBrandOrders = () => {
    let singleBrandOrders = 0;
    let multiBrandOrders = 0;
    const brandCombinations = {};

    ordersInRange.forEach((order) => {
      const brandsInOrder = new Set();
      
      order.cart?.forEach((item) => {
        const brand = item.brand || order.brand;
        if (brand && BRANDS.includes(brand)) {
          brandsInOrder.add(brand);
        }
      });

      if (brandsInOrder.size === 0 && order.brand) {
        brandsInOrder.add(order.brand);
      }

      if (brandsInOrder.size === 1) {
        singleBrandOrders++;
      } else if (brandsInOrder.size > 1) {
        multiBrandOrders++;
        const combo = Array.from(brandsInOrder).sort().join(" + ");
        brandCombinations[combo] = (brandCombinations[combo] || 0) + 1;
      }
    });

    return {
      singleBrandOrders,
      multiBrandOrders,
      topCombinations: Object.entries(brandCombinations)
        .map(([combo, count]) => ({ combo, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  };

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

  // Unique customers
  const uniqueCustomers = new Set(
    ordersInRange.map(o => o.userId).filter(Boolean)
  ).size;

  /* ================= TOP SELLING ITEMS (ACROSS ALL BRANDS) ================= */
  const getTopSellingItems = () => {
    const itemStats = {};

    ordersInRange.forEach((o) => {
      o.cart?.forEach((item) => {
        const key = `${item.name}-${item.brand || o.brand || 'Unknown'}`;
        if (!itemStats[key]) {
          itemStats[key] = {
            name: item.name,
            brand: item.brand || o.brand || "Unknown",
            quantity: 0,
            revenue: 0,
          };
        }
        itemStats[key].quantity += Number(item.qty || 0);
        itemStats[key].revenue += Number(item.price || 0) * Number(item.qty || 0);
      });
    });

    return Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  };

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

  /* ================= BRAND COMPARISON OVER TIME ================= */
  const getBrandTrendData = () => {
    const days = timeRange === "weekly" ? 7 : 30;
    const data = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      data[key] = { date: key };
      BRANDS.forEach(brand => {
        data[key][brand] = 0;
      });
    }

    orders.forEach((o) => {
      if (!o.createdAt || !isDelivered(o.status)) return;
      const d = o.createdAt.toDate();
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      if (data[key]) {
        // Distribute revenue by brand
        const brandRevenue = {};
        let totalBrandRevenue = 0;

        o.cart?.forEach((item) => {
          const brand = item.brand || o.brand;
          if (brand && BRANDS.includes(brand)) {
            const itemTotal = Number(item.price || 0) * Number(item.qty || 0);
            brandRevenue[brand] = (brandRevenue[brand] || 0) + itemTotal;
            totalBrandRevenue += itemTotal;
          }
        });

        // If no brand info, use order brand
        if (totalBrandRevenue === 0 && o.brand && BRANDS.includes(o.brand)) {
          brandRevenue[o.brand] = Number(o.total || 0);
        }

        Object.entries(brandRevenue).forEach(([brand, revenue]) => {
          data[key][brand] += revenue;
        });
      }
    });

    return Object.values(data);
  };

  const hourlyData = getHourlySales();
  const dailyData = getDailySales();
  const brandPerformance = analyzeBrandData();
  const topItems = getTopSellingItems();
  const locationData = analyzeLocationData();
  const crossBrandAnalysis = analyzeCrossBrandOrders();
  const brandTrendData = getBrandTrendData();

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
      : totalRevenue > 0 ? "100.0" : "0.0";

  /* ================= BRAND REVENUE PIE CHART ================= */
  const brandPieData = brandPerformance.map(b => ({
    name: b.name,
    value: b.revenue,
  }));

  const COLORS = ["#FF6B6B", "#4ECDC4", "#FFD93D"];

  /* ================= UI ================= */
  return (
    <div className="admin-sales-container">
      {/* HEADER */}
      <div className="sales-header">
        <div>
          <h1>📊 Multi-Brand Sales Analytics</h1>
          <p>Real-time insights across Shrimmers, Peppanizze & Urban Wrap</p>
        </div>
        <div className="header-controls">
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
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>💰 Total Revenue</h4>
          <p className="kpi-value">₹{Number(totalRevenue).toFixed(0)}</p>
          <span className={Number(growth) >= 0 ? "positive" : "negative"}>
            {Number(growth) >= 0 ? "📈" : "📉"} {Math.abs(growth)}% vs previous
          </span>
        </div>

        <div className="kpi-card">
          <h4>📦 Total Orders</h4>
          <p className="kpi-value">{totalOrders}</p>
          <span className="subtext">
            {crossBrandAnalysis.multiBrandOrders} multi-brand orders
          </span>
        </div>

        <div className="kpi-card">
          <h4>💳 Avg Order Value</h4>
          <p className="kpi-value">₹{avgOrderValue}</p>
          <span className="subtext">Per transaction</span>
        </div>

        <div className="kpi-card">
          <h4>👥 Unique Customers</h4>
          <p className="kpi-value">{uniqueCustomers}</p>
          <span className="subtext">{totalItemsSold} items sold</span>
        </div>
      </div>

      {/* BRAND PERFORMANCE & DISTRIBUTION */}
      <div className="brand-overview-section">
        <div className="brand-performance-card">
          <h3>🏪 Brand Performance Comparison</h3>
          <div className="brand-list">
            {brandPerformance.map((brand, idx) => (
              <div key={brand.name} className="brand-item">
                <div className="brand-rank">#{idx + 1}</div>
                <div className="brand-info">
                  <p className="brand-name">{brand.name}</p>
                  <p className="brand-stats">
                    {brand.orders} orders • {brand.items} items • Avg: ₹{brand.avgOrderValue}
                  </p>
                </div>
                <div className="brand-revenue">₹{brand.revenue.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="brand-pie-card">
          <h3>📊 Revenue Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={brandPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {brandPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${Number(value).toFixed(0)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LOCATION ANALYTICS */}
      <div className="location-analytics-section">
        <h3>📍 Top Performing Locations</h3>
        <div className="location-grid">
          {locationData.map((loc, idx) => (
            <div key={idx} className="location-card">
              <div className="location-rank">#{idx + 1}</div>
              <div className="location-info">
                <h4 className="location-name">{loc.location}</h4>
                <div className="location-stats">
                  <span>📦 {loc.orders} orders</span>
                  <span>👥 {loc.customers} customers</span>
                </div>
              </div>
              <div className="location-revenue">₹{loc.revenue.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CROSS-BRAND INSIGHTS */}
      <div className="cross-brand-section">
        <div className="cross-brand-card">
          <h3>🔄 Cross-Brand Order Analysis</h3>
          <div className="cross-brand-stats">
            <div className="stat-item">
              <div className="stat-label">Single Brand Orders</div>
              <div className="stat-value">{crossBrandAnalysis.singleBrandOrders}</div>
            </div>
            <div className="stat-item highlight">
              <div className="stat-label">Multi-Brand Orders</div>
              <div className="stat-value">{crossBrandAnalysis.multiBrandOrders}</div>
            </div>
          </div>
          {crossBrandAnalysis.topCombinations.length > 0 && (
            <div className="combo-list">
              <h4>Popular Combinations:</h4>
              {crossBrandAnalysis.topCombinations.map((combo, idx) => (
                <div key={idx} className="combo-item">
                  <span className="combo-name">{combo.combo}</span>
                  <span className="combo-count">{combo.count} orders</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP SELLING ITEMS (ALL BRANDS) */}
      <div className="top-items-section">
        <h3>🔥 Top Selling Items (All Brands)</h3>
        <div className="items-grid">
          {topItems.map((item, idx) => (
            <div key={idx} className="item-card">
              <div className="item-rank">#{idx + 1}</div>
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="item-brand" style={{ 
                  color: BRAND_COLORS[item.brand] || '#666',
                  fontWeight: '600'
                }}>
                  {item.brand}
                </p>
              </div>
              <div className="item-stats">
                <div className="item-qty">{item.quantity} sold</div>
                <div className="item-revenue">₹{item.revenue.toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-section">
        {timeRange === "daily" && (
          <div className="chart-card full-width">
            <h3>⏰ Hourly Sales Pattern</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#FFD93D" name="Revenue (₹)" />
                <Bar dataKey="orders" fill="#4ECDC4" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="chart-card full-width">
          <h3>📈 Revenue Trend by Brand</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={brandTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Shrimmers" 
                stroke="#FF6B6B" 
                strokeWidth={3}
                name="Shrimmers"
              />
              <Line 
                type="monotone" 
                dataKey="Peppanizze" 
                stroke="#4ECDC4" 
                strokeWidth={3}
                name="Peppanizze"
              />
              <Line 
                type="monotone" 
                dataKey="Urban Wrap" 
                stroke="#FFD93D" 
                strokeWidth={3}
                name="Urban Wrap"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>📈 Overall Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#FF6B6B" 
                strokeWidth={3}
                name="Revenue (₹)"
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#4ECDC4" 
                strokeWidth={3}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ORDER HISTORY */}
      <div className="orders-table-section">
        <h3>📋 Recent Completed Orders</h3>
        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Brands</th>
                <th>Location</th>
                <th>Time</th>
                <th>Items</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ordersInRange.slice(0, 20).map((o) => {
                // Extract brands from order
                const orderBrands = new Set();
                o.cart?.forEach(item => {
                  const brand = item.brand || o.brand;
                  if (brand) orderBrands.add(brand);
                });
                if (orderBrands.size === 0 && o.brand) orderBrands.add(o.brand);
                
                const brandsText = Array.from(orderBrands).join(", ") || "N/A";
                const location = o.address?.area || o.address?.locality || o.location || "N/A";
                
                return (
                  <tr key={o.id}>
                    <td>#{o.orderId || o.id.slice(-6)}</td>
                    <td>
                      <div className="brands-cell">
                        {Array.from(orderBrands).map((brand, idx) => (
                          <span 
                            key={idx} 
                            className="brand-tag"
                            style={{ 
                              backgroundColor: `${BRAND_COLORS[brand]}20`,
                              color: BRAND_COLORS[brand] || '#1976d2',
                              borderColor: BRAND_COLORS[brand] || '#1976d2'
                            }}
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{location}</td>
                    <td>{o.createdAt?.toDate().toLocaleString()}</td>
                    <td>{o.cart?.length || 0} items</td>
                    <td className="revenue-cell">₹{Number(o.total || 0).toFixed(0)}</td>
                    <td>
                      <span className="status-badge delivered">✅ Completed</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}