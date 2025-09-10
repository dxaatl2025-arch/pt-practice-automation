import React, { useEffect } from 'react';

let calendlyLoaded = false;

const CalendlyInline = ({ url, height = '700px' }) => {
  const calendlyId = `calendly-inline-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const loadCalendlyScript = () => {
      return new Promise((resolve) => {
        if (calendlyLoaded) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          calendlyLoaded = true;
          console.log('✅ Calendly script loaded successfully');
          resolve();
        };
        script.onerror = () => {
          console.error('❌ Failed to load Calendly script');
          resolve(); // Resolve anyway to prevent hanging
        };
        
        document.head.appendChild(script);
        console.log('🎬 Calendly script injected');
      });
    };

    const initializeCalendly = async () => {
      if (!url) {
        console.error('❌ CalendlyInline: URL is required');
        return;
      }

      try {
        await loadCalendlyScript();
        
        // Wait for Calendly to be available
        const checkCalendly = () => {
          if (window.Calendly) {
            const element = document.getElementById(calendlyId);
            if (element) {
              window.Calendly.initInlineWidget({
                url,
                parentElement: element,
                prefill: {},
                utm: {}
              });
              console.log(`✅ Calendly widget initialized for: ${url}`);
            }
          } else {
            setTimeout(checkCalendly, 100);
          }
        };
        
        checkCalendly();
      } catch (error) {
        console.error('❌ Error initializing Calendly:', error);
      }
    };

    initializeCalendly();

    // Cleanup
    return () => {
      const element = document.getElementById(calendlyId);
      if (element) {
        element.innerHTML = '';
      }
    };
  }, [url, calendlyId]);

  if (!url) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
        <p className="text-red-600">Calendly URL is required but not provided.</p>
      </div>
    );
  }

  return (
    <div 
      id={calendlyId}
      className="calendly-inline-widget"
      style={{ minWidth: '320px', height }}
      data-testid="calendly-widget"
      data-url={url}
    >
      {/* Loading placeholder */}
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    </div>
  );
};

export default CalendlyInline;