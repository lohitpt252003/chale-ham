import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function NotFound({ theme }) {
  return (
    <div className={`not-found-container ${theme}`}>
      <h1>404 - Not Found</h1>
      <p>Oops! The page you are looking for doesn't exist.</p>
      <Link to="/dashboard" className="back-link">Go to Dashboard</Link>
    </div>
  );
}

export default NotFound;
