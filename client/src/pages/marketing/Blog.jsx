import React from 'react';
import { Link } from 'react-router-dom';

const Blog = () => {
  const blogPosts = [
    {
      id: 'ai-property-management-future',
      title: 'The Future of Property Management: How AI is Transforming the Industry',
      excerpt: 'Discover how artificial intelligence is revolutionizing property management operations, from automated tenant screening to predictive maintenance.',
      date: '2025-01-15',
      readTime: '8 min read',
      category: 'AI & Technology',
      author: 'PropertyPulse Team',
      image: '🤖'
    },
    {
      id: 'rent-optimization-strategies',
      title: '5 Data-Driven Strategies to Optimize Your Rental Pricing',
      excerpt: 'Learn proven techniques to maximize rental income through strategic pricing, market analysis, and tenant retention strategies.',
      date: '2025-01-10',
      readTime: '6 min read',
      category: 'Revenue Optimization',
      author: 'Sarah Mitchell',
      image: '💰'
    },
    {
      id: 'tenant-turnover-prediction',
      title: 'Predicting Tenant Turnover: Early Warning Signs and Prevention',
      excerpt: 'Identify the key indicators that predict tenant turnover and implement strategies to improve retention rates.',
      date: '2025-01-05',
      readTime: '7 min read',
      category: 'Tenant Management',
      author: 'David Chen',
      image: '📈'
    },
    {
      id: 'automation-property-management',
      title: 'Property Management Automation: What to Automate and What to Keep Human',
      excerpt: 'Find the right balance between automation and human touch in your property management operations.',
      date: '2024-12-28',
      readTime: '5 min read',
      category: 'Operations',
      author: 'Jennifer Lopez',
      image: '⚙️'
    },
    {
      id: 'financial-forecasting-guide',
      title: 'Complete Guide to Property Portfolio Financial Forecasting',
      excerpt: 'Master the art of financial forecasting for your property portfolio with AI-powered insights and proven methodologies.',
      date: '2024-12-20',
      readTime: '10 min read',
      category: 'Financial Planning',
      author: 'Michael Rodriguez',
      image: '📊'
    },
    {
      id: 'ai-leasing-agent-benefits',
      title: 'How AI Leasing Agents Are Converting More Prospects Into Tenants',
      excerpt: 'Explore the benefits of AI-powered leasing agents and how they can improve your conversion rates and tenant experience.',
      date: '2024-12-15',
      readTime: '6 min read',
      category: 'Leasing & Marketing',
      author: 'Lisa Wang',
      image: '🤖'
    }
  ];

  const categories = [
    'All Posts',
    'AI & Technology',
    'Revenue Optimization', 
    'Tenant Management',
    'Operations',
    'Financial Planning',
    'Leasing & Marketing'
  ];

  const [selectedCategory, setSelectedCategory] = React.useState('All Posts');

  const filteredPosts = selectedCategory === 'All Posts' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">📰</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              PropertyPulse Blog
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-purple-50">
              Insights, strategies, and industry trends to help you succeed 
              in modern property management.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length > 0 ? (
            <>
              {/* Featured Post */}
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Article</h2>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl overflow-hidden border border-purple-200">
                  <div className="md:flex">
                    <div className="md:w-1/3 flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
                      <div className="text-8xl">{filteredPosts[0].image}</div>
                    </div>
                    <div className="md:w-2/3 p-8">
                      <div className="flex items-center text-sm text-purple-600 mb-3">
                        <span className="bg-purple-100 px-3 py-1 rounded-full font-medium">
                          {filteredPosts[0].category}
                        </span>
                        <span className="mx-3">•</span>
                        <span>{filteredPosts[0].date}</span>
                        <span className="mx-3">•</span>
                        <span>{filteredPosts[0].readTime}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        <Link 
                          to={`/blog/${filteredPosts[0].id}`}
                          className="hover:text-purple-600 transition-colors"
                        >
                          {filteredPosts[0].title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        {filteredPosts[0].excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          By {filteredPosts[0].author}
                        </div>
                        <Link 
                          to={`/blog/${filteredPosts[0].id}`}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Posts */}
              {filteredPosts.length > 1 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.slice(1).map((post) => (
                      <article key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">
                          <div className="text-6xl">{post.image}</div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-600">
                              {post.category}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{post.readTime}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                            <Link 
                              to={`/blog/${post.id}`}
                              className="hover:text-purple-600 transition-colors"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <div>{post.author}</div>
                              <div>{post.date}</div>
                            </div>
                            <Link 
                              to={`/blog/${post.id}`}
                              className="text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Read More →
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No posts found in this category
              </h3>
              <p className="text-gray-600 mb-8">
                Try selecting a different category or check back soon for new content.
              </p>
              <button
                onClick={() => setSelectedCategory('All Posts')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                View All Posts
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">📧</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stay Updated with PropertyPulse
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get the latest property management insights, AI trends, and platform updates 
            delivered to your inbox weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Subscribe
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No spam, unsubscribe anytime. Privacy policy applies.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Blog;