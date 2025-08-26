import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase'; // ADD THIS IMPORT

const TenantProfile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadProfile = async () => {
    try {
      // Get the current Firebase token for API call
      const currentUser = auth.currentUser;
      if (!currentUser) {
      console.log('❌ No user logged in');
      return;
    }
    
    console.log('🔍 Current Firebase user:', {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    });
      if (!currentUser) {
        console.log('❌ No user logged in');
        setProfile({});
        return;
      }
      
      const token = await currentUser.getIdToken();
      
      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: { 
          'Authorization': `Bearer ${token}` // ADD AUTH HEADER
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data || {});
        console.log('✅ Profile loaded successfully');
      } else {
        console.log('❌ Failed to load profile');
        setProfile({});
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile({});
    }
  };

  const saveProfile = async () => {
  setLoading(true);
  try {
    console.log('💾 Saving profile:', profile);
    
    // DEBUG: Check current user details
    const currentUser = auth.currentUser;
    console.log('🔍 DEBUG - Current Firebase user:', {
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName
    });
    
    if (!currentUser) {
      setMessage('Please log in again ❌');
      setLoading(false);
      return;
    }
    
    const token = await currentUser.getIdToken(true); // Force refresh token
    console.log('🔐 DEBUG - Token first 50 chars:', token.substring(0, 50));
    
    // DEBUG: Decode the token to see what UID it contains
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🎯 DEBUG - Token payload UID:', payload.sub || payload.uid);
    } catch (e) {
      console.log('❌ Could not decode token');
    }
    
    // Rest of your existing saveProfile code...
    const response = await fetch('http://localhost:5000/api/users/profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        budgetMin: profile.budgetMin,
        budgetMax: profile.budgetMax,
        preferredBedrooms: profile.beds,
        preferredLocations: profile.locations || [],
        petPreferences: profile.pets || [],
        profilePreferences: {
          lastUpdated: new Date().toISOString(),
          preferences: profile
        },
        profileUpdatedAt: new Date().toISOString()
      })
    });
    
    // ... rest of your existing code
  } catch (error) {
    console.error('❌ Save error:', error);
    setMessage('Failed to save profile ❌');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
        🎯 Tenant Matching Profile
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Configure your rental preferences for better matches
      </p>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '6px',
          backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
          color: message.includes('✅') ? '#065f46' : '#dc2626',
          border: `1px solid ${message.includes('✅') ? '#a7f3d0' : '#fca5a5'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '15px' }}>
            💰 Budget Range
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Minimum Budget ($)
              </label>
              <input
                type="number"
                value={profile.budgetMin || ''}
                onChange={(e) => setProfile({...profile, budgetMin: parseInt(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Maximum Budget ($)
              </label>
              <input
                type="number"
                value={profile.budgetMax || ''}
                onChange={(e) => setProfile({...profile, budgetMax: parseInt(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '15px' }}>
            🏠 Property Preferences
          </h3>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Bedrooms
            </label>
            <select
              value={profile.beds || ''}
              onChange={(e) => setProfile({...profile, beds: parseInt(e.target.value) || 0})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Any</option>
              <option value="1">1 bedroom</option>
              <option value="2">2 bedrooms</option>
              <option value="3">3 bedrooms</option>
              <option value="4">4 bedrooms</option>
              <option value="5">5 bedrooms</option>
            </select>
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>💾</span>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default TenantProfile;