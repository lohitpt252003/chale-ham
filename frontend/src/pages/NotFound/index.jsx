import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-icon">✈️</div>
      <h1 className="not-found-title">404 — Lost in transit</h1>
      <p className="not-found-sub">This page doesn't exist.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  );
}

export default NotFound;
