# Smoke Test Matrix

## Core API Tests

### Health & Status Endpoints
| Endpoint | Method | Expected Response | Test Command |
|----------|--------|-------------------|--------------|
| `/health` | GET | `200 OK` with status | `curl http://localhost:5000/health` |
| `/health/detailed` | GET | `200 OK` with DB status | `curl http://localhost:5000/health/detailed` |
| `/` | GET | `200 OK` with API info | `curl http://localhost:5000/` |
| `/*` | GET | `404 Not Found` | `curl http://localhost:5000/invalid` |

### Authentication Endpoints
| Endpoint | Method | Expected Response | Test Command |
|----------|--------|-------------------|--------------|
| `/api/auth/login` | POST | `200 OK` with token or `401 Unauthorized` | `curl -X POST http://localhost:5000/api/auth/login -d '{"email":"test@test.com","password":"test"}' -H 'Content-Type: application/json'` |
| `/api/auth/register` | POST | `201 Created` or `400 Bad Request` | `curl -X POST http://localhost:5000/api/auth/register -d '{"email":"new@test.com","password":"test123","role":"TENANT"}' -H 'Content-Type: application/json'` |

## Feature-Specific Tests (When Enabled)

### Applications Module (`APPLICATIONS_E2E=true`)
| Endpoint | Method | Auth Required | Expected Response | Test Command |
|----------|--------|---------------|-------------------|--------------|
| `/api/applications` | POST | No | `201 Created` | `curl -X POST http://localhost:5000/api/applications -d '{"propertyId":"prop1","firstName":"John","lastName":"Doe","email":"john@test.com","consentBackground":true,"signature":"John Doe"}' -H 'Content-Type: application/json'` |
| `/api/applications` | GET | Landlord | `200 OK` with array | `curl -H "Authorization: Bearer <landlord_token>" "http://localhost:5000/api/applications?propertyId=prop1"` |
| `/api/applications/:id/status` | PATCH | Landlord | `200 OK` | `curl -X PATCH -H "Authorization: Bearer <landlord_token>" http://localhost:5000/api/applications/app1/status -d '{"status":"APPROVED"}' -H 'Content-Type: application/json'` |
| `/api/applications/:id/pdf` | GET | Landlord | `200 OK` with PDF | `curl -H "Authorization: Bearer <landlord_token>" http://localhost:5000/api/applications/app1/pdf` |

### Payments Module (`STRIPE_CORE=true`)
| Endpoint | Method | Auth Required | Expected Response | Test Command |
|----------|--------|---------------|-------------------|--------------|
| `/api/payments/intent` | POST | Tenant | `200 OK` with clientSecret | `curl -X POST -H "Authorization: Bearer <tenant_token>" http://localhost:5000/api/payments/intent -d '{"leaseId":"lease1","amount":1200}' -H 'Content-Type: application/json'` |
| `/api/payments/manual` | POST | Landlord | `200 OK` | `curl -X POST -H "Authorization: Bearer <landlord_token>" http://localhost:5000/api/payments/manual -d '{"leaseId":"lease1","amount":1200}' -H 'Content-Type: application/json'` |
| `/api/payments/:id` | GET | Tenant/Landlord | `200 OK` with payment | `curl -H "Authorization: Bearer <token>" http://localhost:5000/api/payments/pay1` |
| `/api/webhooks/stripe` | POST | None | `200 OK` | `curl -X POST http://localhost:5000/api/webhooks/stripe -H "Stripe-Signature: test" -d '{}'` |

### S3 Uploads Module (`S3_UPLOADS=true`)
| Endpoint | Method | Auth Required | Expected Response | Test Command |
|----------|--------|---------------|-------------------|--------------|
| `/api/uploads/signed-url` | POST | Tenant/Landlord | `200 OK` with upload URL | `curl -X POST -H "Authorization: Bearer <token>" http://localhost:5000/api/uploads/signed-url -d '{"entityType":"application","entityId":"app1","contentType":"image/jpeg"}' -H 'Content-Type: application/json'` |

## Rate Limiting Tests

### Authentication Rate Limits
```bash
# Test auth rate limiting (should get 429 after 10 requests)
for i in {1..12}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -H 'Content-Type: application/json' \
    -w "Status: %{http_code}\n" -s -o /dev/null
done
```

### General API Rate Limits  
```bash
# Test general rate limiting (should get 429 after 200 requests in 15 minutes)
for i in {1..5}; do
  echo "Request $i:"
  curl http://localhost:5000/health -w "Status: %{http_code}\n" -s -o /dev/null
done
```

## Error Handling Tests

### Invalid JSON
| Test | Command | Expected Response |
|------|---------|-------------------|
| Malformed JSON | `curl -X POST http://localhost:5000/api/auth/login -d '{invalid json}' -H 'Content-Type: application/json'` | `400 Bad Request` |
| Missing Content-Type | `curl -X POST http://localhost:5000/api/auth/login -d '{"email":"test"}'` | `400 Bad Request` |
| Empty Request Body | `curl -X POST http://localhost:5000/api/auth/login -d '' -H 'Content-Type: application/json'` | `400 Bad Request` |

