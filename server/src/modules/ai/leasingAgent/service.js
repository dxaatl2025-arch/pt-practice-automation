const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

class LeasingAgentService {
  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Create or update a lead from incoming inquiry
   */
  async captureLeadInfo(leadData) {
    const { email, firstName, lastName, phone, source, initialMessage } = leadData;
    
    try {
      // Extract initial qualification data from message using AI
      const qualification = await this.extractQualificationFromMessage(initialMessage);
      
      const leadRecord = await this.prisma.lead.upsert({
        where: { email },
        update: {
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          source: source || 'website',
          lastInteraction: new Date(),
          totalInteractions: { increment: 1 },
          conversationHistory: {
            push: {
              timestamp: new Date(),
              type: 'initial_inquiry',
              content: initialMessage,
              metadata: { source }
            }
          },
          // Update qualification data if extracted
          ...qualification
        },
        create: {
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          source: source || 'website',
          status: 'NEW',
          temperature: 'COLD',
          score: 10, // Base score for new leads
          lastInteraction: new Date(),
          totalInteractions: 1,
          conversationHistory: [{
            timestamp: new Date(),
            type: 'initial_inquiry',
            content: initialMessage,
            metadata: { source }
          }],
          // Add qualification data if extracted
          ...qualification
        }
      });

      // Calculate initial lead score
      const updatedLead = await this.calculateLeadScore(leadRecord.id);
      
      return updatedLead;
    } catch (error) {
      console.error('Error capturing lead:', error);
      throw new Error('Failed to capture lead information');
    }
  }

