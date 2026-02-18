// src/jsx/admin/AdminLayout.jsx
// ✅ UPDATED: Offers removed (managed in Super Admin panel now)

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './admin.css';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ✅ Offers removed — now managed exclusively in Super Admin panel
  const navLinks = [
    { label: 'Dashboard',      path: '/admin',                  icon: '📊' },
    { label: 'Orders',         path: '/admin/orders',           icon: '📋' },
    { label: 'Sales',          path: '/admin/sales',            icon: '💰' },
    { label: 'Stock',          path: '/admin/stock',            icon: '📦' },
    { label: 'Ingredients',    path: '/admin/ingredients',      icon: '🥬' },
    { label: 'Menu Items',     path: '/admin/menu-ingredients', icon: '🍔' },
    { label: 'Menu Stock',     path: '/admin/menu-stock',       icon: '🔴' },
    { label: 'Migrate Menu',   path: '/admin/migrate-menu',     icon: '🔄' },
    { label: 'Setup Tools',    path: '/admin/migrate-menu',     icon: '🔧' },
    { label: 'Users',          path: '/admin/users',            icon: '👥' },
    { label: 'Reports',        path: '/admin/reports',          icon: '📈' },
    { label: 'Settings',       path: '/admin/settings',         icon: '⚙️' },
  ];

  return (
    <div className="admin-app">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobile && sidebarOpen ? 'active' : ''} ${isMobile ? 'mobile-sidebar' : 'desktop-sidebar'}`}>
        <div className="sidebar-header">
          <h2 className="brand">BlueBliss</h2>
          <p className="role">Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <button
              key={link.path + link.label}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(link.path)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-link logout-btn"
            onClick={() => { navigate('/login'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-topbar">
          {isMobile && (
            <button
              className={`hamburger-btn ${sidebarOpen ? 'active' : ''}`}
              onClick={toggleSidebar}
              aria-label="Toggle Menu"
            >
              ☰
            </button>
          )}
          <h2 className="topbar-title">BlueBliss — Admin Panel</h2>
          <div className="admin-info">
            <span className="admin-name">Admin</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;