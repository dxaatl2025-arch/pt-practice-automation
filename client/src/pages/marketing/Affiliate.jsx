import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';

const Affiliate = () => {
  const { appendUTMs } = useUTM();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🤝</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              PropertyPulse Affiliate Program
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-green-50">
              Partner with the leading AI property management platform and earn 
              substantial recurring commissions.
            </p>
            <div className="bg-white/20 rounded-xl p-6 max-w-2xl mx-auto mb-8">
              <h3 className="text-2xl font-bold mb-4">💰 Earn Big: 35% + 20% Recurring</h3>
              <p className="text-green-50">
                35% commission in the first year, then 20% recurring for 3 years. 
                Top performers earn $10,000+ monthly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Generous Commission Structure
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our affiliate program is designed to reward partners with industry-leading 
              commissions and long-term recurring revenue.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Year 1</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">35%</div>
              <p className="text-gray-600">
                Commission on all plans. Average payout: $27/month per customer on Professional plan.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-200 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Years 2-4</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">20%</div>
              <p className="text-gray-600">
                Recurring commission for 3 more years. Build sustainable passive income.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200 text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lifetime Value</h3>
              <div className="text-4xl font-bold text-purple-600 mb-2">$1,300+</div>
              <p className="text-gray-600">
                Average lifetime commission per Professional plan customer over 4 years.
              </p>
            </div>
          </div>

          {/* Example Earnings */}
          <div className="bg-gray-50 rounded-xl p-8 mb-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Potential Monthly Earnings
            </h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">$500</div>
                <div className="text-sm text-gray-600">5 customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">$2,000</div>
                <div className="text-sm text-gray-600">20 customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">$5,000</div>
                <div className="text-sm text-gray-600">50 customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">$10,000+</div>
                <div className="text-sm text-gray-600">100+ customers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner With Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Partner With PropertyPulse?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Market-Leading Product
              </h3>
              <p className="text-gray-600">
                AI-powered platform that solves real problems for property managers with proven ROI.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                High Customer LTV
              </h3>
              <p className="text-gray-600">
                Average customer stays 3+ years with 95% payment reliability and low churn rates.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Growing Market
              </h3>
              <p className="text-gray-600">
                Property management software market growing 12% annually with high demand for AI solutions.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Quality Leads
              </h3>
              <p className="text-gray-600">
                We provide pre-qualified leads and marketing support to help you succeed.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Marketing Tools
              </h3>
              <p className="text-gray-600">
                Complete marketing kit with landing pages, email templates, and sales materials.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Dedicated Support
              </h3>
              <p className="text-gray-600">
                Personal affiliate manager and priority support to maximize your success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect for These Partners
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real Estate Professionals
              </h3>
              <p className="text-gray-600 text-sm">
                Agents, brokers, and consultants with property management connections
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Software Consultants
              </h3>
              <p className="text-gray-600 text-sm">
                IT professionals who work with property management companies
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Business Coaches
              </h3>
              <p className="text-gray-600 text-sm">
                Consultants helping property managers optimize operations
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Industry Educators
              </h3>
              <p className="text-gray-600 text-sm">
                Trainers, course creators, and thought leaders in real estate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to Get Started
            </h2>
            <p className="text-xl text-gray-600">
              Join our partner program in 3 simple steps
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Submit Application
                </h3>
                <p className="text-gray-600">
                  Fill out our affiliate application with your background and target audience. 
                  We review all applications within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Get Approved & Onboarded
                </h3>
                <p className="text-gray-600">
                  Once approved, you'll get access to your affiliate dashboard, marketing materials, 
                  and dedicated affiliate manager.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start Earning Commissions
                </h3>
                <p className="text-gray-600">
                  Use your unique referral links and start earning commissions. 
                  Payouts are processed monthly via PayPal or direct deposit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 text-green-50">
            Join hundreds of partners already earning substantial recurring commissions 
            with PropertyPulse affiliate program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/affiliate/signup"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors inline-flex items-center justify-center"
            >
              🚀 Apply Now
            </Link>
            <Link 
              to={appendUTMs('/dashboard?view=affiliate')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition-colors inline-flex items-center justify-center"
            >
              📊 Affiliate Dashboard
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-green-200">
            Questions? Email us at partners@propertyplus.us
          </div>
        </div>
      </section>
    </div>
  );
};

export default Affiliate;