  /**
   * Extract qualification data from natural language message
   */
  async extractQualificationFromMessage(message) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `You are Sienna, an AI leasing agent. Extract rental qualification information from the user's message. Return JSON with these fields (use null for missing data):
          - budgetMin (number)
          - budgetMax (number) 
          - bedrooms (number)
          - bathrooms (number)
          - desiredArea (string)
          - moveInDate (ISO date string)
          - petFriendly (boolean)
          
          Example: "Looking for a 2BR under $2000 in downtown" -> {"budgetMax": 2000, "bedrooms": 2, "desiredArea": "downtown"}`
        }, {
          role: "user",
          content: message
        }],
        temperature: 0.3
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      // Clean and validate the result
      const qualification = {};
      if (result.budgetMin && typeof result.budgetMin === 'number') qualification.budgetMin = result.budgetMin;
      if (result.budgetMax && typeof result.budgetMax === 'number') qualification.budgetMax = result.budgetMax;
      if (result.bedrooms && typeof result.bedrooms === 'number') qualification.bedrooms = result.bedrooms;
      if (result.bathrooms && typeof result.bathrooms === 'number') qualification.bathrooms = result.bathrooms;
      if (result.desiredArea && typeof result.desiredArea === 'string') qualification.desiredArea = result.desiredArea;
      if (result.moveInDate) qualification.moveInDate = new Date(result.moveInDate);
      if (typeof result.petFriendly === 'boolean') qualification.petFriendly = result.petFriendly;
      
      return qualification;
    } catch (error) {
      console.error('Error extracting qualification:', error);
      return {}; // Return empty object if extraction fails
    }
  }

  /**
   * Generate AI response as Sienna for lead conversation
   */
  async generateResponse(leadId, userMessage, context = {}) {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { assignedTo: true }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Get relevant properties based on lead qualification
      const matchingProperties = await this.findMatchingProperties(lead);
      
      // Build conversation context
      const conversationHistory = lead.conversationHistory || [];
      const recentMessages = conversationHistory.slice(-10); // Last 10 messages
      
      const systemPrompt = `You are Sienna, a friendly and professional AI leasing agent for PropertyPulse. Your goal is to qualify leads, answer questions about available properties, and schedule viewings.

Lead Profile:
- Name: ${lead.firstName || 'Prospect'} ${lead.lastName || ''}
- Budget: $${lead.budgetMin || 'Not specified'} - $${lead.budgetMax || 'Not specified'}
- Bedrooms: ${lead.bedrooms || 'Not specified'}
- Desired Area: ${lead.desiredArea || 'Not specified'}
- Move-in Date: ${lead.moveInDate ? new Date(lead.moveInDate).toDateString() : 'Not specified'}
- Pet-friendly needed: ${lead.petFriendly === null ? 'Not specified' : lead.petFriendly ? 'Yes' : 'No'}

Available Properties: ${matchingProperties.length} properties match their criteria

Key Guidelines:
1. Be conversational and helpful
2. Ask qualifying questions to understand their needs better
3. Suggest relevant properties when appropriate
4. Offer to schedule property viewings
5. Collect contact information if missing
6. Keep responses concise and actionable
7. If they ask about pricing, mention market rates and suggest scheduling a viewing for accurate pricing

Remember: You represent PropertyPulse's properties. Always be professional and helpful.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...recentMessages.map(msg => ({
          role: msg.type === 'user_message' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ];

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;

      // Update lead with new conversation
      await this.updateLeadConversation(leadId, userMessage, response);

      return {
        response,
        leadId: lead.id,
        matchingProperties: matchingProperties.slice(0, 3), // Top 3 matches
        suggestedActions: this.generateSuggestedActions(lead, userMessage, response)
      };

    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Find properties matching lead criteria
   */
  async findMatchingProperties(lead) {
    const where = {
      status: 'ACTIVE',
      isAvailable: true
    };

    // Add filters based on lead qualification
    if (lead.budgetMin || lead.budgetMax) {
      where.rentAmount = {};
      if (lead.budgetMin) where.rentAmount.gte = lead.budgetMin;
      if (lead.budgetMax) where.rentAmount.lte = lead.budgetMax;
    }

    if (lead.bedrooms !== null) {
      where.bedrooms = lead.bedrooms;
    }

    if (lead.desiredArea) {
      where.OR = [
        { addressCity: { contains: lead.desiredArea, mode: 'insensitive' } },
        { addressStreet: { contains: lead.desiredArea, mode: 'insensitive' } },
        { description: { contains: lead.desiredArea, mode: 'insensitive' } }
      ];
    }

    return await this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  /**
   * Update lead conversation history
   */
  async updateLeadConversation(leadId, userMessage, aiResponse) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId }
    });

    const updatedHistory = [
      ...(lead.conversationHistory || []),
      {
        timestamp: new Date(),
        type: 'user_message',
        content: userMessage
      },
      {
        timestamp: new Date(),
        type: 'ai_response',
        content: aiResponse
      }
    ];

    return await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        conversationHistory: updatedHistory,
        lastInteraction: new Date(),
        totalInteractions: { increment: 1 }
      }
    });
  }

  /**
   * Calculate and update lead score based on engagement and qualification
   */
  async calculateLeadScore(leadId) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId }
    });

    let score = 10; // Base score

    // Qualification completeness (up to 30 points)
    if (lead.budgetMin || lead.budgetMax) score += 8;
    if (lead.bedrooms !== null) score += 6;
    if (lead.desiredArea) score += 6;
    if (lead.moveInDate) score += 6;
    if (lead.firstName && lead.lastName) score += 4;

    // Engagement (up to 40 points)
    const interactions = lead.totalInteractions;
    if (interactions >= 5) score += 20;
    else if (interactions >= 3) score += 15;
    else if (interactions >= 2) score += 10;

    // Recency (up to 20 points)
    if (lead.lastInteraction) {
      const daysSinceInteraction = (Date.now() - new Date(lead.lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceInteraction <= 1) score += 20;
      else if (daysSinceInteraction <= 3) score += 15;
      else if (daysSinceInteraction <= 7) score += 10;
      else if (daysSinceInteraction <= 14) score += 5;
    }

    // Contact information (up to 10 points)
    if (lead.phone) score += 5;
    if (lead.firstName && lead.lastName) score += 5;

    // Cap at 100
    score = Math.min(100, score);

    // Determine temperature based on score
    let temperature = 'COLD';
    if (score >= 70) temperature = 'HOT';
    else if (score >= 40) temperature = 'WARM';

    return await this.prisma.lead.update({
      where: { id: leadId },
      data: { score, temperature }
    });
  }

  /**
   * Generate suggested actions based on conversation context
   */
  generateSuggestedActions(lead, userMessage, aiResponse) {
    const actions = [];

    // Analyze message content for action triggers
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    if (lowerMessage.includes('view') || lowerMessage.includes('see') || lowerMessage.includes('tour')) {
      actions.push({
        type: 'schedule_viewing',
        label: 'Schedule Property Viewing',
        priority: 'high'
      });
    }

    if (lowerMessage.includes('call') || lowerMessage.includes('phone')) {
      actions.push({
        type: 'schedule_call',
        label: 'Schedule Phone Call',
        priority: 'medium'
      });
    }

    if (!lead.phone && (lowerResponse.includes('contact') || lowerResponse.includes('phone'))) {
      actions.push({
        type: 'collect_phone',
        label: 'Collect Phone Number',
        priority: 'medium'
      });
    }

    if (lead.score >= 60) {
      actions.push({
        type: 'assign_agent',
        label: 'Assign to Human Agent',
        priority: 'high'
      });
    }

    return actions;
  }

  /**
   * Simulate conversation for testing/demo purposes
   */
  async simulateConversation(leadData, messages) {
    try {
      // Create lead
      const lead = await this.captureLeadInfo(leadData);
      
      const conversation = [];
      
      for (const message of messages) {
        const response = await this.generateResponse(lead.id, message);
        conversation.push({
          user: message,
          sienna: response.response,
          matchingProperties: response.matchingProperties?.length || 0,
          suggestedActions: response.suggestedActions
        });
        
        // Small delay to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get final lead state
      const finalLead = await this.prisma.lead.findUnique({
        where: { id: lead.id }
      });

      return {
        leadId: lead.id,
        conversation,
        finalScore: finalLead.score,
        finalTemperature: finalLead.temperature,
        totalInteractions: finalLead.totalInteractions
      };

    } catch (error) {
      console.error('Error in conversation simulation:', error);
      throw new Error('Failed to simulate conversation');
    }
  }

  /**
   * Get lead insights and analytics
   */
  async getLeadInsights(leadId) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedTo: true }
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const matchingProperties = await this.findMatchingProperties(lead);
    const conversationHistory = lead.conversationHistory || [];
    
    // Analyze conversation for insights
    const insights = {
      qualificationLevel: this.assessQualificationLevel(lead),
      engagementLevel: this.assessEngagementLevel(lead),
      interests: this.extractInterests(conversationHistory),
      nextBestAction: this.suggestNextAction(lead),
      matchingProperties: matchingProperties.length
    };

    return {
      lead,
      insights,
      topProperties: matchingProperties.slice(0, 3)
    };
  }

  assessQualificationLevel(lead) {
    let qualified = 0;
    let total = 7;

    if (lead.budgetMin || lead.budgetMax) qualified++;
    if (lead.bedrooms !== null) qualified++;
    if (lead.bathrooms !== null) qualified++;
    if (lead.desiredArea) qualified++;
    if (lead.moveInDate) qualified++;
    if (lead.phone) qualified++;
    if (lead.firstName && lead.lastName) qualified++;

    const percentage = (qualified / total) * 100;
    
    if (percentage >= 80) return 'Highly Qualified';
    if (percentage >= 50) return 'Moderately Qualified';
    return 'Needs Qualification';
  }

  assessEngagementLevel(lead) {
    const daysSinceInteraction = lead.lastInteraction 
      ? (Date.now() - new Date(lead.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    
    if (lead.totalInteractions >= 5 && daysSinceInteraction <= 1) return 'Highly Engaged';
    if (lead.totalInteractions >= 3 && daysSinceInteraction <= 3) return 'Engaged';
    if (lead.totalInteractions >= 2 && daysSinceInteraction <= 7) return 'Moderately Engaged';
    return 'Low Engagement';
  }

  extractInterests(conversationHistory) {
    const interests = [];
    const messages = conversationHistory.map(msg => msg.content?.toLowerCase() || '').join(' ');
    
    const keywords = {
      'Pet-Friendly': ['pet', 'dog', 'cat', 'animal'],
      'Parking': ['parking', 'garage', 'car'],
      'Gym/Fitness': ['gym', 'fitness', 'workout'],
      'Pool': ['pool', 'swimming'],
      'Downtown': ['downtown', 'city', 'urban'],
      'Quiet Area': ['quiet', 'peaceful', 'residential'],
      'Public Transit': ['transit', 'train', 'bus', 'subway'],
      'Shopping': ['shopping', 'mall', 'stores']
    };

    for (const [interest, words] of Object.entries(keywords)) {
      if (words.some(word => messages.includes(word))) {
        interests.push(interest);
      }
    }

    return interests;
  }

  suggestNextAction(lead) {
    if (lead.temperature === 'HOT' && !lead.assignedTo) {
      return 'Assign to human agent immediately';
    }
    
    if (lead.score >= 50 && lead.totalInteractions >= 3) {
      return 'Schedule property viewing';
    }
    
    if (!lead.phone) {
      return 'Collect phone number';
    }
    
    if (lead.totalInteractions === 1) {
      return 'Send follow-up message with property suggestions';
    }
    
    return 'Continue nurturing conversation';
  }
}

module.exports = LeasingAgentService;