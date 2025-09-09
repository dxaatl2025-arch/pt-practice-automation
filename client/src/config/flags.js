// Frontend Feature Flags Configuration
// Reads from environment variables and provides a unified interface

const DEFAULT_FLAGS = {
  // AI Features
  AI_LEASING: false,
  AI_RENT: false,
  AI_TURNOVER: false,
  AI_FORECAST: false,
  AI_DOCUMENT_SEARCH: false,
  AI_DOCUMENT_CHAT: false,
  
  // Business Modules
  OWNER_PORTAL: false,
  ACCOUNTING: false,
  AFFILIATE_PORTAL: false,
  PRICING: false,
  
  // Core Features
  APPLICATIONS_E2E: false,
  STRIPE_CORE: false,
  S3_UPLOADS: false,
  REMINDERS: false,
  MATCHING_PROFILES: false
};

/**
 * Get boolean value from environment variable
 * @param {string} key - Environment variable key
 * @param {boolean} defaultValue - Default value if env var is not set
 * @returns {boolean}
 */
const getEnvFlag = (key, defaultValue = false) => {
  const value = process.env[`REACT_APP_${key}`] || process.env[`VITE_${key}`];
  
  if (value === undefined) return defaultValue;
  
  // Handle various truthy string representations
  const normalizedValue = value.toString().toLowerCase().trim();
  return normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes';
};

/**
 * Feature flags configuration object
 * Each flag can be enabled via environment variables:
 * - REACT_APP_FLAG_NAME=true (Create React App)
 * - VITE_FLAG_NAME=true (Vite)
 */
export const featureFlags = {
  // AI Features
  AI_LEASING: getEnvFlag('AI_LEASING', DEFAULT_FLAGS.AI_LEASING),
  AI_RENT: getEnvFlag('AI_RENT', DEFAULT_FLAGS.AI_RENT),
  AI_TURNOVER: getEnvFlag('AI_TURNOVER', DEFAULT_FLAGS.AI_TURNOVER),
  AI_FORECAST: getEnvFlag('AI_FORECAST', DEFAULT_FLAGS.AI_FORECAST),
  AI_DOCUMENT_SEARCH: getEnvFlag('AI_DOCUMENT_SEARCH', DEFAULT_FLAGS.AI_DOCUMENT_SEARCH),
  AI_DOCUMENT_CHAT: getEnvFlag('AI_DOCUMENT_CHAT', DEFAULT_FLAGS.AI_DOCUMENT_CHAT),
  
  // Business Modules
  OWNER_PORTAL: getEnvFlag('OWNER_PORTAL', DEFAULT_FLAGS.OWNER_PORTAL),
  ACCOUNTING: getEnvFlag('ACCOUNTING', DEFAULT_FLAGS.ACCOUNTING),
  AFFILIATE_PORTAL: getEnvFlag('AFFILIATE_PORTAL', DEFAULT_FLAGS.AFFILIATE_PORTAL),
  PRICING: getEnvFlag('PRICING', DEFAULT_FLAGS.PRICING),
  
  // Core Features
  APPLICATIONS_E2E: getEnvFlag('APPLICATIONS_E2E', DEFAULT_FLAGS.APPLICATIONS_E2E),
  STRIPE_CORE: getEnvFlag('STRIPE_CORE', DEFAULT_FLAGS.STRIPE_CORE),
  S3_UPLOADS: getEnvFlag('S3_UPLOADS', DEFAULT_FLAGS.S3_UPLOADS),
  REMINDERS: getEnvFlag('REMINDERS', DEFAULT_FLAGS.REMINDERS),
  MATCHING_PROFILES: getEnvFlag('MATCHING_PROFILES', DEFAULT_FLAGS.MATCHING_PROFILES),
  
  // Computed flags
  get ANY_AI_FEATURE() {
    return this.AI_LEASING || this.AI_RENT || this.AI_TURNOVER || 
           this.AI_FORECAST || this.AI_DOCUMENT_SEARCH || this.AI_DOCUMENT_CHAT;
  },
  
  get ANY_BUSINESS_MODULE() {
    return this.OWNER_PORTAL || this.ACCOUNTING || this.AFFILIATE_PORTAL || this.PRICING;
  }
};

/**
 * Check if a specific feature is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean}
 */
export const isFeatureEnabled = (flagName) => {
  return featureFlags[flagName] === true;
};

/**
 * Check if user has required role for feature
 * @param {Object} user - User object with role property
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean}
 */
