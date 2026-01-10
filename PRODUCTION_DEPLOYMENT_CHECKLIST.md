# Production Deployment Checklist

## Pre-Deployment Checklist

### Environment Variables
- [ ] All required environment variables are set in production
- [ ] Database connection string is configured
- [ ] API keys (Replicate, Google, Stripe) are set
- [ ] Supabase configuration is complete
- [ ] Security secrets are generated and set

### Database
- [ ] Database migrations are up to date
- [ ] Database connection is tested
- [ ] Backup strategy is in place
- [ ] Database indexes are optimized

### Security
- [ ] All debug logging is disabled
- [ ] Error messages don't expose sensitive information
- [ ] File upload validation is enabled
- [ ] Rate limiting is configured
- [ ] CORS settings are properly configured

### Performance
- [ ] Image compression is optimized
- [ ] File size limits are appropriate
- [ ] API timeouts are configured
- [ ] Caching strategy is implemented
- [ ] CDN is configured (if applicable)

### Monitoring
- [ ] Error tracking is set up (Sentry)
- [ ] Performance monitoring is enabled
- [ ] Log aggregation is configured
- [ ] Health check endpoints are working

## Deployment Steps

### 1. Database Setup
```bash
# Run migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db push --preview-feature
```

### 2. Environment Configuration
```bash
# Copy production template
cp .env.production.template .env.production

# Fill in actual values
# Deploy to your hosting platform (Vercel, etc.)
```

### 3. Build and Deploy
```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy to hosting platform
# (Follow your platform's deployment instructions)
```

### 4. Post-Deployment Verification
- [ ] Home page loads correctly
- [ ] User authentication works
- [ ] Image upload functionality works
- [ ] AI processing endpoints respond
- [ ] Database operations work
- [ ] Error handling is working
- [ ] Performance is acceptable

## Production-Specific Features

### Logging
- Production uses error-level logging only
- Sensitive information is not logged
- Logs are aggregated for monitoring

### Security
- File uploads are scanned for malware
- Image dimensions are validated
- Session timeouts are shorter
- Login attempts are limited

### Performance
- File size limits are reduced (25MB vs 50MB)
- Image compression is optimized
- API timeouts are longer for reliability
- Polling intervals are optimized

### Error Handling
- Generic error messages for users
- Detailed errors logged for debugging
- Graceful degradation for service failures

## Monitoring and Maintenance

### Regular Checks
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify API response times
- [ ] Monitor file storage usage
- [ ] Check authentication metrics

### Updates
- [ ] Keep dependencies updated
- [ ] Monitor security advisories
- [ ] Test new features in staging
- [ ] Backup database before updates

## Rollback Plan
- [ ] Database backup is available
- [ ] Previous version is tagged
- [ ] Rollback procedure is documented
- [ ] Team knows how to execute rollback

## Support
- [ ] Error tracking alerts are configured
- [ ] Support contact information is available
- [ ] Documentation is up to date
- [ ] Team has access to production systems
