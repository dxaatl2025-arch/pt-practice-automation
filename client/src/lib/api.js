// Centralized API Client Library
// Provides type-safe API calls with error handling, auth, and retry logic
import React from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
                    process.env.VITE_API_BASE_URL || 
                    'http://localhost:5000/api';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Sleep utility for retry logic
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get auth token from user context or localStorage
 */
const getAuthToken = () => {
  // Try to get from user context first (if available)
  if (typeof window !== 'undefined' && window.__USER_TOKEN) {
    return window.__USER_TOKEN;
  }
  
  // Fallback to localStorage
  try {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  } catch (error) {
    console.warn('Unable to access storage for auth token:', error);
    return null;
  }
};

/**
 * Core fetch wrapper with error handling and retry logic
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries for 429/5xx errors
 * @returns {Promise} API response
 */
export const fetchJSON = async (endpoint, options = {}, retries = 2) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Add auth header if token exists
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers
  };
  
  // Handle FormData (don't set Content-Type for multipart)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  
  const fetchOptions = {
    ...options,
    headers
  };
  
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();
      
      // Handle successful responses
      if (response.ok) {
        return data;
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        try {
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          if (typeof window !== 'undefined') {
            window.__USER_TOKEN = null;
          }
        } catch (e) {
          console.warn('Unable to clear auth tokens:', e);
        }
        
        throw new ApiError('Authentication required', 401, data);
      }
      
      if (response.status === 403) {
        throw new ApiError('Access forbidden', 403, data);
      }
      
      if (response.status === 404) {
        throw new ApiError('Resource not found', 404, data);
      }
      
      // Retry on rate limiting (429) and server errors (5xx)
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        const retryDelay = response.status === 429 ? 
          (parseInt(response.headers.get('Retry-After')) || 2) * 1000 :
          Math.pow(2, attempt) * 1000; // Exponential backoff for 5xx
        
        console.warn(`Retrying request to ${endpoint} after ${retryDelay}ms (attempt ${attempt + 1})`);
        await sleep(retryDelay);
        continue;
      }
      
      // For other errors, create ApiError with response data
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on network errors unless it's the last attempt
      if (!(error instanceof ApiError) && attempt < retries) {
        console.warn(`Network error, retrying ${endpoint} (attempt ${attempt + 1}):`, error.message);
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      
      // If it's already an ApiError, re-throw it
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Wrap other errors
      throw new ApiError(`Network error: ${error.message}`, 0, null);
    }
  }
  
  // This shouldn't happen, but just in case
  throw lastError || new ApiError('Unknown error occurred', 0, null);
};

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  get: (endpoint, options = {}) => fetchJSON(endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) => fetchJSON(endpoint, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data),
    ...options 
  }),
  put: (endpoint, data, options = {}) => fetchJSON(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...options 
  }),
  patch: (endpoint, data, options = {}) => fetchJSON(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(data),
    ...options 
  }),
  delete: (endpoint, options = {}) => fetchJSON(endpoint, { method: 'DELETE', ...options })
};

// =============================================================================
// TYPED API ENDPOINTS - Each module has its own section
// =============================================================================

/**
 * Authentication & User Management
 */
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
};

/**
 * Properties API
 */
export const propertiesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/properties${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/properties/${id}`),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  delete: (id) => api.delete(`/properties/${id}`),
  getApplications: (propertyId) => api.get(`/properties/${propertyId}/applications`)
};

/**
 * Tenants API
 */
export const tenantsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/tenants${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/tenants/${id}`),
  create: (tenantData) => api.post('/tenants', tenantData),
  update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
  delete: (id) => api.delete(`/tenants/${id}`)
};

/**
 * Applications API
 */
