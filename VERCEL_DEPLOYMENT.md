# Vercel Production Deployment Guide - Credit Commander

## Security Features Implemented

### ✅ Implemented in Code
1. **Anonymous Client ID System** - Browser-based client identification for report ownership
2. **HTML Sanitization** - XSS protection via sanitize-html library
3. **CORS Protection** - Configurable allowed origins for iframe embedding
4. **Ownership Enforcement** - Users can only access their own reports via client ID
5. **Production Error Handling** - Generic error messages, no stack traces
6. **IP-Based Rate Limiting** - 30 reports per tool per IP address (soft launch protection)

### ⚠️ Additional Rate Limiting (Optional)

**Option 1: Vercel Pro Plan (Recommended)**
- Vercel Pro includes built-in DDoS protection and rate limiting
- No code changes required
- Configured in Vercel dashboard

**Option 2: Upstash Rate Limit (Free Tier Available)**
```bash
npm install @upstash/ratelimit @upstash/redis
```

Add to `api/[...path].ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "1 m"),
});

// In handler:
const identifier = req.headers['x-forwarded-for'] || 'api';
const { success } = await ratelimit.limit(identifier);
if (!success) {
  return res.status(429).json({ error: 'Too many requests' });
}
```

---

## Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables):

```env
NODE_ENV=production
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]
OPENAI_API_KEY=sk-proj-...
SESSION_SECRET=your-random-secret-key
```

---

## CORS Configuration

Currently configured for development (permissive). For production, edit `server/routes.ts`:

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  /https:\/\/.*\.vercel\.app$/,  // Preview deployments
  // Add more domains here
];
```

---

## Deployment Checklist

### Before First Deploy
- [ ] Set all environment variables in Vercel dashboard
- [ ] Verify database connection string is correct
- [ ] Test OpenAI API key is valid
- [ ] Update CORS settings for your production domain
- [ ] Review rate limiting configuration (30 reports per IP)

### After Deploy
- [ ] Test credit roadmap generation in production
- [ ] Verify report save/load functionality works
- [ ] Test PDF export downloads correctly
- [ ] Monitor Vercel logs for errors
- [ ] Check OpenAI usage dashboard for unexpected spikes
- [ ] Verify rate limiting blocks after 30 reports

### Optional Production Enhancements
- [ ] Set up Vercel Analytics
- [ ] Configure custom domain SSL
- [ ] Add monitoring/alerting (e.g., Sentry)
- [ ] Implement additional rate limiting (Upstash or Vercel KV)
- [ ] Add request logging for security audits
- [ ] Set up database backups

---

## Testing Production Deployment

### 1. Test Credit Roadmap Generation
```bash
curl -X POST https://your-domain.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: test-client-123" \
  -d '{
    "tool": "creditcommander",
    "payload": {
      "projectName": "Test Business",
      "organizationType": "LLC",
      ...
    }
  }'
```

### 2. Test Report Listing
```bash
curl -H "X-Client-Id: test-client-123" \
  https://your-domain.vercel.app/api/reports/list?toolkit=creditcommander
```

### 3. Test Rate Limiting
- Generate 30 reports from same IP
- 31st request should return usage limit error
- Verify error message is user-friendly

---

## Security Notes

### ✅ What's Protected
- All report CRUD operations use client ID for ownership
- Users cannot access other users' reports (enforced by client ID)
- XSS attacks blocked via HTML sanitization
- CORS prevents unauthorized domains from calling API
- Generic error messages in production
- Rate limiting prevents abuse (30 reports per IP per tool)

### ⚠️ What Needs Additional Protection
- **Additional Rate Limiting**: Consider per-user quotas beyond IP-based limiting
- **API Abuse**: No request quotas per authenticated user (only IP-based)
- **OpenAI Costs**: Could spike if users generate many reports (monitor usage)

### 🔒 Database Security
- Client ID-based ownership enforcement
- Backward compatibility with legacy toolkit identifiers
- PostgreSQL connection pooling for performance
- Automatic migrations via Drizzle ORM

---

## Usage Tracking System

Credit Commander includes IP-based usage tracking:

```typescript
// 30 reports per tool per IP address
// Automatically tracked in usage_tracking table
// Prevents abuse during soft launch

// Check usage before generation
const usageCheck = await checkUsageLimit(req, 'creditcommander');
if (!usageCheck.allowed) {
  return res.status(429).json({ 
    error: "You've reached the maximum number of reports (30)..."
  });
}
```

---

## Troubleshooting

### "X-Client-Id header is required" errors
- Verify frontend is sending X-Client-Id header in all requests
- Check that browser is generating and storing client ID correctly
- Ensure client ID is consistent across requests

### CORS errors
- Verify your domain is in the allowed origins list
- Check that requests include proper headers
- Ensure iframe embedding domain is whitelisted

### Database connection errors
- Verify DATABASE_URL is correctly set in Vercel
- Check database is accessible from Vercel's servers
- Ensure connection string includes proper pooling parameters

### OpenAI API errors
- Verify OPENAI_API_KEY is set correctly
- Check OpenAI account has sufficient credits
- Monitor API usage in OpenAI dashboard

### Rate limiting not working
- Verify IP address detection is working (check logs)
- Ensure usage_tracking table exists in database
- Check that tool identifier matches ('creditcommander')

---

## Monitoring & Maintenance

### Key Metrics to Monitor
1. **OpenAI API Usage** - Track costs and request volume
2. **Database Size** - Monitor report storage growth
3. **Error Rates** - Watch for spikes in Vercel logs
4. **Response Times** - Ensure AI generation stays performant
5. **Rate Limit Hits** - Track how often users hit the 30-report cap

### Regular Maintenance
- Review and clean up old reports if needed
- Monitor OpenAI costs and adjust rate limits if necessary
- Update dependencies regularly for security patches
- Backup database regularly
- Review CORS configuration as domains change

---

## Custom Domain Setup

1. Add custom domain in Vercel dashboard
2. Update DNS records as instructed by Vercel
3. Wait for SSL certificate provisioning
4. Update CORS configuration to include new domain
5. Test all functionality on custom domain

---

## Rollback Procedure

If deployment has issues:

1. **Immediate**: Use Vercel dashboard to rollback to previous deployment
2. **Check logs**: Review Vercel logs to identify the issue
3. **Fix locally**: Test fix in Replit before redeploying
4. **Redeploy**: Push fix to GitHub, Vercel auto-deploys

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Neon Database**: https://neon.tech/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs

---

**Last Updated**: November 2025  
**Version**: Credit Commander 1.0.0