export const hasRequiredRole = (user, requiredRoles) => {
  if (!user || !user.role) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
};

/**
 * Check if feature is enabled AND user has required role
 * @param {string} flagName - Feature flag name
 * @param {Object} user - User object
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean}
 */
export const canAccessFeature = (flagName, user, requiredRoles = null) => {
  const featureEnabled = isFeatureEnabled(flagName);
  
  if (!featureEnabled) return false;
  if (!requiredRoles) return true;
  
  return hasRequiredRole(user, requiredRoles);
};

/**
 * Get navigation items based on user role and feature flags
 * @param {Object} user - User object
 * @returns {Array} Array of navigation items
 */
export const getEnabledNavigation = (user) => {
  const navItems = [];
  
  // Always available
  navItems.push(
    { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { key: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
  );
  
  // Core property features (always available)
  navItems.push({ key: 'properties', label: 'Properties', icon: '🏠', path: '/properties' });
  
  if (user?.role === 'LANDLORD') {
    navItems.push(
      { key: 'tenants', label: 'Tenants', icon: '👥', path: '/tenants' },
      { key: 'applications', label: 'Applications', icon: '📋', path: '/applications' },
      { key: 'payments', label: 'Payments', icon: '💰', path: '/payments' }
    );
    
    // AI Features (Landlord only)
    if (canAccessFeature('AI_LEASING', user, 'LANDLORD')) {
      navItems.push({ key: 'ai-leasing', label: 'AI Leasing', icon: '🤖', path: '/leasing' });
    }
    if (canAccessFeature('AI_RENT', user, 'LANDLORD')) {
      navItems.push({ key: 'ai-rent', label: 'Rent Optimizer', icon: '💰', path: '/rent-optimizer' });
    }
    if (canAccessFeature('AI_TURNOVER', user, 'LANDLORD')) {
      navItems.push({ key: 'ai-turnover', label: 'Turnover Prediction', icon: '📊', path: '/turnover' });
    }
    if (canAccessFeature('AI_FORECAST', user, 'LANDLORD')) {
      navItems.push({ key: 'ai-forecast', label: 'Forecasting', icon: '📈', path: '/forecast' });
    }
    
    // Business Modules (Landlord/Admin)
    if (canAccessFeature('OWNER_PORTAL', user, ['LANDLORD', 'ADMIN'])) {
      navItems.push({ key: 'owners', label: 'Owner Portal', icon: '🏢', path: '/owners' });
    }
    if (canAccessFeature('ACCOUNTING', user, ['LANDLORD', 'ADMIN'])) {
      navItems.push({ key: 'accounting', label: 'Accounting', icon: '📊', path: '/accounting' });
    }
    if (canAccessFeature('AFFILIATE_PORTAL', user, 'LANDLORD')) {
      navItems.push({ key: 'affiliates', label: 'Affiliates', icon: '🤝', path: '/affiliates' });
    }
  }
  
  // Document features (all users)
  if (canAccessFeature('AI_DOCUMENT_SEARCH', user) || canAccessFeature('AI_DOCUMENT_CHAT', user)) {
    navItems.push({ key: 'documents', label: 'Documents', icon: '📄', path: '/documents' });
  }
  
  // Pricing (all users)
  if (canAccessFeature('PRICING', user)) {
    navItems.push({ key: 'pricing', label: 'Pricing', icon: '💳', path: '/pricing' });
  }
  
  return navItems;
};

/**
 * Get demo/development configuration
 * @returns {Object} Demo configuration object
 */
export const getDemoConfig = () => ({
  isDemoMode: process.env.REACT_APP_DEMO_MODE === 'true' || process.env.VITE_DEMO_MODE === 'true',
  enabledFlags: Object.keys(featureFlags).filter(key => featureFlags[key] === true),
  environment: process.env.NODE_ENV || 'development'
});

/**
 * Component to display feature flag status for debugging
 * @returns {React.Component}
 */
export const FeatureFlagDebugger = ({ show = false }) => {
  if (!show || process.env.NODE_ENV === 'production') return null;
  
  const demoConfig = getDemoConfig();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🚩 Feature Flags</div>
      <div>Environment: {demoConfig.environment}</div>
      <div>Demo Mode: {demoConfig.isDemoMode ? '✅' : '❌'}</div>
      <div style={{ marginTop: '8px', fontSize: '10px' }}>
        Enabled: {demoConfig.enabledFlags.join(', ') || 'None'}
      </div>
    </div>
  );
};

export default featureFlags;