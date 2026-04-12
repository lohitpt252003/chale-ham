import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FEATURES = [
  { icon: '💸', title: 'Track Expenses',    desc: 'Log every expense with categories, notes, and flexible splits.' },
  { icon: '⚖️', title: 'Auto Balances',     desc: 'See exactly who owes whom — recalculated on every change.' },
  { icon: '✅', title: 'Settle Up',          desc: 'Record payments and watch balances clear in real time.' },
  { icon: '📊', title: 'Trip Stats',         desc: 'Per-person and per-category breakdowns at a glance.' },
  { icon: '📦', title: 'Free Storage',       desc: 'Active trips in MongoDB, archived trips in GitHub — zero cost.' },
  { icon: '🌙', title: 'Light & Dark Mode', desc: 'Looks great either way, remembered per browser.' },
];

function LoginPage({ login }) {
  const onSuccess = async (response) => {
    const token = response.credential;
    localStorage.setItem('token', token);
    try {
      const res = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      login({ ...res.data, isAdmin: res.data.is_admin, isActive: res.data.is_active });
    } catch (err) {
      localStorage.removeItem('token');
      toast.error('Login failed. Try again.');
    }
  };

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true">
          <div className="landing-orb landing-orb-1" />
          <div className="landing-orb landing-orb-2" />
        </div>

        <div className="landing-hero-content">
          <div className="landing-badge">✈️ For trips with friends</div>
          <h1 className="landing-title">
            Split expenses.<br />
            <span className="landing-title-accent">Stay friends.</span>
          </h1>
          <p className="landing-subtitle">
            Chale Ham makes it effortless to track shared costs, settle debts, and keep everyone on the same page — no spreadsheets needed.
          </p>
          <div className="landing-login-wrap">
            <GoogleLogin
              onSuccess={onSuccess}
              onError={() => toast.error('Google login failed')}
            />
          </div>
          <p className="landing-login-hint">No password needed · Sign in with Google</p>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h2 className="landing-features-title">Everything you need for group trips</h2>
        <div className="landing-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <div className="landing-feature-title">{f.title}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Chale Ham</span>
      </footer>
    </div>
  );
}

export default LoginPage;
