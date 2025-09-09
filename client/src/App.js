// src/App.js - Minimal Router Integration (Preserves All Existing Functionality)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRequireAuth } from './hooks/useRequireAuth';
import axios from 'axios';
import './App.css';

// Import your existing pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import UserProfile from './pages/UserProfile';
import ApplicationForm from './pages/ApplicationForm/index.js';
import PropertyApplications from './pages/PropertyApplications/index.js';
import TenantProfile from './components/TenantProfile';
import AIFeatures from './pages/AIFeatures.jsx';

// Import API client and components
import { tenantsApi, handleApiError } from './lib/api';
import EmptyState from './components/shared/EmptyState';

const API_URL = 'http://localhost:5000/api';

// Tenant Management Component
const TenantManagementView = ({ tenants, onRefresh, user }) => {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const [newTenant, setNewTenant] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: ''
  });

  const handleCreateTenant = async () => {
    if (!newTenant.firstName || !newTenant.lastName || !newTenant.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await tenantsApi.create(newTenant);
      setShowAddModal(false);
      setNewTenant({ firstName: '', lastName: '', email: '', phone: '', propertyId: '' });
      onRefresh();
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to remove this tenant?')) return;
    
    try {
      setLoading(true);
      await tenantsApi.delete(tenantId);
      onRefresh();
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
          👥 Tenant Management
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          + Add Tenant
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #fecaca'
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {tenants.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Tenants Yet"
          description="Start by adding your first tenant to manage their information and rental agreements."
          actionText="Add First Tenant"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{
                backgroundColor: '#ede9fe',
                color: '#5b21b6',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {tenants.length} Total Tenants
              </span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Manage tenant information and communications
              </span>
            </div>
          </div>
          
          <div>
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontWeight: '600'
                    }}>
                      {(tenant.firstName?.charAt(0) || 'T').toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {tenant.firstName} {tenant.lastName}
                      </h3>
                      <p style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        margin: '2px 0 0 0'
                      }}>
                        {tenant.email}
                      </p>
                    </div>
                  </div>
                  
                  {tenant.phone && (
                    <p style={{
                      color: '#6b7280',
                      fontSize: '14px',
                      margin: '4px 0 0 52px'
                    }}>
                      📞 {tenant.phone}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditingTenant(tenant)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(tenant.id)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Add New Tenant
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151' }}>
                First Name *
              </label>
              <input
                type="text"
                value={newTenant.firstName}
                onChange={(e) => setNewTenant({...newTenant, firstName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151' }}>
                Last Name *
              </label>
              <input
                type="text"
                value={newTenant.lastName}
                onChange={(e) => setNewTenant({...newTenant, lastName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151' }}>
                Email *
              </label>
              <input
                type="email"
                value={newTenant.email}
                onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151' }}>
                Phone
              </label>
              <input
                type="tel"
                value={newTenant.phone}
                onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTenant({ firstName: '', lastName: '', email: '', phone: '', propertyId: '' });
                  setError(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Adding...' : 'Add Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Protected Route Component (UNCHANGED)
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated, hasRequiredRole } = useRequireAuth(requiredRole);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p style={{ color: '#6b7280' }}>Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!hasRequiredRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#7f1d1d' }}>
            You don't have permission to access this page.
            {requiredRole && ` ${requiredRole} role required.`}
          </p>
          <p style={{ color: '#6b7280', marginTop: '16px' }}>
            Current role: {user?.role}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// Main Application Component with URL Routing Support
function AppContent() {
  const { user, loading, logout, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current view from URL or default to dashboard
  const getCurrentViewFromURL = () => {
    const path = location.pathname.substring(1); // Remove leading slash
    return path || 'dashboard';
  };
  
  const [currentView, setCurrentView] = useState(getCurrentViewFromURL());
  const [authView, setAuthView] = useState('login');
  
  // Update currentView when URL changes
  useEffect(() => {
    setCurrentView(getCurrentViewFromURL());
  }, [location.pathname]);
  
  // Application data state
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [applications, setApplications] = useState([]);
  
  // Application-specific state
  const [selectedPropertyForApplication, setSelectedPropertyForApplication] = useState(null);

  // Initialize data when user logs in
  useEffect(() => {
    if (user) {
      initializeApplicationData();
    }
  }, [user]);

  const initializeApplicationData = async () => {
    try {
      setApiStatus('🔄 Loading...');
      await Promise.all([
        testAPIConnection(),
        fetchProperties(),
        fetchUserSpecificData()
      ]);
      setApiStatus('✅ CONNECTED');
    } catch (error) {
      console.error('❌ Failed to initialize app data:', error);
      setApiStatus('❌ DISCONNECTED');
    }
  };

  const testAPIConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/properties`);
      return response.status === 200;
    } catch (error) {
      throw error;
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API_URL}/properties`);
      const propertiesData = response.data.data?.properties || response.data.data || [];
      setProperties(propertiesData);
      console.log(`📊 Loaded ${propertiesData.length} properties`);
    } catch (error) {
      console.error('❌ Failed to fetch properties:', error);
      setProperties([]);
    }
  };

  const fetchUserSpecificData = async () => {
    if (!user) return;

    try {
      if (user.role === 'LANDLORD') {
        await fetchLandlordData();
      } else if (user.role === 'TENANT') {
        await fetchTenantData();
      }
    } catch (error) {
      console.error('❌ Failed to fetch user-specific data:', error);
    }
  };

  const fetchLandlordData = async () => {
    try {
      const [tenantsRes, paymentsRes, applicationsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/tenants`),
        axios.get(`${API_URL}/payments`),
        axios.get(`${API_URL}/applications`)
      ]);
      
      if (tenantsRes.status === 'fulfilled') {
        setTenants(tenantsRes.value.data.data || []);
      }
      
      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value.data.data || []);
      }
      
      if (applicationsRes.status === 'fulfilled') {
        setApplications(applicationsRes.value.data.data || []);
      }
      
      console.log('📊 Landlord data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching landlord data:', error);
    }
  };

  const fetchTenantData = async () => {
    try {
      const [paymentsRes, applicationsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/payments?tenantId=${user.id}`),
        axios.get(`${API_URL}/applications?applicantId=${user.id}`)
      ]);
      
      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value.data.data || []);
      }
      
      if (applicationsRes.status === 'fulfilled') {
        setApplications(applicationsRes.value.data.data || []);
      }
      
      console.log('📊 Tenant data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching tenant data:', error);
    }
  };

  // Navigation handlers
  const handleApplyToProperty = (property) => {
    setSelectedPropertyForApplication(property);
    setCurrentView('rental-application');
  };

  const handleBackFromApplication = () => {
    setSelectedPropertyForApplication(null);
    setCurrentView('properties');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Reset application state
      setCurrentView('dashboard');
      setProperties([]);
      setPayments([]);
      setTenants([]);
      setApplications([]);
      setSelectedPropertyForApplication(null);
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Loading screen during authentication
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <h2 style={{ color: '#1f2937', marginBottom: '8px' }}>PropertyPulse</h2>
          <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Authentication screens
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Global Error Display */}
        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxWidth: '400px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button
                onClick={clearError}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  marginLeft: '12px',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {authView === 'register' ? (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        ) : (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        )}
      </div>
    );
  }

  // Role-based navigation
  const getNavigationItems = () => {
    const commonItems = [
      { view: 'dashboard', label: 'Dashboard', icon: '📊' },
      { view: 'profile', label: 'Profile', icon: '👤' }
    ];

    if (user.role === 'LANDLORD') {
      return [
        ...commonItems,
        { view: 'properties', label: 'My Properties', icon: '🏠' },
        { view: 'applications-management', label: 'Applications', icon: '📋' },
        { view: 'tenants', label: 'Tenants', icon: '👥' },
        { view: 'payments', label: 'Payments', icon: '💰' },
        { view: 'lease-generator', label: 'AI Lease Generator', icon: '🤖' }
      ];
    } else if (user.role === 'TENANT') {
      return [
        ...commonItems,
        { view: 'properties', label: 'Browse Properties', icon: '🏠' },
        { view: 'rental-application', label: 'Apply to Property', icon: '📋' },
        { view: 'my-applications', label: 'My Applications', icon: '📄' },
        { view: 'tenant-profile', label: 'Preferences', icon: '🎯' },
        { view: 'payments', label: 'My Payments', icon: '💳' }
      ];
    }

    return commonItems;
  };

  // Properties View with Role-Based Actions
  const PropertiesView = () => (
    <ProtectedRoute>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            {user.role === 'LANDLORD' ? '🏠 My Properties' : '🏠 Available Properties'}
          </h2>
          {user.role === 'LANDLORD' && (
            <button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              + Add Property
            </button>
          )}
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '24px' 
        }}>
          {properties.map((property) => (
            <div key={property.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: 'rgba(255,255,255,0.7)'
              }}>
                🏠
              </div>
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {property.title}
                </h3>
                
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                  {property.description}
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ marginRight: '8px' }}>📍</span>
                    {property.address?.city || property.addressCity}, {property.address?.state || property.addressState}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ marginRight: '8px' }}>💰</span>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>
                      ${property.rent?.amount?.toLocaleString() || property.rentAmount?.toLocaleString() || 'N/A'}/month
                    </span>
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ marginRight: '8px' }}>🛏️</span>
                    {property.bedrooms} bed • {property.bathrooms} bath • {property.propertyType}
                  </p>
                </div>

                {/* Role-based action buttons */}
                {user.role === 'TENANT' && (
                  <button
                    onClick={() => handleApplyToProperty(property)}
                    style={{
                      width: '100%',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      marginBottom: '16px'
                    }}
                  >
                    📋 Apply Now
                  </button>
                )}

                {user.role === 'LANDLORD' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentView('applications-management')}
                      style={{
                        flex: 1,
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      View Applications
                    </button>
                    <button
                      style={{
                        flex: 1,
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );

  // Application Form View with Property Context
  const ApplicationFormView = () => (
    <ProtectedRoute requiredRole="TENANT">
      {selectedPropertyForApplication ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={handleBackFromApplication}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                marginRight: '16px'
              }}
            >
              ← Back to Properties
            </button>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Apply for: {selectedPropertyForApplication.title}
              </h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                ${selectedPropertyForApplication.rent?.amount?.toLocaleString() || selectedPropertyForApplication.rentAmount?.toLocaleString()}/month • {selectedPropertyForApplication.address?.city || selectedPropertyForApplication.addressCity}, {selectedPropertyForApplication.address?.state || selectedPropertyForApplication.addressState}
              </p>
            </div>
          </div>
          <ApplicationForm 
            propertyId={selectedPropertyForApplication.id}
            property={selectedPropertyForApplication}
            user={user}
            onSuccess={() => {
              alert('Application submitted successfully!');
              setCurrentView('my-applications');
              fetchUserSpecificData(); // Refresh applications
            }}
          />
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px' }}>
            📋 Select a Property to Apply
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Choose a property below to start your application, or browse all properties first.
          </p>
          <button
            onClick={() => setCurrentView('properties')}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Browse Properties
          </button>
        </div>
      )}
    </ProtectedRoute>
  );

  // Render current view with role-based protection
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ProtectedRoute>
            <Dashboard user={user} properties={properties} payments={payments} tenants={tenants} />
          </ProtectedRoute>
        );
      
      case 'properties':
        return <PropertiesView />;
      
      case 'profile':
        return (
          <ProtectedRoute>
            <UserProfile user={user} />
          </ProtectedRoute>
        );
      
      case 'rental-application':
        return <ApplicationFormView />;
      
      case 'applications-management':
        return (
          <ProtectedRoute requiredRole="LANDLORD">
            <PropertyApplications user={user} properties={properties} />
          </ProtectedRoute>
        );
      
      case 'my-applications':
        return (
          <ProtectedRoute requiredRole="TENANT">
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px' }}>
                📄 My Applications
              </h2>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '40px', 
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  Your rental applications will appear here.
                </p>
                <div style={{ marginTop: '20px' }}>
                  <span style={{ 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    {applications.length} Applications
                  </span>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        );
      
      case 'tenant-profile':
        return (
          <ProtectedRoute requiredRole="TENANT">
            <TenantProfile user={user} />
          </ProtectedRoute>
        );
      
      case 'payments':
        return (
          <ProtectedRoute>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px' }}>
                💰 {user.role === 'LANDLORD' ? 'Payment Management' : 'My Payments'}
              </h2>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '40px', 
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  Payment information will appear here.
                </p>
                <div style={{ marginTop: '20px' }}>
                  <span style={{ 
                    backgroundColor: '#d1fae5', 
                    color: '#065f46', 
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    {payments.length} Payment Records
                  </span>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        );
      
      case 'tenants':
        return (
          <ProtectedRoute requiredRole="LANDLORD">
            <TenantManagementView 
              tenants={tenants} 
              onRefresh={fetchUserSpecificData}
              user={user}
            />
          </ProtectedRoute>
        );
      
      case 'lease-generator':
        return (
          <ProtectedRoute>
            <AIFeatures user={user} properties={properties} />
          </ProtectedRoute>
        );
      
      default:
        return (
          <ProtectedRoute>
            <Dashboard user={user} properties={properties} payments={payments} tenants={tenants} />
          </ProtectedRoute>
        );
    }
  };

  // Main application UI styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 20px'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '64px'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: '#2563eb',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '20px'
    },
    nav: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 20px'
    },
    navContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      gap: '16px',
      padding: '16px 0'
    },
    navButton: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
      backgroundColor: active ? '#2563eb' : 'white',
      color: active ? 'white' : '#374151',
      boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      border: active ? 'none' : '1px solid #d1d5db'
    }),
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 20px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Global Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                marginLeft: '12px',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>PropertyPulse</h1>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>AI-Powered Property Management</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>API Status:</span>
              <span style={{
                marginLeft: '8px',
                fontWeight: '500',
                color: apiStatus.includes('✅') ? '#10b981' : apiStatus.includes('❌') ? '#ef4444' : '#f59e0b'
              }}>
                {apiStatus}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {user.name} ({user.role})
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: user.role === 'LANDLORD' ? '#dbeafe' : '#d1fae5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: user.role === 'LANDLORD' ? '#2563eb' : '#10b981',
                fontWeight: '500'
              }}>
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Role-Based Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          {getNavigationItems().map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                navigate(`/${item.view === 'dashboard' ? '' : item.view}`);
              }}
              style={styles.navButton(currentView === item.view)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {renderCurrentView()}
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Root App Component with AuthProvider and Router Wrapper
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;