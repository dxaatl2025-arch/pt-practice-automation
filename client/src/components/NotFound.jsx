import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-9xl mb-8">🚫</div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
          Page Not Found
        </h2>
        
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Sorry, the page you're looking for doesn't exist. The path{' '}
          <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
            {currentPath}
          </code>{' '}
          could not be found on our server.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Here are some helpful links:
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Link 
              to="/"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              🏠 Go Home
            </Link>
            
            <Link 
              to="/features"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              ✨ View Features
            </Link>
            
            <Link 
              to="/demo"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              🎯 Book Demo
            </Link>
            
            <Link 
              to="/contact"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              📧 Contact Us
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Still can't find what you're looking for?
          </p>
          <Link 
            to="/contact"
            className="text-purple-600 hover:text-purple-700 font-medium underline"
          >
            Get in touch with our support team
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;