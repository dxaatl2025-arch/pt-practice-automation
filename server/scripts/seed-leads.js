// Seed script for AI Leasing Agent leads
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLeads() {
  console.log('🌱 Seeding AI Leasing Agent lead data...');

  try {
    // Get a landlord user to assign leads to
    const landlord = await prisma.user.findFirst({
      where: { role: 'LANDLORD' }
    });

    if (!landlord) {
      console.log('No landlord found. Run main seed script first.');
      return;
    }

    // Sample lead data with various qualification levels and engagement
    const leads = [
      {
        email: 'sarah.jones@email.com',
        firstName: 'Sarah',
        lastName: 'Jones',
        phone: '555-0201',
        budgetMin: 1800,
        budgetMax: 2200,
        bedrooms: 2,
        bathrooms: 1,
        desiredArea: 'downtown',
        moveInDate: new Date('2025-02-15'),
        petFriendly: false,
        score: 85,
        temperature: 'HOT',
        source: 'website',
        status: 'QUALIFIED',
        totalInteractions: 6,
        lastInteraction: new Date(),
        assignedToId: landlord.id,
        conversationHistory: [
          {
            timestamp: new Date(Date.now() - 3600000),
            type: 'initial_inquiry',
            content: 'Hi! I\'m looking for a 2BR downtown apartment under $2200. I need to move in by mid-February.',
            metadata: { source: 'website' }
          },
          {
            timestamp: new Date(Date.now() - 3500000),
            type: 'ai_response',
            content: 'Hi Sarah! I\'d be happy to help you find a 2BR apartment downtown. Your budget of up to $2200 gives us great options. Do you have any specific amenities you\'re looking for?'
          },
          {
            timestamp: new Date(Date.now() - 3400000),
            type: 'user_message',
            content: 'I need parking and would prefer something modern with a gym.'
          },
          {
            timestamp: new Date(Date.now() - 3300000),
            type: 'ai_response',
            content: 'Perfect! I have several modern properties with parking and gym amenities. Would you like to schedule a viewing this week?'
          },
          {
            timestamp: new Date(Date.now() - 1800000),
            type: 'user_message',
            content: 'Yes, I\'m available Thursday or Friday afternoon.'
          },
          {
            timestamp: new Date(Date.now() - 1700000),
            type: 'ai_response',
            content: 'Excellent! Let me connect you with our leasing team to schedule your viewing for Thursday afternoon.'
          }
        ],
        interestedProperties: ['property1', 'property2'],
        viewedProperties: [],
        metaData: {
          leadSource: 'organic_search',
          interests: ['Parking', 'Gym', 'Modern']
        }
      },
      {
        email: 'mike.chen@email.com',
        firstName: 'Mike',
        lastName: 'Chen',
        budgetMax: 1500,
        bedrooms: 1,
        desiredArea: 'suburbs',
        petFriendly: true,
        score: 45,
        temperature: 'WARM',
        source: 'referral',
        status: 'CONTACTED',
        totalInteractions: 3,
        lastInteraction: new Date(Date.now() - 86400000), // 1 day ago
        conversationHistory: [
          {
            timestamp: new Date(Date.now() - 172800000), // 2 days ago
            type: 'initial_inquiry',
            content: 'My friend recommended PropertyPulse. I need a pet-friendly 1BR under $1500.',
            metadata: { source: 'referral' }
          },
          {
            timestamp: new Date(Date.now() - 172700000),
            type: 'ai_response',
            content: 'Thanks for the referral! I\'d be happy to help you find a pet-friendly 1BR. What type of pet do you have?'
          },
          {
            timestamp: new Date(Date.now() - 86400000),
            type: 'user_message',
            content: 'I have a golden retriever. Need a place with a yard or nearby dog park.'
          },
          {
            timestamp: new Date(Date.now() - 86300000),
            type: 'ai_response',
            content: 'Perfect! I have several properties with yards and others near dog parks. Let me find the best options for you and your golden retriever.'
          }
        ],
        interestedProperties: [],
        viewedProperties: [],
        metaData: {
          leadSource: 'referral',
          referredBy: 'existing_tenant',
          pets: [{ type: 'dog', breed: 'Golden Retriever' }]
        }
      },
      {
        email: 'jessica.taylor@email.com',
        firstName: 'Jessica',
        lastName: 'Taylor',
        phone: '555-0203',
        budgetMin: 2000,
        budgetMax: 3000,
        bedrooms: 3,
        bathrooms: 2,
        moveInDate: new Date('2025-03-01'),
        score: 35,
        temperature: 'WARM',
        source: 'advertisement',
        status: 'NEW',
        totalInteractions: 2,
        lastInteraction: new Date(Date.now() - 43200000), // 12 hours ago
        conversationHistory: [
          {
            timestamp: new Date(Date.now() - 86400000),
            type: 'initial_inquiry',
            content: 'Saw your ad. Need a 3BR house for my family. Budget is $2000-3000.',
            metadata: { source: 'advertisement' }
          },
          {
            timestamp: new Date(Date.now() - 86300000),
            type: 'ai_response',
            content: 'Hi Jessica! I\'d love to help you find a 3BR home for your family. That\'s a great budget range. How many people will be living in the home?'
          },
          {
            timestamp: new Date(Date.now() - 43200000),
            type: 'user_message',
            content: 'My husband, myself, and two kids (ages 8 and 12). Need good schools nearby.'
          },
          {
            timestamp: new Date(Date.now() - 43100000),
            type: 'ai_response',
            content: 'That\'s wonderful! School districts are definitely important. Let me find family-friendly 3BR properties in areas with highly-rated schools.'
          }
        ],
        interestedProperties: [],
        viewedProperties: [],
        metaData: {
          leadSource: 'google_ads',
          familySize: 4,
          childrenAges: [8, 12],
          priorities: ['Good Schools', 'Family Neighborhood']
        }
      },
      {
        email: 'alex.rodriguez@email.com',
        firstName: 'Alex',
        budgetMax: 1200,
        score: 15,
        temperature: 'COLD',
        source: 'website',
        status: 'NEW',
        totalInteractions: 1,
        lastInteraction: new Date(Date.now() - 604800000), // 1 week ago
        conversationHistory: [
          {
            timestamp: new Date(Date.now() - 604800000),
            type: 'initial_inquiry',
            content: 'Hi',
            metadata: { source: 'website' }
          },
          {
            timestamp: new Date(Date.now() - 604700000),
            type: 'ai_response',
            content: 'Hello! I\'m Sienna, your AI leasing agent. I\'m here to help you find the perfect rental property. What type of place are you looking for?'
          }
        ],
        interestedProperties: [],
        viewedProperties: [],
        metaData: {
          leadSource: 'website_chat',
          engagementLevel: 'minimal'
        }
      },
      {
        email: 'emma.wilson@email.com',
        firstName: 'Emma',
        lastName: 'Wilson',
        phone: '555-0205',
        budgetMin: 1400,
        budgetMax: 1800,
        bedrooms: 1,
        desiredArea: 'downtown',
        moveInDate: new Date('2025-01-20'),
        petFriendly: false,
        score: 70,
        temperature: 'HOT',
        source: 'website',
        status: 'VIEWING_SCHEDULED',
        totalInteractions: 5,
        lastInteraction: new Date(Date.now() - 7200000), // 2 hours ago
        assignedToId: landlord.id,
        conversationHistory: [
          {
            timestamp: new Date(Date.now() - 172800000),
            type: 'initial_inquiry',
            content: 'I need to find a 1BR downtown ASAP. My lease ends Jan 20th. Budget is $1400-1800.',
            metadata: { source: 'website' }
          },
          {
            timestamp: new Date(Date.now() - 172700000),
            type: 'ai_response',
            content: 'Hi Emma! I understand the urgency with your January 20th move-out date. Your budget range gives us excellent downtown options. Do you prefer high-rise or low-rise buildings?'
          },
          {
            timestamp: new Date(Date.now() - 86400000),
            type: 'user_message',
            content: 'High-rise preferred, with good security and maybe a doorman.'
          },
          {
            timestamp: new Date(Date.now() - 86300000),
            type: 'ai_response',
            content: 'Perfect! I have several secure high-rise options with doorman service in your price range. Would you like to see the top 3 properties?'
          },
          {
            timestamp: new Date(Date.now() - 7200000),
            type: 'user_message',
            content: 'Yes please! Can we schedule viewings for this weekend?'
          },
          {
            timestamp: new Date(Date.now() - 7100000),
            type: 'ai_response',
            content: 'Absolutely! I\'ll arrange viewings for Saturday morning. You\'ll love these properties - they all have the security features you\'re looking for.'
          }
        ],
        interestedProperties: ['property1', 'property3'],
        viewedProperties: [],
        metaData: {
          leadSource: 'website_form',
          urgency: 'high',
          preferences: ['High-rise', 'Security', 'Doorman'],
          moveOutDate: '2025-01-20'
        }
      }
    ];

    // Create leads
    for (const leadData of leads) {
      await prisma.lead.create({
        data: leadData
      });
    }

    console.log(`✅ Created ${leads.length} sample leads`);
    console.log('Lead distribution:');
    console.log('- 2 HOT leads (85+ score)');
    console.log('- 2 WARM leads (40-70 score)'); 
    console.log('- 1 COLD lead (15 score)');
    console.log('');
    console.log('Status distribution:');
    console.log('- 1 QUALIFIED');
    console.log('- 1 CONTACTED');
    console.log('- 1 VIEWING_SCHEDULED');
    console.log('- 2 NEW');
    console.log('');
    console.log('🎯 Sample Lead IDs for testing:');
    
    // Fetch and display created leads
    const createdLeads = await prisma.lead.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        score: true,
        temperature: true,
        status: true
      },
      orderBy: { score: 'desc' }
    });

    createdLeads.forEach(lead => {
      console.log(`${lead.firstName || 'Lead'} (${lead.email}): ${lead.id} - ${lead.score} pts, ${lead.temperature}, ${lead.status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding leads:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedLeads()
    .catch((e) => {
      console.error('Seed script error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedLeads };