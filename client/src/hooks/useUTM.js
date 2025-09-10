import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const UTM_STORAGE_KEY = 'propertyplus_utm_data';
const UTM_EXPIRY_DAYS = 7;

export const useUTM = () => {
  const location = useLocation();
  const [utmData, setUtmData] = useState({});

  // Extract UTM parameters from URL
  const extractUTMParams = useCallback((searchParams) => {
    const params = new URLSearchParams(searchParams);
    const utms = {};
    
    // Standard UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].forEach(param => {
      const value = params.get(param);
      if (value) {
        utms[param] = value;
      }
    });

    return Object.keys(utms).length > 0 ? utms : null;
  }, []);

  // Load UTM data from localStorage
  const loadStoredUTMs = useCallback(() => {
    try {
      const stored = localStorage.getItem(UTM_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = new Date().getTime();
        
        // Check if data is still valid (within expiry period)
        if (data.expiry && now < data.expiry) {
          return data.utms || {};
        } else {
          // Remove expired data
          localStorage.removeItem(UTM_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Error loading UTM data from storage:', error);
      localStorage.removeItem(UTM_STORAGE_KEY);
    }
    return {};
  }, []);

  // Save UTM data to localStorage
  const saveUTMData = useCallback((utms) => {
    try {
      const expiry = new Date().getTime() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const dataToStore = {
        utms,
        expiry,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Error saving UTM data to storage:', error);
    }
  }, []);

  // Initialize UTM data on component mount and location change
  useEffect(() => {
    let currentUTMs = loadStoredUTMs();
    
    // Check for new UTM parameters in current URL
    const newUTMs = extractUTMParams(location.search);
    
    if (newUTMs) {
      // Merge new UTMs with existing ones (new ones take precedence)
      currentUTMs = { ...currentUTMs, ...newUTMs };
      saveUTMData(currentUTMs);
    }
    
    setUtmData(currentUTMs);
  }, [location.search, extractUTMParams, loadStoredUTMs, saveUTMData]);

  // Generate URL with UTM parameters
  const appendUTMs = useCallback((path) => {
    if (!utmData || Object.keys(utmData).length === 0) {
      return path;
    }

    const url = new URL(path, window.location.origin);
    
    // Add UTM parameters to URL
    Object.entries(utmData).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    // Return just the pathname + search for internal links
    return url.pathname + url.search;
  }, [utmData]);

  // Get current UTM data
  const getUTMs = useCallback(() => {
    return utmData;
  }, [utmData]);

  // Clear UTM data
  const clearUTMs = useCallback(() => {
    localStorage.removeItem(UTM_STORAGE_KEY);
    setUtmData({});
  }, []);

  // Check if we have any UTM data
  const hasUTMs = Object.keys(utmData).length > 0;

  return {
    utmData,
    appendUTMs,
    getUTMs,
    clearUTMs,
    hasUTMs
  };
};