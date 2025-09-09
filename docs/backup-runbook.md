# Database Backup & Restore Runbook

## Daily Automated Backup

### Setup (Windows Task Scheduler)
1. Create batch script `scripts/backup-db.bat`:
```batch
@echo off
set BACKUP_DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%
set BACKUP_TIME=%time:~0,2%%time:~3,2%
set BACKUP_NAME=propertypulse_%BACKUP_DATE%_%BACKUP_TIME%.sql

pg_dump %DATABASE_URL% > backups/%BACKUP_NAME%
aws s3 cp backups/%BACKUP_NAME% s3://%S3_BACKUP_BUCKET%/daily/

echo Backup completed: %BACKUP_NAME%
```

2. Create Windows Task Scheduler entry:
   - **Program**: `scripts/backup-db.bat`
   - **Schedule**: Daily at 2:00 AM
   - **Run as**: Service account with DB access

### Manual Backup Commands
```bash
# Create timestamped backup
pg_dump $DATABASE_URL > backups/manual_$(date +%Y%m%d_%H%M).sql

# Upload to S3
aws s3 cp backups/manual_*.sql s3://$S3_BACKUP_BUCKET/manual/

# Compress large backups
gzip backups/manual_*.sql
aws s3 cp backups/manual_*.sql.gz s3://$S3_BACKUP_BUCKET/compressed/
```

## Restore Procedures

### Development Restore
```bash
# Download backup from S3
aws s3 cp s3://$S3_BACKUP_BUCKET/daily/propertypulse_YYYYMMDD_HHMM.sql ./

# Drop and recreate database
dropdb propertypulse_dev
createdb propertypulse_dev

# Restore data
psql propertypulse_dev < propertypulse_YYYYMMDD_HHMM.sql

# Run migrations if needed
cd server && npx prisma migrate deploy
```

### Production Restore (Emergency)
```bash
# 1. Stop application server
pm2 stop propertypulse-api

# 2. Create safety backup of current state
pg_dump $PRODUCTION_DATABASE_URL > emergency_current_$(date +%Y%m%d_%H%M).sql

# 3. Download restore file
aws s3 cp s3://$S3_BACKUP_BUCKET/daily/propertypulse_RESTORE_TARGET.sql ./

# 4. Restore database
psql $PRODUCTION_DATABASE_URL < propertypulse_RESTORE_TARGET.sql

# 5. Run migrations
cd server && npx prisma migrate deploy

# 6. Start application server
pm2 start propertypulse-api

# 7. Verify application health
curl http://localhost:5000/health
```

## Backup Verification

### Weekly Verification
```bash
# 1. Download recent backup
aws s3 cp s3://$S3_BACKUP_BUCKET/daily/propertypulse_YYYYMMDD_HHMM.sql ./

# 2. Restore to test database
dropdb propertypulse_test_restore
createdb propertypulse_test_restore
psql propertypulse_test_restore < propertypulse_YYYYMMDD_HHMM.sql

# 3. Run basic verification queries
psql propertypulse_test_restore -c "SELECT COUNT(*) FROM users;"
psql propertypulse_test_restore -c "SELECT COUNT(*) FROM properties;"
psql propertypulse_test_restore -c "SELECT COUNT(*) FROM applications;"

# 4. Cleanup test database
dropdb propertypulse_test_restore
```

### Monitoring & Alerts
- **Backup Size**: Monitor for unexpected size changes (>50% variation)
- **Backup Time**: Alert if backup takes >30 minutes
- **S3 Upload**: Verify successful upload with checksums
- **Missing Backups**: Alert if daily backup is missing by 6 AM

## Retention Policy
- **Daily backups**: Keep for 30 days
- **Weekly backups**: Keep for 12 weeks (first backup of each week)
- **Monthly backups**: Keep for 12 months (first backup of each month)
- **Yearly backups**: Keep indefinitely

## Recovery Time Objectives
- **Development**: 15 minutes
- **Staging**: 30 minutes  
- **Production**: 60 minutes (including verification)

## Emergency Contacts
- **DBA**: [contact info]
- **DevOps**: [contact info]
- **On-call**: [contact info]