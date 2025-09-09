# Operations Runbook

## Application Restart Procedures

### Standard API Restart
```bash
# Check current status
pm2 status propertypulse-api

# Graceful restart (zero downtime)
pm2 restart propertypulse-api

# Hard restart if needed
pm2 stop propertypulse-api
pm2 start propertypulse-api

# Check logs for startup confirmation
pm2 logs propertypulse-api --lines 50
```

### Full System Restart
```bash
# 1. Stop application
pm2 stop all

# 2. Update code (if needed)
git pull origin main
npm run install-all

# 3. Run migrations (if needed)
cd server && npx prisma migrate deploy

# 4. Restart services
pm2 restart all

# 5. Health check
curl http://localhost:5000/health
```

### Windows Service Restart
```batch
# If running as Windows service
net stop PropertyPulseAPI
net start PropertyPulseAPI

# Or via Task Manager > Services
# Find "PropertyPulse API" and restart
```

## Key Rotation Procedures

### JWT Secret Rotation
```bash
# 1. Generate new secret (32+ characters)
openssl rand -base64 32

# 2. Update .env file
JWT_SECRET=new_secret_here

# 3. Restart application
pm2 restart propertypulse-api

# 4. Monitor for authentication errors
pm2 logs propertypulse-api | grep "auth"
```

### Database Password Rotation
```bash
# 1. Update database password in PostgreSQL
# 2. Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:new_password@host:5432/database

# 3. Test connection
cd server && npx prisma db pull

# 4. Restart application
pm2 restart propertypulse-api
```

### Stripe Key Rotation
```bash
# 1. Generate new keys in Stripe Dashboard
# 2. Update .env file
STRIPE_SECRET_KEY=sk_live_new_key
STRIPE_WEBHOOK_SECRET=whsec_new_secret

# 3. Update webhook endpoint in Stripe Dashboard
# 4. Restart application
pm2 restart propertypulse-api

# 5. Test payment processing
curl -X POST /api/payments/intent (with valid auth)
```

### S3 Credentials Rotation
```bash
# 1. Create new IAM access keys in AWS
# 2. Update .env file
AWS_ACCESS_KEY_ID=AKIA_new_key
AWS_SECRET_ACCESS_KEY=new_secret_key

# 3. Test S3 access
aws s3 ls s3://your-bucket

# 4. Restart application
pm2 restart propertypulse-api

# 5. Test file uploads
curl -X POST /api/uploads/signed-url (with valid auth)

# 6. Delete old IAM keys after verification
```

## Webhook Failure Handling

### Stripe Webhook Issues

#### Troubleshoot Webhook Failures
```bash
# 1. Check webhook endpoint logs
pm2 logs propertypulse-api | grep "webhook"
pm2 logs propertypulse-api | grep "Stripe"

# 2. Check Stripe Dashboard webhook logs
# - Go to Developers > Webhooks
# - Check recent deliveries and response codes
# - Look for 4xx or 5xx errors

# 3. Common issues and fixes:
```

#### Webhook Signature Verification Failures
```bash
# Check webhook secret is correct
echo $STRIPE_WEBHOOK_SECRET

# Verify endpoint is receiving raw body
# Check server.js webhook route uses express.raw()

# Test webhook manually
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Stripe-Signature: test" \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_intent.succeeded"}'
```

#### Payment Status Not Updating
```bash
# 1. Check database for payment record
psql $DATABASE_URL -c "SELECT * FROM payments WHERE provider_intent_id = 'pi_xxx';"

# 2. Check webhook processing logs
pm2 logs propertypulse-api | grep "Payment marked as paid"

# 3. Manual payment status update (emergency)
psql $DATABASE_URL -c "UPDATE payments SET status = 'PAID', paid_date = NOW() WHERE provider_intent_id = 'pi_xxx';"
```

