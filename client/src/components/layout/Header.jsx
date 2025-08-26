// client/src/components/layout/Header.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  if (!user) {
    return (
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <h1>PropertyPulse</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>PropertyPulse</h1>
          <span className="logo-subtitle">Property Management</span>
        </div>

        <div className="header-actions">
          <div className="user-menu">
            <div className="user-info" onClick={handleProfile}>
              <div className="user-avatar">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="user-details">
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
            
            <div className="user-actions">
              <button onClick={handleProfile} className="action-btn">
                Profile
              </button>
              <button onClick={handleLogout} className="action-btn logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;