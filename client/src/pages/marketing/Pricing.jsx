import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';

const Pricing = () => {
  const { appendUTMs } = useUTM();

  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      description: "Perfect for small property managers",
      features: [
        "Up to 5 properties",
        "Basic tenant management",
        "Payment tracking",
        "Email support",
        "Mobile app access"
      ],
      cta: "Start Free Trial",
      highlight: false
    },
    {
      name: "Professional",
      price: "$79",
      period: "per month",
      description: "Most popular for growing portfolios",
      features: [
        "Up to 25 properties",
        "All AI features included",
        "Advanced reporting",
        "Priority support",
        "Accounting module",
        "Document automation",
        "API access"
      ],
      cta: "Start Free Trial",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "per month",
      description: "For large property management companies",
      features: [
        "Unlimited properties",
        "White-label options",
        "Custom integrations",
        "Dedicated support",
        "Advanced analytics",
        "Multi-user management",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  const addOns = [
    {
      name: "AI Leasing Agent",
      price: "$49/month",
      description: "24/7 automated lead qualification and tenant screening"
    },
    {
      name: "Owner Portal",
      price: "$29/month",
      description: "Branded portal for property owners with reports and insights"
    },
    {
      name: "Affiliate Program",
      price: "35% first year commission",
      description: "Partner with us and earn recurring revenue"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-green-50">
            Choose the perfect plan for your property management needs. 
            All plans include a 14-day free trial.
          </p>
          <div className="inline-flex items-center bg-white/20 rounded-full px-6 py-3">
            <span className="text-lg">💡 All plans include AI features</span>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.highlight 
                    ? 'border-blue-500 bg-blue-50 shadow-xl' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="text-green-500 mr-3">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.cta === 'Contact Sales' ? '/contact' : appendUTMs('/signup')}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Premium Add-Ons
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enhance your PropertyPulse experience with specialized modules 
              designed for specific use cases.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {addon.name}
                </h3>
                <p className="text-2xl font-bold text-blue-600 mb-4">
                  {addon.price}
                </p>
                <p className="text-gray-600 mb-6">
                  {addon.description}
                </p>
                <Link
                  to={appendUTMs('/contact')}
                  className="block text-center py-2 px-4 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. There are no long-term contracts 
                or cancellation fees.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                Your 14-day free trial includes full access to all features of your chosen plan, 
                including AI tools and premium support.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer custom pricing for large portfolios?
              </h3>
              <p className="text-gray-600">
                Yes, we offer custom enterprise pricing for portfolios with 100+ properties. 
                Contact our sales team for a personalized quote.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade security, including AES-256 encryption, 
                regular security audits, and SOC 2 compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-50">
            Join thousands of property managers who trust PropertyPulse to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={appendUTMs('/signup')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              🚀 Start Free Trial
            </Link>
            <Link 
              to={appendUTMs('/demo')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              📅 Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;