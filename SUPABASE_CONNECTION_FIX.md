# 🔴 CRITICAL: Supabase Connection Fix for Vercel

## The Real Problem

Vercel serverless functions **cannot reach Supabase's direct connection** (port 5432). This is a known limitation.

You must use Supabase's **Transaction Mode Pooler** for serverless environments like Vercel.

---

## Get the Correct Connection Strings from Supabase

### Step 1: Go to Supabase Dashboard

1. Log in to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**

### Step 2: Find Transaction Pooler Connection String

Look for **Connection string** section, then find:

**"Transaction" mode** (NOT "Session" mode)

It should look like:
```
postgresql://postgres.[PROJECT-REF]:YOUR_PASSWORD@aws-0-[region].pooler.supabase.com:6543/postgres
```

**This is different from your direct connection URL!**

### Step 3: Copy BOTH URLs

You need TWO connection strings:

1. **Transaction Pooler URL** (for DATABASE_URL)
2. **Session Pooler URL** (for DIRECT_DATABASE_URL) - Optional, or use the same

---

## Update Vercel Environment Variables

### Option 1: Use Transaction Pooler for Both

```bash
# Set DATABASE_URL (Transaction mode)
vercel env add DATABASE_URL production
# When prompted, paste the Transaction pooler URL from Supabase

# Set DIRECT_DATABASE_URL (same URL)
vercel env add DIRECT_DATABASE_URL production  
# When prompted, paste the same Transaction pooler URL
```

### Option 2: Manual via Dashboard

1. Go to: https://vercel.com/blake-austins-projects/mattressaishopify/settings/environment-variables

2. **DATABASE_URL** → Set to Transaction pooler URL from Supabase

3. **DIRECT_DATABASE_URL** → Set to the same Transaction pooler URL

4. **Save**

5. **Redeploy** without cache

---

## Why Port 5432 Doesn't Work

Supabase's direct connection (port 5432) is **not accessible** from:
- Vercel serverless functions
- Most serverless platforms (Netlify, AWS Lambda, etc.)
- Dynamic IP addresses

You MUST use:
- Port **6543** (Connection Pooler)
- Transaction mode (not session mode)
- Proper pooler URL format

---

## Expected URLs

### ❌ WRONG (what you have):
```
postgresql://postgres:password@db.aptsjasxpdkcfvfagxfz.supabase.co:5432/postgres
```
This won't work from Vercel!

### ✅ CORRECT (what you need):
```
postgresql://postgres.[project-ref]:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```
Transaction pooler - works from Vercel!

---

## Action Required

1. **Log in to Supabase Dashboard NOW**
2. **Copy the Transaction Mode connection string**
3. **Update BOTH env vars in Vercel**
4. **Redeploy**

Without the proper pooler URL, Vercel will never be able to connect to your database.

---

**This is the final fix - port 5432 is simply not accessible from Vercel with Supabase!** 🚀

