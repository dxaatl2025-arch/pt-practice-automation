// client/src/components/applications/MyApplications.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyApplications.css';

const MyApplications = ({ tenantId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    fetchMyApplications();
  }, [tenantId]);

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      // This would need to be implemented in your backend
      // For now, we'll simulate fetching applications for the tenant
      const response = await axios.get(`/api/users/${tenantId}/applications`);
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      // Fallback: Try to get all applications and filter (for demo purposes)
      try {
        const allResponse = await axios.get('/api/applications');
        // In a real app, this would be filtered server-side
        const myApps = allResponse.data.data?.filter(app => 
          app.email === tenantId || // If tenantId is email
          app.tenantId === tenantId // If tenantId is actual ID
        ) || [];
        setApplications(myApps);
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
        setApplications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'DECLINED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'DECLINED': return '❌';
      default: return '📄';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const downloadApplicationPDF = async (applicationId) => {
    try {
      const response = await axios.get(`/api/applications/${applicationId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my-application-${applicationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const ApplicationSummary = ({ application }) => (
    <div 
      className={`application-summary ${selectedApplication?.id === application.id ? 'selected' : ''}`}
      onClick={() => setSelectedApplication(application)}
    >
      <div className="summary-header">
        <div className="property-info">
          <h3>{application.property?.title || 'Property Application'}</h3>
          <p>{application.property?.address || 'Address not available'}</p>
        </div>
        <div className="status-info">
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(application.status) }}
          >
            {getStatusIcon(application.status)} {application.status}
          </span>
        </div>
      </div>
      
      <div className="summary-details">
        <div className="detail-item">
          <span className="label">Submitted:</span>
          <span className="value">{formatDate(application.submittedAt)}</span>
        </div>
        
        {application.reviewedAt && (
          <div className="detail-item">
            <span className="label">Reviewed:</span>
            <span className="value">{formatDate(application.reviewedAt)}</span>
          </div>
        )}
        
        <div className="detail-item">
          <span className="label">Monthly Income:</span>
          <span className="value">{formatCurrency(application.monthlyIncome)}</span>
        </div>
        
        <div className="detail-item">
          <span className="label">Desired Move-in:</span>
          <span className="value">{formatDate(application.desiredMoveIn)}</span>
        </div>
      </div>

      {application.reviewNotes && (
        <div className="review-notes-preview">
          <strong>Landlord Notes:</strong>
          <p>{application.reviewNotes}</p>
        </div>
      )}
    </div>
  );

  const ApplicationDetails = ({ application }) => (
    <div className="application-details">
      <div className="details-header">
        <div className="header-content">
          <h2>{application.property?.title || 'Property Application'}</h2>
          <p className="property-address">{application.property?.address || 'Address not available'}</p>
          
          <div className="status-section">
            <span 
              className="status-badge large"
              style={{ backgroundColor: getStatusColor(application.status) }}
            >
              {getStatusIcon(application.status)} {application.status}
            </span>
            
            {application.status === 'APPROVED' && (
              <div className="status-message success">
                🎉 Congratulations! Your application has been approved. The landlord will contact you soon.
              </div>
            )}
            
            {application.status === 'DECLINED' && (
              <div className="status-message declined">
                We're sorry, but your application was not selected for this property.
              </div>
            )}
            
            {application.status === 'PENDING' && (
              <div className="status-message pending">
                Your application is being reviewed. You'll be notified of the decision soon.
              </div>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button
            onClick={() => downloadApplicationPDF(application.id)}
            className="btn btn-secondary"
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      <div className="timeline">
        <h3>Application Timeline</h3>
        <div className="timeline-items">
          <div className="timeline-item completed">
            <div className="timeline-marker">✓</div>
            <div className="timeline-content">
              <h4>Application Submitted</h4>
              <p>{formatDate(application.submittedAt)}</p>
            </div>
          </div>
          
          <div className={`timeline-item ${application.reviewedAt ? 'completed' : 'pending'}`}>
            <div className="timeline-marker">
              {application.reviewedAt ? '✓' : '⏳'}
            </div>
            <div className="timeline-content">
              <h4>Under Review</h4>
              <p>
                {application.reviewedAt 
                  ? `Reviewed on ${formatDate(application.reviewedAt)}`
                  : 'Waiting for landlord review'
                }
              </p>
            </div>
          </div>
          
          <div className={`timeline-item ${application.status === 'APPROVED' ? 'completed' : application.status === 'DECLINED' ? 'declined' : 'pending'}`}>
            <div className="timeline-marker">
              {application.status === 'APPROVED' ? '✅' : 
               application.status === 'DECLINED' ? '❌' : '⏳'}
            </div>
            <div className="timeline-content">
              <h4>Decision</h4>
              <p>
                {application.status === 'APPROVED' ? 'Application approved!' :
                 application.status === 'DECLINED' ? 'Application declined' :
                 'Awaiting decision'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="application-summary-section">
        <h3>Application Summary</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <h4>Personal Information</h4>
            <div className="summary-item">
              <span className="label">Name:</span>
              <span className="value">{application.firstName} {application.lastName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Email:</span>
              <span className="value">{application.email}</span>
            </div>
            <div className="summary-item">
              <span className="label">Phone:</span>
              <span className="value">{application.phone}</span>
            </div>
          </div>

          <div className="summary-card">
            <h4>Employment</h4>
            <div className="summary-item">
              <span className="label">Employer:</span>
              <span className="value">{application.employerName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Position:</span>
              <span className="value">{application.jobTitle}</span>
            </div>
            <div className="summary-item">
              <span className="label">Monthly Income:</span>
              <span className="value">{formatCurrency(application.monthlyIncome)}</span>
            </div>
          </div>

          <div className="summary-card">
            <h4>Rental Details</h4>
            <div className="summary-item">
              <span className="label">Occupants:</span>
              <span className="value">{application.occupants}</span>
            </div>
            <div className="summary-item">
              <span className="label">Move-in Date:</span>
              <span className="value">{formatDate(application.desiredMoveIn)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Background Check:</span>
              <span className="value">{application.consentBackground ? 'Consented' : 'Not consented'}</span>
            </div>
          </div>
        </div>
      </div>

      {application.reviewNotes && (
        <div className="review-notes-section">
          <h3>Landlord Notes</h3>
          <div className="notes-content">
            <p>{application.reviewNotes}</p>
          </div>
        </div>
      )}

      <div className="next-steps">
        <h3>Next Steps</h3>
        {application.status === 'PENDING' && (
          <div className="steps-content">
            <p>Your application is currently under review. Here's what happens next:</p>
            <ul>
              <li>The landlord will review your application and supporting documents</li>
              <li>You may be contacted for additional information or to schedule a viewing</li>
              <li>You'll receive an email notification once a decision is made</li>
              <li>If approved, the landlord will contact you to discuss lease terms</li>
            </ul>
          </div>
        )}
        
        {application.status === 'APPROVED' && (
          <div className="steps-content">
            <p>Congratulations! Your application has been approved. Next steps:</p>
            <ul>
              <li>The landlord will contact you within 24-48 hours</li>
              <li>You'll discuss lease terms and move-in details</li>
              <li>Prepare required documents for lease signing</li>
              <li>Arrange for security deposit and first month's rent</li>
            </ul>
          </div>
        )}
        
        {application.status === 'DECLINED' && (
          <div className="steps-content">
            <p>We understand this is disappointing. Here are your options:</p>
            <ul>
              <li>Continue searching for other available properties</li>
              <li>Consider improving your application for future submissions</li>
              <li>Contact us if you have questions about the decision</li>
              <li>Set up alerts for new properties that match your criteria</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="my-applications">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-applications">
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Track the status of your rental applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h2>No Applications Yet</h2>
          <p>You haven't submitted any rental applications yet.</p>
          <button className="btn btn-primary">Browse Properties</button>
        </div>
      ) : (
        <div className="applications-content">
          <div className="applications-list">
            <div className="list-header">
              <h2>Your Applications ({applications.length})</h2>
              <div className="status-counts">
                <span className="count-item pending">
                  {applications.filter(app => app.status === 'PENDING').length} Pending
                </span>
                <span className="count-item approved">
                  {applications.filter(app => app.status === 'APPROVED').length} Approved
                </span>
                <span className="count-item declined">
                  {applications.filter(app => app.status === 'DECLINED').length} Declined
                </span>
              </div>
            </div>
            
            {applications.map(application => (
              <ApplicationSummary key={application.id} application={application} />
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

export default MyApplications;