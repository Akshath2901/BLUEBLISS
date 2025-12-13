import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

export default function AdminSidebar() {
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-top">
        <div className="brand">BlueBliss</div>
        <div className="role">Admin</div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin" end className="nav-link">
          Dashboard
        </NavLink>
        <NavLink to="/admin/orders" className="nav-link">
          Orders
        </NavLink>
        <NavLink to="/admin/sales" className="nav-link">
          Sales
        </NavLink>
        <NavLink to="/admin/settings" className="nav-link">
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
}
