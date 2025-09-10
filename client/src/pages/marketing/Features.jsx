import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';

const Features = () => {
  const { appendUTMs } = useUTM();

  const features = [
    {
      category: "AI-Powered Core Features",
      icon: "🤖",
      items: [
        {
          name: "AI Document Search & Chat",
          description: "Upload PDFs, search content, and chat with AI about your documents",
          icon: "📄"
        },
        {
          name: "Smart Property Matching",
          description: "ML-powered tenant/property matching with detailed explanations",
          icon: "🎯"
        },
        {
          name: "AI Leasing Agent \"Sienna\"",
          description: "24/7 automated lead qualification and conversation management",
          icon: "💬"
        },
        {
          name: "AI Rent Optimizer",
          description: "Market-driven rent recommendations with confidence scores",
          icon: "💰"
        },
        {
          name: "Turnover Prediction",
          description: "Risk assessment and retention action suggestions",
          icon: "📈"
        },
        {
          name: "Financial Forecasting",
          description: "12-month portfolio revenue and expense projections",
          icon: "📊"
        }
      ]
    },
    {
      category: "Business Management",
      icon: "🏢",
      items: [
        {
          name: "Owner Portal",
          description: "Portfolio summaries, financial reports, and PDF generation",
          icon: "👑"
        },
        {
          name: "Accounting Suite",
          description: "Chart of accounts, journal entries, and trial balance",
          icon: "📚"
        },
        {
          name: "Affiliate Portal",
          description: "Partner management and commission tracking",
          icon: "🤝"
        },
        {
          name: "Dynamic Pricing",
          description: "Subscription management and billing automation",
          icon: "💳"
        }
      ]
    },
    {
      category: "Operations & Automation",
      icon: "⚙️",
      items: [
        {
          name: "Automated Reminders",
          description: "Smart scheduling for rent, maintenance, and lease renewals",
          icon: "🔔"
        },
        {
          name: "Application Processing",
          description: "Streamlined rental application workflow and approvals",
          icon: "📋"
        },
        {
          name: "Payment Integration",
          description: "Stripe and Plaid integration for seamless transactions",
          icon: "💸"
        },
        {
          name: "File Management",
          description: "S3-powered document storage and organization",
          icon: "📁"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Complete Property Management Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-50">
              Every tool you need to manage properties efficiently, from AI-powered insights 
              to comprehensive business management features.
            </p>
            <Link 
              to={appendUTMs('/demo')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              📅 See It In Action
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16">
              <div className="text-center mb-12">
                <div className="text-5xl mb-4">{category.icon}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {category.category}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.items.map((feature, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              PropertyPulse integrates with the tools you already use, creating a unified 
              workflow for maximum efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">🔥</div>
              <h3 className="font-semibold text-gray-900">Firebase Auth</h3>
              <p className="text-sm text-gray-600">Secure authentication</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="font-semibold text-gray-900">Stripe</h3>
              <p className="text-sm text-gray-600">Payment processing</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">🏦</div>
              <h3 className="font-semibold text-gray-900">Plaid</h3>
              <p className="text-sm text-gray-600">Banking connections</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="font-semibold text-gray-900">AWS S3</h3>
              <p className="text-sm text-gray-600">Document storage</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Experience All Features Risk-Free
          </h2>
          <p className="text-xl mb-8 text-green-50">
            Start with our comprehensive free trial and see how PropertyPulse can 
            transform your property management operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={appendUTMs('/signup')}
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors inline-flex items-center justify-center"
            >
              🚀 Start Free Trial
            </Link>
            <Link 
              to={appendUTMs('/pricing')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition-colors inline-flex items-center justify-center"
            >
              💰 View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;