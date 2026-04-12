import React from 'react';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function Profile({ user }) {
  if (!user) return null;

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      <div className="profile-card">
        {user.picture
          ? <img src={user.picture} alt="Profile" className="profile-avatar-img" />
          : <div className="profile-avatar-initials">{user.name?.charAt(0).toUpperCase()}</div>
        }
        <div className="profile-info">
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
          <div className="profile-badges">
            {user.isAdmin && <span className="badge badge-accent">Admin</span>}
            <span className={`badge ${user.isActive !== false ? 'badge-green' : 'badge-red'}`}>
              {user.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
