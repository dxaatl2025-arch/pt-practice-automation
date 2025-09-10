import React from 'react';
import { Link } from 'react-router-dom';
import { useUTM } from '../../hooks/useUTM';

const About = () => {
  const { appendUTMs } = useUTM();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About PropertyPulse
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-indigo-50">
              We're on a mission to revolutionize property management with 
              artificial intelligence, making it smarter, more efficient, and more profitable.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                PropertyPulse was founded with a simple belief: property management should be 
                intelligent, automated, and profitable. We've built the first truly AI-powered 
                property management platform that learns from your operations and continuously 
                optimizes for better results.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Our platform combines cutting-edge artificial intelligence with deep 
                property management expertise to help landlords and property managers 
                maximize revenue, reduce costs, and provide exceptional tenant experiences.
              </p>
              <Link 
                to={appendUTMs('/features')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center"
              >
                Explore Our Features →
              </Link>
            </div>
            <div className="text-center">
              <div className="text-8xl mb-6">🏢</div>
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-indigo-600">500+</div>
                    <div className="text-gray-600">Properties Managed</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">$2M+</div>
                    <div className="text-gray-600">Revenue Optimized</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">95%</div>
                    <div className="text-gray-600">Customer Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">24/7</div>
                    <div className="text-gray-600">AI Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do, from product development 
              to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Innovation First
              </h3>
              <p className="text-gray-600">
                We constantly push the boundaries of what's possible in property management, 
                leveraging the latest AI technologies to solve real problems.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Customer Success
              </h3>
              <p className="text-gray-600">
                Your success is our success. We're committed to helping every customer 
                achieve their property management goals and maximize their ROI.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Trust & Security
              </h3>
              <p className="text-gray-600">
                We handle your data with the highest levels of security and privacy, 
                using enterprise-grade encryption and security protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're a team of property management experts, AI engineers, and 
              customer success professionals dedicated to your success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                DS
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Founder & CEO
              </h3>
              <p className="text-gray-600 text-sm">
                15+ years in property management and AI development
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                AI
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Head of AI
              </h3>
              <p className="text-gray-600 text-sm">
                ML expert specializing in real estate and predictive analytics
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                PM
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Product Manager
              </h3>
              <p className="text-gray-600 text-sm">
                Former property manager turned product expert
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                CS
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Customer Success
              </h3>
              <p className="text-gray-600 text-sm">
                Dedicated to ensuring every customer achieves their goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform is built on cutting-edge technologies that ensure 
              reliability, scalability, and security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900">OpenAI GPT</h3>
              <p className="text-sm text-gray-600">Advanced AI for document processing and chat</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900">React + Node.js</h3>
              <p className="text-sm text-gray-600">Modern, fast, and scalable web architecture</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="font-semibold text-gray-900">Firebase Auth</h3>
              <p className="text-sm text-gray-600">Enterprise-grade authentication and security</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="font-semibold text-gray-900">AWS Cloud</h3>
              <p className="text-sm text-gray-600">Reliable, scalable cloud infrastructure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Story
            </h2>
          </div>

          <div className="prose prose-lg mx-auto text-gray-600">
            <p>
              PropertyPulse was born out of frustration with outdated property management tools 
              that couldn't keep up with the demands of modern real estate operations. Our founder, 
              with over 15 years in property management, experienced firsthand the inefficiencies 
              of manual processes, spreadsheet-based tracking, and reactive decision-making.
            </p>

            <p>
              In 2023, we set out to build something different. We envisioned a platform that 
              could predict tenant turnover before it happens, optimize rent prices based on 
              real market data, and automate the tedious tasks that consume so much time.
            </p>

            <p>
              Today, PropertyPulse serves hundreds of property managers across the country, 
              helping them increase revenue by an average of 20% while saving 10+ hours per week 
              on administrative tasks. But we're just getting started.
            </p>

            <p>
              Our vision is to make AI-powered property management accessible to every landlord 
              and property manager, regardless of portfolio size or technical expertise. 
              We believe that smart technology should amplify human capabilities, not replace them.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl mb-8 text-indigo-50">
            Be part of the property management revolution. Experience the future of 
            intelligent property management with PropertyPulse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={appendUTMs('/signup')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-50 transition-colors inline-flex items-center justify-center"
            >
              🚀 Start Your Journey
            </Link>
            <Link 
              to={appendUTMs('/demo')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
            >
              📅 Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;