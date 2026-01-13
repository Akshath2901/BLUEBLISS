// AdminLayout.jsx - Mobile Hamburger Menu (Mobile/Tab Only)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './admin.css';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      // Close sidebar when resizing to desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Auto-close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking on overlay
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Handle nav link click
  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { label: '📊 Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: '📋 Orders', path: '/admin/orders', icon: '📋' },
    { label: '💰 Sales', path: '/admin/sales', icon: '💰' },
    { label: '🎉 Offers', path: '/admin/offers', icon: '🎉' },
    { label: '📦 Stock', path: '/admin/stock', icon: '📦' },
    { label: '🥬 Ingredients', path: '/admin/ingredients', icon: '🥬' },
    { label: '🍔 Menu Items', path: '/admin/menu-ingredients', icon: '🍔' },
    { label: '🔄 Migrate Menu', path: '/admin/migrate-menu', icon: '🔄' },
     { label: '🔧 Setup Tools', path: '/admin/migrate-menu', icon: '🔧' },
    { label: '👥 Users', path: '/admin/users', icon: '👥' },
    { label: '📈 Reports', path: '/admin/reports', icon: '📈' },
    { label: '⚙️ Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="admin-app">
      {/* Sidebar - Always visible on desktop, toggle on mobile/tab */}
      <aside className={`admin-sidebar ${isMobile && sidebarOpen ? 'active' : ''} ${isMobile ? 'mobile-sidebar' : 'desktop-sidebar'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h2 className="brand">BlueBliss</h2>
          <p className="role">Admin Panel</p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(link.path)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            className="nav-link logout-btn"
            onClick={() => {
              // Add logout logic here
              navigate('/login');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay (Mobile/Tab only) */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          {/* Hamburger Button - Only shows on mobile/tablet */}
          {isMobile && (
            <button
              className={`hamburger-btn ${sidebarOpen ? 'active' : ''}`}
              onClick={toggleSidebar}
              aria-label="Toggle Menu"
              title="Toggle Sidebar"
            >
              ☰
            </button>
          )}

          {/* Logo/Title */}
          <h2 className="topbar-title">BlueBliss — Admin Panel</h2>

          {/* Admin Info */}
          <div className="admin-info">
            <span className="admin-name">Admin</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {/* Outlet for nested routes */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;