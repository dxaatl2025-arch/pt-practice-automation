import React from 'react';
import { Link } from 'react-router-dom';
import CalendlyInline from '../../components/CalendlyInline';
import { useUTM } from '../../hooks/useUTM';

const Demo = () => {
  const { appendUTMs } = useUTM();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              See PropertyPulse in Action
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-50">
              Book a personalized demo and discover how AI can transform your 
              property management operations.
            </p>
            <div className="bg-white/20 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-2">🚀 What You'll See:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-50">
                <div>• AI Leasing Agent in action</div>
                <div>• Rent optimization demo</div>
                <div>• Turnover prediction analytics</div>
                <div>• Financial forecasting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Single Demo Widget */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">⚡</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Quick Intro Demo (15 minutes)
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Perfect for busy property managers who want a quick overview of our core features, 
              pricing, and how PropertyPulse can transform their operations.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12 text-sm">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✅ Feature Overview</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">✅ AI Demo</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">✅ Pricing Discussion</span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">✅ Q&A Session</span>
            </div>
          </div>

          {/* Calendly Widget */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-16">
            <CalendlyInline 
              url="https://calendly.com/dessuber/15min"
              height="700px"
            />
          </div>

          {/* Alternative Options */}
          <div className="text-center">
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Need a More Comprehensive Demo?
              </h3>
              <p className="text-gray-600 mb-8">
                For a complete walkthrough with personalized setup planning, check out our Founders offer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/founders"
                  className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors inline-flex items-center justify-center"
                >
                  🚀 Full Setup Demo (30 min)
                </Link>
                <Link 
                  to={appendUTMs('/contact')}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
                >
                  📧 Email Questions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You'll Discover in Your Demo
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Automation
              </h3>
              <p className="text-gray-600 text-sm">
                See how AI handles tenant screening, rent optimization, and predictive analytics
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Revenue Growth
              </h3>
              <p className="text-gray-600 text-sm">
                Learn how customers increase revenue by 15-25% with optimized pricing
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Time Savings
              </h3>
              <p className="text-gray-600 text-sm">
                Discover automation that saves 10+ hours per week on routine tasks
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Custom Setup
              </h3>
              <p className="text-gray-600 text-sm">
                Get a personalized implementation plan for your specific needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              What Demo Attendees Say
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600 mb-4">
                "The demo was incredibly thorough. I could immediately see how this 
                would transform my property management business."
              </p>
              <div className="text-sm text-gray-500">
                - Maria S., Portfolio Manager
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600 mb-4">
                "The AI features shown in the demo convinced me immediately. 
                Signed up right after the call!"
              </p>
              <div className="text-sm text-gray-500">
                - David L., Real Estate Investor
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600 mb-4">
                "Best property management demo I've seen. The team really knows 
                their stuff and the platform is impressive."
              </p>
              <div className="text-sm text-gray-500">
                - Jennifer K., Property Manager
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to See PropertyPulse in Action?
          </h2>
          <p className="text-xl mb-8 text-purple-50">
            Book your free demo today and discover how AI can revolutionize 
            your property management operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://calendly.com/dessuber/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-colors inline-flex items-center justify-center"
            >
              ⚡ Book Your Demo (15 min)
            </a>
            <Link 
              to={appendUTMs('/contact')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transition-colors inline-flex items-center justify-center"
            >
              📧 Have Questions?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Demo;