### Authentication Errors
| Test | Command | Expected Response |
|------|---------|-------------------|
| No Token | `curl http://localhost:5000/api/applications` | `401 Unauthorized` |
| Invalid Token | `curl -H "Authorization: Bearer invalid_token" http://localhost:5000/api/applications` | `401 Unauthorized` |
| Expired Token | `curl -H "Authorization: Bearer <expired_token>" http://localhost:5000/api/applications` | `401 Unauthorized` |

## Security Headers Tests

### Required Headers Check
```bash
# Test security headers
curl -I http://localhost:5000/ | grep -E "(X-Content-Type-Options|X-Frame-Options|X-XSS-Protection)"

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY  
# X-XSS-Protection: 1; mode=block
```

### Production Headers Check
```bash
# In production, these should NOT be present:
curl -I http://localhost:5000/ | grep -E "(X-Database-Target|X-Database-Type)"

# Should return nothing in production
```

## Background Services Tests

### Reminders Worker (`REMINDERS=true`)
```bash
# Check worker starts
pm2 logs propertypulse-api | grep "Reminders worker started"

# Check periodic execution (every ~15 minutes)  
pm2 logs propertypulse-api | grep "Processing due reminders"

# Manual trigger test (if test endpoint exists)
curl -X POST http://localhost:5000/test-reminders
```

## Database Connectivity Tests

### Prisma Connection
```bash
# Test Prisma connection
cd server && npx prisma db pull

# Test basic query
cd server && npx prisma studio --port 5556 &
curl http://localhost:5556/
```

### Connection Pooling
```bash
# Test multiple concurrent connections
for i in {1..10}; do
  curl http://localhost:5000/health &
done
wait

# All should return 200 OK
```

## Integration Tests

### Email Integration (if SendGrid configured)
```bash
# Test email service
node -e "
const { sendEmail } = require('./server/src/utils/email');
sendEmail({
  to: 'test@example.com',
  subject: 'Smoke Test Email',
  html: '<p>This is a test email from smoke testing.</p>'
}).then(result => {
  console.log('✅ Email test passed:', result);
}).catch(error => {
  console.log('❌ Email test failed:', error.message);
});
"
```

### S3 Integration (if S3 configured)
```bash
# Test S3 connection
aws s3 ls s3://$S3_BUCKET

# Test file upload
echo "test content" > test-upload.txt
aws s3 cp test-upload.txt s3://$S3_BUCKET/smoke-test/
aws s3 rm s3://$S3_BUCKET/smoke-test/test-upload.txt
rm test-upload.txt
```

## Performance Baseline Tests

### Response Time Tests
```bash
# Test API response times (should be < 2000ms)
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:5000/health
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:5000/health/detailed

# Database query time
time (cd server && npx prisma db pull)
```

### Memory Usage Tests
```bash
# Check memory usage
pm2 monit

# Look for memory leaks after multiple requests
for i in {1..100}; do curl -s http://localhost:5000/health > /dev/null; done
pm2 monit
```

## Automated Test Script

```bash
#!/bin/bash
# Save as scripts/smoke-test.sh

echo "🧪 Starting Smoke Tests..."

# 1. Health checks
echo "Testing health endpoints..."
curl -f http://localhost:5000/health > /dev/null && echo "✅ Health check passed" || echo "❌ Health check failed"

# 2. Rate limiting
echo "Testing rate limiting..."
# (Add rate limiting tests here)

# 3. Security headers
echo "Testing security headers..."
# (Add security header tests here)

# 4. Feature-specific tests based on environment
if [ "$APPLICATIONS_E2E" = "true" ]; then
  echo "Testing Applications module..."
  # (Add applications tests here)
fi

if [ "$STRIPE_CORE" = "true" ]; then
  echo "Testing Payments module..."
  # (Add payments tests here)
fi

echo "🏁 Smoke tests completed"
```

## Expected Results Summary

### All Tests Should Pass
- **Health endpoints**: 200 OK responses
- **Authentication**: Proper token validation
- **Rate limiting**: 429 responses when limits exceeded
- **Error handling**: Appropriate HTTP status codes
- **Security headers**: All required headers present
- **Feature modules**: All enabled features working
- **Performance**: Response times < 2 seconds
- **Background services**: Workers running (if enabled)

### Failure Investigation
If any tests fail:
1. Check application logs: `pm2 logs propertypulse-api`
2. Check database connectivity: `npx prisma db pull`
3. Verify environment variables: `env | grep NODE_ENV`
4. Review recent code changes
5. Check system resources: memory, disk space
6. Escalate per runbook procedures if needed