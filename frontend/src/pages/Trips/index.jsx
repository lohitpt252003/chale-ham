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

function Trips({ user }) {
  const [myTrips, setMyTrips]       = useState([]);
  const [allTrips, setAllTrips]     = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [tripStatus, setTripStatus] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [joiningTrips, setJoiningTrips] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const reqs = [
        axios.get(`${API}/my-trips`,   { headers: authHeader() }),
        axios.get(`${API}/trips`,      { headers: authHeader() }),
        axios.get(`${API}/my-requests`,{ headers: authHeader() }),
      ];
      if (user.isAdmin) reqs.push(axios.get(`${API}/trips/status`, { headers: authHeader() }));

      const results = await Promise.all(reqs);
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

  const requestJoin = async (tripName) => {
    setJoiningTrips(p => ({ ...p, [tripName]: true }));
    try {
      const res = await axios.post(`${API}/trips/${tripName}/join`, {}, { headers: authHeader() });
      toast.info(res.data.message);
      fetchData();
    } catch {
      toast.error('Failed to send join request.');
    } finally {
      setJoiningTrips(p => ({ ...p, [tripName]: false }));
    }
  };

  const otherTrips = allTrips.filter(t => !myTrips.includes(t));

  const filteredMine  = myTrips.filter(t => t.toLowerCase().includes(search.toLowerCase()));
  const filteredOther = otherTrips.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-screen">Loading trips...</div>;

  return (
    <div className="trips-page">
      <div className="trips-page-header">
        <div>
          <h2 className="trips-page-title">All Trips</h2>
          <p className="trips-page-sub">{myTrips.length} trip{myTrips.length !== 1 ? 's' : ''} joined</p>
        </div>
        <input
          className="trips-page-search"
          type="text"
          placeholder="Search trips..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* My Trips */}
      <section className="trips-section">
        <h3 className="trips-section-label">Your Trips</h3>
        {filteredMine.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2rem' }}>🧳</div>
            <p>{search ? 'No trips match your search.' : 'You haven\'t joined any trips yet.'}</p>
          </div>
        ) : (
          <div className="trips-grid">
            {filteredMine.map(trip => (
              <Link key={trip} to={`/trip/${trip}`} className="trips-card">
                <div className="trips-card-top">
                  <div className="trips-card-emoji">🗺️</div>
                  {user.isAdmin && trip in tripStatus && (
                    <span className={`trips-card-tier ${tripStatus[trip] ? 'active' : 'archived'}`}>
                      {tripStatus[trip] ? '⚡' : '📦'}
                    </span>
                  )}
                </div>
                <div className="trips-card-name">{trip}</div>
                <div className="trips-card-hint">Open trip →</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Discover */}
      {filteredOther.length > 0 && (
        <section className="trips-section">
          <h3 className="trips-section-label">Discover</h3>
          <div className="trips-grid">
            {filteredOther.map(trip => (
              <div key={trip} className="trips-card trips-card-discover">
                <div className="trips-card-top">
                  <div className="trips-card-emoji">✈️</div>
                </div>
                <div className="trips-card-name">{trip}</div>
                {myRequests.includes(trip) ? (
                  <span className="badge badge-amber" style={{ marginTop: '8px' }}>Pending</span>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm trips-card-join-btn"
                    onClick={() => requestJoin(trip)}
                    disabled={joiningTrips[trip]}
                  >
                    {joiningTrips[trip] ? 'Requesting...' : 'Request to Join'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Trips;
