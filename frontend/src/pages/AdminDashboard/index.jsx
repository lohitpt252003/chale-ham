import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingTrip, setProcessingTrip] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, tRes] = await Promise.all([
        axios.get(`${API}/users`, { headers: authHeader() }),
        axios.get(`${API}/trips/status`, { headers: authHeader() }),
      ]);
      setUsers(uRes.data);
      setTrips(tRes.data);

      const reqData = await Promise.all(
        tRes.data.map(t =>
          axios.get(`${API}/trips/${t.name}/requests`, { headers: authHeader() })
            .then(r => ({ trip: t.name, reqs: r.data }))
            .catch(() => ({ trip: t.name, reqs: [] }))
        )
      );
      setRequests(reqData.filter(r => r.reqs.length > 0));
    } catch {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (email, current) => {
    try {
      await axios.put(`${API}/users/${email}/status?is_active=${!current}`, {}, { headers: authHeader() });
      toast.success(`User ${!current ? 'activated' : 'deactivated'}.`);
      fetchData();
    } catch { toast.error('Failed to update user.'); }
  };

  const toggleTripStatus = async (tripName, current) => {
    setProcessingTrip(tripName);
    try {
      await axios.put(`${API}/trips/${tripName}/status?is_active=${!current}`, {}, { headers: authHeader() });
      toast.success(`Trip migrated to ${!current ? 'MongoDB' : 'GitHub archive'}.`);
      fetchData();
    } catch { toast.error('Failed to migrate trip.'); }
    finally { setProcessingTrip(null); }
  };

  const handleRequest = async (trip, email, action) => {
    try {
      await axios.post(`${API}/trips/${trip}/requests/${email}/${action}`, {}, { headers: authHeader() });
      toast.success(`Request ${action}d.`);
      fetchData();
    } catch { toast.error(`Failed to ${action} request.`); }
  };

  if (loading) return <div className="loading-screen">Loading admin panel...</div>;

  const pendingCount = requests.reduce((s, r) => s + r.reqs.length, 0);

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {/* Join Requests */}
      <div className="admin-dashboard-section">
        <div className="admin-dashboard-section-header">
          <h3>Join Requests</h3>
          {pendingCount > 0 && <span className="badge badge-amber">{pendingCount} pending</span>}
        </div>
        {requests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No pending requests.
          </div>
        ) : requests.map(tripReq => (
          <div key={tripReq.trip} className="admin-dashboard-req-group">
            <div className="admin-dashboard-req-title">{tripReq.trip}</div>
            {tripReq.reqs.map(r => (
              <div key={r.email} className="admin-dashboard-req-item">
                <div className="avatar-initials">{r.name.charAt(0).toUpperCase()}</div>
                <div className="admin-dashboard-req-info">
                  <div className="admin-dashboard-req-name">{r.name}</div>
                  <div className="admin-dashboard-req-email">{r.email}</div>
                </div>
                <div className="admin-dashboard-req-actions">
                  <button className="btn btn-success btn-sm" onClick={() => handleRequest(tripReq.trip, r.email, 'approve')}>Approve</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleRequest(tripReq.trip, r.email, 'reject')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Trip Storage */}
      <div className="admin-dashboard-section">
        <div className="admin-dashboard-section-header">
          <h3>Trip Storage Tier</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Trip</th><th>Storage</th><th>Action</th></tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.name}>
                  <td className="fw-600">{t.name}</td>
                  <td>
                    <span className={`badge ${t.is_active ? 'badge-green' : 'badge-accent'}`}>
                      {t.is_active ? '⚡ MongoDB' : '📦 GitHub Archive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleTripStatus(t.name, t.is_active)}
                      disabled={processingTrip === t.name}
                    >
                      {processingTrip === t.name ? 'Migrating...' : t.is_active ? 'Archive to GitHub' : 'Cache in MongoDB'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users */}
      <div className="admin-dashboard-section">
        <div className="admin-dashboard-section-header">
          <h3>User Management</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.email}>
                  <td>
                    <div className="admin-dashboard-user-cell">
                      {u.picture
                        ? <img src={u.picture} alt="" className="avatar" />
                        : <div className="avatar-initials">{u.name?.charAt(0).toUpperCase()}</div>
                      }
                      {u.name}
                    </div>
                  </td>
                  <td className="color-muted" style={{ fontSize: '0.85rem' }}>{u.email}</td>
                  <td>
                    {u.is_admin
                      ? <span className="badge badge-accent">Admin</span>
                      : <span className="badge badge-muted">Member</span>}
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {u.email !== user.email ? (
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-ghost' : 'btn-success'}`}
                        style={u.is_active ? { color: 'var(--red)', borderColor: 'var(--red)' } : {}}
                        onClick={() => toggleUserStatus(u.email, u.is_active)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : <span className="color-muted" style={{ fontSize: '0.8rem' }}>You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
