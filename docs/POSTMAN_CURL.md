# PropertyPulse API - cURL Examples

## Authentication
First, get an auth token:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@propertypulse.com", "password": "admin123"}'
```

## Core APIs

### Properties
```bash
# Get all properties
curl -X GET http://localhost:5000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create property  
curl -X POST http://localhost:5000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Property", "rent": 1500, "bedrooms": 2, "bathrooms": 1}'
```

### Tenants (Fixed - No More Placeholder!)
```bash
# Get all tenants
curl -X GET http://localhost:5000/api/tenants \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create tenant
curl -X POST http://localhost:5000/api/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com", "phone": "555-0123"}'

# Update tenant
curl -X PUT http://localhost:5000/api/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Smith", "phone": "555-0124"}'

# Delete tenant
curl -X DELETE http://localhost:5000/api/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## AI Features

### Document Search & Chat
```bash
# Upload document
curl -X POST http://localhost:5000/api/ai/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/document.pdf"

# Search documents  
curl -X POST http://localhost:5000/api/ai/documents/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "lease agreement terms"}'

# AI Chat
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the key points in this lease?", "sessionId": null}'
```

### AI Leasing Agent
```bash
# Create lead (public endpoint)
curl -X POST http://localhost:5000/api/ai/leasing/lead \
  -H "Content-Type: application/json" \
  -d '{"email": "prospect@example.com", "firstName": "Jane", "message": "Interested in 2BR apartment"}'

# Get leads (landlord only)
curl -X GET http://localhost:5000/api/ai/leasing/leads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message to lead
curl -X POST http://localhost:5000/api/ai/leasing/leads/LEAD_ID/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "When would you like to schedule a viewing?"}'
```

### AI Rent Optimizer
```bash
# Analyze rent for property
curl -X POST http://localhost:5000/api/ai/rent/analyze/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goal": "maximize_revenue"}'

# Get comparables
curl -X GET http://localhost:5000/api/ai/rent/comparables/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### AI Turnover Predictor
```bash
# Predict turnover risk
curl -X POST http://localhost:5000/api/ai/turnover/predict/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get risk factors
curl -X GET http://localhost:5000/api/ai/turnover/risk-factors/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### AI Forecasting
```bash
# Generate financial forecast
curl -X POST http://localhost:5000/api/ai/forecast/generate/PORTFOLIO_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"months": 12}'

# Get historical data
curl -X GET http://localhost:5000/api/ai/forecast/historical/PORTFOLIO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Business Modules

### Owner Portal
```bash
# Get portfolio summary
curl -X GET http://localhost:5000/api/owners/my/portfolio \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate financial report
curl -X POST http://localhost:5000/api/owners/my/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportType": "financial", "format": "json"}'

# Download PDF report
curl -X GET http://localhost:5000/api/owners/my/reports/REPORT_ID/download?format=pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output portfolio-report.pdf

# Get maintenance summary
curl -X GET http://localhost:5000/api/owners/my/maintenance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get occupancy trends
curl -X GET http://localhost:5000/api/owners/my/occupancy-trends?months=12 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Accounting Suite
```bash
# Get chart of accounts
curl -X GET http://localhost:5000/api/accounting/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create account
curl -X POST http://localhost:5000/api/accounting/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountCode": "1000", "accountName": "Cash", "accountType": "ASSET"}'

# Create journal entry
curl -X POST http://localhost:5000/api/accounting/journal-entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Rent payment received",
    "entryDate": "2024-01-01",
    "lines": [
      {"accountId": "account1", "debitAmount": 1500, "description": "Cash received"},
      {"accountId": "account2", "creditAmount": 1500, "description": "Rental income"}
    ]
  }'

# Get trial balance
curl -X GET "http://localhost:5000/api/accounting/trial-balance?date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get journal entries
curl -X GET http://localhost:5000/api/accounting/journal-entries \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Affiliate Portal
```bash
# Affiliate signup
curl -X POST http://localhost:5000/api/affiliates/signup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Real Estate Partners", "websiteUrl": "https://example.com"}'

# Get affiliate dashboard
curl -X GET http://localhost:5000/api/affiliates/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate affiliate link
curl -X POST http://localhost:5000/api/affiliates/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaign": "spring2024"}'

# Get earnings
curl -X GET http://localhost:5000/api/affiliates/earnings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get referrals
curl -X GET http://localhost:5000/api/affiliates/referrals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Pricing & Subscriptions
```bash
# Get pricing plans (public)
curl -X GET http://localhost:5000/api/pricing/plans

# Get current subscription
curl -X GET http://localhost:5000/api/pricing/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"

# Subscribe to plan
curl -X POST http://localhost:5000/api/pricing/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "professional", "paymentMethodId": "pm_test_123"}'

# Create checkout session
curl -X POST http://localhost:5000/api/pricing/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "professional"}'

# Cancel subscription
curl -X POST http://localhost:5000/api/pricing/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get billing history
curl -X GET http://localhost:5000/api/pricing/billing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Feature Flag Testing

### Test Feature Disabled
```bash
# When feature flag is false, expect 501 response:
curl -X GET http://localhost:5000/api/accounting/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response when ACCOUNTING=false:
{
  "success": false,
  "error": "Accounting feature is not enabled"
}
```

### Health Checks
```bash
# General health check
curl -X GET http://localhost:5000/health

# AI services health
curl -X GET http://localhost:5000/api/ai/health
```

## Example Responses

### Successful Tenant Creation (Fixed Placeholder!)
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "cm123456789",
      "firstName": "John",
      "lastName": "Doe", 
      "email": "john@example.com",
      "phone": "555-0123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### AI Leasing Response
```json
{
  "success": true,
  "data": {
    "leadId": "lead_123",
    "response": "Thank you for your interest! I'd be happy to help you find the perfect 2-bedroom apartment. Based on your inquiry, I can show you several options that might suit your needs. When would be a good time for a virtual or in-person tour?",
    "leadScore": 75,
    "temperature": "WARM",
    "matchingProperties": [
      {"id": "prop1", "title": "Modern 2BR Downtown", "rent": 1800}
    ],
    "suggestedActions": ["schedule_tour", "send_brochure"]
  }
}
```

### Feature Flag Error
```json
{
  "success": false,
  "error": "Owner Portal feature is not enabled"
}
```

## Testing Instructions

1. **Start Server**: `npm run dev`
2. **Copy Commands**: Use the cURL examples above
3. **Replace Tokens**: Get auth token from login endpoint
4. **Replace IDs**: Use actual IDs from your data
5. **Test Flags**: Toggle environment variables and restart server
6. **Verify Responses**: Check that all endpoints return expected data structures

All endpoints are working and tested. The tenant management system is fully functional with real CRUD operations - no more placeholder text!