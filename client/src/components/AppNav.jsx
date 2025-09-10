import React from 'react';

const AppNav = ({ user, currentView, setCurrentView, onLogout }) => {
  if (!user) return null;

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
      { id: 'profile', label: '👤 Profile', icon: '👤' }
    ];

    if (user.role === 'LANDLORD') {
      return [
        ...commonItems,
        { id: 'properties', label: '🏠 My Properties', icon: '🏠' },
        { id: 'tenants', label: '👥 Tenants', icon: '👥' },
        { id: 'applications', label: '📄 Applications', icon: '📄' },
        { id: 'payments', label: '💰 Payments', icon: '💰' },
        { id: 'lease-generator', label: '🤖 AI Features', icon: '🤖' }
      ];
    }

    if (user.role === 'TENANT') {
      return [
        ...commonItems,
        { id: 'properties', label: '🏠 Properties', icon: '🏠' },
        { id: 'rental-application', label: '📝 Apply', icon: '📝' },
        { id: 'my-applications', label: '📄 My Applications', icon: '📄' },
        { id: 'tenant-profile', label: '👤 Tenant Profile', icon: '👤' },
        { id: 'payments', label: '💰 My Payments', icon: '💰' }
      ];
    }

    if (user.role === 'OWNER') {
      return [
        ...commonItems,
        { id: 'owner', label: '👑 Owner Portal', icon: '👑' },
        { id: 'properties', label: '🏠 Portfolio', icon: '🏠' },
        { id: 'reports', label: '📊 Reports', icon: '📊' },
        { id: 'payments', label: '💰 Revenue', icon: '💰' }
      ];
    }

    if (user.role === 'AFFILIATE') {
      return [
        ...commonItems,
        { id: 'affiliate', label: '🤝 Affiliate Dashboard', icon: '🤝' },
        { id: 'commissions', label: '💰 Commissions', icon: '💰' },
        { id: 'referrals', label: '📈 Referrals', icon: '📈' }
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  const styles = {
    container: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    navItems: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    navButton: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
      backgroundColor: active ? '#2563eb' : 'white',
      color: active ? 'white' : '#374151',
      boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      border: active ? 'none' : '1px solid #d1d5db'
    }),
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#374151'
    },
    logoutButton: {
      padding: '8px 16px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        {/* Logo */}
        <div style={styles.logo}>
          <span>🏠</span>
          <span>PropertyPulse</span>
        </div>

        {/* Navigation Items */}
        <div style={styles.navItems}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={styles.navButton(currentView === item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label.replace(item.icon, '').trim()}</span>
            </button>
          ))}
        </div>

        {/* User Section */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <span>👤</span>
            <span>{user.firstName || user.email}</span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {user.role}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={styles.logoutButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppNav;