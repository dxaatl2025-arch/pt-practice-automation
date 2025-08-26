import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplicationForm = () => {
  // Add properties state for dynamic selection
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    // Applicant info
    fullName: '',
    dob: '',
    email: '',
    phone: '',
    
    // Current address
    currentAddress: '',
    yearsAtAddress: '',
    reasonForMoving: '',
    
    // Employment
    employerName: '',
    jobTitle: '',
    employerAddress: '',
    employerPhone: '',
    employmentLength: '',
    monthlyIncome: '',
    otherIncome: '',
    
    // Rental history
    prevAddress: '',
    prevLandlordName: '',
    prevLandlordContact: '',
    reasonForLeaving: '',
    wasLateRent: false,
    
    // Reference
    refName: '',
    refRelationship: '',
    refContact: '',
    
    // Household
    occupants: 1,
    hasPets: false,
    pets: [],
    hasVehicles: false,
    vehicles: [],
    
    // Disclosures
    wasEvicted: false,
    felony: false,
    
    // Application details
    desiredMoveIn: '',
    consentBackground: false,
    signature: ''
  });

  // Fetch available properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const response = await axios.get('http://localhost:5000/api/properties');
        // Handle different response formats from your API
const propertiesData = response.data.data?.properties || response.data.properties || response.data.data || [];
        setProperties(propertiesData);
        
        // Auto-select first available property
        if (propertiesData.length > 0) {
          setSelectedPropertyId(propertiesData[0].id);
        }
        
        console.log('✅ Properties loaded:', propertiesData.length);
      } catch (error) {
        console.error('❌ Failed to fetch properties:', error);
        // If no properties available, show message but don't block form
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate property selection
    if (!selectedPropertyId) {
      alert('Please select a property to apply for');
      return;
    }
    
    if (!formData.consentBackground) {
      alert('Background check consent is required');
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        ...formData,
        //propertyId: selectedPropertyId, // Use selected property ID instead of hardcoded
        propertyId: selectedPropertyId, // Always use selected property (remove fallback)
        monthlyIncome: parseInt(formData.monthlyIncome) || 0,
        occupants: parseInt(formData.occupants) || 1,
        yearsAtAddress: parseFloat(formData.yearsAtAddress) || 0,
        // Transform dates to ISO strings
        dob: formData.dob ? new Date(formData.dob).toISOString() : null,
        desiredMoveIn: formData.desiredMoveIn ? new Date(formData.desiredMoveIn).toISOString() : null
      };

      console.log('📤 Submitting application for property:', selectedPropertyId);

      const response = await axios.post('http://localhost:5000/api/applications', applicationData);
      
      if (response.data.success) {
        setSubmitted(true);
        alert('✅ Application submitted successfully!');
        // Reset form
        resetForm();
      }
    } catch (error) {
      console.error('❌ Application submission failed:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message).join('\n');
        alert(`❌ Validation errors:\n${errorMessages}`);
      } else {
        alert(`❌ Submission failed: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFormData({
      fullName: '', dob: '', email: '', phone: '', currentAddress: '',
      yearsAtAddress: '', reasonForMoving: '', employerName: '', jobTitle: '',
      employerAddress: '', employerPhone: '', employmentLength: '', monthlyIncome: '',
      otherIncome: '', prevAddress: '', prevLandlordName: '', prevLandlordContact: '',
      reasonForLeaving: '', wasLateRent: false, refName: '', refRelationship: '',
      refContact: '', occupants: 1, hasPets: false, pets: [], hasVehicles: false, 
      vehicles: [], wasEvicted: false, felony: false, desiredMoveIn: '', 
      consentBackground: false, signature: ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const styles = {
    section: {
      backgroundColor: '#f8fafc',
      padding: '24px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: '1px solid #e5e7eb'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      color: '#374151'
    },
    checkbox: {
      width: '18px',
      height: '18px'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px'
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #a7f3d0',
          borderRadius: '12px',
          padding: '32px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', marginBottom: '12px' }}>
            Application Submitted Successfully!
          </h2>
          <p style={{ color: '#047857', marginBottom: '24px' }}>
            Your rental application has been submitted and is being reviewed. You will be contacted within 2-3 business days.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          🏠 Phase-1 Rental Application
        </h2>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Complete all required sections to submit your application
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Property Selection Section - NEW */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>🏠</span>
            Property Selection
          </h3>
          {loadingProperties ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading available properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#92400e', margin: 0 }}>
                ⚠️ No properties available for application at this time.
              </p>
            </div>
          ) : (
            <div>
              <label style={styles.label}>
                Select Property to Apply For *
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                style={styles.input}
                required
              >
                <option value="">Please select a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} - ${property.rent?.amount ? property.rent.amount.toLocaleString() : property.rentAmount ? property.rentAmount.toLocaleString() : 'N/A'}/month
                    {property.address?.city && ` - ${property.address.city}, ${property.address.state}`}
{property.addressCity && ` - ${property.addressCity}, ${property.addressState}`}
                  </option>
                ))}
              </select>
              {selectedPropertyId && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1e40af'
                }}>
                  ✓ Selected: {properties.find(p => p.id === selectedPropertyId)?.title}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Applicant Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>👤</span>
            Applicant Information
          </h3>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Current Address */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>📍</span>
            Current Address
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Current Address *</label>
            <input
              type="text"
              name="currentAddress"
              value={formData.currentAddress}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Years at Address *</label>
              <input
                type="number"
                name="yearsAtAddress"
                value={formData.yearsAtAddress}
                onChange={handleChange}
                style={styles.input}
                step="0.1"
                required
              />
            </div>
            <div>
              <label style={styles.label}>Reason for Moving</label>
              <input
                type="text"
                name="reasonForMoving"
                value={formData.reasonForMoving}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>💼</span>
            Employment Information
          </h3>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Employer Name *</label>
              <input
                type="text"
                name="employerName"
                value={formData.employerName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Job Title *</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>
          <div style={{ margin: '16px 0' }}>
            <label style={styles.label}>Employer Address *</label>
            <input
              type="text"
              name="employerAddress"
              value={formData.employerAddress}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.grid3}>
            <div>
              <label style={styles.label}>Employer Phone *</label>
              <input
                type="tel"
                name="employerPhone"
                value={formData.employerPhone}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Employment Length *</label>
              <input
                type="text"
                name="employmentLength"
                value={formData.employmentLength}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Monthly Income *</label>
              <input
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={styles.label}>Other Income (Optional)</label>
            <input
              type="text"
              name="otherIncome"
              value={formData.otherIncome}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        {/* Reference */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>👥</span>
            Reference
          </h3>
          <div style={styles.grid3}>
            <div>
              <label style={styles.label}>Reference Name *</label>
              <input
                type="text"
                name="refName"
                value={formData.refName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Relationship *</label>
              <input
                type="text"
                name="refRelationship"
                value={formData.refRelationship}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Reference Contact *</label>
              <input
                type="tel"
                name="refContact"
                value={formData.refContact}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Household Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>🏠</span>
            Household Information
          </h3>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Number of Occupants *</label>
              <input
                type="number"
                name="occupants"
                value={formData.occupants}
                onChange={handleChange}
                style={styles.input}
                min="1"
                required
              />
            </div>
            <div>
              <label style={styles.label}>Desired Move-in Date *</label>
              <input
                type="date"
                name="desiredMoveIn"
                value={formData.desiredMoveIn}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Pets Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>🐕</span>
            Pets Information
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="hasPets"
                checked={formData.hasPets}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    hasPets: e.target.checked,
                    pets: e.target.checked ? [{ type: '', count: 1, description: '' }] : []
                  }));
                }}
                style={styles.checkbox}
              />
              <span>Do you have pets?</span>
            </label>
          </div>
          
          {formData.hasPets && (
            <div style={styles.grid3}>
              <div>
                <label style={styles.label}>Pet Type</label>
                <input
                  type="text"
                  placeholder="Dog, Cat, etc."
                  value={formData.pets[0]?.type || ''}
                  onChange={(e) => {
                    const newPets = [...formData.pets];
                    newPets[0] = { ...newPets[0], type: e.target.value };
                    setFormData(prev => ({ ...prev, pets: newPets }));
                  }}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Number of Pets</label>
                <input
                  type="number"
                  min="1"
                  value={formData.pets[0]?.count || 1}
                  onChange={(e) => {
                    const newPets = [...formData.pets];
                    newPets[0] = { ...newPets[0], count: parseInt(e.target.value) };
                    setFormData(prev => ({ ...prev, pets: newPets }));
                  }}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  placeholder="Breed, size, etc."
                  value={formData.pets[0]?.description || ''}
                  onChange={(e) => {
                    const newPets = [...formData.pets];
                    newPets[0] = { ...newPets[0], description: e.target.value };
                    setFormData(prev => ({ ...prev, pets: newPets }));
                  }}
                  style={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        {/* Vehicles Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>🚗</span>
            Vehicle Information
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="hasVehicles"
                checked={formData.hasVehicles}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    hasVehicles: e.target.checked,
                    vehicles: e.target.checked ? [{ make: '', model: '', year: '', license: '' }] : []
                  }));
                }}
                style={styles.checkbox}
              />
              <span>Do you have vehicles?</span>
            </label>
          </div>
          
          {formData.hasVehicles && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={styles.label}>Make</label>
                <input
                  type="text"
                  placeholder="Toyota"
                  value={formData.vehicles[0]?.make || ''}
                  onChange={(e) => {
                    const newVehicles = [...formData.vehicles];
                    newVehicles[0] = { ...newVehicles[0], make: e.target.value };
                    setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                  }}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Model</label>
                <input
                  type="text"
                  placeholder="Camry"
                  value={formData.vehicles[0]?.model || ''}
                  onChange={(e) => {
                    const newVehicles = [...formData.vehicles];
                    newVehicles[0] = { ...newVehicles[0], model: e.target.value };
                    setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                  }}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Year</label>
                <input
                  type="number"
                  placeholder="2020"
                  value={formData.vehicles[0]?.year || ''}
                  onChange={(e) => {
                    const newVehicles = [...formData.vehicles];
                    newVehicles[0] = { ...newVehicles[0], year: parseInt(e.target.value) };
                    setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                  }}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>License Plate</label>
                <input
                  type="text"
                  placeholder="ABC123"
                  value={formData.vehicles[0]?.license || ''}
                  onChange={(e) => {
                    const newVehicles = [...formData.vehicles];
                    newVehicles[0] = { ...newVehicles[0], license: e.target.value };
                    setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                  }}
                  style={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        {/* Disclosures */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>⚠️</span>
            Disclosures
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="wasEvicted"
                checked={formData.wasEvicted}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Have you ever been evicted?</span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="felony"
                checked={formData.felony}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Have you ever been convicted of a felony?</span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="wasLateRent"
                checked={formData.wasLateRent}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Have you ever been late on rent?</span>
            </label>
          </div>
        </div>

        {/* Consent & Signature */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>✍️</span>
            Consent & Digital Signature
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Digital Signature (Type your full name) *</label>
            <input
              type="text"
              name="signature"
              value={formData.signature}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'start',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fed7aa'
          }}>
            <input
              type="checkbox"
              name="consentBackground"
              checked={formData.consentBackground}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
              required
            />
            <span style={{ fontSize: '14px', color: '#92400e' }}>
              <strong>I consent to a background check</strong> and authorize verification of the information provided. This consent is required to process my application. *
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            type="submit"
            disabled={loading || !selectedPropertyId}
            style={{
              backgroundColor: loading || !selectedPropertyId ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontWeight: '600',
              padding: '16px 48px',
              borderRadius: '12px',
              border: 'none',
              cursor: loading || !selectedPropertyId ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            {loading ? (
              <>
                <span style={{ marginRight: '8px' }}>⏳</span>
                Submitting Application...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>📤</span>
                Submit Application
              </>
            )}
          </button>
          {!selectedPropertyId && !loadingProperties && (
            <p style={{ marginTop: '8px', fontSize: '14px', color: '#ef4444' }}>
              Please select a property to submit your application
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;