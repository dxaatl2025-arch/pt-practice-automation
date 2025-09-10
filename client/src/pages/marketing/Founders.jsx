import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';
import CalendlyInline from '../../components/CalendlyInline';

const Founders = () => {
  const { appendUTMs } = useUTM();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Founders' Exclusive Offer
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-purple-50">
              Be among the first to revolutionize property management with AI. 
              Get exclusive founder pricing and lifetime benefits.
            </p>
            <div className="bg-white/20 rounded-xl p-6 max-w-2xl mx-auto mb-8">
              <h3 className="text-2xl font-bold mb-4">🎉 Limited Time: 20% Off Lifetime</h3>
              <p className="text-purple-50">
                Join our founding members and get permanent 20% discount on any plan, 
                plus exclusive access to new features and direct founder support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Details */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What's Included in the Founders' Package
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              This is more than just a discount - it's your VIP pass to shape the future 
              of property management technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                20% Off Lifetime
              </h3>
              <p className="text-gray-600">
                Permanent discount on any plan - Professional plan for just $63/month instead of $79.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Early Access
              </h3>
              <p className="text-gray-600">
                Be first to try new AI features and provide feedback that shapes development.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Direct Founder Access
              </h3>
              <p className="text-gray-600">
                Monthly calls with founders, priority support, and direct influence on roadmap.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Founder Badge
              </h3>
              <p className="text-gray-600">
                Special recognition in app and community as a founding member.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Exclusive Content
              </h3>
              <p className="text-gray-600">
                Access to founder masterclasses, advanced tutorials, and industry insights.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border border-pink-200">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Price Lock Guarantee
              </h3>
              <p className="text-gray-600">
                Your founder discount is locked in forever - even if we raise prices.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="text-center mb-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                to={appendUTMs('/signup?founder=true')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-colors inline-flex items-center justify-center"
              >
                🚀 Claim Founder Status
              </Link>
              <a 
                href="https://calendly.com/dessuber/15min"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-600 hover:text-white transition-colors inline-flex items-center justify-center"
              >
                📅 Quick Chat (15 min)
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Limited to first 100 members • Expires December 31, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              What Early Users Are Saying
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600 mb-4">
                "The AI leasing agent alone has saved me 10+ hours per week. 
                This founder pricing is incredible value."
              </p>
              <div className="text-sm text-gray-500">
                - Sarah M., Property Manager
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600 mb-4">
                "Finally, a platform that actually understands property management. 
                The founder benefits are amazing too!"
              </p>
              <div className="text-sm text-gray-500">
                - Mike D., Real Estate Investor
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600 mb-4">
                "Being a founding member means my feedback actually shapes the product. 
                Plus the 20% discount is fantastic."
              </p>
              <div className="text-sm text-gray-500">
                - Jennifer L., Portfolio Owner
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Schedule Your Founder Consultation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Book a quick 15-minute intro call to learn more about the founder program, 
              or schedule a 30-minute deep dive to see the platform in action.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Intro</h3>
                <p className="text-gray-600">15 minutes to discuss founder benefits and answer your questions</p>
              </div>
              <CalendlyInline url={process.env.REACT_APP_CALENDLY_INTRO_URL || 'https://calendly.com/dessuber/15min'} />
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Full Setup</h3>
                <p className="text-gray-600">30 minutes for platform demo and implementation planning</p>
              </div>
              <CalendlyInline url={process.env.REACT_APP_CALENDLY_SETUP_URL || 'https://calendly.com/dessuber/30min'} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Prefer to start immediately?
            </p>
            <Link 
              to={appendUTMs('/signup?founder=true')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-colors inline-flex items-center"
            >
              🚀 Claim Your Founder Status Now
            </Link>
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-20 bg-gradient-to-r from-red-500 to-pink-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">⏰</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Don't Miss Out - Limited Spots Available
          </h2>
          <p className="text-xl mb-8 text-red-50">
            We're limiting founder memberships to ensure quality support and community. 
            Only 47 spots remaining out of 100 total.
          </p>
          
          <div className="bg-white/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Founder Spots Claimed:</span>
              <span>53/100</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 mt-3">
              <div className="bg-white h-3 rounded-full" style={{width: '53%'}}></div>
            </div>
          </div>

          <Link 
            to={appendUTMs('/signup?founder=true')}
            className="bg-white text-red-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors inline-flex items-center"
          >
            🔥 Secure My Founder Status
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Founders;