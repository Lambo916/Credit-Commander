# Vercel 404 Fix - Manual Steps Required

## ⚠️ Issue
The `vite.config.ts` file is protected from automated edits. You need to manually update it.

## ✅ Step 1: Update vite.config.ts

**Open `vite.config.ts` and replace ALL contents with:**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: 'client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: false
  }
});
```

**Key changes explained:**
- `plugins: [react()]` - Uses the already-installed @vitejs/plugin-react
- `root: 'client'` - Tells Vite where index.html lives (required!)
- `alias` - Fixes @ and @shared imports for proper resolution
- `outDir: '../dist/client'` - Outputs build to dist/client (relative to root)

## ✅ Step 2: Verify vercel.json (Already Updated)

The `vercel.json` has been configured for static SPA deployment:

```json
{
  "buildCommand": "npx vite build",
  "outputDirectory": "dist/client",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This configuration:
- Runs vite build from repo root (picks up vite.config.ts)
- Outputs to dist/client (configured in vite.config.ts)
- Routes all requests to index.html (SPA behavior)

## ✅ Step 3: Test Build Locally

```bash
npm run build
```

**Expected output:**
- ✅ Vite build completes successfully
- ✅ Creates `dist/client/index.html`
- ✅ Creates `dist/client/assets/` folder with JS/CSS

**If it fails:**
- Double-check vite.config.ts was updated correctly
- Ensure you copied the ENTIRE config (not just parts)

## ✅ Step 4: Commit and Push

```bash
git add vite.config.ts vercel.json
git commit -m "fix: update Vercel static build path and SPA routing"
git push origin main
```

Vercel will automatically redeploy when it detects the push to main branch.

## ✅ Step 5: Verify Deployment

Once Vercel finishes deploying (usually 1-2 minutes):

**Test these URLs:**
- ✅ https://compli.yourbizguru.com → Should load CompliPilot app
- ✅ https://compli.yourbizguru.com/any-route → Should load app (SPA routing)
- ✅ Refresh on any route → Should not 404

## 🔧 Troubleshooting

### Build fails with "Cannot find module @vitejs/plugin-react"
This package is already installed. Make sure you copied the vite.config.ts exactly as shown.

### 404 errors persist after deployment
- Check Vercel logs for build errors
- Verify outputDirectory in vercel.json is "dist/client"
- Ensure index.html exists in dist/client after build

### Blank page loads
- Check browser console for errors
- Verify assets are loading (check Network tab)
- Confirm environment variables are set in Vercel

---

**Once Step 1 is complete, the deployment will work correctly!**
