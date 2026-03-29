import React from 'react';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Footer({ theme }) {
  return (
    <footer className={`footer ${theme}`}>
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Chale-Ham - Expense sharing for friends</p>
      </div>
    </footer>
  );
}

export default Footer;
