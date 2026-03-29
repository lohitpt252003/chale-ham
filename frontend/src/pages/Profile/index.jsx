import React from 'react';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Profile({ user, theme }) {
  if (!user) return <div>Please log in</div>;

  return (
    <div className={`profile-container ${theme}`}>
      <h2>User Profile</h2>
      <div className="profile-card">
        {user.picture && <img src={user.picture} alt="Profile" className="profile-large-avatar" />}
        <div className="profile-info">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Admin Rights:</strong> {user.is_admin ? 'Yes' : 'No'}</p>
          <p><strong>Status:</strong> <span style={{ color: user.is_active ? 'green' : 'red' }}>{user.is_active ? 'Active' : 'Inactive'}</span></p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
