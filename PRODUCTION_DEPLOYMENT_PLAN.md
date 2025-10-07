# MattressAI Production Deployment Plan
## Optimized for Vercel + Cloudflare + Firebase Stack

**Last Updated:** October 7, 2025  
**Status:** Ready to Deploy Phase 5

---

## 📋 Executive Summary

Based on your codebase analysis and existing infrastructure (Vercel, Cloudflare, Firebase), here's the optimal deployment strategy:

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                           │
│              (DNS + CDN + DDoS + SSL/TLS)                   │
└─────────────┬───────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                              │
│         (Remix App Backend + Serverless Functions)          │
│                                                             │
│  • Admin Panel (/admin/*)                                   │
│  • App Proxy Routes (/apps/mattressai/*)                   │
│  • Webhooks (/webhooks/*)                                   │
│  • Auth (/auth/*)                                           │
│  • API Routes                                               │
└─────────────┬───────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPPORTING SERVICES                       │
│                                                             │
│  PostgreSQL (Supabase/Neon)  │  Vector Store (Pinecone)    │
│  • Session data              │  • Product embeddings        │
│  • Leads & analytics         │  • Semantic search           │
│  • A/B experiments           │  • 99.9% uptime SLA          │
│  • Billing records           │                              │
│                              │                              │
│  AI Services                 │  Firebase (Optional)         │
│  • Anthropic Claude          │  • Real-time notifications   │
│  • OpenAI Embeddings         │  • Analytics backup          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Why This Stack?

### ✅ Vercel (Primary Backend)
**Best for:** Remix apps, global edge network, zero-config deployments

- **Native Remix Support:** Built-in optimizations
- **Serverless Functions:** Perfect for Shopify webhooks
- **Global CDN:** < 50ms response times worldwide
- **Auto-scaling:** Handles traffic spikes during sales
- **Git Integration:** Deploy on every push
- **You're already paying for it** ✅

**Limitations:**
- 10-second timeout on Hobby plan (60s on Pro)
- Need external database (SQLite won't work)

### ✅ Cloudflare (DNS + Security)
**Best for:** DDoS protection, caching, SSL management

- **Free SSL/TLS:** Automatic certificate management
- **DDoS Protection:** Unlimited mitigation
- **Caching:** Reduce origin requests by 60-80%
- **Firewall Rules:** Block malicious requests
- **Analytics:** Real-time traffic insights
- **You're already paying for it** ✅

### ✅ Firebase (Optional/Backup)
**Best for:** Real-time features, authentication, analytics

For this project, Firebase is **optional** but can be used for:
- Real-time lead notifications (alternative to polling)
- Analytics backup (redundancy)
- Admin mobile app (future)

**Verdict:** Not critical for Phase 5, but keep it ready for Phase 6+

### ⭐ NEW: Supabase or Neon (PostgreSQL)
**Required:** Production database to replace SQLite

**Supabase (Recommended):**
- Managed PostgreSQL with 500MB free
- Built-in connection pooling
- Real-time subscriptions (bonus!)
- Auto-backups
- Dashboard for debugging
- **Pricing:** Free → $25/month (Pro)

**Neon (Alternative):**
- Serverless PostgreSQL
- Auto-scaling storage
- Instant branching for testing
- **Pricing:** Free → $19/month

---

## 📦 What Needs to Be Deployed

### Current Status Analysis

| Component | Current State | Production Ready? | Action Needed |
|-----------|---------------|-------------------|---------------|
| **Remix Backend** | Local dev | ❌ No | Deploy to Vercel |
| **Database** | SQLite (dev.sqlite) | ❌ No | Migrate to PostgreSQL |
| **Theme Extension** | ✅ Deployed to Shopify | ✅ Yes | Already done! |
| **Environment Vars** | Local .env | ❌ No | Add to Vercel |
| **Shopify Config** | Partially updated | ⚠️ Partial | Fix URLs |
| **Migrations** | Local only | ❌ No | Run on production DB |
| **Billing Plans** | Local only | ❌ No | Seed production |

---

## 🚀 Step-by-Step Deployment Guide

### Phase 1: Database Setup (30 minutes)

#### Option A: Supabase (Recommended)

```bash
# 1. Create account at https://supabase.com/
# 2. Create new project: "mattressai-prod"
# 3. Wait 2 minutes for provisioning
# 4. Copy connection string from Settings → Database

# Format:
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# 5. Update your local .env (DON'T COMMIT)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# 6. Test connection
npx prisma db pull
```

#### Option B: Neon (Alternative)

```bash
# 1. Create account at https://neon.tech/
# 2. Create new project: "mattressai"
# 3. Copy connection string

# Format:
postgresql://[user]:[password]@[endpoint].neon.tech/mattressai

# 4. Update local .env
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/mattressai"
```

#### Update Prisma Schema

```bash
# Edit prisma/schema.prisma
```

Change from:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:dev.sqlite"
}
```

To:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Run Migrations

```bash
# Apply all migrations to production database
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify
npx prisma studio
# Should open browser with empty tables
```

---

### Phase 2: Vercel Deployment (45 minutes)

#### Step 1: Prepare Repository

```bash
# Commit database changes
git add prisma/schema.prisma
git commit -m "chore: migrate from SQLite to PostgreSQL"
git push origin main
```

#### Step 2: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New" → "Project"**
3. Import your GitHub repository: `MattressAIBlake/mattressai`
4. **Framework Preset:** Remix
5. **Root Directory:** `./` (default)
6. **Build Command:** `npm run build`
7. **Output Directory:** `build` (default)
8. **Install Command:** `npm install`

#### Step 3: Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

```bash
# Shopify
SHOPIFY_API_KEY=6b1ed5786311fcaad075b3a7cc5f348e
SHOPIFY_API_SECRET=your_actual_secret_here
SHOPIFY_APP_URL=https://your-project.vercel.app
SCOPES=read_customers,write_customers,read_inventory,read_orders,read_products,unauthenticated_read_product_listings

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# AI Services
ANTHROPIC_API_KEY=your_production_key
OPENAI_API_KEY=your_production_key

# Vector Store
PINECONE_API_KEY=your_production_key
PINECONE_INDEX=mattressai-prod

# Billing
BILLING_ENABLED=true
BILLING_STARTER_PRICE=0
BILLING_PRO_PRICE=49
BILLING_ENTERPRISE_PRICE=199
BILLING_TRIAL_DAYS=14

# Features
STOREFRONT_I18N_ENABLED=true
AB_TESTING_ENABLED=true

# URLs (update after first deploy)
HOST=https://your-project.vercel.app
```

**⚠️ Important:** Set all variables to **Production** environment

#### Step 4: Deploy

```bash
# Option 1: Deploy via Vercel Dashboard
# Click "Deploy" button

# Option 2: Deploy via CLI
npm install -g vercel
vercel login
vercel --prod

# Wait for deployment (2-3 minutes)
# Note your deployment URL: https://your-project.vercel.app
```

#### Step 5: Run Production Migrations

```bash
# SSH into Vercel (or use dashboard shell)
# This runs automatically on first deploy via package.json "build" script

# Verify manually:
vercel env pull .env.production
npx prisma migrate deploy

# Seed billing plans
npx tsx app/lib/billing/seed-plans.ts
```

**Expected Output:**
```
✅ Applied 11 migrations in 2.5s
🌱 Seeding billing plans...
✅ Billing plans seeded successfully
```

---

### Phase 3: Cloudflare Configuration (20 minutes)

#### Step 1: Add Domain

1. Go to https://dash.cloudflare.com/
2. Click **"Add a site"**
3. Enter your domain: `mattressai.app` (or your domain)
4. Select plan (Free is fine)
5. Update nameservers at your registrar

#### Step 2: Configure DNS

Add these DNS records:

```
Type    Name    Content                         Proxy
CNAME   @       your-project.vercel.app         ✅ Proxied
CNAME   www     your-project.vercel.app         ✅ Proxied
```

#### Step 3: SSL/TLS Settings

- **Encryption mode:** Full (strict)
- **Always Use HTTPS:** On
- **Minimum TLS Version:** 1.2
- **Automatic HTTPS Rewrites:** On

#### Step 4: Caching Rules

```
Rule 1: Cache Admin Panel
If URL Path contains "/admin/"
Then: Cache Level = Bypass

Rule 2: Cache Static Assets
If URL Path matches "^/assets/.*"
Then: Cache Level = Cache Everything, Edge TTL = 1 month

Rule 3: Cache Storefront Widget
If URL Path contains "/apps/mattressai/widget"
Then: Cache Level = Cache Everything, Edge TTL = 1 hour
```

#### Step 5: Firewall Rules (Recommended)

```
Rule 1: Block Bad Bots
If Known Bot = Bad Bot
Then: Challenge (Captcha)

Rule 2: Rate Limit API
If URL Path contains "/api/"
Then: Rate Limit = 100 requests/minute per IP
```

---

### Phase 4: Update Shopify Configuration (15 minutes)

#### Update shopify.app.toml

Replace the URLs with your actual production domain:

```toml
# /Users/blakeaustin/Desktop/mattressaishopify/shopify.app.toml

client_id = "6b1ed5786311fcaad075b3a7cc5f348e"
name = "MattressAI"
application_url = "https://mattressai.app"  # Your Cloudflare domain
embedded = true

[webhooks]
api_version = "2025-10"

  [[webhooks.subscriptions]]
  topics = ["products/update", "products/create", "products/delete", "orders/create", "orders/paid", "app/uninstalled", "app_subscriptions/update"]
  uri = "https://mattressai.app/webhooks"
  compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]

[access.admin]
direct_api_mode = "online"
embedded_app_direct_api_access = true

[access_scopes]
scopes = "read_customers,write_customers,read_inventory,read_orders,read_products,unauthenticated_read_product_listings,read_customer_events"

[auth]
redirect_urls = [
  "https://mattressai.app/auth/callback",
  "https://mattressai.app/api/auth",
  "http://localhost:5174/auth/callback"  # Keep for local dev
]

[app_proxy]
url = "https://mattressai.app"
subpath = "mattressai"  # CRITICAL: Changed from "proxy" to "mattressai"
prefix = "apps"
# This creates: shop.com/apps/mattressai/* → your-app/apps/mattressai/*
```

#### Deploy Updated Config

```bash
cd /Users/blakeaustin/Desktop/mattressaishopify

# Commit changes
git add shopify.app.toml
git commit -m "chore: update production URLs"
git push origin main

# Deploy to Shopify
shopify app deploy --force

# This updates:
# - Webhook endpoints
# - Auth redirect URLs
# - App proxy URL
# - Access scopes
```

#### Verify in Partners Dashboard

1. Go to https://partners.shopify.com/
2. Navigate to: Apps → MattressAI → Configuration
3. Verify:
   - ✅ App URL: `https://mattressai.app/`
   - ✅ Allowed redirection URLs: `https://mattressai.app/auth/callback`
   - ✅ App proxy: `apps/mattressai` → `https://mattressai.app`
   - ✅ Webhooks: All pointing to `https://mattressai.app/webhooks`

---

### Phase 5: Testing & Verification (30 minutes)

#### Test 1: Installation Flow

```bash
# 1. Install app on test store
# Go to: https://partners.shopify.com/[org]/apps/[app]/test
# Select a development store
# Click "Install"

# 2. Verify installation
# Should redirect to: https://mattressai.app/app
# Should see Polaris admin interface
# No console errors
```

#### Test 2: Database Operations

```bash
# Check if tables were created
npx prisma studio --url=$DATABASE_URL

# Should see:
# - Session table (with 1+ records from test install)
# - Plan table (with 3 records)
# - Empty: Experiment, Variant, Lead, ChatSession
```

#### Test 3: Admin Features

Visit these URLs and verify no errors:

- ✅ `/admin/plans` - Shows current plan (Starter)
- ✅ `/admin/prompt-builder` - Shows prompt interface
- ✅ `/admin/catalog-indexing` - Shows indexing UI
- ✅ `/admin/experiments` - Shows empty state
- ✅ `/admin/leads` - Shows empty state
- ✅ `/admin/analytics-dashboard` - Shows zero state

#### Test 4: Storefront Widget

```bash
# 1. Activate theme extension
# Go to: Online Store → Themes → Customize
# Click "App embeds" in left sidebar
# Enable "MattressAI Widget"
# Save

# 2. Visit storefront
# Open: https://your-test-store.myshopify.com/
# Should see chat bubble (bottom right)

# 3. Test chat
# Click bubble → Opens widget
# Type: "I need a mattress"
# Should get AI response (verify in Network tab)

# 4. Check logs
# Vercel: https://vercel.com/[project]/logs
# Should see: POST /apps/mattressai/session/start
```

#### Test 5: Webhooks

```bash
# Test product webhook
# 1. Go to Shopify Admin → Products
# 2. Edit any product
# 3. Save

# 4. Check Vercel logs
# Should see: POST /webhooks/products/update
# Status: 200

# 5. Check database
# Should see: Event record created
```

#### Test 6: Billing (Test Mode)

```bash
# 1. Navigate to: /admin/plans
# 2. Click "Upgrade to Pro"
# 3. Should redirect to Shopify billing page
# 4. Click "Approve charge"
# 5. Should redirect back to app
# 6. Verify: Current plan = Pro

# Note: This creates a TEST charge (not real money)
# Real charges only happen after App Store approval
```

---

## 🔐 Security Checklist

Before going live:

- [ ] All `.env` secrets stored in Vercel (not in code)
- [ ] Database has strong password (20+ chars, random)
- [ ] Cloudflare SSL is "Full (strict)"
- [ ] HMAC verification enabled on webhooks
- [ ] JWT verification on admin routes
- [ ] Rate limiting enabled (Cloudflare)
- [ ] Firewall rules active (Cloudflare)
- [ ] No API keys in client-side code
- [ ] CORS properly configured
- [ ] CSP headers set (Vercel)

---

## 📊 Performance Targets

| Metric | Target | How to Measure |
|--------|--------|---------------|
| **Admin Load Time** | < 2s | Lighthouse in Chrome DevTools |
| **Widget Load Time** | < 500ms | Network tab (widget.js) |
| **API Response Time** | < 300ms | Vercel logs |
| **Database Query Time** | < 50ms | Prisma Studio + Logs |
| **Uptime** | > 99.9% | UptimeRobot (free) |

---

## 🚨 Troubleshooting

### Issue: "App installation fails"

**Symptoms:** Error during install, or white screen

**Fix:**
```bash
# Check Vercel logs
vercel logs --follow

# Common causes:
# 1. DATABASE_URL not set → Add in Vercel dashboard
# 2. Migrations not run → Run: npx prisma migrate deploy
# 3. Invalid SHOPIFY_API_SECRET → Double-check in Partners dashboard
```

### Issue: "Widget not showing on storefront"

**Symptoms:** No chat bubble appears

**Fix:**
```bash
# 1. Verify theme extension is deployed
shopify app deploy

# 2. Check if enabled in theme editor
# Online Store → Themes → Customize → App embeds

# 3. Check app proxy is working
curl https://your-store.myshopify.com/apps/mattressai/session/start

# Should return JSON (not 404)
```

### Issue: "Webhooks failing"

**Symptoms:** 401 or 403 errors in Vercel logs

**Fix:**
```bash
# Verify HMAC signature verification
# Check app/lib/shopify/verifyWebhookHmac.ts

# Test webhook manually:
curl -X POST https://mattressai.app/webhooks/products/update \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: [signature]" \
  -d '{"id": 123}'

# Should return 200 (not 401)
```

### Issue: "High database latency"

**Symptoms:** Slow page loads, timeouts

**Fix:**
```bash
# 1. Check database connection pooling
# Add to DATABASE_URL: ?pgbouncer=true&connection_limit=10

# 2. Add indexes to frequently queried fields
# In schema.prisma, add @@index([field])

# 3. Use Prisma's connection pool
# Set in prisma/schema.prisma:
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
#   directUrl = env("DIRECT_DATABASE_URL")
# }
```

---

## 💰 Cost Estimate (Monthly)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro | $20 | Required for 60s timeout |
| **Supabase** | Pro | $25 | 8GB database, auto-backups |
| **Cloudflare** | Free | $0 | Unlimited DDoS, SSL included |
| **Pinecone** | Starter | $70 | 1 pod, 1M vectors |
| **Anthropic** | Usage | ~$50 | Estimated 500K tokens/month |
| **OpenAI** | Usage | ~$10 | Embeddings only |
| **Total** | | **$175/month** | Before revenue |

**Break-even:** 4 Pro customers or 1 Enterprise customer

---

## 🎯 Next Steps (After This Deployment)

1. **Set up monitoring:**
   - Vercel Analytics (built-in)
   - Sentry for error tracking
   - UptimeRobot for uptime monitoring

2. **Create support infrastructure:**
   - Support email: support@mattressai.app
   - Help docs (Notion or GitBook)
   - Privacy policy (required for App Store)

3. **Prepare App Store submission:**
   - Follow `DEPLOYMENT_AND_SUBMISSION_GUIDE.md`
   - Capture screenshots (5 minimum)
   - Record demo video (60-90 seconds)
   - Write app listing content

4. **Marketing setup:**
   - Landing page (mattressai.app)
   - Social media accounts
   - Email sequences for new users

---

## ✅ Deployment Checklist

Print this and check off as you go:

### Pre-Deployment
- [ ] Backup current SQLite database
- [ ] Create Supabase/Neon account
- [ ] Update prisma/schema.prisma to PostgreSQL
- [ ] Test migrations locally with new DB
- [ ] Commit all changes to GitHub

### Vercel Setup
- [ ] Create Vercel project
- [ ] Add all environment variables
- [ ] Deploy to production
- [ ] Verify deployment URL works
- [ ] Run migrations on production DB
- [ ] Seed billing plans

### Cloudflare Setup
- [ ] Add domain to Cloudflare
- [ ] Configure DNS records
- [ ] Enable SSL/TLS (Full strict)
- [ ] Set up caching rules
- [ ] Create firewall rules
- [ ] Verify domain resolves

### Shopify Configuration
- [ ] Update shopify.app.toml URLs
- [ ] Fix app_proxy subpath (mattressai)
- [ ] Deploy with `shopify app deploy`
- [ ] Verify in Partners Dashboard
- [ ] Test webhooks are receiving events

### Testing
- [ ] Install app on test store
- [ ] Test all admin pages
- [ ] Activate theme extension
- [ ] Test storefront widget
- [ ] Verify database operations
- [ ] Test billing flow (test mode)
- [ ] Check Vercel logs for errors
- [ ] Run Lighthouse audit (90+ score)

### Security
- [ ] Verify no secrets in GitHub
- [ ] Strong database password
- [ ] Cloudflare SSL active
- [ ] Rate limiting enabled
- [ ] Firewall rules active

### Documentation
- [ ] Update README with production URL
- [ ] Document any deployment quirks
- [ ] Create runbook for common issues
- [ ] Share credentials with team (1Password)

---

## 📞 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Cloudflare Docs:** https://developers.cloudflare.com/
- **Shopify Partners:** https://partners.shopify.com/
- **Remix Docs:** https://remix.run/docs

**Emergency Contacts:**
- Vercel Support: support@vercel.com (Pro plan = priority)
- Supabase Support: In-dashboard chat (Pro plan)
- Shopify Partners Support: https://partners.shopify.com/support

---

## 🎉 Success Criteria

You'll know deployment is successful when:

1. ✅ App installs on test store without errors
2. ✅ All admin pages load in < 2 seconds
3. ✅ Storefront widget appears and responds
4. ✅ Webhooks are being received (check logs)
5. ✅ Database queries are fast (< 50ms)
6. ✅ Billing upgrade flow works (test mode)
7. ✅ No errors in Vercel logs for 24 hours
8. ✅ Lighthouse score > 90 on admin pages
9. ✅ You can sleep soundly knowing it's stable 😴

---

**Ready to deploy?** Start with Phase 1 (Database Setup) and work through each phase sequentially. Budget 3-4 hours total.

Good luck! 🚀

