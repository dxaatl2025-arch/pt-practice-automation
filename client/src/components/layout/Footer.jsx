import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';

const Footer = () => {
  const { appendUTMs } = useUTM();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl">🏠</div>
              <span className="text-xl font-bold">PropertyPulse</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The future of property management is here. AI-powered solutions 
              that streamline operations and maximize revenue for property managers.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/propertyplus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                🐦
              </a>
              <a href="https://linkedin.com/company/propertyplus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                💼
              </a>
              <a href="https://facebook.com/propertyplus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                📘
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/demo" className="text-gray-400 hover:text-white transition-colors">Live Demo</Link></li>
              <li><Link to={appendUTMs('/signup')} className="text-gray-400 hover:text-white transition-colors">Start Free Trial</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/affiliate" className="text-gray-400 hover:text-white transition-colors">Affiliate Program</Link></li>
              <li><Link to="/founders" className="text-gray-400 hover:text-white transition-colors">Founders Offer</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li>
                <button 
                  onClick={() => window.Tawk_API && window.Tawk_API.toggle()}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Live Chat
                </button>
              </li>
              <li><a href="mailto:support@propertyplus.us" className="text-gray-400 hover:text-white transition-colors">Email Support</a></li>
              <li><a href="https://calendly.com/dessuber/15min" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Schedule Call</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 PropertyPulse. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="/security" className="text-gray-400 hover:text-white text-sm transition-colors">Security</a>
            <Link to="/404" className="text-gray-400 hover:text-white text-sm transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;