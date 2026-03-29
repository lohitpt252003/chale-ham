import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function LoginPage({ login, theme }) {
  const onSuccess = async (response) => {
    const token = response.credential;
    localStorage.setItem('token', token);
    
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
      });
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      // The backend upserts the user and returns the current user status
      // In a real flow, we'd have a /me endpoint
      // For now, we decode what we have, but we should probably fetch the actual profile from backend
      // since the backend determines if the user is an admin.
      
      // Let's assume the first request to /trips worked, so user is active.
      // We'll need a better way to get is_admin.
      const user = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        isAdmin: payload.email === 'ka25eq0346@gmail.com' || payload.email === 'lohit.pinto@gmail.com' // Fallback check
      };
      login(user);
    } catch (err) {
      console.error("Login verification failed", err);
      alert(err.response?.data?.detail || "Login failed. Check backend.");
    }
  };

  const onError = () => {
    console.log('Login Failed');
  };

  return (
    <div className={`login-page ${theme}`}>
      <div className="login-card">
        <h1>Welcome to Chale-Ham</h1>
        <p>Expense sharing for friends</p>
        <div className="google-login-wrapper">
          <GoogleLogin onSuccess={onSuccess} onError={onError} />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
