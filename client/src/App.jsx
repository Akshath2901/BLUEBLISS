import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

/* ================ CONTEXT PROVIDERS ================ */
import { NavbarOffersProvider } from "./context/NavbarOffersContext.jsx";
import { HomeOffersProvider } from "./context/HomeOffersContext.jsx";
import { LoyaltyProvider } from "./context/LoyaltyContext.jsx";
import ComboBuilder from "./jsx/ComboBuilder.jsx";
import { VegFilterProvider } from "./context/VegFilterContext";

/* ================ USER COMPONENTS ================ */
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
import BottomNav from "./jsx/BottomNav";
import FloatingButtons from "./jsx/FloatingButtons";

/* ================ AUTH PAGES ================ */
import LoginPage from "./jsx/LoginPage";
import SignupPage from "./jsx/SignupPage";

/* ================ USER PROFILE ================ */
import Profile from "./jsx/Profile";
import MyOrders from "./jsx/profile/MyOrders";
import OrderDetails from "./jsx/profile/OrderDetails";
import MyRatings from "./jsx/profile/MyRatings";
import Help from "./jsx/profile/Help";
import RateOrder from './jsx/profile/RateOrder';

/* ================ ADMIN ================ */
import AdminLogin from "./jsx/admin/AdminLogin";
import AdminProtectedRoute from "./jsx/admin/AdminProtectedRoute";
import AdminLayout from "./jsx/admin/AdminLayout";
import AdminDashboard from "./jsx/admin/AdminDashboard";
import AdminOrders from "./jsx/admin/AdminOrders";
import AdminOrderDetails from "./jsx/admin/AdminOrdersDetails";
import AdminSales from "./jsx/admin/AdminSales";
import AdminSettings from "./jsx/admin/AdminSettings";
import AdminOffers from "./jsx/admin/AdminOffers";
import AdminStockManagement from "./jsx/admin/AdminStockManagement";
import AdminIngredients from "./jsx/admin/AdminIngredients";
import MenuIngredientsManager from './jsx/admin/MenuIngredientsManager';
import FixMenuTypeMigration from './jsx/admin/MenuTypeMigration';

/* ================ MENU ================ */
import SwiggyStyleMenu from "./jsx/SwiggyStyleMenu";
import Peppa from "./jsx/Peppapage";
import UrbanWrap from "./jsx/Urbanpage";

/* ================ AI COMPONENTS ================ */
import GlobalAISuggester from './jsx/GlobalAISuggester';
import AiToastNotification from './jsx/AiToastNotification';

/* ================ LAYOUT ================ */
function Layout({ children }) {
  const location = useLocation();

  if (
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login" ||
    location.pathname === "/signup"
  ) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <BottomNav />
      <FloatingButtons />
      <AiToastNotification />
      <GlobalAISuggester />
      {children}
    </>
  );
}

export default function App() {
  return (
    <NavbarOffersProvider>
      <HomeOffersProvider>
        <LoyaltyProvider>
           <VegFilterProvider>
          <Router>
            <Layout>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/combo-builder" element={<ComboBuilder />} />

                {/* MENU ROUTES */}
                <Route path="/menu/shrimmers" element={<SwiggyStyleMenu />} />
                <Route path="/menu/peppanizze" element={<Peppa />} />
                <Route path="/menu/urbanwrap" element={<UrbanWrap />} />

                {/* AUTH ROUTES */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* PROTECTED USER ROUTES */}
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/payment-gateway" element={<ProtectedRoute><PaymentGateway /></ProtectedRoute>} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                
                {/* ✅ ORDER TRACKING ROUTES - Both paths work */}
                <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="/track-order" element={<Navigate to="/order-tracking" replace />} />

                {/* PROFILE ROUTES */}
               <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
<Route path="/order-details/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
<Route path="/my-ratings" element={<ProtectedRoute><MyRatings /></ProtectedRoute>} />
<Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
{/* <Route path="/rate-order" element={<ProtectedRoute><RateOrder /></ProtectedRoute>} /> */}
                {/* ADMIN LOGIN */}
                <Route path="/admin-login" element={<AdminLogin />} />

                {/* ADMIN ROUTES */}
                <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="order/:id" element={<AdminOrderDetails />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="stock" element={<AdminStockManagement />} />
                  <Route path="ingredients" element={<AdminIngredients />} />
                  <Route path="menu-ingredients" element={<MenuIngredientsManager />} />
                  <Route path="migrate-menu" element={<FixMenuTypeMigration />} />
                </Route>
              </Routes>
            </Layout>
          </Router>
          </VegFilterProvider>
        </LoyaltyProvider>
      </HomeOffersProvider>
    </NavbarOffersProvider>
  );
}