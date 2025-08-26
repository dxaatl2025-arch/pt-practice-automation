// client/src/pages/Dashboard.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1>Welcome to PropertyPulse</h1>
      <p>Hello, {user?.firstName}! This is your dashboard.</p>
      
      {user?.role === 'LANDLORD' && (
        <div className="dashboard-section">
          <h2>Landlord Dashboard</h2>
          <p>Manage your properties and applications here.</p>
        </div>
      )}
      
      {user?.role === 'TENANT' && (
        <div className="dashboard-section">
          <h2>Tenant Dashboard</h2>
          <p>Browse properties and track your applications here.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;