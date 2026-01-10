# Google Workspace Email Support Prompt

Copy and paste this to Google AI support or Google Workspace support:

---

**Subject: One email address works, another doesn't on same domain**

I have a Google Workspace account for the domain `develloinc.com`. 

**Problem:**
- `sales@develloinc.com` - ✅ **WORKS** (can receive emails)
- `info@develloinc.com` - ❌ **NOT WORKING** (cannot receive emails)

Both addresses are on the same domain. Emails sent to `info@develloinc.com` are bouncing or not being delivered, while `sales@develloinc.com` receives emails normally.

**What I've checked:**
- DNS MX records are configured correctly (pointing to Google mail servers)
- Domain is verified in Google Workspace Admin
- `sales@develloinc.com` is receiving emails successfully

**Questions:**
1. Does the `info@develloinc.com` email address exist in my Google Workspace account?
2. If it exists, is it configured as a user account, alias, or group?
3. Could there be any routing rules or filters blocking emails to `info@develloinc.com`?
4. Are there any differences in how these two addresses are configured that would cause one to work and the other not?
5. What should I check in Google Workspace Admin Console to diagnose this?

**Domain:** develloinc.com
**Working email:** sales@develloinc.com
**Non-working email:** info@develloinc.com

Please help me identify why one email address works while the other doesn't on the same domain.

---
