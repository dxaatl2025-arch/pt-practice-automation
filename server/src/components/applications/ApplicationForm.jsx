// client/src/components/applications/ApplicationForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApplicationForm.css';

const ApplicationForm = ({ propertyId, onSubmitSuccess, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [property, setProperty] = useState(null);
  
  const [formData, setFormData] = useState({
    // Personal Information (Step 1)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    
    // Current Address (Step 2)
    currentAddress: '',
    currentCity: '',
    currentState: '',
    currentZip: '',
    yearsAtAddress: '',
    reasonForMoving: '',
    
    // Employment Information (Step 3)
    employerName: '',
    jobTitle: '',
    employerAddress: '',
    employerPhone: '',
    employmentLength: '',
    monthlyIncome: '',
    otherIncome: '',
    
    // Previous Rental History (Step 4)
    prevAddress: '',
    prevLandlordName: '',
    prevLandlordContact: '',
    reasonForLeaving: '',
    wasLateRent: false,
    
    // References (Step 5)
    refName: '',
    refRelationship: '',
    refContact: '',
    
    // Household Information (Step 6)
    occupants: '',
    pets: [],
    vehicles: [],
    
    // Background & Disclosures (Step 7)
    wasEvicted: false,
    felony: false,
    
    // Application Details (Step 8)
    desiredMoveIn: '',
    consentBackground: false,
    signature: ''
  });

  const totalSteps = 8;

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`/api/properties/${propertyId}`);
      setProperty(response.data.data);
    } catch (error) {
      console.error('Failed to fetch property:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};
    
    switch (step) {
      case 1: // Personal Information
        if (!formData.firstName.trim()) stepErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) stepErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) stepErrors.email = 'Email is required';
        if (!formData.phone.trim()) stepErrors.phone = 'Phone is required';
        if (!formData.dateOfBirth) stepErrors.dateOfBirth = 'Date of birth is required';
        break;
        
      case 2: // Current Address
        if (!formData.currentAddress.trim()) stepErrors.currentAddress = 'Current address is required';
        if (!formData.currentCity.trim()) stepErrors.currentCity = 'City is required';
        if (!formData.currentState.trim()) stepErrors.currentState = 'State is required';
        if (!formData.currentZip.trim()) stepErrors.currentZip = 'ZIP code is required';
        if (!formData.yearsAtAddress) stepErrors.yearsAtAddress = 'Years at address is required';
        break;
        
      case 3: // Employment
        if (!formData.employerName.trim()) stepErrors.employerName = 'Employer name is required';
        if (!formData.jobTitle.trim()) stepErrors.jobTitle = 'Job title is required';
        if (!formData.employerAddress.trim()) stepErrors.employerAddress = 'Employer address is required';
        if (!formData.employerPhone.trim()) stepErrors.employerPhone = 'Employer phone is required';
        if (!formData.employmentLength.trim()) stepErrors.employmentLength = 'Employment length is required';
        if (!formData.monthlyIncome) stepErrors.monthlyIncome = 'Monthly income is required';
        break;
        
      case 4: // Rental History (optional fields, no validation needed)
        break;
        
      case 5: // References
        if (!formData.refName.trim()) stepErrors.refName = 'Reference name is required';
        if (!formData.refRelationship.trim()) stepErrors.refRelationship = 'Relationship is required';
        if (!formData.refContact.trim()) stepErrors.refContact = 'Reference contact is required';
        break;
        
      case 6: // Household
        if (!formData.occupants) stepErrors.occupants = 'Number of occupants is required';
        break;
        
      case 7: // Background (boolean fields, no validation needed)
        break;
        
      case 8: // Final
        if (!formData.desiredMoveIn) stepErrors.desiredMoveIn = 'Desired move-in date is required';
        if (!formData.consentBackground) stepErrors.consentBackground = 'Background check consent is required';
        if (!formData.signature.trim()) stepErrors.signature = 'Digital signature is required';
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationData = {
        propertyId,
        ...formData,
        monthlyIncome: parseFloat(formData.monthlyIncome),
        otherIncome: formData.otherIncome ? parseFloat(formData.otherIncome) : null,
        yearsAtAddress: parseFloat(formData.yearsAtAddress),
        occupants: parseInt(formData.occupants)
      };

      const response = await axios.post('/api/applications', applicationData);
      
      if (onSubmitSuccess) {
        onSubmitSuccess(response.data);
      }
    } catch (error) {
      console.error('Application submission failed:', error);
      setErrors({ submit: error.response?.data?.message || 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalInfo = () => (
    <div className="form-section">
      <h3>Personal Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>
        
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>
        
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        
        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>
        
        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={errors.dateOfBirth ? 'error' : ''}
          />
          {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
        </div>
      </div>
    </div>
  );

  const renderCurrentAddress = () => (
    <div className="form-section">
      <h3>Current Address</h3>
      <div className="form-grid">
        <div className="form-group full-width">
          <label>Current Address *</label>
          <input
            type="text"
            value={formData.currentAddress}
            onChange={(e) => handleInputChange('currentAddress', e.target.value)}
            className={errors.currentAddress ? 'error' : ''}
          />
          {errors.currentAddress && <span className="error-text">{errors.currentAddress}</span>}
        </div>
        
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={formData.currentCity}
            onChange={(e) => handleInputChange('currentCity', e.target.value)}
            className={errors.currentCity ? 'error' : ''}
          />
          {errors.currentCity && <span className="error-text">{errors.currentCity}</span>}
        </div>
        
        <div className="form-group">
          <label>State *</label>
          <input
            type="text"
            value={formData.currentState}
            onChange={(e) => handleInputChange('currentState', e.target.value)}
            className={errors.currentState ? 'error' : ''}
          />
          {errors.currentState && <span className="error-text">{errors.currentState}</span>}
        </div>
        
        <div className="form-group">
          <label>ZIP Code *</label>
          <input
            type="text"
            value={formData.currentZip}
            onChange={(e) => handleInputChange('currentZip', e.target.value)}
            className={errors.currentZip ? 'error' : ''}
          />
          {errors.currentZip && <span className="error-text">{errors.currentZip}</span>}
        </div>
        
        <div className="form-group">
          <label>Years at Address *</label>
          <input
            type="number"
            value={formData.yearsAtAddress}
            onChange={(e) => handleInputChange('yearsAtAddress', e.target.value)}
            className={errors.yearsAtAddress ? 'error' : ''}
          />
          {errors.yearsAtAddress && <span className="error-text">{errors.yearsAtAddress}</span>}
        </div>
        
        <div className="form-group full-width">
          <label>Reason for Moving</label>
          <textarea
            value={formData.reasonForMoving}
            onChange={(e) => handleInputChange('reasonForMoving', e.target.value)}
            rows="3"
          />
        </div>
      </div>
    </div>
  );

  const renderEmployment = () => (
    <div className="form-section">
      <h3>Employment Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Employer Name *</label>
          <input
            type="text"
            value={formData.employerName}
            onChange={(e) => handleInputChange('employerName', e.target.value)}
            className={errors.employerName ? 'error' : ''}
          />
          {errors.employerName && <span className="error-text">{errors.employerName}</span>}
        </div>
        
        <div className="form-group">
          <label>Job Title *</label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            className={errors.jobTitle ? 'error' : ''}
          />
          {errors.jobTitle && <span className="error-text">{errors.jobTitle}</span>}
        </div>
        
        <div className="form-group full-width">
          <label>Employer Address *</label>
          <input
            type="text"
            value={formData.employerAddress}
            onChange={(e) => handleInputChange('employerAddress', e.target.value)}
            className={errors.employerAddress ? 'error' : ''}
          />
          {errors.employerAddress && <span className="error-text">{errors.employerAddress}</span>}
        </div>
        
        <div className="form-group">
          <label>Employer Phone *</label>
          <input
            type="tel"
            value={formData.employerPhone}
            onChange={(e) => handleInputChange('employerPhone', e.target.value)}
            className={errors.employerPhone ? 'error' : ''}
          />
          {errors.employerPhone && <span className="error-text">{errors.employerPhone}</span>}
        </div>
        
        <div className="form-group">
          <label>Employment Length *</label>
          <input
            type="text"
            placeholder="e.g., 2 years, 6 months"
            value={formData.employmentLength}
            onChange={(e) => handleInputChange('employmentLength', e.target.value)}
            className={errors.employmentLength ? 'error' : ''}
          />
          {errors.employmentLength && <span className="error-text">{errors.employmentLength}</span>}
        </div>
        
        <div className="form-group">
          <label>Monthly Income *</label>
          <input
            type="number"
            value={formData.monthlyIncome}
            onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
            className={errors.monthlyIncome ? 'error' : ''}
          />
          {errors.monthlyIncome && <span className="error-text">{errors.monthlyIncome}</span>}
        </div>
        
        <div className="form-group">
          <label>Other Income</label>
          <input
            type="number"
            value={formData.otherIncome}
            onChange={(e) => handleInputChange('otherIncome', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderRentalHistory = () => (
    <div className="form-section">
      <h3>Previous Rental History</h3>
      <div className="form-grid">
        <div className="form-group full-width">
          <label>Previous Address</label>
          <input
            type="text"
            value={formData.prevAddress}
            onChange={(e) => handleInputChange('prevAddress', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Previous Landlord Name</label>
          <input
            type="text"
            value={formData.prevLandlordName}
            onChange={(e) => handleInputChange('prevLandlordName', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Previous Landlord Contact</label>
          <input
            type="text"
            value={formData.prevLandlordContact}
            onChange={(e) => handleInputChange('prevLandlordContact', e.target.value)}
          />
        </div>
        
        <div className="form-group full-width">
          <label>Reason for Leaving</label>
          <textarea
            value={formData.reasonForLeaving}
            onChange={(e) => handleInputChange('reasonForLeaving', e.target.value)}
            rows="3"
          />
        </div>
        
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.wasLateRent}
              onChange={(e) => handleInputChange('wasLateRent', e.target.checked)}
            />
            Have you ever been late on rent?
          </label>
        </div>
      </div>
    </div>
  );

  const renderReferences = () => (
    <div className="form-section">
      <h3>References</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Reference Name *</label>
          <input
            type="text"
            value={formData.refName}
            onChange={(e) => handleInputChange('refName', e.target.value)}
            className={errors.refName ? 'error' : ''}
          />
          {errors.refName && <span className="error-text">{errors.refName}</span>}
        </div>
        
        <div className="form-group">
          <label>Relationship *</label>
          <input
            type="text"
            value={formData.refRelationship}
            onChange={(e) => handleInputChange('refRelationship', e.target.value)}
            className={errors.refRelationship ? 'error' : ''}
          />
          {errors.refRelationship && <span className="error-text">{errors.refRelationship}</span>}
        </div>
        
        <div className="form-group">
          <label>Contact Information *</label>
          <input
            type="text"
            value={formData.refContact}
            onChange={(e) => handleInputChange('refContact', e.target.value)}
            className={errors.refContact ? 'error' : ''}
          />
          {errors.refContact && <span className="error-text">{errors.refContact}</span>}
        </div>
      </div>
    </div>
  );

  const renderHousehold = () => (
    <div className="form-section">
      <h3>Household Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Number of Occupants *</label>
          <input
            type="number"
            min="1"
            value={formData.occupants}
            onChange={(e) => handleInputChange('occupants', e.target.value)}
            className={errors.occupants ? 'error' : ''}
          />
          {errors.occupants && <span className="error-text">{errors.occupants}</span>}
        </div>
        
        <div className="form-group full-width">
          <label>Pets (if any)</label>
          <textarea
            placeholder="Describe any pets (type, size, etc.)"
            value={formData.pets}
            onChange={(e) => handleInputChange('pets', e.target.value)}
            rows="3"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Vehicles</label>
          <textarea
            placeholder="Describe vehicles (make, model, year, license plate)"
            value={formData.vehicles}
            onChange={(e) => handleInputChange('vehicles', e.target.value)}
            rows="3"
          />
        </div>
      </div>
    </div>
  );

  const renderBackground = () => (
    <div className="form-section">
      <h3>Background & Disclosures</h3>
      <div className="form-grid">
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.wasEvicted}
              onChange={(e) => handleInputChange('wasEvicted', e.target.checked)}
            />
            Have you ever been evicted?
          </label>
        </div>
        
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.felony}
              onChange={(e) => handleInputChange('felony', e.target.checked)}
            />
            Do you have any felony convictions?
          </label>
        </div>
      </div>
    </div>
  );

  const renderFinal = () => (
    <div className="form-section">
      <h3>Application Details</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Desired Move-in Date *</label>
          <input
            type="date"
            value={formData.desiredMoveIn}
            onChange={(e) => handleInputChange('desiredMoveIn', e.target.value)}
            className={errors.desiredMoveIn ? 'error' : ''}
          />
          {errors.desiredMoveIn && <span className="error-text">{errors.desiredMoveIn}</span>}
        </div>
        
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.consentBackground}
              onChange={(e) => handleInputChange('consentBackground', e.target.checked)}
              className={errors.consentBackground ? 'error' : ''}
            />
            I consent to a background check *
          </label>
          {errors.consentBackground && <span className="error-text">{errors.consentBackground}</span>}
        </div>
        
        <div className="form-group full-width">
          <label>Digital Signature *</label>
          <input
            type="text"
            placeholder="Type your full name as digital signature"
            value={formData.signature}
            onChange={(e) => handleInputChange('signature', e.target.value)}
            className={errors.signature ? 'error' : ''}
          />
          {errors.signature && <span className="error-text">{errors.signature}</span>}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderPersonalInfo();
      case 2: return renderCurrentAddress();
      case 3: return renderEmployment();
      case 4: return renderRentalHistory();
      case 5: return renderReferences();
      case 6: return renderHousehold();
      case 7: return renderBackground();
      case 8: return renderFinal();
      default: return null;
    }
  };

  return (
    <div className="application-form">
      <div className="form-header">
        <h2>Rental Application</h2>
        {property && (
          <div className="property-info">
            <h3>{property.title || property.addressStreet}</h3>
            <p>{property.addressCity}, {property.addressState} • ${property.rentAmount}/month</p>
          </div>
        )}
        
        <div className="progress-bar">
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div 
                key={i} 
                className={`step ${i + 1 <= currentStep ? 'completed' : ''} ${i + 1 === currentStep ? 'active' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>
        
        <p className="step-indicator">Step {currentStep} of {totalSteps}</p>
      </div>

      <div className="form-content">
        {renderCurrentStep()}
        
        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}
      </div>

      <div className="form-actions">
        <div className="left-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
        
        <div className="right-actions">
          {currentStep > 1 && (
            <button type="button" onClick={handlePrevious} className="btn btn-secondary">
              Previous
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button type="button" onClick={handleNext} className="btn btn-primary">
              Next
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="btn btn-success"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;