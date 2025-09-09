# PropertyPulse AI Features - Production Deployment Guide

## 🚀 Quick Start Production Deployment

### Step 1: Environment Configuration

Copy and configure your production environment:

```bash
# Copy environment template
cp .env.example .env

# Configure required variables
DATABASE_URL="postgresql://user:pass@your-prod-db:5432/propertypulse"
OPENAI_API_KEY="sk-your-production-openai-key"
NODE_ENV="production"
```

### Step 2: Enable AI Features

```bash
# Enable all AI features
AI_LEASING=true
AI_RENT_OPTIMIZER=true  
AI_TURNOVER_PREDICTOR=true
AI_FORECASTING=true
AI_DOCUMENT_SEARCH=true
AI_DOCUMENT_CHAT=true
```

### Step 3: Database Setup

```bash
# Run migrations
cd server && npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Verify database
npm run health
```

### Step 4: Start Production Server

```bash
# Install dependencies
npm run install-all

# Build frontend (if applicable)
npm run build

# Start production server
npm run start
```

## 📋 Complete Feature Reference

### 🤖 AI Document Search & Chat

**Endpoints:**
```
POST /api/ai/documents/upload          # Upload documents
GET  /api/ai/documents                 # Get user documents  
POST /api/ai/documents/search          # AI-powered search
POST /api/ai/chat                      # Chat with AI assistant
GET  /api/ai/chat/sessions             # Get chat history
GET  /api/ai/chat/sessions/:id         # Get specific session
```

**Usage Example:**
```javascript
// Upload document
const formData = new FormData();
formData.append('document', file);
formData.append('propertyId', 'prop-123');

const response = await fetch('/api/ai/documents/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});

// Search documents
const searchResponse = await fetch('/api/ai/documents/search', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "What are the lease terms for downtown properties?",
    propertyId: "prop-123" // optional
  })
});
```

### 👩‍💼 AI Leasing Agent "Sienna"

**Endpoints:**
```
POST /api/ai/leasing/lead              # Create lead and start conversation
POST /api/ai/leasing/simulate          # Demo conversation simulation
GET  /api/ai/leasing/leads             # List and filter leads
GET  /api/ai/leasing/leads/:id         # Get lead insights
POST /api/ai/leasing/leads/:id/message # Continue conversation
PUT  /api/ai/leasing/leads/:id/assign  # Assign to human agent
PUT  /api/ai/leasing/leads/:id/status  # Update lead status
```

**Usage Example:**
```javascript
// Create lead from website inquiry
const leadResponse = await fetch('/api/ai/leasing/lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "prospect@email.com",
    firstName: "John",
    message: "Looking for a 2BR downtown under $2500"
  })
});

// Response includes AI analysis
const leadData = await leadResponse.json();
console.log('Lead Score:', leadData.data.leadScore);
console.log('AI Response:', leadData.data.response);
console.log('Matching Properties:', leadData.data.matchingProperties);
```

### 💰 AI Rent Optimizer

**Endpoints:**
```
POST /api/ai/rent/analyze/:propertyId  # Analyze individual property
POST /api/ai/rent/portfolio            # Analyze entire portfolio  
GET  /api/ai/rent/market/:propertyId   # Get market data and comparables
GET  /api/ai/rent/insights/dashboard   # Portfolio dashboard insights
GET  /api/ai/rent/history/:propertyId  # Rent history and trends
```

**Usage Example:**
```javascript
// Analyze property rent optimization
const rentAnalysis = await fetch('/api/ai/rent/analyze/prop-123', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    goal: "maximize_revenue" // or "maintain_occupancy", "balanced"
  })
});

const analysis = await rentAnalysis.json();
console.log('Suggested Rent:', analysis.data.analysis.suggestedRent);
console.log('Confidence:', analysis.data.analysis.confidence);
console.log('Monthly Increase:', analysis.data.metrics.monthlyIncrease);
```

### 📊 AI Turnover Predictor

**Endpoints:**
```
POST /api/ai/turnover/analyze/:leaseId # Analyze turnover risk
GET  /api/ai/turnover/insights         # Portfolio turnover insights
```

**Usage Example:**
```javascript
// Analyze tenant turnover risk
const turnoverAnalysis = await fetch('/api/ai/turnover/analyze/lease-123', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const riskData = await turnoverAnalysis.json();
console.log('Turnover Risk:', riskData.data.riskLevel); // LOW, MEDIUM, HIGH
console.log('Recommendations:', riskData.data.recommendations);
```

### 🔮 AI Forecasting Service

**Endpoints:**
```
POST /api/ai/forecast/revenue          # Revenue forecasting
POST /api/ai/forecast/occupancy        # Occupancy forecasting
```

