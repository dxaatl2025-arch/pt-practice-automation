// client/src/components/applications/PropertyApplications.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PropertyApplications.css';

const PropertyApplications = ({ landlordId }) => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchProperties();
  }, [landlordId]);

  useEffect(() => {
    if (selectedProperty) {
      fetchApplications();
    }
  }, [selectedProperty, filters]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      const landlordProperties = response.data.data.filter(
        prop => prop.landlordId === landlordId || prop.owner?.id === landlordId
      );
      setProperties(landlordProperties);
      
      if (landlordProperties.length > 0) {
        setSelectedProperty(landlordProperties[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchApplications = async () => {
    if (!selectedProperty) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        propertyId: selectedProperty,
        ...filters
      });
      
      const response = await axios.get(`/api/applications?${params}`);
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (applicationId) => {
    try {
      const response = await axios.get(`/api/applications/${applicationId}`);
      setSelectedApplication(response.data.data);
    } catch (error) {
      console.error('Failed to fetch application details:', error);
    }
  };

  const updateApplicationStatus = async (applicationId, status, reviewNotes = '') => {
    setUpdating(true);
    try {
      await axios.patch(`/api/applications/${applicationId}/status`, {
        status,
        reviewNotes
      });
      
      // Refresh applications list
      fetchApplications();
      
      // Update selected application if it's the one being updated
      if (selectedApplication && selectedApplication.id === applicationId) {
        fetchApplicationDetails(applicationId);
      }
      
      alert(`Application ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('Failed to update application status');
    } finally {
      setUpdating(false);
    }
  };

  const downloadApplicationPDF = async (applicationId, applicantName) => {
    try {
      const response = await axios.get(`/api/applications/${applicationId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `application-${applicantName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'DECLINED': return 'status-declined';
      default: return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const ApplicationCard = ({ application }) => (
    <div 
      className={`application-card ${selectedApplication?.id === application.id ? 'selected' : ''}`}
      onClick={() => fetchApplicationDetails(application.id)}
    >
      <div className="application-header">
        <h4>{application.firstName} {application.lastName}</h4>
        <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
          {application.status}
        </span>
      </div>
      
      <div className="application-info">
        <p><strong>Email:</strong> {application.email}</p>
        <p><strong>Monthly Income:</strong> {formatCurrency(application.monthlyIncome)}</p>
        <p><strong>Occupants:</strong> {application.occupants}</p>
        <p><strong>Submitted:</strong> {formatDate(application.submittedAt)}</p>
      </div>
    </div>
  );

  const ApplicationDetails = ({ application }) => {
    const [reviewNotes, setReviewNotes] = useState(application.reviewNotes || '');

    return (
      <div className="application-details">
        <div className="details-header">
          <h3>{application.firstName} {application.lastName}</h3>
          <div className="details-actions">
            <button
              onClick={() => downloadApplicationPDF(application.id, `${application.firstName}-${application.lastName}`)}
              className="btn btn-secondary"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="details-content">
          <div className="section">
            <h4>Personal Information</h4>
            <div className="info-grid">
              <div><strong>Name:</strong> {application.firstName} {application.lastName}</div>
              <div><strong>Email:</strong> {application.email}</div>
              <div><strong>Phone:</strong> {application.phone}</div>
              <div><strong>Date of Birth:</strong> {new Date(application.dateOfBirth).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="section">
            <h4>Current Address</h4>
            <div className="info-grid">
              <div><strong>Address:</strong> {application.currentAddress}</div>
              <div><strong>City:</strong> {application.currentCity}, {application.currentState} {application.currentZip}</div>
              <div><strong>Years at Address:</strong> {application.yearsAtAddress}</div>
              {application.reasonForMoving && (
                <div><strong>Reason for Moving:</strong> {application.reasonForMoving}</div>
              )}
            </div>
          </div>

          <div className="section">
            <h4>Employment Information</h4>
            <div className="info-grid">
              <div><strong>Employer:</strong> {application.employerName}</div>
              <div><strong>Job Title:</strong> {application.jobTitle}</div>
              <div><strong>Employer Address:</strong> {application.employerAddress}</div>
              <div><strong>Employer Phone:</strong> {application.employerPhone}</div>
              <div><strong>Employment Length:</strong> {application.employmentLength}</div>
              <div><strong>Monthly Income:</strong> {formatCurrency(application.monthlyIncome)}</div>
              {application.otherIncome && (
                <div><strong>Other Income:</strong> {formatCurrency(application.otherIncome)}</div>
              )}
            </div>
          </div>

          {(application.prevAddress || application.prevLandlordName) && (
            <div className="section">
              <h4>Previous Rental History</h4>
              <div className="info-grid">
                {application.prevAddress && <div><strong>Previous Address:</strong> {application.prevAddress}</div>}
                {application.prevLandlordName && <div><strong>Previous Landlord:</strong> {application.prevLandlordName}</div>}
                {application.prevLandlordContact && <div><strong>Landlord Contact:</strong> {application.prevLandlordContact}</div>}
                {application.reasonForLeaving && <div><strong>Reason for Leaving:</strong> {application.reasonForLeaving}</div>}
                <div><strong>Late Rent History:</strong> {application.wasLateRent ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          <div className="section">
            <h4>References</h4>
            <div className="info-grid">
              <div><strong>Name:</strong> {application.refName}</div>
              <div><strong>Relationship:</strong> {application.refRelationship}</div>
              <div><strong>Contact:</strong> {application.refContact}</div>
            </div>
          </div>

          <div className="section">
            <h4>Household Information</h4>
            <div className="info-grid">
              <div><strong>Number of Occupants:</strong> {application.occupants}</div>
              <div><strong>Desired Move-in Date:</strong> {new Date(application.desiredMoveIn).toLocaleDateString()}</div>
              {application.pets && <div><strong>Pets:</strong> {application.pets}</div>}
              {application.vehicles && <div><strong>Vehicles:</strong> {application.vehicles}</div>}
            </div>
          </div>

          <div className="section">
            <h4>Background Disclosures</h4>
            <div className="info-grid">
              <div><strong>Previous Eviction:</strong> {application.wasEvicted ? 'Yes' : 'No'}</div>
              <div><strong>Felony Conviction:</strong> {application.felony ? 'Yes' : 'No'}</div>
              <div><strong>Background Consent:</strong> {application.consentBackground ? 'Yes' : 'No'}</div>
              <div><strong>Digital Signature:</strong> {application.signature}</div>
            </div>
          </div>

          <div className="section">
            <h4>Application Status</h4>
            <div className="info-grid">
              <div><strong>Current Status:</strong> 
                <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                  {application.status}
                </span>
              </div>
              <div><strong>Submitted:</strong> {formatDate(application.submittedAt)}</div>
              {application.reviewedAt && (
                <div><strong>Reviewed:</strong> {formatDate(application.reviewedAt)}</div>
              )}
            </div>

            {application.status === 'PENDING' && (
              <div className="status-actions">
                <div className="review-notes">
                  <label>Review Notes:</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows="3"
                  />
                </div>
                
                <div className="action-buttons">
                  <button
                    onClick={() => updateApplicationStatus(application.id, 'APPROVED', reviewNotes)}
                    disabled={updating}
                    className="btn btn-success"
                  >
                    {updating ? 'Updating...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(application.id, 'DECLINED', reviewNotes)}
                    disabled={updating}
                    className="btn btn-danger"
                  >
                    {updating ? 'Updating...' : 'Decline'}
                  </button>
                </div>
              </div>
            )}

            {application.reviewNotes && (
              <div className="existing-notes">
                <strong>Review Notes:</strong>
                <p>{application.reviewNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="property-applications">
      <div className="applications-header">
        <h2>Rental Applications</h2>
        
        <div className="header-controls">
          <div className="property-selector">
            <label>Property:</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="">Select Property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.title || `${property.addressStreet}, ${property.addressCity}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filters">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DECLINED">Declined</option>
            </select>

            <input
              type="text"
              placeholder="Search applicants..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {selectedProperty && (
          <div className="applications-summary">
            <span className="summary-item">
              <strong>{applications.filter(app => app.status === 'PENDING').length}</strong> Pending
            </span>
            <span className="summary-item">
              <strong>{applications.filter(app => app.status === 'APPROVED').length}</strong> Approved
            </span>
            <span className="summary-item">
              <strong>{applications.length}</strong> Total
            </span>
          </div>
        )}
      </div>

      {!selectedProperty ? (
        <div className="empty-state">
          <p>Select a property to view applications</p>
        </div>
      ) : loading ? (
        <div className="loading-state">
          <p>Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <p>No applications found for this property</p>
        </div>
      ) : (
        <div className="applications-content">
          <div className="applications-list">
            <h3>Applications ({applications.length})</h3>
            {applications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>

          {selectedApplication && (
            <div className="application-details-panel">
              <ApplicationDetails application={selectedApplication} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyApplications;