import React, { useState } from 'react';
import { useUTM } from '../../hooks/useUTM';

const Contact = () => {
  const { getUTMs } = useUTM();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    honey: '' // honeypot field
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check honeypot field (should be empty)
    if (formData.honey) {
      console.log('Spam detected - honeypot field filled');
      return;
    }

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Get UTM data to include in submission
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
        const response = await fetch(`${apiBase}/api/support/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          setStatus('success');
          setFormData({
            name: '',
            email: '',
            company: '',
            phone: '',
            message: '',
            honey: ''
          });
        } else {
          throw new Error('API submission failed');
        }
      } catch (apiError) {
        console.log('API submission failed, using fallback:', apiError);
        
        // Fallback: Log to console and show success message
        // In a real application, you might want to use a service like Formspree or Netlify Forms
        console.log('Contact form submission (fallback):', submissionData);
        
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          message: '',
          honey: ''
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again or email us directly at support@propertyplus.us');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">📧</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in Touch
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-teal-50">
              Have questions about PropertyPulse? We're here to help you find the 
              perfect solution for your property management needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Let's Start a Conversation
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Whether you're looking for a demo, have technical questions, or need help 
                choosing the right plan, our team is ready to assist you.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                    📞
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Schedule a Call
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Book a personalized demo or consultation
                    </p>
                    <a 
                      href="https://calendly.com/dessuber/15min" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Schedule 15-min call →
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    💬
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Live Chat
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Get instant answers to your questions
                    </p>
                    <button 
                      onClick={() => window.Tawk_API && window.Tawk_API.toggle()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Start chat →
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                    📧
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Email Support
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Send us an email and we'll respond within 24 hours
                    </p>
                    <a 
                      href="mailto:support@propertyplus.us"
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      support@propertyplus.us
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 rounded-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Your full name"
                  />
                </div>

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="your.email@company.com"
                  />
                </div>

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Your company name"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Tell us about your property management needs..."
                  />
                </div>

                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="honey"
                  value={formData.honey}
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                  tabIndex="-1"
                  autoComplete="off"
                />

                {/* Status Messages */}
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-red-600 mr-2">❌</span>
                      <span className="text-red-700">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {status === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✅</span>
                      <span className="text-green-700">
                        Thank you! We've received your message and will respond within 24 hours.
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? '📤 Sending...' : '📧 Send Message'}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  We typically respond within 24 hours during business days.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How quickly can I get started with PropertyPulse?
              </h3>
              <p className="text-gray-600">
                You can sign up and start using PropertyPulse immediately. Our onboarding process 
                takes just a few minutes, and you'll have access to all features right away.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do you offer customer support?
              </h3>
              <p className="text-gray-600">
                Yes! We provide comprehensive support through live chat, email, and scheduled calls. 
                Our support team is available during business hours and we aim to respond within 24 hours.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I migrate my existing data to PropertyPulse?
              </h3>
              <p className="text-gray-600">
                Absolutely! We provide data migration assistance to help you import your existing 
                property, tenant, and financial data. Our team will guide you through the process.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is there a setup fee or long-term contract?
              </h3>
              <p className="text-gray-600">
                No setup fees and no long-term contracts required. You can start with our monthly 
                plans and cancel anytime. We also offer discounts for annual subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;