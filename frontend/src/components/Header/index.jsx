import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Header({ user, logout, theme, toggleTheme }) {
  return (
    <nav className={`header-nav ${theme}`}>
      <div className="header-left">
        <Link to="/dashboard" className="header-logo">
          Chale-Ham
        </Link>
      </div>
      <div className="header-right">
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        {user.isAdmin && (
          <Link to="/admin" className="header-link">Admin</Link>
        )}
        <Link to="/profile" className="header-link">Profile</Link>
        <span className="header-user">Hello, {user.name}</span>
        {user.picture && <img src={user.picture} alt="profile" className="header-avatar" />}
        <button onClick={logout} className="header-logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Header;
