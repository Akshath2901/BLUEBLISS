import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "../admin/admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-app">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-topbar">
          <h2>BlueBliss — Admin Panel</h2>
        </div>

        <div className="admin-content">
          {/* Use nested routing or Outlet for children pages */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
