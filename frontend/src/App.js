import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TripDetail from './pages/TripDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import HowToUse from './pages/HowToUse';
import Trips from './pages/Trips';
import NotFound from './pages/NotFound';
import WelcomePage from './pages/WelcomePage';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { logout(); }
    }
    const interceptor = axios.interceptors.response.use(
      r => r,
      err => {
        if (err.response?.status === 401) logout();
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('showWelcome', 'true');
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <Router>
      <div className={`App ${theme}`}>
        {user && <Header user={user} logout={logout} theme={theme} toggleTheme={toggleTheme} />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={user ? <Navigate to={localStorage.getItem('showWelcome') ? '/welcome' : '/dashboard'} /> : <LoginPage login={login} />} />
            <Route path="/welcome" element={user ? <WelcomePage user={user} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            <Route path="/trip/:tripName" element={user ? <TripDetail user={user} /> : <Navigate to="/login" />} />
            <Route path="/trips" element={user ? <Trips user={user} /> : <Navigate to="/login" />} />
            <Route path="/how-to-use" element={user ? <HowToUse /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user ? (localStorage.getItem('showWelcome') ? '/welcome' : '/dashboard') : '/login'} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {user && <Footer />}
      </div>
      <ToastContainer position="bottom-right" theme={theme} autoClose={3000} />
    </Router>
  );
}

export default App;