export const applicationsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/applications${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/applications/${id}`),
  create: (applicationData) => api.post('/applications', applicationData),
  update: (id, applicationData) => api.put(`/applications/${id}`, applicationData),
  delete: (id) => api.delete(`/applications/${id}`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status })
};

/**
 * Payments API
 */
export const paymentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/payments${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/payments/${id}`),
  create: (paymentData) => api.post('/payments', paymentData),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  processPayment: (paymentData) => api.post('/payments/process', paymentData),
  getStripeSession: (data) => api.post('/payments/stripe/session', data)
};

/**
 * AI Document Search & Chat API
 */
export const documentsApi = {
  upload: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('document', file);
    Object.keys(metadata).forEach(key => formData.append(key, metadata[key]));
    return api.post('/ai/documents/upload', formData);
  },
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/ai/documents${query ? `?${query}` : ''}`);
  },
  search: (query) => api.post('/ai/documents/search', { query }),
  delete: (id) => api.delete(`/ai/documents/${id}`)
};

export const chatApi = {
  createSession: () => api.post('/ai/chat/sessions'),
  getSessions: () => api.get('/ai/chat/sessions'),
  getSession: (sessionId) => api.get(`/ai/chat/sessions/${sessionId}`),
  sendMessage: (sessionId, message, documentIds = []) => 
    api.post('/ai/chat', { sessionId, message, documentIds }),
  deleteSession: (sessionId) => api.delete(`/ai/chat/sessions/${sessionId}`)
};

/**
 * AI Leasing Agent API
 */
export const leasingApi = {
  createLead: (leadData) => api.post('/ai/leasing/lead', leadData),
  getLeads: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/ai/leasing/leads${query ? `?${query}` : ''}`);
  },
  getLead: (leadId) => api.get(`/ai/leasing/leads/${leadId}`),
  sendMessage: (leadId, message) => api.post(`/ai/leasing/leads/${leadId}/message`, { message }),
  updateLeadStatus: (leadId, status) => api.put(`/ai/leasing/leads/${leadId}/status`, { status }),
  assignLead: (leadId, assignedToId) => api.put(`/ai/leasing/leads/${leadId}/assign`, { assignedToId }),
  simulate: (leadData, messages) => api.post('/ai/leasing/simulate', { leadData, messages })
};

/**
 * AI Rent Optimizer API
 */
export const rentOptimizerApi = {
  analyze: (propertyId, goal = 'maximize_revenue') => 
    api.post(`/ai/rent/analyze/${propertyId}`, { goal }),
  getComparables: (propertyId, radius = 1) => 
    api.get(`/ai/rent/comparables/${propertyId}?radius=${radius}`),
  getMarketData: (location) => api.post('/ai/rent/market', { location })
};

/**
 * AI Turnover Predictor API
 */
export const turnoverApi = {
  predict: (tenantId) => api.post(`/ai/turnover/predict/${tenantId}`),
  getRiskFactors: (tenantId) => api.get(`/ai/turnover/risk-factors/${tenantId}`),
  getRetentionActions: (tenantId) => api.get(`/ai/turnover/retention-actions/${tenantId}`),
  bulkPredict: (tenantIds) => api.post('/ai/turnover/bulk-predict', { tenantIds })
};

/**
 * AI Financial Forecasting API
 */
export const forecastingApi = {
  generate: (portfolioId, months = 12) => 
    api.post(`/ai/forecast/generate/${portfolioId}`, { months }),
  getHistoricalData: (portfolioId) => api.get(`/ai/forecast/historical/${portfolioId}`),
  updateAssumptions: (portfolioId, assumptions) => 
    api.put(`/ai/forecast/assumptions/${portfolioId}`, assumptions),
  exportForecast: (portfolioId, format = 'csv') => 
    api.get(`/ai/forecast/export/${portfolioId}?format=${format}`)
};

/**
 * Owner Portal API
 */
