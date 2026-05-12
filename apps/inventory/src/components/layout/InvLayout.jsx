// apps/inventory/src/components/layout/InvLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './InvLayout.css';

const NAV = [
  { section: null, links: [
    { label:'Dashboard',       path:'/' },
  ]},
  { section: 'Inventory', links: [
    { label:'Stock Control',   path:'/stock'           },
    { label:'Usage Tracker',   path:'/usage'           },
    { label:'Purchase Orders', path:'/purchase-orders' },
    { label:'Waste Log',       path:'/waste'           },
  ]},
  { section: 'Management', links: [
    { label:'Staff',           path:'/staff'     },
    { label:'Suppliers',       path:'/suppliers' },
    { label:'Cost Analysis',   path:'/cost'      },
    { label:'Reports',         path:'/reports'   },
  ]},
  { section: 'Intelligence', links: [
    { label:'AI Insights',     path:'/ai'   },
    { label:'Petpooja Sync',   path:'/sync', badge:'Soon' },
  ]},
];

export default function InvLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 1024);
  const [theme,       setTheme]       = useState(() => localStorage.getItem('inv-theme') || 'light');
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inv-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fn = () => { const m = window.innerWidth < 1024; setIsMobile(m); if (!m) setSidebarOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [location]);

  const isActive = path => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const go = path => { navigate(path); if (isMobile) setSidebarOpen(false); };
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const name     = profile?.name || user?.email?.split('@')[0] || 'User';
  const role     = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Staff';
  const initials = name.slice(0,2).toUpperCase();

  return (
    <div className="inv-app">

      {/* ── Sidebar ── */}
      <aside className={`inv-sb ${isMobile ? 'mob' : 'desk'} ${isMobile && sidebarOpen ? 'open' : ''}`}>

        {/* Brand */}
        <div className="inv-sb-brand">
          <div className="inv-sb-logo">BB</div>
          <div className="inv-sb-brand-text">
            <p className="inv-sb-brand-name">BlueBliss</p>
            <p className="inv-sb-brand-sub">Inventory</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="inv-sb-nav">
          {NAV.map((group, gi) => (
            <div key={gi} className="inv-sb-group">
              {group.section && <p className="inv-sb-section">{group.section}</p>}
              {group.links.map(link => (
                <button key={link.path}
                  className={`inv-sb-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => go(link.path)}>
                  <span className="inv-sb-link-dot" />
                  <span className="inv-sb-link-label">{link.label}</span>
                  {link.badge && <span className="inv-sb-badge">{link.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="inv-sb-user">
          <div className="inv-sb-user-inner">
            <div className="inv-sb-avatar">{initials}</div>
            <div className="inv-sb-user-info">
              <p className="inv-sb-user-name">{name}</p>
              <p className="inv-sb-user-role">{role}</p>
            </div>
            <button className="inv-sb-logout" onClick={handleLogout} title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {isMobile && sidebarOpen && <div className="inv-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="inv-main">

        {/* Topbar */}
        <header className="inv-topbar">
          {isMobile && (
            <button className="inv-hamburger" onClick={() => setSidebarOpen(p => !p)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          )}

          <div className="inv-topbar-live">
            <span className="inv-live-dot" />
            <span className="inv-live-text">Live</span>
          </div>

          <div className="inv-topbar-right">
            {/* Theme */}
            <button className="inv-icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark'
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>

            {/* User pill */}
            <div className="inv-user-pill" onClick={() => setUserMenuOpen(p => !p)}>
              <div className="inv-topbar-avatar">{initials}</div>
              <div className="inv-user-pill-info">
                <p className="inv-user-pill-name">{name}</p>
                <p className="inv-user-pill-role">{role} · {user?.email}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {userMenuOpen && (
              <>
                <div className="inv-user-menu">
                  <div className="inv-um-profile">
                    <div className="inv-um-avatar">{initials}</div>
                    <div>
                      <p className="inv-um-name">{name}</p>
                      <p className="inv-um-email">{user?.email}</p>
                    </div>
                  </div>
                  <div className="inv-um-divider"/>
                  <button className="inv-um-item" onClick={()=>{setUserMenuOpen(false);setTheme(t=>t==='dark'?'light':'dark');}}>
                    {theme==='dark'?'Light Mode':'Dark Mode'}
                  </button>
                  <div className="inv-um-divider"/>
                  <button className="inv-um-item inv-um-signout" onClick={handleLogout}>Sign Out</button>
                </div>
                <div className="inv-um-backdrop" onClick={() => setUserMenuOpen(false)}/>
              </>
            )}
          </div>
        </header>

        <main className="inv-content"><Outlet /></main>
      </div>
    </div>
  );
}