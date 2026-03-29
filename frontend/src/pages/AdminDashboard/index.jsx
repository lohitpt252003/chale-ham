import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function AdminDashboard({ user, theme }) {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]); // Array of {trip, requests[]}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const [uRes, tRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setUsers(uRes.data);
      
      // Fetch requests for all trips
      const reqPromises = tRes.data.map(trip => 
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${trip}/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => ({ trip, reqs: res.data }))
      );
      const allReqs = await Promise.all(reqPromises);
      setRequests(allReqs.filter(r => r.reqs.length > 0));
      
    } catch (err) {
      console.error(err);
      setError("Failed to fetch admin data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (email, currentStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/users/${email}/status?is_active=${!currentStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status.");
    }
  };

  const handleRequest = async (trip, email, action) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${trip}/requests/${email}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} request.`);
    }
  };

  if (!user.isAdmin) {
    return <div className={`admin-denied ${theme}`}>Access Denied</div>;
  }

  return (
    <div className={`admin-dashboard-container ${theme}`}>
      <h2>Admin Dashboard</h2>
      {error && <p className="error-message">{error}</p>}
      
      <h3>Pending Trip Requests</h3>
      {requests.length === 0 ? <p>No pending requests.</p> : (
        <div className="requests-section">
          {requests.map(tripReq => (
            <div key={tripReq.trip} className="trip-request-group">
              <h4>Trip: {tripReq.trip}</h4>
              <ul className="req-list">
                {tripReq.reqs.map(r => (
                  <li key={r.email} className="req-item">
                    <span>{r.name} ({r.email})</span>
                    <div className="req-btns">
                      <button onClick={() => handleRequest(tripReq.trip, r.email, 'approve')} className="approve-btn">Approve</button>
                      <button onClick={() => handleRequest(tripReq.trip, r.email, 'reject')} className="reject-btn">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: '40px' }}>User Management</h3>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.email}>
                  <td className="user-cell">
                    {u.picture && <img src={u.picture} alt="" className="user-avatar" />}
                    {u.name}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.is_admin ? 'Yes' : 'No'}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {u.email !== user.email && (
                      <button onClick={() => toggleUserStatus(u.email, u.is_active)} className="status-toggle-btn">
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
