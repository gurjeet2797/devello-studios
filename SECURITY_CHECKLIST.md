# 🚨 SECURITY CHECKLIST - PRODUCTION DEPLOYMENT

## 🔴 CRITICAL - IMMEDIATE ACTION REQUIRED

### 1. **EXPOSED SECRETS - ROTATE IMMEDIATELY**

**⚠️ YOUR LIVE STRIPE KEYS ARE EXPOSED IN VERSION CONTROL**

- [ ] **ROTATE STRIPE KEYS IMMEDIATELY**
  - Go to Stripe Dashboard → Developers → API Keys
  - Revoke the exposed live secret key: `[REDACTED - Check git history if needed]`
  - Generate new live secret key
  - Update all environment variables

- [ ] **ROTATE SUPABASE KEYS**
  - Go to Supabase Dashboard → Settings → API
  - Regenerate service role key
  - Update environment variables

- [ ] **ROTATE API TOKENS**
  - Replicate: Generate new API token
  - Google: Generate new API key (if needed)

### 2. **ENVIRONMENT FILES - SECURE IMMEDIATELY**

- [ ] **Remove all .env files from git history**
  ```bash
  git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env*' --prune-empty --tag-name-filter cat -- --all
  git push origin --force --all
  ```

- [ ] **Verify .gitignore includes all sensitive files**
  - `.env*` files are now ignored
  - Backup files are ignored
  - Log files are ignored

- [ ] **Set up environment variables in Vercel**
  - Go to Vercel Dashboard → Project → Settings → Environment Variables
  - Add all required variables (see list below)

## 🟡 HIGH PRIORITY - FIX BEFORE PRODUCTION

### 3. **RATE LIMITING & ABUSE PROTECTION**

- [ ] **Enhanced rate limiting implemented**
  - Upload endpoints: 5 requests per minute
  - Auth endpoints: 10 requests per 5 minutes
  - General endpoints: 30 requests per 15 minutes
  - Progressive blocking for repeat offenders

- [ ] **File upload security**
  - File type validation
  - File size limits (50MB)
  - Image dimension validation
  - Malware scanning (in production)

### 4. **SECURITY HEADERS & CORS**

- [ ] **Security headers implemented**
  - Content Security Policy (CSP)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security
  - Permissions Policy

- [ ] **CORS properly configured**
  - Specific origins only (no wildcards)
  - Credentials properly handled
  - Methods and headers restricted

### 5. **AUTHENTICATION & AUTHORIZATION**

- [ ] **Supabase auth properly configured**
  - Email confirmation enabled
  - Password strength requirements
  - Session timeout configured
  - Rate limiting on auth endpoints

- [ ] **API route protection**
  - All sensitive routes require authentication
  - Proper token validation
  - Service role key only used server-side

## 🟢 MEDIUM PRIORITY - IMPLEMENT SOON

### 6. **MONITORING & LOGGING**

- [ ] **Error monitoring**
  - Set up Sentry or similar
  - Monitor for security events
  - Log rate limit violations

- [ ] **Audit logging**
  - Log all authentication events
  - Log file uploads
  - Log payment events

### 7. **DATA PROTECTION**

- [ ] **Database security**
  - Row Level Security (RLS) enabled
  - Proper user isolation
  - Backup encryption

- [ ] **File storage security**
  - Supabase storage properly configured
  - Access controls implemented
  - File cleanup policies

### 8. **PAYMENT SECURITY**

- [ ] **Stripe webhook verification**
  - Webhook signatures verified
  - Idempotency handled
  - Error handling implemented

- [ ] **Payment flow security**
  - No sensitive data in URLs
  - Proper error handling
  - Success/failure handling

## 📋 REQUIRED ENVIRONMENT VARIABLES

### Production Environment Variables (Vercel)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vajxcznjxrfdrheqetca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[NEW_SERVICE_ROLE_KEY]

# Stripe (ROTATE THESE!)
STRIPE_SECRET_KEY=[NEW_LIVE_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[NEW_LIVE_PUBLISHABLE_KEY]

# AI Services
REPLICATE_API_TOKEN=[NEW_REPLICATE_TOKEN]
GOOGLE_API_KEY=[NEW_GOOGLE_KEY]

# Database
DATABASE_URL=[YOUR_DATABASE_URL]

# Production
NODE_ENV=production
PRODUCTION_URL=https://your-domain.com
```

## 🔧 SECURITY IMPROVEMENTS IMPLEMENTED

### Rate Limiting
- ✅ Different limits for different endpoint types
- ✅ Progressive blocking for repeat offenders
- ✅ Upload-specific rate limiting
- ✅ Auth-specific rate limiting

### Security Headers
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security
- ✅ Permissions Policy

### File Upload Security
- ✅ File type validation
- ✅ File size limits
- ✅ Image dimension validation
- ✅ Malware scanning configuration

### CORS Configuration
- ✅ Specific origins only
- ✅ Proper credentials handling
- ✅ Restricted methods and headers

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All secrets rotated
- [ ] Environment variables set in Vercel
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Post-Deployment
- [ ] Test authentication flow
- [ ] Test file upload with rate limiting
- [ ] Test payment flow
- [ ] Monitor error logs
- [ ] Verify security headers

### Ongoing Monitoring
- [ ] Monitor rate limit violations
- [ ] Monitor authentication failures
- [ ] Monitor payment failures
- [ ] Regular security audits
- [ ] Keep dependencies updated

## 🆘 EMERGENCY CONTACTS

If you discover a security breach:

1. **Immediate Actions**
   - Rotate all exposed keys immediately
   - Check for unauthorized access
   - Monitor for suspicious activity

2. **Stripe Support**
   - Contact Stripe support if payment keys compromised
   - Monitor for unauthorized charges

3. **Supabase Support**
   - Contact Supabase support if database keys compromised
   - Check for unauthorized data access

4. **Legal Considerations**
   - Document the incident
   - Consider legal requirements for data breaches
   - Notify affected users if necessary

---

**⚠️ DO NOT DEPLOY TO PRODUCTION UNTIL ALL CRITICAL ITEMS ARE COMPLETED**
