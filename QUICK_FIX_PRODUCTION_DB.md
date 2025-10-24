# 🚨 QUICK FIX: Production Database Setup

## The Problem

Your production database is PostgreSQL but migration files were created for SQLite. They won't work!

Error: `The table session does not exist in the current database`

## THE FIX (2 Commands)

### Option 1: Direct Schema Push (FASTEST - 30 seconds)

This pushes your schema directly without using migration files:

```bash
# Get your production DATABASE_URL from Vercel
# Then run:

DATABASE_URL="your-production-url" npx prisma db push --skip-generate

# Then mark migrations as resolved:
DATABASE_URL="your-production-url" npx prisma migrate resolve --applied "20251008130439_update_for_new_pricing"
DATABASE_URL="your-production-url" npx prisma migrate resolve --applied "20251013000000_add_billing_status"
DATABASE_URL="your-production-url" npx prisma migrate resolve --applied "20251013115957_add_billing_status"
DATABASE_URL="your-production-url" npx prisma migrate resolve --applied "20251019164828_add_product_image_url"
DATABASE_URL="your-production-url" npx prisma migrate resolve --applied "20251023234506_add_product_url_to_profile"
DATABASE_URL="your-production-url" npx prisma migrate resolve --applied "20251024000500_add_price_to_product_profile"
```

### Option 2: Reset and Migrate (Clean Slate)

⚠️ Only if Option 1 doesn't work and you're OK losing any data:

```bash
DATABASE_URL="your-production-url" npx prisma migrate reset --force
```

## After Running

Your database will have:
- ✅ All tables created
- ✅ All indexes created
- ✅ Schema synced with your code

Then:
1. Refresh your Vercel deployment (redeploy or wait for next push)
2. Dashboard will load
3. You can index products

## Get Your DATABASE_URL

1. Go to Vercel dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Find and copy **DATABASE_URL**

It looks like:
```
postgresql://user:password@host.postgres.database.azure.com/dbname
```

## Verification

After running, check it worked:

```bash
DATABASE_URL="your-production-url" npx prisma db pull
```

Should say "Your database is now in sync with your schema."

---

**Run Option 1 now** - takes 30 seconds! ⏱️

