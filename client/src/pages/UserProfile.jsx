// client/src/pages/UserProfile.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1>User Profile</h1>
      <div className="profile-info">
        <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        {user?.phone && <p><strong>Phone:</strong> {user?.phone}</p>}
      </div>
    </div>
  );
};

export default UserProfile;