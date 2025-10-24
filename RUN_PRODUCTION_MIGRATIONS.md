# Run Production Database Migrations

## Critical: Database Schema Out of Sync

Your production database is missing the `productUrl` and `price` columns that were added to the schema. This is causing the errors you're seeing.

## Quick Fix - Run Migrations on Production

### Option 1: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run migrations on production database
vercel env pull .env.production
npx prisma migrate deploy
```

### Option 2: Direct Database Connection

If you have direct access to your production PostgreSQL database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

### Option 3: Via Vercel Dashboard

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Copy your `DATABASE_URL`
4. Run locally:
   ```bash
   DATABASE_URL="your-copied-url" npx prisma migrate deploy
   ```

## What These Migrations Do

### Migration 1: `20251023234506_add_product_url_to_profile`
```sql
ALTER TABLE "ProductProfile" ADD COLUMN "productUrl" TEXT;
CREATE INDEX "ProductProfile_productUrl_idx" ON "ProductProfile"("productUrl");
```

### Migration 2: `20251024000500_add_price_to_product_profile`
```sql
ALTER TABLE "ProductProfile" ADD COLUMN "price" DOUBLE PRECISION;
```

## Verification

After running migrations, verify they worked:

```bash
# Check if columns exist
npx prisma db pull
```

The schema should now match your local `prisma/schema.prisma` file.

## About the Shopify Auth Error

The "Invalid API key or access token" error is separate and likely means:
1. The Shopify session expired
2. You need to reinstall the app on your store
3. The access token needs to be refreshed

To fix:
1. Go to your Shopify admin
2. Uninstall the app
3. Reinstall it from your development/production URL
4. This will create a fresh session with valid credentials

## After Migrations Complete

Once the database is updated:
1. The catalog management page will load properly
2. You can run indexing jobs
3. The price filtering will work correctly

---

**Status**: Migration files created and pushed to GitHub
**Next Step**: Run `npx prisma migrate deploy` with your production DATABASE_URL

