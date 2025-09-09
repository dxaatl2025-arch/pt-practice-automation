import React from 'react';

const EmptyState = ({ 
  icon = '📄', 
  title = 'No data available', 
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
  learnMoreUrl,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`} style={{
      textAlign: 'center',
      padding: '48px 24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
        opacity: 0.6
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '8px',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: '#6b7280',
        fontSize: '14px',
        marginBottom: '24px',
        lineHeight: '1.5',
        maxWidth: '400px',
        margin: '0 auto 24px auto'
      }}>
        {description}
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {onAction && actionText && (
          <button
            onClick={onAction}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            {actionText}
          </button>
        )}
        
        {learnMoreUrl && (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#6b7280',
              fontSize: '14px',
              textDecoration: 'none',
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
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
            Learn More →
          </a>
        )}
      </div>
    </div>
  );
};

export default EmptyState;