### Email Webhook/Delivery Issues
```bash
# Check SendGrid webhook status
curl -X GET "https://api.sendgrid.com/v3/user/webhooks/event/settings" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Check email delivery logs
pm2 logs propertypulse-api | grep "Email sent successfully"
pm2 logs propertypulse-api | grep "Email send failed"

# Test email service
node -e "
const { sendEmail } = require('./server/src/utils/email');
sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>Test message</p>'
}).then(console.log).catch(console.error);
"
```

## Log File Locations

### Application Logs
```bash
# PM2 logs
~/.pm2/logs/propertypulse-api-error.log
~/.pm2/logs/propertypulse-api-out.log

# Winston logs (if configured)
./logs/error.log
./logs/combined.log

# View logs in real-time
pm2 logs propertypulse-api --lines 100 --raw
tail -f logs/error.log
```

### System Logs
```bash
# Windows Event Logs
# Open Event Viewer > Windows Logs > Application
# Filter for PropertyPulse events

# Linux System Logs
/var/log/syslog
/var/log/messages
journalctl -u propertypulse-api
```

### Database Logs
```bash
# PostgreSQL logs (location varies by installation)
# Windows: C:\Program Files\PostgreSQL\14\data\log\
# Linux: /var/log/postgresql/

# View recent errors
tail -f /var/log/postgresql/postgresql-14-main.log | grep ERROR
```

## Performance Monitoring

### Key Metrics to Monitor
```bash
# CPU and Memory usage
pm2 monit

# Database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Response times
pm2 logs propertypulse-api | grep "Slow request"

# Error rates
pm2 logs propertypulse-api | grep "❌" | wc -l
```

### Performance Optimization
```bash
# Clear application cache (if using Redis)
redis-cli FLUSHALL

# Restart with fresh memory
pm2 restart propertypulse-api

# Database query optimization
# Check slow queries in PostgreSQL logs
# Consider adding indexes for frequently queried columns
```

## Backup & Recovery

### Emergency Database Backup
```bash
# Immediate backup before any risky operations
pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to safe location
aws s3 cp emergency_backup_*.sql s3://backup-bucket/emergency/
```

### Quick Recovery
```bash
# Restore from recent backup
aws s3 cp s3://backup-bucket/daily/latest.sql ./
psql $DATABASE_URL < latest.sql

# Run migrations if needed
cd server && npx prisma migrate deploy
```

## Troubleshooting Common Issues

### Application Won't Start
```bash
# 1. Check port availability
netstat -tulpn | grep :5000

# 2. Check environment variables
env | grep NODE_ENV
env | grep DATABASE_URL

# 3. Check database connectivity
cd server && npx prisma db pull

# 4. Check dependencies
npm ls --depth=0

# 5. Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Database Connection Errors
```bash
# 1. Test connection string
psql $DATABASE_URL -c "SELECT 1;"

# 2. Check database server status
pg_isready -h hostname -p 5432

# 3. Check connection limits
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# 4. Reset connections if needed
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'propertypulse' AND pid != pg_backend_pid();"
```

### Memory Issues
```bash
# Check memory usage
pm2 monit
free -h

# Restart with memory cleanup
pm2 restart propertypulse-api

# Enable memory monitoring
pm2 install pm2-server-monit
```

## Emergency Contacts

### Escalation Procedures
1. **Level 1**: Development team (response: 4 hours)
2. **Level 2**: Senior developer (response: 2 hours) 
3. **Level 3**: System administrator (response: 1 hour)
4. **Level 4**: Emergency on-call (response: 30 minutes)

### Contact Information
- **Development Team**: [email/slack channel]
- **Database Admin**: [email/phone]
- **System Admin**: [email/phone]
- **Emergency On-Call**: [phone number]

### Service Accounts & Access
- **Database**: [connection details]
- **Stripe Dashboard**: [login information]
- **AWS Console**: [access details]
- **SendGrid**: [account information]
- **Sentry**: [project URL]

---

**This runbook should be reviewed and updated quarterly. All team members should be familiar with these procedures.**