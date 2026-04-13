import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          FaceAttend
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/dashboard" className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}>Dashboard</Link>
              <Link to="/mark-attendance" className={`nav-link${isActive('/mark-attendance') ? ' active' : ''}`}>Mark Attendance</Link>
              <Link to="/face-register" className={`nav-link${isActive('/face-register') ? ' active' : ''}`}>Register Face</Link>
              <Link to="/attendance-history" className={`nav-link${isActive('/attendance-history') ? ' active' : ''}`}>History</Link>
              <Link to="/settings" className={`nav-link${isActive('/settings') ? ' active' : ''}`}>Settings</Link>
              <div className="nav-user">
                <span className="nav-user-name">{user.name}</span>
                <div className="nav-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <button onClick={logout} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        {user ? (
          <>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/mark-attendance" onClick={() => setMobileMenuOpen(false)}>Mark Attendance</Link>
            <Link to="/face-register" onClick={() => setMobileMenuOpen(false)}>Register Face</Link>
            <Link to="/attendance-history" onClick={() => setMobileMenuOpen(false)}>History</Link>
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
            <div className="mobile-menu-divider">
              <span style={{ color: 'var(--text-primary)' }}>{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-ghost"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
