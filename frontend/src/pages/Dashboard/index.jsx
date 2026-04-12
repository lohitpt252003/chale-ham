import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

function Dashboard({ user }) {
  const [myTrips, setMyTrips] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [tripStatus, setTripStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [newTripName, setNewTripName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joiningTrips, setJoiningTrips] = useState({});

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API}/my-trips`, { headers: authHeader() }),
        axios.get(`${API}/trips`, { headers: authHeader() }),
        axios.get(`${API}/my-requests`, { headers: authHeader() }),
      ];
      if (user.isAdmin) {
        requests.push(axios.get(`${API}/trips/status`, { headers: authHeader() }));
      }
      const results = await Promise.all(requests);
      setMyTrips(results[0].data);
      setAllTrips(results[1].data);
      setMyRequests(results[2].data);
      if (user.isAdmin && results[3]) {
        const map = {};
        results[3].data.forEach(t => { map[t.name] = t.is_active; });
        setTripStatus(map);
      }
    } catch {
      toast.error('Failed to load trips.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;
    setCreating(true);
    try {
      await axios.post(`${API}/trips?trip_name=${encodeURIComponent(newTripName.trim())}`, {}, { headers: authHeader() });
      setNewTripName('');
      toast.success('Trip created!');
      fetchTrips();
    } catch {
      toast.error('Failed to create trip.');
    } finally {
      setCreating(false);
    }
  };

  const requestJoin = async (tripName) => {
    setJoiningTrips(p => ({ ...p, [tripName]: true }));
    try {
      const res = await axios.post(`${API}/trips/${tripName}/join`, {}, { headers: authHeader() });
      toast.info(res.data.message);
      fetchTrips();
    } catch {
      toast.error('Failed to send join request.');
    } finally {
      setJoiningTrips(p => ({ ...p, [tripName]: false }));
    }
  };

  const otherTrips = allTrips.filter(t => !myTrips.includes(t));

  if (loading) return <div className="loading-screen">Loading trips...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Trips</h2>
        {user.isAdmin && (
          <form onSubmit={handleCreateTrip} className="dashboard-create-form">
            <input
              className="dashboard-create-input"
              type="text"
              placeholder="New trip name..."
              value={newTripName}
              onChange={e => setNewTripName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : '+ Create'}
            </button>
          </form>
        )}
      </div>

      {myTrips.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '2rem' }}>🧳</div>
          <p>{user.isAdmin ? 'Create your first trip above.' : 'Request to join a trip below.'}</p>
        </div>
      ) : (
        <div className="dashboard-trips-grid">
          {myTrips.map(trip => (
            <Link key={trip} to={`/trip/${trip}`} className="dashboard-trip-card">
              <div className="dashboard-trip-card-icon">🗺️</div>
              <div className="dashboard-trip-card-name">{trip}</div>
              {user.isAdmin && trip in tripStatus && (
                <div className={`dashboard-trip-card-storage ${tripStatus[trip] ? 'active' : 'archived'}`}>
                  {tripStatus[trip] ? '⚡ MongoDB' : '📦 Archived'}
                </div>
              )}
              <div className="dashboard-trip-card-hint">View details →</div>
            </Link>
          ))}
        </div>
      )}

      {otherTrips.length > 0 && (
        <div className="dashboard-discover-section">
          <h2>Discover Trips</h2>
          <div className="dashboard-trips-grid">
            {otherTrips.map(trip => (
              <div key={trip} className="dashboard-discover-card">
                <div className="dashboard-discover-card-icon">✈️</div>
                <div className="dashboard-discover-card-name">{trip}</div>
                {myRequests.includes(trip) ? (
                  <span className="badge badge-amber">Request Pending</span>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm dashboard-join-btn"
                    onClick={() => requestJoin(trip)}
                    disabled={joiningTrips[trip]}
                  >
                    {joiningTrips[trip] ? 'Requesting...' : 'Request to Join'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