**Usage Example:**
```javascript
// Forecast revenue for next 12 months
const forecastResponse = await fetch('/api/ai/forecast/revenue', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    propertyIds: ["prop-1", "prop-2"], // or omit for all properties
    timeframe: "12_months",
    scenario: "optimistic" // pessimistic, realistic, optimistic
  })
});

const forecast = await forecastResponse.json();
console.log('Projected Revenue:', forecast.data.projections);
```

## 🔐 Authentication & Security

All AI endpoints require authentication. Include the Bearer token in requests:

```javascript
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
};
```

### Rate Limits:
- **Document Operations**: 30 requests per 15 minutes
- **Chat Messages**: 20 requests per 5 minutes  
- **AI Analysis**: 50 requests per 15 minutes
- **Rent Optimization**: 30 requests per 15 minutes

## 🎛️ Feature Flag Management

Control AI features in production:

```bash
# Enable specific features
AI_LEASING=true                # AI Leasing Agent
AI_RENT_OPTIMIZER=true         # Rent Optimization
AI_DOCUMENT_SEARCH=false       # Document Search (disabled)
AI_DOCUMENT_CHAT=false         # AI Chat (disabled)
```

## 📊 Monitoring & Analytics

### OpenAI Usage Monitoring:
- Monitor API usage in OpenAI dashboard
- Set usage alerts for cost control
- Track token consumption per feature

### Application Metrics:
- **Response Times**: AI endpoints should average <5 seconds
- **Error Rates**: Monitor for failed AI requests
- **User Adoption**: Track feature usage by endpoint

### Health Checks:
```bash
# Test AI service health
curl https://your-domain.com/api/ai/health

# Expected response:
{
  "success": true,
  "message": "AI service is running",
  "service": "OpenAI GPT-4 Lease Generator",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

## 🚨 Troubleshooting Guide

### Common Issues:

**1. AI Features Not Working**
- Check `OPENAI_API_KEY` is set correctly
- Verify feature flags are enabled (`AI_LEASING=true`)
- Check OpenAI account has sufficient credits

**2. Database Connection Issues**
- Run `npx prisma migrate deploy` to apply migrations
- Verify `DATABASE_URL` connection string
- Check database server is accessible

**3. Authentication Errors**
- Verify Firebase Admin is properly configured
- Check JWT tokens are valid
- Ensure user exists in database

**4. Rate Limiting Errors**
- Check if rate limits are exceeded
- Implement retry logic with exponential backoff
- Consider upgrading rate limits for production

### Debug Mode:
```bash
# Enable debug logging
NODE_ENV=development
DEBUG=true

# Check logs for detailed error information
tail -f logs/app.log
```

## 📈 Performance Optimization

### Production Settings:
```bash
# Optimize for production
NODE_ENV=production
PM2_INSTANCES=4              # Use PM2 cluster mode
AI_RESPONSE_CACHE=true       # Enable response caching
DB_POOL_SIZE=20              # Increase database pool
```

### Database Optimization:
- Ensure all indexes are created
- Monitor slow query logs
- Consider read replicas for heavy usage

## 🔄 Backup & Recovery

### Database Backups:
```bash
# Automated daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/daily/
```

### AI Data Backup:
- Chat sessions and documents are stored in database
- Ensure regular database backups include AI data
- Consider separate backup strategy for uploaded documents

## 🎯 Success Checklist

After deployment, verify:

- [ ] All AI endpoints return successful responses
- [ ] Feature flags control module availability
- [ ] Authentication and authorization work correctly
- [ ] Rate limiting is active and functional
- [ ] Database migrations completed successfully
- [ ] OpenAI integration is working
- [ ] File uploads process correctly
- [ ] Chat sessions persist properly
- [ ] Lead scoring system is active
- [ ] Rent optimization calculations work
- [ ] Error handling is comprehensive
- [ ] Monitoring and logging are active

## 📞 Support

For production issues:
1. Check application logs first
2. Verify environment variables
3. Test individual AI endpoints
4. Monitor OpenAI dashboard for API issues
5. Check database connectivity and performance

**Emergency Rollback:**
```bash
# Disable all AI features immediately
AI_LEASING=false
AI_RENT_OPTIMIZER=false
AI_TURNOVER_PREDICTOR=false
AI_FORECASTING=false
AI_DOCUMENT_SEARCH=false
AI_DOCUMENT_CHAT=false

# Restart application
pm2 restart propertypulse-api
```

This production deployment guide ensures smooth rollout of all AI features with comprehensive monitoring and troubleshooting capabilities.