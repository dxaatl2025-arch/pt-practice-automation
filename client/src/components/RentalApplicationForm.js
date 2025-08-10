// src/components/RentalApplicationForm.js - COMPLETE WORKING VERSION
import React, { useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, FileText, User, Home, Briefcase, Users, Shield } from 'lucide-react';

const RentalApplicationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    currentAddress: '',
    currentAddressDuration: '',
    reasonForMoving: '',
    employerName: '',
    jobTitle: '',
    employerAddress: '',
    employerPhone: '',
    employmentLength: '',
    monthlyGrossIncome: '',
    otherIncomeSources: '',
    previousAddress: '',
    previousLandlordName: '',
    previousLandlordContact: '',
    reasonForLeaving: '',
    lateRentHistory: false,
    referenceName: '',
    referenceRelationship: '',
    referenceContact: '',
    numberOfOccupants: 1,
    hasPets: false,
    petDetails: '',
    hasVehicles: false,
    vehicleDetails: '',
    everEvicted: false,
    evictionDetails: '',
    criminalConviction: false,
    convictionDetails: '',
    desiredMoveInDate: '',
    backgroundCheckConsent: false,
    signatureData: '',
    propertyId: '',
    landlordId: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const signatureCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const totalSteps = 6;

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Address', icon: Home },
    { number: 3, title: 'Employment', icon: Briefcase },
    { number: 4, title: 'References', icon: Users },
    { number: 5, title: 'Background', icon: Shield },
    { number: 6, title: 'Review & Sign', icon: FileText }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        
        if (formData.dateOfBirth) {
          const birthDate = new Date(formData.dateOfBirth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          if (age < 18) newErrors.dateOfBirth = 'Applicant must be 18 years or older';
        }
        break;

      case 2:
        if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current address is required';
        if (!formData.currentAddressDuration.trim()) newErrors.currentAddressDuration = 'Duration at current address is required';
        if (!formData.reasonForMoving.trim()) newErrors.reasonForMoving = 'Reason for moving is required';
        break;

      case 3:
        if (!formData.employerName.trim()) newErrors.employerName = 'Employer name is required';
        if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
        if (!formData.employerAddress.trim()) newErrors.employerAddress = 'Employer address is required';
        if (!formData.employerPhone.trim()) newErrors.employerPhone = 'Employer phone is required';
        if (!formData.employmentLength.trim()) newErrors.employmentLength = 'Employment length is required';
        if (!formData.monthlyGrossIncome) newErrors.monthlyGrossIncome = 'Monthly income is required';
        
        if (formData.monthlyGrossIncome && (isNaN(formData.monthlyGrossIncome) || formData.monthlyGrossIncome <= 0)) {
          newErrors.monthlyGrossIncome = 'Income must be a positive number';
        }
        break;

      case 4:
        if (!formData.referenceName.trim()) newErrors.referenceName = 'Reference name is required';
        if (!formData.referenceRelationship.trim()) newErrors.referenceRelationship = 'Reference relationship is required';
        if (!formData.referenceContact.trim()) newErrors.referenceContact = 'Reference contact is required';
        if (!formData.numberOfOccupants || formData.numberOfOccupants < 1) {
          newErrors.numberOfOccupants = 'Number of occupants must be at least 1';
        }
        break;

      case 5:
        if (formData.everEvicted && !formData.evictionDetails.trim()) {
          newErrors.evictionDetails = 'Please provide eviction details';
        }
        if (formData.criminalConviction && !formData.convictionDetails.trim()) {
          newErrors.convictionDetails = 'Please provide conviction details';
        }
        break;

      case 6:
        if (!formData.desiredMoveInDate) newErrors.desiredMoveInDate = 'Desired move-in date is required';
        if (!formData.backgroundCheckConsent) newErrors.backgroundCheckConsent = 'Background check consent is required';
        if (!formData.signatureData) newErrors.signatureData = 'Digital signature is required';
        
        if (formData.desiredMoveInDate) {
          const moveInDate = new Date(formData.desiredMoveInDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (moveInDate < today) {
            newErrors.desiredMoveInDate = 'Move-in date cannot be in the past';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Signature Canvas Functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = signatureCanvasRef.current;
      const signatureData = canvas.toDataURL();
      setFormData(prev => ({ ...prev, signatureData }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData(prev => ({ ...prev, signatureData: '' }));
  };

  const submitApplication = async () => {
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/rental-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmissionResult({
          success: true,
          applicationNumber: result.data.applicationNumber,
          message: 'Application submitted successfully!'
        });
      } else {
        setSubmissionResult({
          success: false,
          message: result.message || 'Failed to submit application'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '2rem', textAlign: 'center' }}>
          {submissionResult.success ? (
            <>
              <CheckCircle2 style={{ width: '3rem', height: '3rem', color: '#10b981', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Application Submitted!</h2>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{submissionResult.message}</p>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#166534' }}>
                  <strong>Application Number:</strong><br />
                  {submissionResult.applicationNumber}
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Please save your application number for future reference.
              </p>
            </>
          ) : (
            <>
              <AlertCircle style={{ width: '3rem', height: '3rem', color: '#ef4444', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Submission Failed</h2>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{submissionResult.message}</p>
              <button
                onClick={() => setSubmissionResult(null)}
                style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    const inputStyle = {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    };

    const errorInputStyle = {
      ...inputStyle,
      borderColor: '#ef4444'
    };

    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <User style={{ width: '1.25rem', height: '1.25rem' }} />
              Personal Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  style={errors.fullName ? errorInputStyle : inputStyle}
                  placeholder="Enter your full legal name"
                />
                {errors.fullName && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  style={errors.dateOfBirth ? errorInputStyle : inputStyle}
                />
                {errors.dateOfBirth && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={errors.email ? errorInputStyle : inputStyle}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={errors.phone ? errorInputStyle : inputStyle}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Home style={{ width: '1.25rem', height: '1.25rem' }} />
              Address Information
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Current Address *
              </label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleInputChange}
                rows={3}
                style={errors.currentAddress ? {...inputStyle, borderColor: '#ef4444'} : inputStyle}
                placeholder="Street address, city, state, zip code"
              />
              {errors.currentAddress && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.currentAddress}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  How long at current address? *
                </label>
                <input
                  type="text"
                  name="currentAddressDuration"
                  value={formData.currentAddressDuration}
                  onChange={handleInputChange}
                  style={errors.currentAddressDuration ? errorInputStyle : inputStyle}
                  placeholder="e.g., 2 years 3 months"
                />
                {errors.currentAddressDuration && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.currentAddressDuration}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Reason for moving *
                </label>
                <input
                  type="text"
                  name="reasonForMoving"
                  value={formData.reasonForMoving}
                  onChange={handleInputChange}
                  style={errors.reasonForMoving ? errorInputStyle : inputStyle}
                  placeholder="e.g., Job relocation, need more space"
                />
                {errors.reasonForMoving && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.reasonForMoving}</p>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Previous Address (if applicable)
              </label>
              <textarea
                name="previousAddress"
                value={formData.previousAddress}
                onChange={handleInputChange}
                rows={2}
                style={inputStyle}
                placeholder="Previous address"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Previous Landlord Name
                </label>
                <input
                  type="text"
                  name="previousLandlordName"
                  value={formData.previousLandlordName}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Landlord name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Landlord Contact
                </label>
                <input
                  type="text"
                  name="previousLandlordContact"
                  value={formData.previousLandlordContact}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Phone or email"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Ever been late on rent?
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="lateRentHistory"
                      checked={formData.lateRentHistory === true}
                      onChange={() => setFormData(prev => ({ ...prev, lateRentHistory: true }))}
                    />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="lateRentHistory"
                      checked={formData.lateRentHistory === false}
                      onChange={() => setFormData(prev => ({ ...prev, lateRentHistory: false }))}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Briefcase style={{ width: '1.25rem', height: '1.25rem' }} />
              Employment & Income Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Current Employer Name *
                </label>
                <input
                  type="text"
                  name="employerName"
                  value={formData.employerName}
                  onChange={handleInputChange}
                  style={errors.employerName ? errorInputStyle : inputStyle}
                  placeholder="Company name"
                />
                {errors.employerName && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.employerName}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  style={errors.jobTitle ? errorInputStyle : inputStyle}
                  placeholder="Your position"
                />
                {errors.jobTitle && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.jobTitle}</p>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Employer Address *
              </label>
              <textarea
                name="employerAddress"
                value={formData.employerAddress}
                onChange={handleInputChange}
                rows={2}
                style={errors.employerAddress ? {...inputStyle, borderColor: '#ef4444'} : inputStyle}
                placeholder="Employer's full address"
              />
              {errors.employerAddress && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.employerAddress}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Employer Phone *
                </label>
                <input
                  type="tel"
                  name="employerPhone"
                  value={formData.employerPhone}
                  onChange={handleInputChange}
                  style={errors.employerPhone ? errorInputStyle : inputStyle}
                  placeholder="(555) 123-4567"
                />
                {errors.employerPhone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.employerPhone}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Length of Employment *
                </label>
                <input
                  type="text"
                  name="employmentLength"
                  value={formData.employmentLength}
                  onChange={handleInputChange}
                  style={errors.employmentLength ? errorInputStyle : inputStyle}
                  placeholder="e.g., 2 years 6 months"
                />
                {errors.employmentLength && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.employmentLength}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Monthly Gross Income *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '8px', color: '#6b7280' }}>$</span>
                  <input
                    type="number"
                    name="monthlyGrossIncome"
                    value={formData.monthlyGrossIncome}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      paddingLeft: '24px',
                      borderColor: errors.monthlyGrossIncome ? '#ef4444' : '#d1d5db'
                    }}
                    placeholder="5000"
                    min="0"
                    step="100"
                  />
                </div>
                {errors.monthlyGrossIncome && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.monthlyGrossIncome}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Other Income Sources
                </label>
                <input
                  type="text"
                  name="otherIncomeSources"
                  value={formData.otherIncomeSources}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="e.g., Investment income, freelance"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users style={{ width: '1.25rem', height: '1.25rem' }} />
              References & Household Information
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Personal Reference</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Reference Name *
                  </label>
                  <input
                    type="text"
                    name="referenceName"
                    value={formData.referenceName}
                    onChange={handleInputChange}
                    style={errors.referenceName ? errorInputStyle : inputStyle}
                    placeholder="Full name"
                  />
                  {errors.referenceName && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.referenceName}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Relationship to Applicant *
                  </label>
                  <input
                    type="text"
                    name="referenceRelationship"
                    value={formData.referenceRelationship}
                    onChange={handleInputChange}
                    style={errors.referenceRelationship ? errorInputStyle : inputStyle}
                    placeholder="e.g., Friend, Colleague"
                  />
                  {errors.referenceRelationship && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.referenceRelationship}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Reference Contact Info *
                  </label>
                  <input
                    type="text"
                    name="referenceContact"
                    value={formData.referenceContact}
                    onChange={handleInputChange}
                    style={errors.referenceContact ? errorInputStyle : inputStyle}
                    placeholder="Phone or email"
                  />
                  {errors.referenceContact && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.referenceContact}</p>}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Household Information</h4>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Number of Occupants *
                </label>
                <input
                  type="number"
                  name="numberOfOccupants"
                  value={formData.numberOfOccupants}
                  onChange={handleInputChange}
                  style={errors.numberOfOccupants ? errorInputStyle : inputStyle}
                  min="1"
                  placeholder="1"
                />
                {errors.numberOfOccupants && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.numberOfOccupants}</p>}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Do you have pets?
                </label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="hasPets"
                      checked={formData.hasPets === true}
                      onChange={() => setFormData(prev => ({ ...prev, hasPets: true }))}
                    />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="hasPets"
                      checked={formData.hasPets === false}
                      onChange={() => setFormData(prev => ({ ...prev, hasPets: false }))}
                    />
                    No
                  </label>
                </div>
                {formData.hasPets && (
                  <textarea
                    name="petDetails"
                    value={formData.petDetails}
                    onChange={handleInputChange}
                    rows={2}
                    style={inputStyle}
                    placeholder="Describe your pets (type, breed, size, weight)"
                  />
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Do you have vehicles?
                </label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="hasVehicles"
                      checked={formData.hasVehicles === true}
                      onChange={() => setFormData(prev => ({ ...prev, hasVehicles: true }))}
                    />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="hasVehicles"
                      checked={formData.hasVehicles === false}
                      onChange={() => setFormData(prev => ({ ...prev, hasVehicles: false }))}
                    />
                    No
                  </label>
                </div>
                {formData.hasVehicles && (
                  <textarea
                    name="vehicleDetails"
                    value={formData.vehicleDetails}
                    onChange={handleInputChange}
                    rows={2}
                    style={inputStyle}
                    placeholder="Describe your vehicles (make, model, year, license plate)"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
              Background & Legal Information
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Have you ever been evicted? *
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="everEvicted"
                    checked={formData.everEvicted === true}
                    onChange={() => setFormData(prev => ({ ...prev, everEvicted: true }))}
                  />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="everEvicted"
                    checked={formData.everEvicted === false}
                    onChange={() => setFormData(prev => ({ ...prev, everEvicted: false }))}
                  />
                  No
                </label>
              </div>
              {formData.everEvicted && (
                <div>
                  <textarea
                    name="evictionDetails"
                    value={formData.evictionDetails}
                    onChange={handleInputChange}
                    rows={3}
                    style={errors.evictionDetails ? {...inputStyle, borderColor: '#ef4444'} : inputStyle}
                    placeholder="Please provide details about the eviction"
                  />
                  {errors.evictionDetails && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.evictionDetails}</p>}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Have you ever been convicted of a crime? *
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="criminalConviction"
                    checked={formData.criminalConviction === true}
                    onChange={() => setFormData(prev => ({ ...prev, criminalConviction: true }))}
                  />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="criminalConviction"
                    checked={formData.criminalConviction === false}
                    onChange={() => setFormData(prev => ({ ...prev, criminalConviction: false }))}
                  />
                  No
                </label>
              </div>
              {formData.criminalConviction && (
                <div>
                  <textarea
                    name="convictionDetails"
                    value={formData.convictionDetails}
                    onChange={handleInputChange}
                    rows={3}
                    style={errors.convictionDetails ? {...inputStyle, borderColor: '#ef4444'} : inputStyle}
                    placeholder="Please provide details about the conviction"
                  />
                  {errors.convictionDetails && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.convictionDetails}</p>}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '6px', padding: '1rem' }}>
              <p style={{ fontSize: '14px', color: '#1e40af' }}>
                <strong>Note:</strong> A criminal history will not necessarily disqualify you from renting. 
                We evaluate applications on a case-by-case basis considering the nature, timing, and 
                relevance of any convictions.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FileText style={{ width: '1.25rem', height: '1.25rem' }} />
              Review & Sign Application
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Desired Move-In Date *
              </label>
              <input
                type="date"
                name="desiredMoveInDate"
                value={formData.desiredMoveInDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                style={errors.desiredMoveInDate ? errorInputStyle : inputStyle}
              />
              {errors.desiredMoveInDate && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.desiredMoveInDate}</p>}
            </div>

            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="backgroundCheckConsent"
                  checked={formData.backgroundCheckConsent}
                  onChange={handleInputChange}
                  style={{ marginTop: '4px' }}
                />
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Background & Credit Check Consent *
                  </label>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    I authorize the landlord to conduct a background check, credit check, and verify 
                    employment and rental history as part of the application process.
                  </p>
                </div>
              </div>
              {errors.backgroundCheckConsent && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.backgroundCheckConsent}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Digital Signature *
              </label>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', backgroundColor: 'white' }}>
                <canvas
                  ref={signatureCanvasRef}
                  width={400}
                  height={150}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'crosshair', width: '100%', maxWidth: '400px', height: 'auto' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Sign above using your mouse or finger</p>
                  <button
                    type="button"
                    onClick={clearSignature}
                    style={{ fontSize: '12px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {errors.signatureData && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.signatureData}</p>}
            </div>

            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Application Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Applicant:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '500' }}>{formData.fullName || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Email:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '500' }}>{formData.email || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Phone:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '500' }}>{formData.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Monthly Income:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                    {formData.monthlyGrossIncome ? `${parseFloat(formData.monthlyGrossIncome).toLocaleString()}` : 'Not provided'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Occupants:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '500' }}>{formData.numberOfOccupants || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Pets:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '500' }}>{formData.hasPets ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          PropertyPulse Rental Application
        </h1>
        <p style={{ color: '#6b7280' }}>Complete all sections to submit your rental application</p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= step.number ? '#2563eb' : '#e5e7eb',
                  color: currentStep >= step.number ? 'white' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {currentStep > step.number ? '✓' : <StepIcon size={18} />}
                </div>
                {index < steps.length - 1 && (
                  <div style={{
                    width: '2rem',
                    height: '2px',
                    backgroundColor: currentStep > step.number ? '#2563eb' : '#e5e7eb',
                    marginLeft: '0.5rem'
                  }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Step {currentStep} of {totalSteps}: {steps[currentStep - 1]?.title}
          </span>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '2rem', marginBottom: '2rem' }}>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            fontWeight: '500',
            border: 'none',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            backgroundColor: currentStep === 1 ? '#e5e7eb' : '#6b7280',
            color: currentStep === 1 ? '#9ca3af' : 'white'
          }}
        >
          Previous
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={nextStep}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submitApplication}
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontWeight: '500',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              backgroundColor: isSubmitting ? '#9ca3af' : '#059669',
              color: 'white'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div style={{ marginTop: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#991b1b' }}>Please correct the following errors:</h4>
              <ul style={{ marginTop: '0.25rem', fontSize: '14px', color: '#dc2626', listStyle: 'disc', paddingLeft: '1.25rem' }}>
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalApplicationForm;