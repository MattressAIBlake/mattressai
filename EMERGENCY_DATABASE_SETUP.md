# 🚨 EMERGENCY: Production Database Setup

## Critical Issue

Your production database is **completely empty** - no tables exist at all. This means:
- ❌ No Session table
- ❌ No ProductProfile table
- ❌ No IndexJob table
- ❌ Nothing!

## Why This Happened

You likely:
1. Changed your DATABASE_URL to a new database, OR
2. Never ran migrations on production, OR
3. The database was reset/recreated

## THE FIX (Takes 2 Minutes)

### Step 1: Get Your Production Database URL

Go to Vercel → Your Project → Settings → Environment Variables

Find and copy your **DATABASE_URL** (it looks like: `postgresql://user:pass@host/db`)

### Step 2: Run ALL Migrations

Open your terminal and run:

```bash
# Set the production database URL
export DATABASE_URL="paste-your-production-url-here"

# Deploy ALL migrations to create all tables
npx prisma migrate deploy
```

This will create:
- ✅ Session table (for Shopify auth)
- ✅ ProductProfile table (for indexed products)
- ✅ IndexJob table (for tracking jobs)
- ✅ All other required tables

### Step 3: Verify

After running, verify tables exist:

```bash
npx prisma db pull
```

You should see no changes if everything worked.

### Alternative: One-Line Fix

```bash
DATABASE_URL="your-url-here" npx prisma migrate deploy
```

## What This Does

Runs all 5 migration files:
1. `20251008130439_update_for_new_pricing` - Creates base tables
2. `20251013000000_add_billing_status` - Adds billing fields
3. `20251013115957_add_billing_status` - Updates billing
4. `20251019164828_add_product_image_url` - Adds imageUrl
5. `20251023234506_add_product_url_to_profile` - Adds productUrl
6. `20251024000500_add_price_to_product_profile` - Adds price

## After Migrations Complete

1. ✅ Dashboard will load
2. ✅ You can manage catalog
3. ✅ Indexing will work (after reinstalling app for auth)
4. ✅ Chat widget will work

## Security Note

⚠️ Make sure you're using the **production** DATABASE_URL, not development!

## Need Help?

If this doesn't work, check:
- Is the DATABASE_URL correct?
- Does the database exist?
- Do you have permissions to create tables?
- Is it a PostgreSQL database (not SQLite)?

---

**Run this NOW to unblock everything!** ⏰