export const ownersApi = {
  getPortfolio: (ownerId) => api.get(`/owners/${ownerId}/portfolio`),
  getReports: (ownerId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/owners/${ownerId}/reports${query ? `?${query}` : ''}`);
  },
  generateReport: (ownerId, reportType, options = {}) => 
    api.post(`/owners/${ownerId}/reports`, { reportType, ...options }),
  downloadReport: (ownerId, reportId, format = 'pdf') => 
    api.get(`/owners/${ownerId}/reports/${reportId}/download?format=${format}`)
};

/**
 * Accounting API
 */
export const accountingApi = {
  getChartOfAccounts: () => api.get('/accounting/chart-of-accounts'),
  createAccount: (accountData) => api.post('/accounting/chart-of-accounts', accountData),
  updateAccount: (accountId, accountData) => api.put(`/accounting/chart-of-accounts/${accountId}`, accountData),
  deleteAccount: (accountId) => api.delete(`/accounting/chart-of-accounts/${accountId}`),
  
  getJournalEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/accounting/journal-entries${query ? `?${query}` : ''}`);
  },
  createJournalEntry: (entryData) => api.post('/accounting/journal-entries', entryData),
  
  getTrialBalance: (date) => api.get(`/accounting/trial-balance?date=${date}`),
  getIncomeStatement: (startDate, endDate) => 
    api.get(`/accounting/income-statement?startDate=${startDate}&endDate=${endDate}`),
  getBalanceSheet: (date) => api.get(`/accounting/balance-sheet?date=${date}`)
};

/**
 * Affiliate Portal API
 */
export const affiliatesApi = {
  signup: (affiliateData) => api.post('/affiliates/signup', affiliateData),
  getDashboard: () => api.get('/affiliates/dashboard'),
  getEarnings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/affiliates/earnings${query ? `?${query}` : ''}`);
  },
  getReferrals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/affiliates/referrals${query ? `?${query}` : ''}`);
  },
  generateLink: (campaign) => api.post('/affiliates/links', { campaign }),
  requestPayout: (amount) => api.post('/affiliates/payouts', { amount })
};

/**
 * Pricing & Subscriptions API
 */
export const pricingApi = {
  getPlans: () => api.get('/pricing/plans'),
  getCurrentSubscription: () => api.get('/pricing/subscription'),
  subscribe: (planId, paymentMethodId) => 
    api.post('/pricing/subscribe', { planId, paymentMethodId }),
  cancelSubscription: () => api.post('/pricing/cancel'),
  updateSubscription: (planId) => api.post('/pricing/update', { planId }),
  getBillingHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/pricing/billing${query ? `?${query}` : ''}`);
  },
  createCheckoutSession: (planId) => api.post('/pricing/checkout', { planId })
};

/**
 * Matching API
 */
export const matchingApi = {
  getMatches: (preferences) => api.post('/matching/find', preferences),
  savePreferences: (preferences) => api.post('/matching/preferences', preferences),
  getPreferences: () => api.get('/matching/preferences'),
  updatePreferences: (preferences) => api.put('/matching/preferences', preferences)
};

/**
 * Health Check API
 */
export const healthApi = {
  check: () => api.get('/health'),
  checkAI: () => api.get('/ai/health')
};

/**
 * Error handler utility for React components
 * @param {Error} error - The error to handle
 * @param {Function} setError - State setter for error display
 */
export const handleApiError = (error, setError = null) => {
  console.error('API Error:', error);
  
  let userMessage = 'An unexpected error occurred. Please try again.';
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        userMessage = 'Please log in to continue.';
        break;
      case 403:
        userMessage = 'You don\'t have permission to perform this action.';
        break;
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      default:
        userMessage = error.message || userMessage;
    }
  } else {
    userMessage = 'Network error. Please check your connection and try again.';
  }
  
  if (setError) {
    setError(userMessage);
  }
  
  return userMessage;
};

/**
 * React hook for API calls with loading states
 * Usage: const { data, loading, error, refetch } = useApi(() => propertiesApi.getAll())
 */
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const execute = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, dependencies);
  
  React.useEffect(() => {
    execute();
  }, [execute]);
  
  return { data, loading, error, refetch: execute };
};

export default api;