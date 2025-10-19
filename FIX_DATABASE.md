# Quick Fix: Add imageUrl Column

You're getting a redirect loop because the catalog page can't load without the column.

## FASTEST FIX (30 seconds):

### Option 1: Use Vercel Postgres Dashboard
1. Go to https://vercel.com/blakeaustin's-projects/mattressaishopify/stores
2. Click on your Postgres database
3. Click "Query" tab
4. Run this SQL:
```sql
ALTER TABLE "ProductProfile" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
```
5. Done! Refresh your app

### Option 2: Use node script locally
1. Make sure you have production DATABASE_URL in your environment
2. Run:
```bash
node scripts/add-imageurl-column.mjs
```

### Option 3: Use Vercel CLI
```bash
vercel env pull
node scripts/add-imageurl-column.mjs
```

---

## After Running the SQL:

1. **Hard refresh** your app (Cmd+Shift+R or Ctrl+Shift+R)
2. Go to Catalog Indexing - should work now!
3. Click "Re-Index Catalog"
4. Product images will be fetched and stored

---

## What This Does:

Adds one column to your database:
```sql
ALTER TABLE "ProductProfile" ADD COLUMN "imageUrl" TEXT;
```

That's it! Safe, simple, and reversible.

