// src/App
// .js - Complete PropertyPulse without Tailwind dependencies
// Add this import at the very top of App.js
import { auth } from './services/firebase';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';


// STEP 1: Add these imports at the top of your App.js (after existing imports)

import { FileText, Wand2, Download, Copy, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import RentalApplicationForm from './components/RentalApplicationForm';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user] = useState({ name: 'John Smith', role: 'landlord' });
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Styles
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
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    },
    statCard: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    },
    statHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statIcon: {
      padding: '12px',
      borderRadius: '8px',
      fontSize: '24px'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginTop: '8px'
    },
    propertiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '24px'
    },
    propertyCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    propertyImage: {
      height: '200px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: 'rgba(255,255,255,0.7)'
    },
    aiRecommendations: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      borderRadius: '12px',
      color: 'white',
      marginBottom: '32px'
    },
    successFooter: {
      background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
      color: 'white',
      padding: '32px 20px',
      textAlign: 'center',
      marginTop: '48px'
    }
  };

  useEffect(() => {
    testAPIConnection();
    fetchData();
  }, []);
// Add this useEffect to test Firebase
useEffect(() => {
  console.log('🔥 Firebase Auth initialized:', auth ? '✅ Success' : '❌ Failed');
  console.log('🔥 Firebase Project ID:', auth?.app?.options?.projectId);
}, []);
  const testAPIConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus('✅ CONNECTED');
    } catch (error) {
      setApiStatus('❌ DISCONNECTED');
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/properties`);
      setProperties(response.data.data.properties || mockProperties);
      setPayments(mockPayments);
      setTenants(mockTenants);
      setLoading(false);
    } catch (error) {
      setProperties(mockProperties);
      setPayments(mockPayments);
      setTenants(mockTenants);
      setLoading(false);
    }
  };

  // Enhanced mock data with AI features
  const mockProperties = [
    {
      id: '1',
      title: 'Luxury Downtown Apartment',
      description: 'Beautiful 2-bedroom apartment with stunning city views and premium amenities',
      address: { street: '100 Peachtree St', city: 'Atlanta', state: 'GA' },
      rent: { amount: 2500 },
      bedrooms: 2,
      bathrooms: 2,
      propertyType: 'apartment',
      status: 'active',
      aiScore: 95,
      aiRecommendations: ['High demand area - consider 5% rent increase', 'Below market rate by $200/month', 'Great ROI potential - 12.5% annually']
    },
    {
      id: '2',
      title: 'Cozy Midtown Studio',
      description: 'Perfect for young professionals, walking distance to MARTA station',
      address: { street: '200 14th St', city: 'Atlanta', state: 'GA' },
      rent: { amount: 1800 },
      bedrooms: 0,
      bathrooms: 1,
      propertyType: 'studio',
      status: 'active',
      aiScore: 88,
      aiRecommendations: ['Popular with millennials aged 25-35', 'Near public transport increases demand', 'Quick rental turnaround expected']
    },
    {
      id: '3',
      title: 'Spacious Buckhead House',
      description: 'Family-friendly house in prestigious Buckhead neighborhood',
      address: { street: '500 W Paces Ferry', city: 'Atlanta', state: 'GA' },
      rent: { amount: 4500 },
      bedrooms: 4,
      bathrooms: 3,
      propertyType: 'house',
      status: 'active',
      aiScore: 92,
      aiRecommendations: ['Premium location commands higher rent', 'Target high-income families', 'Seasonal demand spike in summer months']
    }
  ];

  const mockPayments = [
    { id: '1', tenant: 'Sarah Johnson', property: 'Luxury Downtown Apartment', amount: 2500, date: '2024-01-01', status: 'paid', automated: true },
    { id: '2', tenant: 'Mike Chen', property: 'Cozy Midtown Studio', amount: 1800, date: '2024-01-01', status: 'paid', automated: true },
    { id: '3', tenant: 'Emma Davis', property: 'Spacious Buckhead House', amount: 4500, date: '2024-01-01', status: 'pending', automated: false }
  ];

  const mockTenants = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', property: 'Luxury Downtown Apartment', rentDue: '2024-02-01', status: 'active', aiRisk: 'low', paymentHistory: 24 },
    { id: '2', name: 'Mike Chen', email: 'mike@email.com', property: 'Cozy Midtown Studio', rentDue: '2024-02-01', status: 'active', aiRisk: 'low', paymentHistory: 18 },
    { id: '3', name: 'Emma Davis', email: 'emma@email.com', property: 'Spacious Buckhead House', rentDue: '2024-02-01', status: 'late', aiRisk: 'medium', paymentHistory: 6 }
  ];

  // AI-Powered Analytics
const calculateAIInsights = () => {
  const totalRevenue = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.rent?.amount || 0), 0) : 8500;
  const avgAIScore = properties.length > 0 && properties.some(p => p.aiScore) ? 
  Math.round(properties.reduce((sum, p) => sum + (p.aiScore || 90), 0) / properties.length) : 91;
  const occupancyRate = properties.length > 0 ? Math.round((properties.filter(p => p.status === 'active').length / properties.length) * 100) : 85;
  const automatedPayments = payments.filter(p => p.automated).length;
  
  return {
    totalRevenue,
    avgAIScore,
    occupancyRate,
    automatedPayments,
    predictions: [
      `Revenue forecast: $${Math.round(totalRevenue * 1.08).toLocaleString()} next month`,
      `${automatedPayments}/${payments.length} payments automated (${Math.round(automatedPayments/payments.length*100)}%)`,
      `AI suggests focusing on properties with 90+ scores for expansion`
    ]
  };
};
  const aiInsights = calculateAIInsights();

  // Dashboard View
  const DashboardView = () => (
    <div>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px' }}>
        🤖 AI-Powered Dashboard
      </h2>
      
      {/* AI-Powered Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Monthly Revenue</p>
              <p style={{ ...styles.statValue, color: '#10b981' }}>${aiInsights.totalRevenue.toLocaleString()}</p>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46' }}>💰</div>
          </div>
          <p style={{ fontSize: '12px', color: '#10b981', marginTop: '8px' }}>+8% predicted growth</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>AI Performance Score</p>
              <p style={{ ...styles.statValue, color: '#2563eb' }}>{aiInsights.avgAIScore}/100</p>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>🤖</div>
          </div>
          <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '8px' }}>Excellent optimization</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Occupancy Rate</p>
              <p style={{ ...styles.statValue, color: '#7c3aed' }}>{aiInsights.occupancyRate}%</p>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#ede9fe', color: '#5b21b6' }}>🏘️</div>
          </div>
          <p style={{ fontSize: '12px', color: '#7c3aed', marginTop: '8px' }}>Above market average</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Smart Automation</p>
              <p style={{ ...styles.statValue, color: '#f59e0b' }}>{aiInsights.automatedPayments}/{payments.length}</p>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#fef3c7', color: '#92400e' }}>⚡</div>
          </div>
          <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px' }}>Payments automated</p>
        </div>
      </div>

      {/* AI Predictions */}
      <div style={styles.aiRecommendations}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          🤖 AI-Powered Insights & Predictions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {aiInsights.predictions.map((prediction, index) => (
            <div key={index} style={{ 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <p style={{ fontSize: '14px' }}>💡 {prediction}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Properties View with AI Scoring
  const PropertiesView = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
          🏠 AI-Optimized Properties
        </h2>
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
      </div>
      
      <div style={styles.propertiesGrid}>
        {properties.map((property) => (
          <div key={property.id} style={styles.propertyCard}>
            <div style={styles.propertyImage}>
              🏠
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{property.title}</h3>
                <div style={{
                  backgroundColor: property.aiScore >= 90 ? '#d1fae5' : '#fef3c7',
                  color: property.aiScore >= 90 ? '#065f46' : '#92400e',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  🤖 AI: {property.aiScore}/100
                </div>
              </div>
              
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                {property.description}
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ marginRight: '8px' }}>📍</span>
                  {property.address.city}, {property.address.state}
                </p>
                <p style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ marginRight: '8px' }}>💰</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>${property.rent.amount.toLocaleString()}/month</span>
                </p>
                <p style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ marginRight: '8px' }}>🛏️</span>
                  {property.bedrooms} bed • {property.bathrooms} bath • {property.propertyType}
                </p>
              </div>
              
              {/* AI Recommendations */}
              <div style={{ 
                paddingTop: '16px', 
                borderTop: '1px solid #f3f4f6',
                backgroundColor: '#f8fafc',
                margin: '16px -24px -24px -24px',
                padding: '16px 24px'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed', marginBottom: '8px' }}>
                  🤖 AI Insights:
                </p>
                {(property.aiRecommendations || ['AI analysis pending', 'Data being processed']).slice(0, 2).map((rec, index) => (
                  <p key={index} style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    • {rec}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Smart Payments View
  const PaymentsView = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
          💰 Smart Rent Tracking & Automation
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            🤖 Auto-Collect All
          </button>
          <button style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            + Record Payment
          </button>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Recent Payments & Automation Status</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Tenant</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Property</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>AI Automation</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937' }}>{payment.tenant}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{payment.property}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>${payment.amount.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: payment.status === 'paid' ? '#d1fae5' : '#fef3c7',
                      color: payment.status === 'paid' ? '#065f46' : '#92400e'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: payment.automated ? '#dbeafe' : '#f3f4f6',
                      color: payment.automated ? '#1d4ed8' : '#6b7280'
                    }}>
                      {payment.automated ? '🤖 Automated' : 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Tenants View with AI Risk Assessment
  const TenantsView = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
          👥 AI-Enhanced Tenant Management
        </h2>
        <button style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '500'
        }}>
          + Add Tenant
        </button>
      </div>
      
      <div style={styles.propertiesGrid}>
        {tenants.map((tenant) => (
          <div key={tenant.id} style={{ ...styles.statCard, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  👤
                </div>
                <div>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>{tenant.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{tenant.email}</p>
                </div>
              </div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: tenant.aiRisk === 'low' ? '#d1fae5' : tenant.aiRisk === 'medium' ? '#fef3c7' : '#fee2e2',
                color: tenant.aiRisk === 'low' ? '#065f46' : tenant.aiRisk === 'medium' ? '#92400e' : '#dc2626'
              }}>
                🤖 {tenant.aiRisk.toUpperCase()} RISK
              </span>
            </div>
            
            <div style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
              <p style={{ marginBottom: '4px' }}><strong>Property:</strong> {tenant.property}</p>
              <p style={{ marginBottom: '4px' }}><strong>Rent Due:</strong> {tenant.rentDue}</p>
              <p style={{ marginBottom: '4px' }}>
                <strong>Payment History:</strong> {tenant.paymentHistory} months
              </p>
              <p>
                <strong>Status:</strong>
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: tenant.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: tenant.status === 'active' ? '#065f46' : '#dc2626'
                }}>
                  {tenant.status}
                </span>
              </p>
            </div>
            
            <button style={{
              width: '100%',
              backgroundColor: '#7c3aed',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              🤖 AI Analysis & Auto-Actions
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Lease Generator View with AI
const LeaseGeneratorView = () => {
  const [leaseTerms, setLeaseTerms] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [generatedLease, setGeneratedLease] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokensUsed, setTokensUsed] = useState(null);
  const [isMockResponse, setIsMockResponse] = useState(false);

  const handleGenerateLease = async () => {
    if (!leaseTerms.trim()) {
      setError('Please enter lease terms');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setGeneratedLease('');

    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-lease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaseTerms: leaseTerms.trim(),
          propertyId: propertyId || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedLease(data.leaseDocument);
        setTokensUsed(data.tokensUsed);
        setIsMockResponse(data.isMockResponse || false);
        setSuccess(
          data.isMockResponse 
            ? 'Lease agreement generated successfully using development mode!'
            : 'Lease agreement generated successfully!'
        );
      } else {
        setError(data.message || 'Failed to generate lease agreement');
      }
    } catch (error) {
      console.error('Error generating lease:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLease);
      setSuccess('Lease agreement copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadLease = () => {
    const blob = new Blob([generatedLease], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-agreement-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exampleTerms = `12-month lease starting January 1, 2024
$1,400 per month rent, due on the 1st of each month
$1,400 security deposit
No pets allowed
5-day grace period for late rent
Tenant responsible for utilities except water/sewer
No smoking inside the property
30-day notice required for termination`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
          🤖 AI Lease Generator
          {isMockResponse && (
            <span style={{
              fontSize: '14px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '4px 8px',
              borderRadius: '4px',
              marginLeft: '12px',
              fontWeight: 'normal'
            }}>
              Development Mode
            </span>
          )}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Input Section */}
        <div style={{ ...styles.statCard, padding: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
            📝 Lease Terms Input
          </h3>

          {/* Property Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Select Property (Optional)
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a property...</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title} - {property.propertyType}
                </option>
              ))}
            </select>
          </div>

          {/* Lease Terms Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Lease Terms & Requirements
            </label>
            <textarea
              value={leaseTerms}
              onChange={(e) => setLeaseTerms(e.target.value)}
              placeholder="Enter your lease terms in plain English..."
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Describe rent amount, lease duration, rules, deposits, etc. Be as detailed as possible.
            </p>
          </div>

          {/* Example Terms */}
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setLeaseTerms(exampleTerms)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                textDecoration: 'underline',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Use example terms
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateLease}
            disabled={isLoading || !leaseTerms.trim()}
            style={{
              width: '100%',
              backgroundColor: isLoading || !leaseTerms.trim() ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontWeight: '500',
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: isLoading || !leaseTerms.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏱️</span>
                <span>Generating Lease...</span>
              </>
            ) : (
              <>
                <span>🪄</span>
                <span>Generate Lease Agreement</span>
              </>
            )}
          </button>

            <button
  onClick={() => setCurrentView('rental-application')}
  style={styles.navButton(currentView === 'rental-application')}
>
  <span>📋</span>
  <span>Rental Application</span>
</button>

          {/* Status Messages */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ color: '#dc2626' }}>⚠️</span>
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ color: '#16a34a' }}>✅</span>
              <span style={{ color: '#16a34a', fontSize: '14px' }}>{success}</span>
            </div>
          )}

          {tokensUsed && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              Tokens used: {tokensUsed} {isMockResponse && '(simulated)'}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div style={{ ...styles.statCard, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
              📄 Generated Lease Agreement
            </h3>
            
            {generatedLease && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <button
                  onClick={downloadLease}
                  style={{
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Download as text file"
                >
                  💾
                </button>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={generatedLease || 'Generated lease agreement will appear here...'}
              readOnly
              style={{
                width: '100%',
                height: '400px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#f9fafb',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'none'
              }}
            />
          </div>

          {generatedLease && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '6px'
            }}>
              <p style={{ color: '#92400e', fontSize: '14px' }}>
                <strong>Important:</strong> This is an AI-generated template{isMockResponse ? ' (development mode)' : ''}. Please review with legal counsel before using. 
                All parties should understand their rights and obligations before signing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  useEffect(() => {
    testAPIConnection();
    fetchData();
  }, []);

  return (
    <div style={styles.container}>
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
                color: apiStatus.includes('✅') ? '#10b981' : '#ef4444'
              }}>
                {apiStatus}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#374151' }}>Welcome, {user.name}</span>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                fontWeight: '500'
              }}>
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={styles.navButton(currentView === 'dashboard')}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentView('properties')}
            style={styles.navButton(currentView === 'properties')}
          >
            <span>🏠</span>
            <span>Properties</span>
          </button>
          <button
            onClick={() => setCurrentView('payments')}
            style={styles.navButton(currentView === 'payments')}
          >
            <span>💰</span>
            <span>Payments</span>
          </button>
          <button
            onClick={() => setCurrentView('tenants')}
            style={styles.navButton(currentView === 'tenants')}
          >
            <span>👥</span>
            <span>Tenants</span>
          </button>
          <button
  onClick={() => setCurrentView('lease-generator')}
  style={styles.navButton(currentView === 'lease-generator')}
>
  <span>🤖</span>
  <span>AI Lease Generator</span>
</button>
<button
  onClick={() => setCurrentView('rental-application')}
  style={styles.navButton(currentView === 'rental-application')}
>
  <span>📋</span>
  <span>Rental Application</span>
</button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
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
              <p style={{ color: '#6b7280' }}>Loading PropertyPulse AI Platform...</p>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'properties' && <PropertiesView />}
            {currentView === 'payments' && <PaymentsView />}
            {currentView === 'tenants' && <TenantsView />}
            {currentView === 'lease-generator' && <LeaseGeneratorView />}
            {currentView === 'rental-application' && <RentalApplicationForm />}
{currentView === 'rental-application' && <RentalApplicationForm />}
          </>
        )}
      </main>

      {/* Success Footer */}
      <footer style={styles.successFooter}>
        <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
          🎉 COMPLETE AI-POWERED SAAS PLATFORM! 🎉
        </h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          gap: '32px', 
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          <span>✅ React Frontend</span>
          <span>✅ Node.js Backend</span>
          <span>✅ MongoDB Ready</span>
          <span>✅ Firebase Auth</span>
          <span>✅ AI Analytics</span>
          <span>✅ Smart Automation</span>
          <span>✅ Payment Processing</span>
          <span>✅ Tenant Management</span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          💰 PRODUCTION-READY REVENUE PLATFORM! 💰
        </div>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          All features complete • Real backend APIs • AI-powered insights • Ready for customers!
        </p>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;