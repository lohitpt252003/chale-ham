import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TripDetail from './pages/TripDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <Router>
      <div className={`App ${theme}`}>
        {user && <Header user={user} logout={logout} theme={theme} toggleTheme={toggleTheme} />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage login={login} theme={theme} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} theme={theme} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && user.isAdmin ? <AdminDashboard user={user} theme={theme} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile user={user} theme={theme} /> : <Navigate to="/login" />} />
            <Route path="/trip/:tripName" element={user ? <TripDetail user={user} theme={theme} /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            <Route path="*" element={<NotFound theme={theme} />} />
          </Routes>
        </main>
        {user && <Footer theme={theme} />}
      </div>
    </Router>
  );
}

export default App;
