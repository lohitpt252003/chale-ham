import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Dashboard({ user, theme }) {
  const [myTrips, setMyTrips] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTripName, setNewTripName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const [myRes, allRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/my-trips`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setMyTrips(myRes.data);
      setAllTrips(allRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch trips.");
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async () => {
    if (!newTripName) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips?trip_name=${newTripName}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTripName('');
      fetchTrips();
    } catch (err) {
      console.error(err);
      alert("Failed to create trip.");
    }
  };

  const joinTrip = async (tripName) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${tripName}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to send join request.");
    }
  };

  const otherTrips = allTrips.filter(t => !myTrips.includes(t));

  return (
    <div className={`dashboard-container ${theme}`}>
      <h2>Your Trips</h2>
      {error && <p className="error-message">{error}</p>}
      {loading ? <p>Loading...</p> : (
        <div className="trips-grid">
          {myTrips.length === 0 ? <p>No trips yet.</p> : myTrips.map(trip => (
            <Link key={trip} to={`/trip/${trip}`} className="trip-card-link">
              <div className="trip-card">
                <h3>{trip}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}

      {otherTrips.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2>Discover Trips</h2>
          <div className="trips-grid">
            {otherTrips.map(trip => (
              <div key={trip} className="trip-card discovery-card">
                <h3>{trip}</h3>
                <button onClick={() => joinTrip(trip)} className="join-btn">Request to Join</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.isAdmin && (
        <div className="admin-panel">
          <h3>Admin Panel: Create Trip</h3>
          <div className="create-trip-form">
            <input 
              type="text" 
              placeholder="Trip Name" 
              value={newTripName} 
              onChange={(e) => setNewTripName(e.target.value)}
              className="trip-name-input"
            />
            <button onClick={createTrip} className="create-btn">Create New Trip</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
