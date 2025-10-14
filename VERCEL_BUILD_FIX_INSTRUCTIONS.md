# Vercel Build Fix Instructions

## Problem
Your Vercel builds are failing because the `DIRECT_DATABASE_URL` environment variable is missing, preventing Prisma from generating the client and causing all your code changes to not deploy.

## Solution

### Step 1: Add Missing Environment Variable to Vercel

1. Go to your Vercel dashboard: https://vercel.com
2. Select your `mattressaishopify` project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

```
Name: DIRECT_DATABASE_URL
Value: [Same as your DATABASE_URL]
```

**Important:** If your `DATABASE_URL` contains connection pooling parameters (like `pgbouncer=true` or `pooler=true`), the `DIRECT_DATABASE_URL` should be the **direct** connection string WITHOUT pooling.

**Example:**
- `DATABASE_URL`: `postgresql://user:pass@host:5432/db?pgbouncer=true&connect_timeout=10`
- `DIRECT_DATABASE_URL`: `postgresql://user:pass@host:5432/db?connect_timeout=10`

If you're using **Vercel Postgres**, you can find both URLs in your Vercel project's **Storage** tab.

5. Make sure to add it to **ALL environments** (Production, Preview, Development)

### Step 2: Push the Build Script Fix

Run the following commands to push the updated build script:

```bash
git add -A
git commit -m "Fix Vercel build script to work without db push"
git push origin main
```

### Step 3: Trigger a New Deployment

After pushing:
1. Go to your Vercel dashboard
2. Navigate to your project's **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Or wait for the automatic deployment to complete (usually 1-2 minutes)

### Step 4: Verify Deployment

1. Check that the deployment succeeds (green checkmark)
2. Click on the deployment to view the build logs
3. Look for "✅ Build complete!" in the logs
4. Visit your app: https://mattressaishopify.vercel.app

### Step 5: Clear Your Browser Cache

Once the deployment succeeds:
1. In your browser, open Developer Tools (F12)
2. Right-click the **Refresh** button
3. Select **"Empty Cache and Hard Reload"** (Chrome) or **"Hard Refresh"** (Firefox)
4. Or press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)

## Why This Happened

- Prisma requires `DIRECT_DATABASE_URL` for connection pooling with PostgreSQL
- The old build script tried to run `prisma db push` during build, which failed
- When builds fail, Vercel serves the last successful deployment (which is your old code)
- This is why none of your changes were visible

## What We Fixed

1. **Updated `package.json` build script** - Removed `prisma db push` from build (database schema is managed separately via migrations)
2. **Updated `vercel-build.sh`** - Simplified to just generate Prisma client and build Remix

## Next Steps After Deployment

Once your build succeeds, you should see:
- Auto-sync feature working (database and Shopify billing in sync)
- "Cancel Subscription" button for active subscriptions
- Proper subscription status display
- All the TitleBar console warnings fixed

If you still have issues after following these steps, check the Vercel deployment logs for any error messages.

