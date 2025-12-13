import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// ---------------- USER COMPONENTS ----------------
import Navbar from "./jsx/Navbar";
import Home from "./jsx/home";
import About from "./jsx/About";
import Contact from "./jsx/Contact";
import SearchResults from "./jsx/SearchResults";
import CartPage from "./jsx/CartPage";
import Billing from "./jsx/Billing";
import PaymentGateway from "./jsx/PaymentGateway";
import Payment from "./jsx/Payment";
import PaymentSuccess from "./jsx/PaymentSuccess";
import OrderTracking from "./jsx/OrderTracking";
import ProtectedRoute from "./jsx/ProtectedRoute";

// ---------------- USER PROFILE COMPONENTS ----------------
import UserProfile from "./jsx/UserProfile";
import MyOrders from "./jsx/profile/MyOrders";
import OrderDetails from "./jsx/profile/OrderDetails";
import MyRatings from "./jsx/profile/MyRatings";
import Help from "./jsx/profile/Help";

// ---------------- ADMIN COMPONENTS ----------------
import AdminLogin from "./jsx/admin/AdminLogin";
import AdminProtectedRoute from "./jsx/admin/AdminProtectedRoute";
import AdminLayout from "./jsx/admin/AdminLayout";
import AdminDashboard from "./jsx/admin/AdminDashboard";
import AdminOrders from "./jsx/admin/AdminOrders";
import AdminOrderDetails from "./jsx/admin/AdminOrdersDetails";
import AdminSales from "./jsx/admin/AdminSales";
import AdminSettings from "./jsx/admin/AdminSettings";
import SwiggyStyleMenu from "./jsx/SwiggyStyleMenu";
import Peppa from "./jsx/Peppapage";
import UrbanWrap from "./jsx/Urbanpage";

// ---------------- LAYOUT (HIDE NAVBAR IN ADMIN) ----------------
function Layout({ children }) {
  const location = useLocation();

  const hideNavbarRoutes = [
    "/admin-login",
  ];

  // Hide navbar for all /admin..
  if (location.pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>

          {/* ---------------- USER ROUTES ---------------- */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<SearchResults />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route path="/billing" element={<Billing />} />
          <Route path="/payment-gateway" element={<PaymentGateway />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/menu/shrimmers" element={<SwiggyStyleMenu />} />
          <Route path="/menu/peppanizze" element={<Peppa/>} />
          <Route path="/menu/urbanwrap" element={<UrbanWrap />} />

          {/* ---------------- USER PROFILE ROUTES ---------------- */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order-details/:id" element={<OrderDetails />} />
          <Route path="/my-ratings" element={<MyRatings />} />
          <Route path="/help" element={<Help />} />

          {/* ---------------- ADMIN LOGIN ---------------- */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ---------------- ADMIN ROUTES (PROTECTED) ---------------- */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="order/:id" element={<AdminOrderDetails />} />
            <Route path="sales" element={<AdminSales />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

        </Routes>
      </Layout>
    </Router>
  );
}
