import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics, { initAnalytics } from '../lib/analytics';
import { useUTM } from './useUTM';

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const location = useLocation();
  const { getUTMs } = useUTM();

  useEffect(() => {
    // Initialize analytics on first use
    initAnalytics().then(() => {
      // Get current UTM data
      const utmData = getUTMs();
      
      // Get page title from document or generate from path
      let title = document.title;
      if (title === 'PropertyPulse - AI-Powered Property Management Platform') {
        // Generate specific titles for routes
        const pathTitles = {
          '/': 'Home - PropertyPulse',
          '/features': 'Features - PropertyPulse',
          '/pricing': 'Pricing - PropertyPulse',
          '/about': 'About Us - PropertyPulse',
          '/founders': 'Founders Offer - PropertyPulse',
          '/affiliate': 'Affiliate Program - PropertyPulse',
          '/demo': 'Book a Demo - PropertyPulse',
          '/contact': 'Contact Us - PropertyPulse',
          '/blog': 'Blog - PropertyPulse',
          '/signup': 'Sign Up - PropertyPulse',
          '/login': 'Log In - PropertyPulse'
        };
        
        title = pathTitles[location.pathname] || `${location.pathname} - PropertyPulse`;
        
        // Update document title
        document.title = title;
      }
      
      // Track page view
      analytics.pageView(location.pathname + location.search, title, utmData);
    });
  }, [location, getUTMs]);
};

// Hook for tracking specific events with UTM context
export const useEventTracking = () => {
  const { getUTMs } = useUTM();

  const trackEvent = (action, parameters = {}) => {
    const utmData = getUTMs();
    analytics.event(action, { ...parameters, ...utmData });
  };

  const trackConversion = (action, parameters = {}) => {
    const utmData = getUTMs();
    analytics.conversion(action, { ...parameters, ...utmData });
  };

  const trackFormSubmit = (formName) => {
    const utmData = getUTMs();
    analytics.formSubmit(formName, utmData);
  };

  const trackButtonClick = (buttonName, location) => {
    const utmData = getUTMs();
    analytics.buttonClick(buttonName, location, utmData);
  };

  const trackDemoRequest = (source) => {
    const utmData = getUTMs();
    analytics.demoRequest(source, utmData);
  };

  const trackSignupStart = (source) => {
    const utmData = getUTMs();
    analytics.signupStart(source, utmData);
  };

  const trackSignupComplete = (plan) => {
    const utmData = getUTMs();
    analytics.signupComplete(plan, utmData);
  };

  const trackContactSubmit = () => {
    const utmData = getUTMs();
    analytics.contactSubmit(utmData);
  };

  const trackBlogRead = (slug, category) => {
    const utmData = getUTMs();
    analytics.blogRead(slug, category, utmData);
  };

  const trackPricingView = (plan) => {
    const utmData = getUTMs();
    analytics.pricingView(plan, utmData);
  };

  const trackAffiliateInterest = () => {
    const utmData = getUTMs();
    analytics.affiliateInterest(utmData);
  };

  return {
    trackEvent,
    trackConversion,
    trackFormSubmit,
    trackButtonClick,
    trackDemoRequest,
    trackSignupStart,
    trackSignupComplete,
    trackContactSubmit,
    trackBlogRead,
    trackPricingView,
    trackAffiliateInterest
  };
};

// Hook for user identification
export const useUserTracking = () => {
  const identifyUser = (userId, properties = {}) => {
    analytics.identify(userId, properties);
  };

  return { identifyUser };
};

const analyticsHooks = {
  usePageTracking,
  useEventTracking,
  useUserTracking
};

export default analyticsHooks;