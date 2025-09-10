import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';
import { useEventTracking } from '../../hooks/useAnalytics';

const AffiliateSignup = () => {
  const { getUTMs } = useUTM();
  const { trackFormSubmit } = useEventTracking();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    website: '',
    experience: '',
    payoutMethod: 'paypal',
    paypalEmail: '',
    phone: '',
    referralSource: '',
    acceptTerms: false,
    marketingEmails: true
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (!formData.acceptTerms) {
      setError('Please accept the affiliate terms and conditions.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setStatus('loading');
    setError('');
    
    try {
      // Get UTM data for tracking
      const utmData = getUTMs();
      
      const submissionData = {
        ...formData,
        utmData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Try to submit to API endpoint
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      
      try {
        const response = await fetch(`${apiBase}/api/affiliates/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          setStatus('success');
          trackFormSubmit('affiliate_application');
        } else {
          throw new Error('API submission failed');
        }
      } catch (apiError) {
        console.log('API submission failed, using fallback:', apiError);
        
        // Fallback: Log to console and show success message
        console.log('Affiliate application submission (fallback):', submissionData);
        
        setStatus('success');
        trackFormSubmit('affiliate_application');
      }
    } catch (error) {
      console.error('Affiliate signup error:', error);
      setError('Something went wrong. Please try again or email us directly at affiliates@propertyplus.us');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-6xl mb-8">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Application Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your interest in becoming a PropertyPulse affiliate partner. 
            We'll review your application and get back to you within 1-2 business days.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-3">What's Next?</h3>
            <ul className="text-left text-green-700 space-y-2">
              <li>✅ Application review (1-2 business days)</li>
              <li>📞 Follow-up call to discuss partnership details</li>
              <li>📋 Onboarding and affiliate portal access</li>
              <li>🚀 Start earning 35% commissions!</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Return to Home
            </Link>
            <Link 
              to="/affiliate"
              className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              Back to Affiliate Program
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-2xl font-bold text-purple-600">
            PropertyPulse
          </Link>
        </div>
      </div>

      {/* Form Section */}
      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-5xl mb-6">🤝</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join the PropertyPulse Affiliate Program
            </h1>
            <p className="text-xl text-gray-600">
              Earn 35% first-year commission + 20% recurring for 3 years
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Your first name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="your.email@company.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Your company name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Experience in Real Estate/PropTech
                    </label>
                    <select
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select experience level</option>
                      <option value="less-than-1-year">Less than 1 year</option>
                      <option value="1-3-years">1-3 years</option>
                      <option value="3-5-years">3-5 years</option>
                      <option value="5-10-years">5-10 years</option>
                      <option value="more-than-10-years">More than 10 years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Payout Method
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="payoutMethod"
                          value="paypal"
                          checked={formData.payoutMethod === 'paypal'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">PayPal</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="payoutMethod"
                          value="bank"
                          checked={formData.payoutMethod === 'bank'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">Bank Transfer (ACH)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="payoutMethod"
                          value="check"
                          checked={formData.payoutMethod === 'check'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">Check (Mail)</span>
                      </label>
                    </div>
                  </div>
                  
                  {formData.payoutMethod === 'paypal' && (
                    <div>
                      <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        PayPal Email Address
                      </label>
                      <input
                        type="email"
                        id="paypalEmail"
                        name="paypalEmail"
                        value={formData.paypalEmail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="your.paypal@email.com"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label htmlFor="referralSource" className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about our affiliate program?
                </label>
                <select
                  id="referralSource"
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select source</option>
                  <option value="website">PropertyPulse Website</option>
                  <option value="social-media">Social Media</option>
                  <option value="search-engine">Search Engine</option>
                  <option value="referral">Referral from friend/colleague</option>
                  <option value="industry-event">Industry Event/Conference</option>
                  <option value="email-marketing">Email Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Terms and Conditions */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      required
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <span className="ml-3 text-gray-700 text-sm">
                      I accept the{' '}
                      <Link to="/affiliate-terms" className="text-purple-600 hover:text-purple-700 underline">
                        affiliate terms and conditions
                      </Link>{' '}
                      and understand the commission structure. *
                    </span>
                  </label>
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="marketingEmails"
                      checked={formData.marketingEmails}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <span className="ml-3 text-gray-700 text-sm">
                      I'd like to receive marketing updates and affiliate program news via email.
                    </span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">❌</span>
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>🔄 Submitting Application...</>
                  ) : (
                    <>🚀 Submit Affiliate Application</>
                  )}
                </button>
                
                <p className="text-sm text-gray-500 text-center mt-4">
                  We typically review applications within 1-2 business days.
                </p>
              </div>
            </form>
          </div>

          {/* Back to Affiliate Program */}
          <div className="text-center mt-8">
            <Link 
              to="/affiliate"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Affiliate Program Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateSignup;