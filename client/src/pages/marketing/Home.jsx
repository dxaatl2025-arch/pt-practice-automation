import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';
import usePageMeta from '../../hooks/usePageMeta';

const Home = () => {
  const { appendUTMs } = useUTM();
  
  usePageMeta({
    title: 'AI-Powered Property Management Platform',
    description: 'Transform your property management with AI. Optimize rent, predict turnover, automate leasing, and maximize revenue with PropertyPulse.',
    ogTitle: 'PropertyPulse - The Future of Property Management is Here',
    ogDescription: 'Harness AI-powered insights to optimize rent, predict turnover, automate leasing, and transform your property portfolio into a data-driven success story.',
    ogImage: '/images/propertypulse-hero.png'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The Future of Property Management is Here
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-blue-50">
              Harness AI-powered insights to optimize rent, predict turnover, automate leasing, 
              and transform your property portfolio into a data-driven success story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to={appendUTMs('/signup')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center"
              >
                🚀 Start Free Trial
              </Link>
              <Link 
                to={appendUTMs('/demo')}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
              >
                📅 Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Property Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automate operations, maximize revenue, and provide exceptional tenant experiences 
              with our comprehensive suite of AI tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white border border-blue-100">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">AI Leasing Agent</h3>
              <p className="text-gray-600">
                Automate lead qualification and tenant screening with our AI agent "Sienna" 
                that works 24/7 to convert prospects.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-green-50 to-white border border-green-100">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Rent Optimization</h3>
              <p className="text-gray-600">
                Maximize revenue with market-driven rent recommendations based on real-time 
                data and competitor analysis.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-purple-50 to-white border border-purple-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Predictive Analytics</h3>
              <p className="text-gray-600">
                Predict tenant turnover, forecast cash flow, and make data-driven decisions 
                to optimize your portfolio performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Trusted by Property Managers Nationwide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-3xl font-bold text-gray-400">500+</div>
            <div className="text-3xl font-bold text-gray-400">Properties</div>
            <div className="text-3xl font-bold text-gray-400">95%</div>
            <div className="text-3xl font-bold text-gray-400">Satisfaction</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl mb-8 text-blue-50">
            Join hundreds of property managers who have already revolutionized their operations with PropertyPulse.
          </p>
          <Link 
            to={appendUTMs('/signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center"
          >
            🚀 Start Your Free Trial Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;