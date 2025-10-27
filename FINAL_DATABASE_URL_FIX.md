# 🔴 CRITICAL: Final DATABASE_URL Fix

## The Problem

Your logs show:
```
Can't reach database server at `db.aptsjasxpdkcfvfagxfz.supabase.co:6543`
```

**Issue**: PgBouncer (port 6543) doesn't work with Prisma's session storage checks in transaction mode.

## The Fix

You need to use **DIRECT CONNECTION** with SSL, not the pooler:

### ❌ WRONG (what you have now):
```
postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:6543/postgres?pgbouncer=true
```

### ✅ CORRECT (use this instead):
```
postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:5432/postgres?sslmode=require&pool_timeout=0
```

## Why This Fixes It

1. **Port 5432** = Direct connection to PostgreSQL (not pooler)
2. **sslmode=require** = Required by Supabase
3. **pool_timeout=0** = Prevents connection timeout in Vercel serverless

## Update in Vercel NOW

1. Go to: https://vercel.com/blake-austins-projects/mattressaishopify/settings/environment-variables
2. Edit `DATABASE_URL` for **Production**
3. Change to:
   ```
   postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:5432/postgres?sslmode=require&pool_timeout=0
   ```
4. **Save**
5. **Redeploy** (without cache)

## Alternative: Use Supabase's Transaction Pooler URL

Or get the **Transaction Pooler URL** from Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Look for **Connection String** → **Transaction mode**
3. Copy that URL and use it as DATABASE_URL

It should look like:
```
postgresql://postgres.PROJECT_REF:qWF0UP9PucYcjBzr@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## This is NOT an App Bridge Issue

The errors you're seeing are **database connection errors**, not Shopify App Bridge errors. App Bridge errors would show:
- Toast messages
- UI-level errors
- Client-side issues

Your errors are:
- Server-side
- Database connection failures
- Prisma initialization errors

## Summary

**Problem**: Connection pooler (port 6543) with `pgbouncer=true` doesn't work with Prisma  
**Solution**: Use direct connection (port 5432) with `sslmode=require`  
**Action**: Update DATABASE_URL in Vercel and redeploy

---

**Do this NOW**: Update DATABASE_URL to port 5432 with sslmode=require! 🚀

