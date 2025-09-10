import { useEffect } from 'react';

const TawkLoader = () => {
  useEffect(() => {
    // Check if Tawk script is already loaded
    if (window.Tawk_API) {
      console.log('Tawk.to already loaded');
      return;
    }

    // Initialize Tawk_API object
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create script element using the provided embed code
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/68bafe59721af15d8753062d/1j4d733ea';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Insert script before first script tag (as per Tawk recommendation)
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    // Add event listeners
    window.Tawk_API.onLoad = function() {
      console.log('✅ Tawk.to chat widget loaded successfully');
      
      // Add test selector to the Tawk widget after it loads
      setTimeout(() => {
        const tawkWidget = document.querySelector('#tawk-widget, .tawk-widget, .tawk-bubble, [id^="tawk-"], [class*="tawk"]');
        if (tawkWidget) {
          tawkWidget.setAttribute('data-testid', 'tawk-widget');
          console.log('🎯 Added test selector to Tawk widget');
        }
      }, 1000);
    };

    window.Tawk_API.onStatusChange = function(status) {
      console.log('🔄 Tawk.to status changed:', status);
    };

    console.log('🎬 Tawk.to script injected');

    // Cleanup function (minimal - Tawk handles its own lifecycle)
    return () => {
      console.log('🧹 TawkLoader cleanup');
    };
  }, []);

  return null;
};

export default TawkLoader;