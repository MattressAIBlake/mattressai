# 🔧 Fix Vercel DATABASE_URL

## The Real Problem

Your error shows:
```
Can't reach database server at `db.aptsjasxpdkcfvfagxfz.supabase.co:5432`
```

This means your **Vercel production DATABASE_URL is missing the SSL parameter** that Supabase requires.

---

## Quick Fix (2 Minutes)

### Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click your project: **mattressaishopify**
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Update DATABASE_URL

Find the `DATABASE_URL` variable for **Production** and update it to:

```
postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:5432/postgres?sslmode=require
```

**Important**: Make sure it includes `?sslmode=require` at the end!

### Step 3: Redeploy

After saving the environment variable:

**Option A - Via Dashboard:**
1. Go to **Deployments** tab
2. Click **...** on the latest deployment
3. Click **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. Click **Redeploy**

**Option B - Via CLI:**
```bash
vercel --prod --force
```

---

## Alternative: Use Connection Pooler

If the above doesn't work, try the connection pooler (port 6543):

```
postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:6543/postgres?pgbouncer=true
```

**Note**: Connection pooler is better for serverless environments like Vercel!

---

## Why This Fixes It

Supabase requires:
1. ✅ SSL connections (`?sslmode=require`)
2. ✅ Or connection pooler (port 6543)

Your current DATABASE_URL is missing this, so Vercel can't connect to the database.

---

## What to Do Right Now

### Via Vercel Dashboard (Easiest):

1. **Update DATABASE_URL**:
   - Go to Vercel → Settings → Environment Variables
   - Edit `DATABASE_URL` for Production
   - Change to: `postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:5432/postgres?sslmode=require`
   - Save

2. **Redeploy**:
   - Go to Deployments tab
   - Redeploy latest (without cache)

### Via CLI (Alternative):

```bash
# Add the correct DATABASE_URL
vercel env add DATABASE_URL production

# When prompted, paste this value:
# postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:5432/postgres?sslmode=require

# Then redeploy
vercel --prod --force
```

---

## Expected Result

After fixing and redeploying:
- ✅ App can connect to Supabase
- ✅ Session table is found
- ✅ No more "Can't reach database server" error
- ✅ No more "MissingSessionTableError"
- ✅ Authentication works

---

## If Still Having Issues

Try the connection pooler URL instead:

```
postgresql://postgres:qWF0UP9PucYcjBzr@db.aptsjasxpdkcfvfagxfz.supabase.co:6543/postgres?pgbouncer=true
```

Connection pooler is **recommended for Vercel** because:
- More stable for serverless
- Better connection management
- Fewer timeout issues

---

## Summary

**Problem**: DATABASE_URL missing SSL configuration  
**Solution**: Add `?sslmode=require` or use connection pooler  
**Time**: 2 minutes  
**Steps**:
1. Update DATABASE_URL in Vercel
2. Redeploy
3. Done! ✅

---

**Go to Vercel Dashboard now and update that DATABASE_URL!** 🚀

