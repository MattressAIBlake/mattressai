# Deployment Testing & Verification Guide

This guide ensures your deployments are always fresh and not suffering from cache issues at any layer.

## Understanding the Caching Layers

When deploying to Vercel and accessing via Shopify Admin, there are **5 caching layers**:

1. **Browser Cache** - Your local browser's cache
2. **Shopify Admin Cache** - Shopify's iframe cache  
3. **CDN Cache** - Vercel's Edge Network cache
4. **Vercel Build Cache** - Cached build artifacts on Vercel
5. **Server Memory** - Node.js runtime cache

## Pre-Deployment Checklist

### 1. Verify Local Build

```bash
# Clean and rebuild locally
rm -rf build/
npm run build

# Check that build completed successfully
ls -la build/client/assets/ | grep -i divider
```

### 2. Check Vercel Configuration

Ensure `vercel.json` has proper asset routing:
- ✅ `outputDirectory` points to `build/client`
- ✅ Asset routes are defined BEFORE catch-all route
- ✅ Cache headers are set for `/assets/*`

## Deployment Process

### Option A: Deploy via Git (Recommended)

```bash
# Make a change (or create empty commit)
git add .
git commit -m "Deploy: [describe changes]"
git push origin main

# Monitor deployment at vercel.com/dashboard
```

### Option B: Force Fresh Build

If you suspect Vercel is using cached builds:

```bash
# Create a cache-busting change
echo "# Deploy $(date +%s)" >> .vercel-rebuild
git add .vercel-rebuild
git commit -m "Force fresh build"
git push origin main
```

## Post-Deployment Verification

### Automated Verification

```bash
# Run the verification script
./scripts/verify-deployment.sh

# Or specify a different URL
./scripts/verify-deployment.sh https://your-preview-deployment.vercel.app
```

### Manual Verification Steps

#### Step 1: Check Health Endpoint

```bash
curl https://mattressaishopify.vercel.app/api/health | jq
```

Look for:
- `status: "ok"`
- `build.manifestExists: true`
- `build.sampleAssets` has recent file hashes

#### Step 2: Verify Asset Accessibility

Pick an asset from the health endpoint response and test:

```bash
# Example - use actual filename from health response
curl -I https://mattressaishopify.vercel.app/assets/Divider-CfiGoO6r.js

# Should return:
# HTTP/2 200 
# cache-control: public, max-age=31536000, immutable
```

If you get **404**, assets are not being served correctly. Check:
- Is `outputDirectory` set in `vercel.json`?
- Are asset routes defined before catch-all route?
- Did the build actually generate assets?

#### Step 3: Check Vercel Deployment Logs

1. Go to https://vercel.com/dashboard
2. Click on your project → **Deployments**
3. Click on the latest deployment
4. Check **Build Logs**:
   - ✅ `npm run build` completed successfully
   - ✅ Assets were generated (look for `.js`, `.css` files)
   - ✅ No errors during build

5. Check **Functions** tab:
   - ✅ `/api/index` exists
   - ✅ No cold start errors

## Clearing Caches (When Needed)

### 1. Clear Vercel Edge Cache

```bash
# This is automatic with new deployments
# Vercel invalidates edge cache on deploy
```

Or manually via Vercel Dashboard:
- Project → Settings → Advanced → **Purge Cache**

### 2. Clear Browser Cache

**Hard Refresh:**
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

**Or clear all site data:**
1. Open DevTools (F12)
2. Application tab → Storage → **Clear site data**

### 3. Clear Shopify Admin Cache

**Method 1: Reload the app**
- Close the MattressAI app tab in Shopify admin
- Navigate away, then back to Apps → MattressAI

**Method 2: Incognito window**
- Open Shopify admin in incognito/private window
- This bypasses all browser caches

**Method 3: Force reload via URL**
- Add `?nocache=true&t=[timestamp]` to the app URL
- Or append `&refresh=1` to any query string

### 4. Clear Vercel Build Cache

If Vercel keeps using stale builds:

