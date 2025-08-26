// src/hooks/useRequireAuth.js - Authentication Requirement Hook
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to enforce authentication and role-based access
 * @param {string} requiredRole - Optional role requirement ('LANDLORD' or 'TENANT')
 * @returns {object} - Auth context with user, loading states, etc.
 */
export const useRequireAuth = (requiredRole = null) => {
  const auth = useAuth();
  const { user, loading, isAuthenticated } = auth;

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, should redirect to login');
      return;
    }

    // Check role requirements
    if (requiredRole && user?.role !== requiredRole) {
      console.log(`🚫 Access denied. Required: ${requiredRole}, User role: ${user?.role}`);
      return;
    }

    console.log(`✅ Access granted for ${user?.role} user`);
  }, [isAuthenticated, user, loading, requiredRole]);

  return {
    ...auth,
    hasRequiredRole: requiredRole ? user?.role === requiredRole : true,
    canAccess: isAuthenticated && (requiredRole ? user?.role === requiredRole : true)
  };
};