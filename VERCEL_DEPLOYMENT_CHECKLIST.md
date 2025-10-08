# Vercel Deployment - Missing Database Fix

## Current Issue

Getting **400 Bad Request** when clicking upgrade buttons:
```
POST /app/admin/plans → 400 Bad Request
```

## Root Cause

The PostgreSQL database is **not configured** in Vercel yet. The app is trying to query the database but `DATABASE_URL` is either:
- ❌ Not set
- ❌ Set to placeholder value
- ❌ Pointing to invalid database

## Fix: Set Up PostgreSQL Database

### Step 1: Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Select your `mattressaishopify` project
3. Click **Storage** tab (left sidebar)
4. Click **Create Database** button
5. Select **Postgres** 
6. Choose region: **US East (iad1)** - same as your app
7. Click **Create**

**Wait 30 seconds** for database to provision.

### Step 2: Connect Database to Project

Vercel automatically creates these environment variables:
- `POSTGRES_URL` - Pooled connection (for high concurrency)
- `POSTGRES_URL_NON_POOLING` - Direct connection (for migrations)
- `POSTGRES_PRISMA_URL` - Optimized for Prisma
- `POSTGRES_URL_NO_SSL` - Without SSL

### Step 3: Map to Your App's Variables

Go to **Settings** → **Environment Variables** and add:

```
DATABASE_URL
Value: $POSTGRES_PRISMA_URL
Environment: Production, Preview, Development
```

```
DIRECT_DATABASE_URL
Value: $POSTGRES_URL_NON_POOLING
Environment: Production, Preview, Development
```

**Important**: Use the `$VARIABLE` syntax - Vercel will auto-populate the actual values.

### Step 4: Redeploy

After setting variables:
1. Go to **Deployments** tab
2. Click the latest deployment (top of list)
3. Click **"..."** menu → **Redeploy**
4. Make sure "Use existing Build Cache" is **OFF** (unchecked)
5. Click **Redeploy**

This will:
- ✅ Generate Prisma client with correct DB
- ✅ Push database schema (create tables)
- ✅ Seed billing plans
- ✅ Make billing upgrades work

---

## Alternative: Quick Test with Supabase

If you want to test immediately, use Supabase (free tier):

### 1. Create Supabase Project
- Go to https://supabase.com/dashboard
- Click **New Project**
- Name: `mattressai-prod`
- Database password: (save this!)
- Region: **US East**
- Click **Create Project** (wait 2 min)

### 2. Get Connection String
- Go to **Settings** → **Database**
- Find **Connection string** → **Prisma**
- Copy the connection pooling URL

### 3. Add to Vercel
Go to Vercel → Settings → Environment Variables:

```
DATABASE_URL
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

```
DIRECT_DATABASE_URL
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

Replace `[PROJECT-REF]` and `[PASSWORD]` with your values.

### 4. Redeploy
Same as above - go to Deployments and redeploy.

---

## Verify It's Working

### Check Deployment Logs
After redeploying, check the build logs:

```
✅ Should see:
✔ Generated Prisma Client
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

The database is now in sync with your schema.
```

```
❌ If you see:
Error: Environment variable not found: DATABASE_URL
```
→ Database variables not set correctly

### Check Server Logs
In Vercel:
1. Go to **Deployments**
2. Click latest **"Ready"** deployment
3. Click **Functions** tab
4. Find `/api/index` function
5. Click to see live logs

Look for database errors:
```
❌ Error: P1001: Can't reach database server
❌ Error: P1017: Server has closed the connection
```

### Test Billing Page
1. Open your app in Shopify admin
2. Go to Plans & Billing page
3. Click "Upgrade to Pro"
4. Should redirect to Shopify billing page (not 400 error!)

---

## Quick Checklist

Before testing billing:

- [ ] **Database Created** in Vercel or Supabase
- [ ] **DATABASE_URL** environment variable set
- [ ] **DIRECT_DATABASE_URL** environment variable set
- [ ] **Redeployed** with new variables
- [ ] **Deployment Status** = "Ready" (not "Error")
- [ ] **Build Logs** show Prisma migration success
- [ ] **Clear browser cache** before testing

---

## Common Errors & Fixes

### Error: "Invalid plan"
**Cause**: Plans not seeded in database  
**Fix**: Wait for deployment to complete - build script runs `prisma db push` which creates tables. Then you may need to manually seed:

```bash
# Run locally to seed production DB
DATABASE_URL="your-production-url" node scripts/seed-plans.mjs
```

### Error: "Failed to create subscription"
**Cause**: Shopify API error or admin GraphQL not working  
**Check**: 
- SHOPIFY_API_KEY is correct
- SHOPIFY_API_SECRET is correct
- App has billing scopes enabled

### Error: "Prisma Client could not be initialized"
**Cause**: Prisma client generated for wrong database  
**Fix**: Redeploy with "Use existing Build Cache" = OFF

---

## Environment Variables Needed

Make sure all these are set in Vercel:

### Database (Required)
```
DATABASE_URL=$POSTGRES_PRISMA_URL
DIRECT_DATABASE_URL=$POSTGRES_URL_NON_POOLING
```

### Shopify (Required)
```
SHOPIFY_API_KEY=6b1ed5786311fcaad075b3a7cc5f348e
SHOPIFY_API_SECRET=your-secret-from-partners-dashboard
SHOPIFY_APP_URL=mattressaishopify.vercel.app
```

### AI Services (Required)
```
OPENAI_API_KEY=your-openai-key
```

### Optional
```
ANTHROPIC_API_KEY=your-anthropic-key (if using Claude)
PINECONE_API_KEY=your-pinecone-key (for vector search)
```

---

## Status Check

Run this in your terminal to verify local setup:
```bash
node scripts/test-billing.js
```

All tests should pass locally. If they do but Vercel fails, it's definitely a database issue.

---

## Next Steps

1. **Create PostgreSQL database in Vercel** (5 minutes)
2. **Set environment variables** (2 minutes)
3. **Redeploy** (2 minutes)
4. **Test billing upgrade** (1 minute)

Total time: ~10 minutes to fix

---

## Need Help?

Check these in order:
1. Vercel Deployment Logs
2. Vercel Function Logs (Runtime logs)
3. Browser Console (Network tab → Response)
4. Server logs for specific errors

The 400 error will have a response body with more details about what failed.