**Via vercel.json** (already configured):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build/client"
}
```

**Via CLI:**
```bash
vercel --force
```

**Via Dashboard:**
- Project → Settings → General → **Reset Build Cache**

## Testing in Different Environments

### Test on Preview Deployments

Every PR and branch push creates a preview:

```bash
# Push to a branch
git checkout -b test-deployment
git push origin test-deployment

# Get preview URL from Vercel dashboard
# Test using that URL
./scripts/verify-deployment.sh https://your-preview.vercel.app
```

### Test Production Deployment

```bash
# After main branch is deployed
./scripts/verify-deployment.sh https://mattressaishopify.vercel.app

# Test in browser (with cache disabled)
# DevTools → Network → Disable cache checkbox
```

## Troubleshooting Common Issues

### Issue 1: Assets Return 404

**Symptoms:**
```
GET /assets/Divider-ABC123.js net::ERR_ABORTED 404
```

**Diagnosis:**
```bash
# Check if assets exist in build
ls -la build/client/assets/ | grep Divider

# Check if Vercel has outputDirectory set
grep outputDirectory vercel.json

# Check asset routing
grep -A 5 "routes" vercel.json
```

**Fix:**
1. Ensure `outputDirectory: "build/client"` in `vercel.json`
2. Ensure asset routes are defined before catch-all
3. Redeploy

### Issue 2: Old Asset Hashes Referenced

**Symptoms:**
```
GET /assets/Divider-OLDHASH.js 404
```

**Diagnosis:**
```bash
# Check server manifest
curl https://mattressaishopify.vercel.app/api/health | jq '.build.sampleAssets'

# Compare to local build
ls build/client/assets/ | grep Divider
```

**Fix:**
1. Clear browser cache completely
2. Close and reopen Shopify admin
3. If still failing, check Vercel is using latest deployment
4. Force redeploy if needed

### Issue 3: Vercel Using Cached Build

**Symptoms:**
- New code not appearing in production
- Asset hashes don't change between deploys
- Build time is suspiciously fast (< 30s)

**Diagnosis:**
```bash
# Check deployment logs on Vercel dashboard
# Look for "Using cached build" messages
```

**Fix:**
```bash
# Force fresh build
echo "# $(date)" >> .vercel-rebuild
git add .vercel-rebuild
git commit -m "Force rebuild"
git push origin main
```

### Issue 4: Remix Not Loading Correctly

**Symptoms:**
- App loads but is blank
- Console errors about missing modules
- Hydration errors

**Diagnosis:**
```bash
# Check if server build exists
curl https://mattressaishopify.vercel.app/api/health

# Check browser console for errors
```

**Fix:**
1. Ensure `api/index.js` imports correct server build
2. Check that `build/server/index.js` was generated
3. Verify no errors in Vercel function logs

## Best Practices

### 1. Always Test Locally First

```bash
npm run build
npm start
# Test on localhost:3000
```

### 2. Use Semantic Commit Messages

```bash
git commit -m "fix: correct asset serving in vercel config"
git commit -m "feat: add deployment verification endpoint"
```

### 3. Monitor Deployments

- Set up Vercel deployment notifications
- Check build logs after each deploy
- Run verification script after deployment

### 4. Use Preview Deployments

- Test on preview URL before merging to main
- Share preview URLs with team for testing

### 5. Document Changes

- Update this guide when deployment process changes
- Add notes about any cache-busting techniques used

## Quick Reference Commands

```bash
# Full deployment workflow
rm -rf build/
npm run build
git add .
git commit -m "Your message"
git push origin main

# Wait for Vercel deployment, then:
./scripts/verify-deployment.sh

# If verification passes:
# 1. Hard refresh browser (Cmd+Shift+R)
# 2. Reopen Shopify admin app
# 3. Test functionality

# If issues persist:
# Clear all caches and test in incognito window
```

## Additional Resources

- [Vercel Configuration Docs](https://vercel.com/docs/projects/project-configuration)
- [Remix on Vercel Guide](https://vercel.com/docs/frameworks/remix)
- [HTTP Caching Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

