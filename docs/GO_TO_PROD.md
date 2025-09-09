# Production Deployment Checklist

## Pre-Deployment Setup

### Environment Configuration
- [ ] Copy `.env.example` to `.env` and configure all values
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set strong JWT secret (32+ characters)
- [ ] Configure SendGrid API key for emails
- [ ] Set up Firebase service account credentials

### Feature Flags Configuration
- [ ] Set `APPLICATIONS_E2E=true` to enable applications module
- [ ] Set `STRIPE_CORE=true` if using payments (requires Stripe keys)
- [ ] Set `S3_UPLOADS=true` if using file uploads (requires AWS credentials)
- [ ] Set `REMINDERS=true` if using email reminders
- [ ] Configure Sentry DSN for error tracking (optional)

### Database Setup
```bash
# Run migrations
cd server && npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Verify database connection
npm run health
```

### Security Checklist
- [ ] Rate limiting configured for auth (10 requests/15min)
- [ ] Rate limiting configured for payments (20 requests/5min)
- [ ] CORS origins properly configured
- [ ] Database-identifying headers disabled in production
- [ ] CSP headers include Stripe and S3 endpoints
- [ ] SSL certificates installed and configured

## Module-Specific Deployment

### Applications Module
```bash
# Enable feature flag
APPLICATIONS_E2E=true

# Test endpoints
curl -X POST /api/applications (should accept applications)
curl -X GET /api/applications?propertyId=X (landlord auth required)

# Verify email notifications work
# Check logs for: "✅ Landlord notification sent successfully"
```

### Payments Module (Stripe)
```bash
# Configure Stripe
STRIPE_CORE=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Test payment intent creation
curl -X POST /api/payments/intent (tenant auth required)

# Configure webhook endpoint in Stripe Dashboard:
# URL: https://yourdomain.com/api/webhooks/stripe
# Events: payment_intent.succeeded
```

### File Uploads (S3)
```bash
# Configure S3
S3_UPLOADS=true
AWS_ACCESS_KEY_ID=AKIA...
S3_BUCKET=your-production-bucket

# Test signed URL generation
curl -X POST /api/uploads/signed-url (auth required)

# Verify S3 bucket permissions:
# - API service can generate presigned URLs
# - Bucket allows PUT operations from presigned URLs
```

### Email Reminders
```bash
# Enable reminders worker
REMINDERS=true

# Verify worker starts
# Check logs for: "🔔 Reminders worker started"
# Check logs for: "🔔 Processing due reminders..." (every ~15 min)

# Test reminder creation (via database/admin panel)
# Verify email delivery
```

## CI/CD Pipeline Setup

### GitHub Actions
- [ ] Repository secrets configured:
  - `STAGING_DATABASE_URL`
  - `PRODUCTION_DATABASE_URL` 
  - Other environment variables as needed
- [ ] Pipeline runs on push to `main` (production) and `develop` (staging)
- [ ] Tests pass in CI environment
- [ ] Production deployment requires manual approval

### Deployment Commands
```bash
# Manual production deployment
git checkout main
git pull origin main
npm run install-all
cd server && npx prisma migrate deploy
npm run build
pm2 restart propertypulse-api

# Health check after deployment
curl https://yourdomain.com/health
curl https://yourdomain.com/health/detailed
```

## Backup Setup

### Database Backups
- [ ] Daily backup script configured (Windows Task Scheduler or cron)
- [ ] S3 backup bucket created and accessible
- [ ] Backup verification script runs weekly
- [ ] Retention policy implemented (30 days daily, 12 weeks weekly)

```bash
# Test backup process
scripts/backup-db.bat  # Windows
# OR
scripts/backup-db.sh   # Linux

# Verify backup uploaded to S3
aws s3 ls s3://your-backup-bucket/daily/
```

## Monitoring & Logging

### Error Tracking
- [ ] Sentry configured (optional but recommended)
- [ ] Log files writable in `logs/` directory
- [ ] Log rotation configured (5MB max, 5 files)

### Health Monitoring
```bash
# Set up monitoring for these endpoints:
GET /health                 # Basic health check
GET /health/detailed        # Database connectivity
GET /health/canary         # Feature status

# Expected responses should be HTTP 200 with JSON status
```

## Final Verification

### Smoke Tests
```bash
# Run comprehensive smoke tests
npm run test:smoke

# Test each major workflow:
# 1. User registration/login
# 2. Property listing
# 3. Application submission (if enabled)
# 4. Payment processing (if enabled)
# 5. File upload (if enabled)
```

### Performance Tests
- [ ] API response times < 2 seconds under normal load
- [ ] Database queries optimized (check slow query logs)
- [ ] File upload/download speeds acceptable
- [ ] Email delivery times < 30 seconds

### Security Verification
```bash
# Verify security headers
curl -I https://yourdomain.com/

# Test rate limiting
# Should get 429 after exceeding limits

# Verify no sensitive data in error responses
curl https://yourdomain.com/api/nonexistent
# Should not expose database details or stack traces
```

## Post-Deployment

### Immediate Actions (First 24 Hours)
- [ ] Monitor error logs for unusual activity
- [ ] Verify all cron jobs/scheduled tasks running
- [ ] Check email delivery rates
- [ ] Monitor database performance
- [ ] Verify SSL certificate auto-renewal

### Ongoing Monitoring
- [ ] Weekly backup verification
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Annual SSL certificate renewal (if not automated)

## Rollback Procedures

### Emergency Rollback
```bash
# 1. Switch to previous version
git checkout <previous-commit>
pm2 restart propertypulse-api

# 2. Restore database if needed (see backup-runbook.md)

# 3. Update DNS if necessary

# 4. Monitor for stability
```

## Support Contacts
- **Primary Developer**: [contact info]
- **Database Admin**: [contact info]
- **DevOps/Infrastructure**: [contact info]
- **Emergency Escalation**: [contact info]