// Google Analytics 4 wrapper for PropertyPulse
class Analytics {
  constructor() {
    this.trackingId = process.env.REACT_APP_GA_TRACKING_ID || 'G-1GTRJ30EMH';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isEnabled = this.isProduction && this.trackingId;
    this.debugMode = process.env.REACT_APP_GA_DEBUG === 'true';
    
    if (this.debugMode || !this.isProduction) {
      console.log('🎯 Analytics Config:', {
        trackingId: this.trackingId,
        isProduction: this.isProduction,
        isEnabled: this.isEnabled,
        debugMode: this.debugMode
      });
    }
  }

  // Initialize Google Analytics
  init() {
    if (!this.isEnabled && !this.debugMode) {
      console.log('🎯 Analytics disabled (non-production environment)');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
      
      script.onload = () => {
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        
        window.gtag('js', new Date());
        window.gtag('config', this.trackingId, {
          page_title: document.title,
          page_location: window.location.href,
          custom_map: {
            custom_dimension_1: 'utm_source',
            custom_dimension_2: 'utm_medium',
            custom_dimension_3: 'utm_campaign',
            custom_dimension_4: 'utm_term',
            custom_dimension_5: 'utm_content'
          }
        });

        if (this.debugMode) {
          console.log('🎯 Google Analytics initialized:', this.trackingId);
        }
        
        resolve();
      };
      
      script.onerror = () => {
        console.error('🎯 Failed to load Google Analytics script');
        resolve(); // Don't fail the app if GA fails
      };
      
      document.head.appendChild(script);
    });
  }

  // Track page views with UTM data
  pageView(path, title, utmData = {}) {
    if (!this.isEnabled && !this.debugMode) return;
    
    const eventData = {
      page_title: title || document.title,
      page_location: window.location.origin + path,
      page_path: path
    };

    // Add UTM parameters if available
    if (utmData && Object.keys(utmData).length > 0) {
      if (utmData.utm_source) eventData.utm_source = utmData.utm_source;
      if (utmData.utm_medium) eventData.utm_medium = utmData.utm_medium;
      if (utmData.utm_campaign) eventData.utm_campaign = utmData.utm_campaign;
      if (utmData.utm_term) eventData.utm_term = utmData.utm_term;
      if (utmData.utm_content) eventData.utm_content = utmData.utm_content;
    }

    if (this.debugMode) {
      console.log('🎯 Page View:', eventData);
    }

    if (window.gtag) {
      window.gtag('config', this.trackingId, eventData);
    }
  }

  // Track custom events
  event(action, parameters = {}) {
    if (!this.isEnabled && !this.debugMode) return;
    
    const eventData = {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label,
      value: parameters.value,
      ...parameters
    };

    if (this.debugMode) {
      console.log('🎯 Event:', action, eventData);
    }

    if (window.gtag) {
      window.gtag('event', action, eventData);
    }
  }

  // Track conversions
  conversion(action, parameters = {}) {
    this.event(action, {
      ...parameters,
      category: 'conversion'
    });
  }

  // Track form submissions
  formSubmit(formName, utmData = {}) {
    this.event('form_submit', {
      category: 'form',
      label: formName,
      ...utmData
    });
  }

  // Track button clicks
  buttonClick(buttonName, location, utmData = {}) {
    this.event('click', {
      category: 'engagement',
      label: `${buttonName} - ${location}`,
      ...utmData
    });
  }

  // Track demo requests
  demoRequest(source, utmData = {}) {
    this.conversion('demo_request', {
      category: 'lead_generation',
      label: source,
      ...utmData
    });
  }

  // Track signup attempts
  signupStart(source, utmData = {}) {
    this.conversion('signup_start', {
      category: 'lead_generation',
      label: source,
      ...utmData
    });
  }

  // Track signup completions
  signupComplete(plan, utmData = {}) {
    this.conversion('signup_complete', {
      category: 'conversion',
      label: plan,
      value: plan === 'enterprise' ? 199 : (plan === 'professional' ? 79 : 29),
      ...utmData
    });
  }

  // Track contact form submissions
  contactSubmit(utmData = {}) {
    this.conversion('contact_form', {
      category: 'lead_generation',
      label: 'contact_form',
      ...utmData
    });
  }

  // Track blog engagement
  blogRead(slug, category, utmData = {}) {
    this.event('blog_read', {
      category: 'content',
      label: `${category} - ${slug}`,
      ...utmData
    });
  }

  // Track pricing page engagement
  pricingView(plan, utmData = {}) {
    this.event('pricing_view', {
      category: 'product_interest',
      label: plan,
      ...utmData
    });
  }

  // Track affiliate interest
  affiliateInterest(utmData = {}) {
    this.event('affiliate_interest', {
      category: 'partnership',
      label: 'affiliate_program',
      ...utmData
    });
  }

  // Identify user (when they sign up/login)
  identify(userId, properties = {}) {
    if (!this.isEnabled && !this.debugMode) return;
    
    if (this.debugMode) {
      console.log('🎯 User Identify:', userId, properties);
    }

    if (window.gtag) {
      window.gtag('config', this.trackingId, {
        user_id: userId,
        custom_parameters: properties
      });
    }
  }
}

// Create singleton instance
const analytics = new Analytics();

// Auto-initialize on import (will only run in production unless debug mode)
let initPromise = null;
const initAnalytics = () => {
  if (!initPromise) {
    initPromise = analytics.init();
  }
  return initPromise;
};

// Export the instance and methods
export default analytics;
export { initAnalytics };

// For debugging in development
if (process.env.NODE_ENV !== 'production') {
  window.__analytics = analytics;
}