import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Header({ user, logout, theme, toggleTheme }) {
  const loc = useLocation();
  const is = (path) => loc.pathname === path ? ' active' : '';

  return (
    <nav className="header-nav">
      <Link to="/dashboard" className="header-logo">
        <span className="header-logo-icon">✈️</span>
        <span className="header-logo-text">Chale Ham</span>
      </Link>

      <div className="header-center">
        <Link to="/dashboard" className={`header-nav-link${is('/dashboard')}`}>Dashboard</Link>
        <Link to="/trips"     className={`header-nav-link${is('/trips')}`}>Trips</Link>
        {user.isAdmin && (
          <Link to="/admin"   className={`header-nav-link${is('/admin')}`}>Admin</Link>
        )}
        <Link to="/how-to-use" className={`header-nav-link${is('/how-to-use')}`}>Guide</Link>
      </div>

      <div className="header-right">
        <button onClick={toggleTheme} className="header-theme-btn" title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <Link to="/profile" className="header-avatar-wrap">
          {user.picture
            ? <img src={user.picture} alt="" className="header-avatar" />
            : <div className="avatar-initials">{user.name?.charAt(0).toUpperCase()}</div>
          }
        </Link>

        <button onClick={logout} className="header-logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Header;
