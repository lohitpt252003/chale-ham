import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function WelcomePage({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('showWelcome');
    const timer = setTimeout(() => navigate('/dashboard'), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-page">
      <div className="welcome-card">
        {user.picture
          ? <img src={user.picture} alt="Profile" className="welcome-avatar" />
          : <div className="welcome-avatar-initials">{user.name?.charAt(0).toUpperCase()}</div>
        }
        <div className="welcome-greeting">Welcome back,</div>
        <div className="welcome-name">{user.name}</div>
        <div className="welcome-sub">Ready to split some bills?</div>
        <button className="btn btn-primary welcome-btn" onClick={() => navigate('/dashboard')}>
          Go to Dashboard →
        </button>
        <div className="welcome-hint">Redirecting automatically…</div>
      </div>
    </div>
  );
}

export default WelcomePage;
