# 🔧 PostgreSQL Migration Deployment Guide

## What This Fixes

Your Shopify app is failing with:
```
MissingSessionTableError: Prisma session table does not exist
```

**Root Cause**: Original migrations were generated from SQLite (using `DATETIME`) but your production database is Supabase/PostgreSQL. The SQLite syntax migrations cannot run on PostgreSQL, so tables were never created.

**Solution**: A new PostgreSQL-compatible baseline migration that creates all tables using proper PostgreSQL syntax.

---

## 🚀 Quick Deployment (5 Minutes)

### Prerequisites

1. Access to your Supabase/PostgreSQL production database URL
2. Node.js and npm installed locally
3. Project cloned locally

### Step 1: Get Your Production Database URL

#### From Vercel Dashboard:
1. Go to https://vercel.com/
2. Navigate to your project
3. Click **Settings** → **Environment Variables**
4. Find and copy your `DATABASE_URL` (starts with `postgresql://`)

#### From Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)

### Step 2: Run the Migration

Open your terminal in the project directory and run:

```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Deploy the migration
npx prisma migrate deploy
```

**Or as a one-liner:**

```bash
DATABASE_URL="postgresql://user:password@host:5432/database" npx prisma migrate deploy
```

### Step 3: Verify Success

You should see output like:

```
✓ Applying migration `20251024020000_postgresql_baseline_migration`
✓ The following migrations have been applied:

migrations/
  └─ 20251024020000_postgresql_baseline_migration/
    └─ migration.sql

All migrations have been successfully applied.
```

---

## ✅ Verification Checklist

After running the migration, verify everything works:

### 1. Check Tables Exist

```bash
npx prisma db pull
```

If successful, you should see "Schema synced" with no changes.

### 2. Verify Session Table

Connect to your database and run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'Session';
```

Should return the `Session` table.

### 3. Test Your App

1. Visit your app URL: `https://your-app.vercel.app`
2. The app should load without the session table error
3. Try authenticating with Shopify (you may need to reinstall the app)

---

## 🔍 What This Migration Does

### Key Features

- ✅ **Safe & Idempotent**: Uses `CREATE TABLE IF NOT EXISTS`
- ✅ **Non-Destructive**: Won't drop existing tables or data
- ✅ **PostgreSQL Native**: Proper types (`TIMESTAMP`, `DOUBLE PRECISION`)
- ✅ **Complete Schema**: All 18 tables with indexes and constraints

### Tables Created

1. `Session` - Shopify authentication (THE CRITICAL ONE!)
2. `CustomerToken` - Customer auth tokens
3. `CodeVerifier` - OAuth code verifiers
4. `Conversation` - Chat conversations
5. `Message` - Chat messages
6. `CustomerAccountUrl` - Customer account URLs
7. `PromptVersion` - AI prompt versions
8. `IndexJob` - Product indexing jobs
9. `ProductProfile` - Enriched product data
10. `ChatSession` - Chat analytics
11. `Lead` - Lead capture data
12. `Alert` - Alert notifications
13. `Event` - Event tracking
14. `AlertSettings` - Alert configuration
15. `Experiment` - A/B test experiments
16. `Variant` - Experiment variants
17. `Tenant` - Shop/tenant data
18. `Plan` - Billing plans

---

## 🛡️ Safety Features

### Why This is Safe

1. **Idempotent**: Can run multiple times without breaking anything
2. **Conditional Creation**: Only creates tables/indexes that don't exist
3. **No Data Loss**: Doesn't drop or truncate any existing data
4. **Foreign Keys Protected**: Uses DO blocks to add constraints safely
5. **Index Protection**: Uses `IF NOT EXISTS` for all indexes

### What If Tables Already Exist?

No problem! The migration will:
- Skip existing tables
- Add any missing columns (none in this case)
- Create missing indexes only
- Leave all data intact

---

## 🚨 Troubleshooting

### Error: "relation already exists"

This is **expected and safe**! It means some tables already exist. The migration will skip those and create only what's missing.

### Error: "password authentication failed"

Your `DATABASE_URL` is incorrect. Double-check:
- Username and password are correct
- Host and port are correct (usually `:5432` for PostgreSQL)
- Database name is correct
- URL is properly encoded (special characters need encoding)

### Error: "SSL connection required"

Your Supabase database requires SSL. Update your URL:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Error: "permission denied"

Your database user doesn't have CREATE TABLE permissions. Contact your database admin or use a superuser connection string.

### Still Getting Session Table Error?

1. Verify the migration actually ran (check output)
2. Ensure you're using the correct DATABASE_URL
3. Check Vercel's environment variables match your local test
4. Restart your Vercel deployment after migration

---

## 🔄 Rollback Plan

### If Something Goes Wrong

The migration is designed to be safe, but if you need to rollback:

1. **Tables were created but app is broken:**
   ```sql
   -- Drop all tables (⚠️ THIS DELETES ALL DATA!)
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. **Want to start fresh:**
   ```bash
   # Reset migrations (local dev only!)
   npx prisma migrate reset
   
   # Then re-deploy
   npx prisma migrate deploy
   ```

### Backup Recommendation

Before running on production, back up your database:

```bash
# For Supabase
# Go to Dashboard → Settings → Backups → Create backup

# For other PostgreSQL
pg_dump $DATABASE_URL > backup.sql
```

---

## 📋 Post-Deployment Steps

### 1. Update Vercel Environment Variables

Ensure these are set in Vercel:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SHOPIFY_API_KEY` - Your Shopify API key
- `SHOPIFY_API_SECRET` - Your Shopify API secret
- `SCOPES` - Required Shopify scopes

### 2. Redeploy Your App

After the migration, trigger a new deployment:

```bash
vercel --prod
```

Or push to your main branch if auto-deployment is enabled.

### 3. Reinstall the App (If Needed)

If authentication still fails:
1. Go to your Shopify admin
2. Navigate to Apps
3. Uninstall your app
4. Reinstall it from your app URL

This creates fresh session tokens.

---

## 🎯 Expected Results

After successful deployment:

- ✅ No more "MissingSessionTableError"
- ✅ App loads without crashes
- ✅ Shopify authentication works
- ✅ Can access admin dashboard
- ✅ Product indexing works
- ✅ Chat widget functions properly
- ✅ Analytics and leads capture data

---

## 📞 Need Help?

### Check Deployment Logs

```bash
# Vercel logs
vercel logs

# Check database connection
npx prisma db pull
```

### Verify Migration Status

```bash
# See which migrations have been applied
npx prisma migrate status
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Session table doesn't exist | Re-run `npx prisma migrate deploy` |
| Authentication fails | Reinstall the app in Shopify |
| Wrong database | Verify `DATABASE_URL` points to production |
| SSL errors | Add `?sslmode=require` to connection string |
| Permission denied | Use admin/owner database credentials |

---

## ✨ Success Criteria

You'll know it worked when:

1. ✅ Migration command completes without errors
2. ✅ `npx prisma db pull` shows no schema changes
3. ✅ App loads at your production URL
4. ✅ No "MissingSessionTableError" in logs
5. ✅ Can authenticate with Shopify successfully

---

**Migration Created**: October 24, 2025  
**Migration ID**: `20251024020000_postgresql_baseline_migration`  
**Database**: Supabase (PostgreSQL)  
**Status**: Ready to deploy ✅

