import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAPIConnection();
    fetchProperties();
  }, []);

  const testAPIConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus(`✅ CONNECTED: ${response.data.message}`);
    } catch (error) {
      setApiStatus('❌ Backend connection failed');
      console.error('API Error:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API_URL}/properties`);
      setProperties(response.data.data.properties);
      setLoading(false);
    } catch (error) {
      console.error('Properties Error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏠 PropertyPulse</h1>
        <h2>Full-Stack SaaS Platform</h2>
        <p><strong>Backend Status:</strong> {apiStatus}</p>
        
        <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px' }}>
          <h3>Available Properties ({properties.length})</h3>
          {loading ? (
            <p>Loading properties...</p>
          ) : (
            <div>
              {properties.map((property, index) => (
                <div key={property.id || index} style={{ 
                  border: '2px solid #4CAF50', 
                  margin: '15px 0', 
                  padding: '20px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)'
                }}>
                  <h4>{property.title}</h4>
                  <p>Location: {property.address?.city}, {property.address?.state}</p>
                  <p>Rent: ${property.rent?.amount}/month</p>
                  <p>Bedrooms: {property.bedrooms} | Bathrooms: {property.bathrooms}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#4CAF50', borderRadius: '10px' }}>
          <h3>🚀 FULL-STACK WORKING!</h3>
          <p>✅ Backend + Frontend Connected</p>
          <p>💰 Ready for Business Features!</p>
        </div>
      </header>
    </div>
  );
}

export default App;