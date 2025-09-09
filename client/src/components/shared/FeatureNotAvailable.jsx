import React from 'react';

const FeatureNotAvailable = ({ 
  featureName,
  requiredRole = null,
  userRole = null,
  isFeatureEnabled = false,
  upgradeUrl = null,
  contactUrl = null
}) => {
  
  const getIcon = () => {
    if (!isFeatureEnabled) return '🔒';
    if (requiredRole && userRole && !hasRole()) return '⛔';
    return '🚧';
  };
  
  const getTitle = () => {
    if (!isFeatureEnabled) return `${featureName} Not Available`;
    if (requiredRole && userRole && !hasRole()) return 'Access Denied';
    return `${featureName} Coming Soon`;
  };
  
  const getDescription = () => {
    if (!isFeatureEnabled) {
      return `${featureName} is not enabled by your administrator. Contact your admin to enable this feature.`;
    }
    if (requiredRole && userRole && !hasRole()) {
      return `This feature requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role. Your current role: ${userRole}`;
    }
    return `${featureName} is currently under development and will be available soon.`;
  };
  
  const hasRole = () => {
    if (!requiredRole || !userRole) return true;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(userRole);
  };
  
  return (
    <div style={{
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '48px 32px',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '24px',
          opacity: 0.7
        }}>
          {getIcon()}
        </div>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          {getTitle()}
        </h2>
        
        <p style={{
          color: '#6b7280',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '32px',
          margin: '0 0 32px 0'
        }}>
          {getDescription()}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {!isFeatureEnabled && contactUrl && (
            <a
              href={contactUrl}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Contact Admin
            </a>
          )}
          
          {requiredRole && userRole && !hasRole() && upgradeUrl && (
            <a
              href={upgradeUrl}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              Upgrade Account
            </a>
          )}
          
          <button
            onClick={() => window.history.back()}
            style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.color = '#374151';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.target.style.color = '#6b7280';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            Go Back
          </button>
        </div>
        
        {/* Development tooltip */}
        {!isFeatureEnabled && process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '24px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <strong>Dev Note:</strong> Enable this feature by setting the appropriate environment variable to 'true'
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureNotAvailable;