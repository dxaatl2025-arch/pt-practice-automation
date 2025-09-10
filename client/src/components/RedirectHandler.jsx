import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const searchParams = location.search;

    // Handle case-sensitivity redirects
    const redirectMap = {
      '/Features': '/features',
      '/Pricing': '/pricing',
      '/About': '/about',
      '/Founders': '/founders',
      '/Affiliate': '/affiliate',
      '/Demo': '/demo',
      '/Contact': '/contact',
      '/Blog': '/blog',
      '/Signup': '/signup',
      '/Login': '/login'
    };

    if (redirectMap[path]) {
      // Preserve query parameters
      navigate(redirectMap[path] + searchParams, { replace: true });
    }

    // Handle trailing slashes (remove them)
    if (path !== '/' && path.endsWith('/')) {
      navigate(path.slice(0, -1) + searchParams, { replace: true });
    }

    // Handle common misspellings or old URLs
    const oldUrlMap = {
      '/property-management': '/features',
      '/ai-features': '/features',
      '/get-started': '/signup',
      '/schedule-demo': '/demo',
      '/partners': '/affiliate',
      '/partner-program': '/affiliate',
      '/schedule': '/demo'
    };

    if (oldUrlMap[path]) {
      navigate(oldUrlMap[path] + searchParams, { replace: true });
    }
  }, [location, navigate]);

  return null; // This component doesn't render anything
};

export default RedirectHandler;