import React from 'react';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Footer() {
  return (
    <footer className="footer">
      <span className="footer-text">Chale Ham &copy; {new Date().getFullYear()}</span>
    </footer>
  );
}

export default Footer;
