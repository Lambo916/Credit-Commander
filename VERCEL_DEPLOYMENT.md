# Vercel Production Deployment Guide

## Security Features Implemented

### ✅ Implemented in Code
1. **JWT Authentication** - All protected routes require valid Supabase JWT tokens
2. **HTML Sanitization** - XSS protection via sanitize-html library
3. **CORS Protection** - Locked to grant.yourbizguru.com and *.vercel.app
4. **Ownership Enforcement** - Users can only access their own reports
5. **Production Error Handling** - Generic error messages, no stack traces
6. **Row-Level Security** - Supabase RLS policies enforce user_id = auth.uid()

### ⚠️ Rate Limiting (Requires Additional Setup)

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

**Option 3: Vercel Edge Config + KV**
- Use Vercel KV for distributed rate limiting
- Requires Vercel Pro plan
- See: https://vercel.com/docs/storage/vercel-kv

---

## Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables):

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
```

---

## CORS Configuration

Currently configured for:
- `https://grant.yourbizguru.com` (production)
- `https://*.vercel.app` (preview deployments)

To modify, edit `api/[...path].ts`:
```typescript
const allowedOrigins = [
  'https://grant.yourbizguru.com',
  /https:\/\/.*\.vercel\.app$/,
  // Add more domains here
];
```

---

## Deployment Checklist

### Before First Deploy
- [ ] Set all environment variables in Vercel dashboard
- [ ] Verify Supabase RLS policies are active
- [ ] Test authentication with real Supabase user account
- [ ] Verify CORS settings match your domain
- [ ] Decide on rate limiting solution (see above)

### After Deploy
- [ ] Test authentication flow in production
- [ ] Verify CORS works from your domain
- [ ] Test report save/list/delete with real user
- [ ] Monitor Vercel logs for errors
- [ ] Check OpenAI usage dashboard for unexpected spikes

### Optional Production Enhancements
- [ ] Set up Vercel Analytics
- [ ] Configure custom domain SSL
- [ ] Add monitoring/alerting (e.g., Sentry)
- [ ] Implement rate limiting (Upstash or Vercel KV)
- [ ] Add request logging for security audits

---

## Testing Production Deployment

### 1. Test Authentication
```bash
# Get JWT token from Supabase (after user login in frontend)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://grant.yourbizguru.com/api/reports/list?toolkit=grantgenie
```

### 2. Test CORS
```javascript
// Should work from grant.yourbizguru.com
fetch('https://grant.yourbizguru.com/api/reports/list?toolkit=grantgenie', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
});

// Should fail from unauthorized origin
// Error: CORS policy blocked
```

### 3. Test Ownership Enforcement
- User A saves a report
- User B tries to access User A's report
- Expected: 404 Not Found (ownership check prevents access)

---

## Security Notes

### ✅ What's Protected
- All report CRUD operations require JWT authentication
- Users cannot access other users' reports (enforced in code + RLS)
- XSS attacks blocked via HTML sanitization
- CORS prevents unauthorized domains from calling API
- Generic error messages in production

### ⚠️ What Needs Additional Protection
- **Rate Limiting**: Not implemented at Vercel level (see options above)
- **API Abuse**: No request quotas per user (consider implementing)
- **OpenAI Costs**: Could spike if users generate many reports (add user quotas)

### 🔒 Database Security
Supabase RLS policies:
```sql
-- SELECT policy
CREATE POLICY "Users can view own reports"
ON compliance_reports FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own reports"
ON compliance_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete own reports"
ON compliance_reports FOR DELETE
USING (auth.uid() = user_id);
```

---

## Troubleshooting

### "Authentication required" in production
- Verify Supabase JWT token is being sent in Authorization header
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel
- Ensure frontend is sending `Bearer TOKEN` format

### CORS errors
- Verify origin is in allowedOrigins array
- Check that origin header matches exactly (https vs http)
- Ensure credentials: 'include' is set in frontend fetch

### "Report not found" when accessing own report
- Check that userId from JWT matches report.userId in database
- Verify RLS policies are not blocking access
- Check Supabase logs for policy violations

---

## Contact

For security issues or questions about this deployment:
- Review code: `api/[...path].ts`, `server/auth.ts`, `server/routes.ts`
- Check Vercel logs: https://vercel.com/[your-team]/[project]/logs
- Supabase Dashboard: https://supabase.com/dashboard/project/[PROJECT]
