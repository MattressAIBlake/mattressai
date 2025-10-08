# Vercel Database Setup - URGENT FIX

## Issue
Vercel deployment is failing because `DATABASE_URL` is not set to a valid PostgreSQL connection string.

## Error
```
Error: the URL must start with the protocol `file:`.
  --> prisma/schema.prisma:7
 6 |   provider = "sqlite"
 7 |   url      = env("DATABASE_URL")
```

## Solution

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your `mattressaishopify` project
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a region (ideally same as your app - US East)
7. Click **Create**

### Step 2: Environment Variables Will Auto-Configure

Vercel will automatically set these variables:
- `POSTGRES_URL` - Connection pooling URL (use this for DATABASE_URL)
- `POSTGRES_URL_NON_POOLING` - Direct connection URL (use this for DIRECT_DATABASE_URL)
- `POSTGRES_PRISMA_URL` - Optimized for Prisma
- `POSTGRES_URL_NO_SSL` - Without SSL

### Step 3: Update Environment Variables in Vercel

Go to your project → Settings → Environment Variables and add/update:

```env
DATABASE_URL=$POSTGRES_PRISMA_URL
DIRECT_DATABASE_URL=$POSTGRES_URL_NON_POOLING
```

**OR** if those don't work, use:

```env
DATABASE_URL=$POSTGRES_URL
DIRECT_DATABASE_URL=$POSTGRES_URL_NON_POOLING
```

### Step 4: Redeploy

After setting up the database:
1. The environment variables are already configured
2. Just redeploy: Go to Deployments → click latest → Redeploy

## Alternative: Use Supabase

If you prefer Supabase (free tier available):

1. Go to https://supabase.com
2. Create a new project
3. Get the connection string from Settings → Database
4. Add to Vercel environment variables:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Quick Fix Command

Once you have the PostgreSQL URL:

```bash
# In Vercel dashboard, set:
vercel env add DATABASE_URL production
# Paste your PostgreSQL URL when prompted

vercel env add DIRECT_DATABASE_URL production
# Paste your direct PostgreSQL URL when prompted
```

## Local Development

For local development with SQLite, keep this in your `.env`:

```env
DATABASE_URL=file:./prisma/dev.sqlite
```

The schema now uses **PostgreSQL for production** (Vercel) and you can use **SQLite for local development** by keeping the file: URL in your local .env.

## Verify Setup

After configuring, your next deployment should succeed. Check the build logs for:

```
✔ Generated Prisma Client
✔ Database migration successful
```

## Files Changed

- ✅ `prisma/schema.prisma` - Changed back to PostgreSQL provider
- ✅ Vercel needs DATABASE_URL set to PostgreSQL connection string

## Next Deploy

```bash
git add -A
git commit -m "Fix: Restore PostgreSQL for Vercel production"
git push origin main
```

Vercel will auto-deploy and should succeed once DATABASE_URL is configured.

