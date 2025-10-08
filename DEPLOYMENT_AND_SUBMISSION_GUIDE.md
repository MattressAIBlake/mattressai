# Phase 5 Deployment & App Store Submission Guide

Complete step-by-step instructions for deploying Phase 5 features and submitting to Shopify App Store.

---

## Part 1: Git & Code Management

### Step 1: Commit Your Changes

```bash
# You're already on branch feat/phase-5-ux-billing-bfs
# Files are already staged

# Commit with descriptive message
git commit -m "feat: Phase 5 - Storefront UX + A/B Testing + BFS Compliance & Billing

✨ Features:
- A/B testing engine with variant assignment and statistical significance
- 3-tier billing (Starter/Pro/Enterprise) with Shopify integration
- Enhanced storefront widget with product comparison
- Accessibility improvements (WCAG AA compliant)
- BFS compliance: empty states, error boundaries, i18n

📊 New Models:
- Experiment, Variant, Tenant, Plan
- variantId tracking on ChatSession, Lead, Event

🎨 New Components:
- RecCard with fit scores and 'why it fits' bullets
- CompareDrawer for side-by-side comparison
- Stepper with progress indicators
- ErrorBoundary for graceful error handling

📝 Admin Routes:
- /admin/experiments - A/B test management
- /admin/plans - Billing & usage tracking

🚀 Ready for: Production deployment + App Store submission"
```

### Step 2: Push to Remote

```bash
# Push the branch
git push -u origin feat/phase-5-ux-billing-bfs
```

### Step 3: Create Pull Request (Optional but Recommended)

1. Go to your GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Select `feat/phase-5-ux-billing-bfs` as source branch
4. Add title: **"Phase 5: Storefront UX + A/B Testing + BFS & Billing"**
5. Copy contents from `PHASE5_SUMMARY.md` into PR description
6. Review changes in GitHub UI
7. If working solo, you can merge immediately or merge to main later

---

## Part 2: Database Migration

### Step 4: Apply Migrations to Development

```bash
# Make sure you're in the project directory
cd /Users/blakeaustin/Desktop/mattressaishopify

# Run migrations
npm run setup

# Or manually:
npx prisma migrate deploy
npx prisma generate
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.sqlite" at "file:dev.sqlite"

Applying migration `20251006201529_add_phase5_ab_testing_billing`

The following migration(s) have been applied:
...

✔ Generated Prisma Client
```

### Step 5: Seed Billing Plans

```bash
# Run the seed script
npx tsx app/lib/billing/seed-plans.ts

# Or if tsx is not installed:
node --loader ts-node/esm app/lib/billing/seed-plans.ts
```

**Expected Output:**
```
🌱 Seeding billing plans...
✅ Billing plans seeded successfully
```

**Verify in Database:**
```bash
# Open Prisma Studio to verify
npx prisma studio

# Navigate to:
# - Plan table (should have 3 records: starter, pro, enterprise)
# - Tenant table (should exist but may be empty until first install)
```

---

## Part 3: Local Testing

### Step 6: Start Development Server

```bash
# Start the app
npm run dev

# This will:
# - Start Remix in development mode
# - Start Shopify CLI tunnel
# - Give you a preview URL
```

**Expected Output:**
```
Using shopify.app.toml:
  └─ from: /Users/blakeaustin/Desktop/mattressaishopify

  Partners account: Your Account
  Organization:     Your Org
  App:              MattressAI

  Tunneling to: https://your-tunnel-url.trycloudflare.com

  Preview URL: https://partners.shopify.com/...
```

### Step 7: Test on Development Store

#### 7.1 Install App
1. Open the Preview URL from Step 6
2. Select your development store
3. Click "Install app"
4. Grant all permissions

#### 7.2 Test Billing Plans Page
1. Navigate to: `https://admin.shopify.com/store/YOUR_STORE/apps/mattressai/admin/plans`
2. Verify:
   - ✅ Current plan shows "Starter"
   - ✅ Trial days remaining displays
   - ✅ Usage bars render correctly
   - ✅ Plan comparison cards display
   - ✅ "Upgrade to Pro" button works (redirects to Shopify billing - will fail in dev, that's okay)

#### 7.3 Test A/B Testing
1. Navigate to: `/admin/experiments`
2. Click "Create Experiment"
3. Fill out form:
   - Name: "Test Prompt Variations"
   - Status: "Paused"
   - Variant 1: Control, 50%
   - Variant 2: Variant A, 50%
4. Verify:
   - ✅ Split validation (must sum to 100%)
   - ✅ Experiment appears in list
   - ✅ Can view detail page with metrics
   - ✅ Can pause/resume

#### 7.4 Test Storefront Widget
1. Activate the theme extension:
   - Go to `/admin/onboarding` (or similar setup page)
   - Click "Activate Storefront App Embed"
   - In Theme Editor, enable "MattressAI - Personal Shopper"
2. Visit your storefront
3. Verify:
   - ✅ Chat bubble appears (bottom right)
   - ✅ Clicking opens widget
   - ✅ Session starts and gets variant assignment (check browser console)

#### 7.5 Test Product Indexing
1. Navigate to: `/admin/catalog-indexing`
2. Click "Index Now" (use small catalog first)
3. Wait for completion
4. Test widget recommendations work

### Step 8: Run Accessibility Audit

```bash
# Install axe DevTools browser extension (if not already)
# Chrome: https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/

# Or use Lighthouse in Chrome DevTools
# 1. Open any admin page or storefront widget
# 2. Press F12 → Lighthouse tab
# 3. Select "Accessibility" category
# 4. Click "Generate report"
```

**Target Score:** 90+ (ideally 95+)

**Common Issues to Fix:**
- Color contrast ratios
- Missing ARIA labels
- Keyboard navigation problems
- Focus indicators

---

## Part 4: Production Deployment

### Step 9: Prepare Environment Variables

Create/update your production `.env` file:

```bash
# Copy your current .env as reference
cp .env .env.production.example

# Edit for production:
nano .env.production.example
```

**Required Variables:**
```bash
# Shopify
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_secret
SCOPES=write_products,read_customers,write_orders,etc

# Database (if using remote DB)
DATABASE_URL=your_production_database_url

# Anthropic
ANTHROPIC_API_KEY=your_production_key

# OpenAI (for embeddings)
OPENAI_API_KEY=your_production_key

# Pinecone (for vector store)
PINECONE_API_KEY=your_production_key
PINECONE_INDEX=your_production_index

# Billing (production values)
BILLING_ENABLED=true
BILLING_STARTER_PRICE=0
BILLING_PRO_PRICE=49
BILLING_ENTERPRISE_PRICE=199
BILLING_TRIAL_DAYS=14

# i18n
STOREFRONT_I18N_ENABLED=true

# Host (your production URL)
HOST=https://your-app.fly.dev
```

### Step 10: Deploy to Hosting Platform

#### Option A: Fly.io (Recommended for Remix)

```bash
# Install Fly CLI (if not already)
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize (first time only)
fly launch --name mattressai-shopify

# Deploy
fly deploy

# Set environment variables
fly secrets set SHOPIFY_API_KEY=xxx SHOPIFY_API_SECRET=xxx ANTHROPIC_API_KEY=xxx OPENAI_API_KEY=xxx PINECONE_API_KEY=xxx
```

#### Option B: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Set environment variables via Railway dashboard
```

#### Option C: Render

1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `npm install && npm run setup && npm run build`
   - **Start Command:** `npm run start`
   - **Environment:** Add all env vars from Step 9
5. Click "Create Web Service"

### Step 11: Deploy Extensions

```bash
# Deploy theme extensions to Shopify
npm run deploy

# This deploys:
# - mattressai-widget (theme app extension)
# - Any other extensions you have
```

**Expected Output:**
```
✔ Deployed extension to Shopify
Extension ID: 123456789
```

### Step 12: Run Production Migrations

**If using remote database:**

```bash
# SSH into your production server or use your platform's console

# Option 1: Fly.io
fly ssh console -a mattressai-shopify
npm run setup

# Option 2: Railway
railway run npm run setup

# Option 3: Render
# Use the Shell tab in Render dashboard
npm run setup
```

**If using SQLite (not recommended for production):**
- Ensure `prisma/dev.sqlite` is included in deployment
- Or switch to PostgreSQL for production

### Step 13: Seed Plans in Production

```bash
# Via your hosting platform's console:

# Fly.io
fly ssh console -a mattressai-shopify
npx tsx app/lib/billing/seed-plans.ts

# Railway
railway run npx tsx app/lib/billing/seed-plans.ts

# Render
# Use Shell tab
npx tsx app/lib/billing/seed-plans.ts
```

### Step 14: Update Shopify App URLs

1. Go to https://partners.shopify.com/
2. Navigate to: Apps → Your App → Configuration
3. Update URLs:
   - **App URL:** `https://your-production-url.fly.dev/`
   - **Allowed redirection URLs:** 
     - `https://your-production-url.fly.dev/auth`
     - `https://your-production-url.fly.dev/auth/callback`
     - `https://your-production-url.fly.dev/api/auth`
   - **App proxy:**
     - **Subpath prefix:** `apps`
     - **Subpath:** `mattressai`
     - **Proxy URL:** `https://your-production-url.fly.dev/apps/mattressai`
4. Click "Save"

---

## Part 5: App Store Submission Prep

### Step 15: Capture Screenshots

**Required Screenshots (at least 5):**

#### Screenshot 1: Prompt Builder
```
Navigate to: /admin/prompt-builder
Capture: Full page showing prompt configuration interface
Resolution: 1280x800 or higher
```

#### Screenshot 2: Catalog Indexing
```
Navigate to: /admin/catalog-indexing
Capture: Index job in progress with progress bar
Resolution: 1280x800 or higher
```

#### Screenshot 3: A/B Testing Experiments
```
Navigate to: /admin/experiments/[id]
Capture: Experiment metrics with variant performance
Resolution: 1280x800 or higher
```

#### Screenshot 4: Plans & Usage
```
Navigate to: /admin/plans
Capture: Usage dashboard with progress bars and plan comparison
Resolution: 1280x800 or higher
```

#### Screenshot 5: Storefront Widget
```
Visit storefront with widget open
Capture: Chat with product recommendations and "why it fits" bullets
Resolution: 1280x800 or higher (mobile: 375x667)
```

#### Screenshot 6: Product Comparison (Bonus)
```
Storefront: Open compare drawer with 2-3 products
Capture: Side-by-side comparison view
Resolution: 1280x800 or higher
```

**Tools to Use:**
- macOS: Cmd+Shift+4 (selection) or Cmd+Shift+3 (full screen)
- Chrome DevTools: Device toolbar for mobile screenshots
- Use annotation tool to highlight key features (optional)

### Step 16: Create Demo Video

**Recommended Tool:** Loom (https://www.loom.com/) or QuickTime Screen Recording

**Script (60-90 seconds):**

```
[0:00-0:10] Introduction
"Hi, I'm demonstrating MattressAI, an AI-powered shopping assistant for mattress stores."

[0:10-0:25] Admin - Prompt Builder
- Open /admin/prompt-builder
- Show configuring conversation flow
- Click "Activate" on a prompt version

[0:25-0:35] Admin - Indexing
- Open /admin/catalog-indexing
- Click "Index Now"
- Show progress bar (or pre-recorded completion)

[0:35-0:50] Storefront - Widget
- Visit storefront
- Open chat widget
- Type: "I need a mattress for side sleeping"
- Show AI response with recommendations
- Point out "why it fits" bullets and fit score

[0:50-1:00] Storefront - Compare & Add to Cart
- Click "Compare" on 2 products
- Open comparison drawer
- Click "Add to Cart" from comparison
- Show success feedback

[1:00-1:10] Admin - Leads & Analytics
- Open /admin/leads
- Show captured lead
- Open /admin/analytics-dashboard
- Show funnel metrics

[1:10-1:20] Closing
"MattressAI helps merchants convert browsers into buyers with personalized AI guidance."
```

**Export Settings:**
- Format: MP4
- Resolution: 1920x1080 or 1280x720
- Max size: 500MB
- Duration: 60-120 seconds

### Step 17: Prepare App Listing Content

Create a document with the following:

#### App Name
```
MattressAI - Personal Shopping Assistant
```

#### Tagline (50 chars max)
```
AI-powered mattress recommendations & guidance
```

#### Short Description (120 chars max)
```
Convert browsers into buyers with personalized AI recommendations, lead capture, and analytics for mattress stores.
```

#### Long Description (2000 chars max)

```
MattressAI transforms your mattress store into an intelligent shopping experience that guides customers to their perfect mattress.

🤖 AI-POWERED RECOMMENDATIONS
Our advanced AI analyzes customer preferences, sleep positions, and requirements to recommend the best mattresses from your catalog. Each recommendation includes:
- Personalized "why it fits" explanations
- Fit score (0-100%) based on customer needs
- Side-by-side product comparison
- Visual firmness indicators

📊 INTELLIGENT PROMPT BUILDER
Configure your AI assistant's conversation flow without coding:
- Guide customers through key questions
- Set recommendation rules based on your expertise
- A/B test different approaches
- Version control for prompts

🎯 LEAD CAPTURE & ANALYTICS
Never lose a potential customer:
- Capture emails and phone numbers with consent
- Intent scoring (0-100) for prioritization
- Real-time alerts for high-intent shoppers
- Comprehensive funnel analytics

🔍 AUTOMATED CATALOG INDEXING
Our smart indexing extracts mattress-specific attributes automatically:
- Firmness, height, materials
- Certifications and features
- Vector search for semantic matching
- Hybrid enrichment (mapping + heuristics + AI)

⚡ BUILT FOR PERFORMANCE
- Lightning-fast response times
- Mobile-optimized widget
- Accessible (WCAG AA compliant)
- Works with any Shopify theme

📈 A/B TESTING
Optimize your conversion rates:
- Test different prompts and strategies
- Statistical significance tracking
- Per-variant metrics (leads, carts, orders)
- One-click rollout of winners

💎 FLEXIBLE PRICING
- Starter: Free forever (perfect for small stores)
- Pro: Advanced features + SMS alerts
- Enterprise: White-glove support + priority indexing

PERFECT FOR:
✅ Mattress specialty stores
✅ Furniture stores with mattress sections
✅ Sleep wellness brands
✅ Any store with complex product selection

EASY SETUP:
1. Install the app
2. Activate the theme extension
3. Configure your AI assistant
4. Index your catalog
5. Start converting!

Try MattressAI risk-free with our 14-day trial.
```

#### Key Features (3-5 bullet points)
```
- AI-powered product recommendations with fit scores and personalized explanations
- Visual product comparison (up to 3 mattresses side-by-side)
- Lead capture with intent scoring and real-time alerts
- A/B testing for prompts and recommendation strategies
- Automated catalog indexing with mattress-specific enrichment
```

#### Support URL
```
https://your-website.com/support
# Or: mailto:support@your-domain.com
# Or: Your existing support portal URL
```

#### Privacy Policy URL
```
https://your-website.com/privacy
# Must be accessible without login
```

#### Pricing Details

**Starter Plan (Free):**
- Price: Free
- Best for: Stores with 0-75 unique visitors per day
- Features:
  - 100K AI tokens/month
  - 2 alerts/day
  - 10K vector queries/month
  - 2 concurrent indexing jobs
  - Email alerts
  - Basic analytics

**Pro Plan:**
- Price: $49/month
- Trial: 14 days
- Best for: Stores with 75-250 unique visitors per day
- Features:
  - 500K AI tokens/month
  - 50 alerts/day
  - 50K vector queries/month
  - 5 concurrent indexing jobs
  - SMS + Email alerts
  - Advanced analytics
  - A/B testing
  - Priority support

**Enterprise Plan:**
- Price: $199/month
- Trial: 14 days
- Best for: Stores with 250+ unique visitors per day
- Features:
  - 2M AI tokens/month
  - Unlimited alerts/day
  - 200K vector queries/month
  - Unlimited concurrent indexing jobs
  - All Pro features
  - Priority indexing
  - Dedicated support
  - Custom integrations

#### Categories
```
Primary: Sales and conversion optimization
Secondary: Customer support
Tags: AI, Recommendations, Personalization, Analytics
```

### Step 18: Test on Production Store

Before submitting, do a full test on production:

```bash
# Install your production app on a test store
# (Not your dev store - use a clean test store)

1. Go to: https://partners.shopify.com/[org]/apps/[app]/test
2. Click "Select store" → Choose test store
3. Complete installation
4. Run through entire flow:
   ✅ Activate theme extension
   ✅ Configure prompt builder
   ✅ Index products (small catalog)
   ✅ Test widget on storefront
   ✅ Capture a test lead
   ✅ View analytics
   ✅ Create A/B test
   ✅ Test billing upgrade (will create charge in test mode)
```

---

## Part 6: Shopify App Store Submission

### Step 19: Create App Listing

1. Go to: https://partners.shopify.com/
2. Navigate to: Apps → Your App → Distribution
3. Click "Create app listing"

### Step 20: Fill Out App Listing Form

#### Section 1: Basic Information
- **App name:** MattressAI - Personal Shopping Assistant
- **Tagline:** [From Step 17]
- **App icon:** Upload 1024x1024 PNG (create a professional logo)
- **Short description:** [From Step 17]
- **Long description:** [From Step 17]
- **Key features:** [From Step 17]

#### Section 2: Media
- **Screenshots:** Upload all 6 screenshots (at least 5 required)
- **Demo video:** Upload MP4 from Step 16
- **Order screenshots:** Drag to reorder (most important first)

#### Section 3: Pricing
- Click "Add pricing plan"
- **Plan 1 - Starter:**
  - Name: Starter
  - Price: Free
  - Trial: None
  - Features: [List from Step 17]
- **Plan 2 - Pro:**
  - Name: Pro
  - Price: $49.00 USD
  - Billing cycle: Every 30 days
  - Trial: 14 days
  - Features: [List from Step 17]
- **Plan 3 - Enterprise:**
  - Name: Enterprise
  - Price: $199.00 USD
  - Billing cycle: Every 30 days
  - Trial: 14 days
  - Features: [List from Step 17]

#### Section 4: Support
- **Support email:** support@your-domain.com
- **Support URL:** https://your-website.com/support
- **Privacy policy URL:** https://your-website.com/privacy
- **Support languages:** English (add others if available)

#### Section 5: Categories & Tags
- **Primary category:** Sales and conversion optimization
- **Additional category:** Customer support
- **Tags:** ai, recommendations, personalization, mattress, shopping assistant, lead capture, analytics

#### Section 6: Compliance
- ✅ Check "I confirm this app complies with Shopify's API Terms of Service"
- ✅ Check "I confirm this app is GDPR compliant" (you have webhooks implemented)
- ✅ Check "I confirm this app handles customer data securely"
- ✅ Check "I confirm app is accessible" (you've done accessibility testing)

### Step 21: App Submission Checklist (Built for Shopify)

Before submitting, verify:

#### Required Features
- ✅ App installs successfully
- ✅ All features work in production
- ✅ No console errors
- ✅ Mobile responsive (admin + storefront)
- ✅ Loads in < 3 seconds
- ✅ GDPR webhooks implemented
- ✅ Theme extension works with Dawn theme
- ✅ App proxy routes work
- ✅ Billing integration works (test mode verified)

#### UX Requirements
- ✅ Empty states on all pages
- ✅ Loading states for all async operations
- ✅ Error states with helpful messages
- ✅ Success confirmations
- ✅ Consistent UI (using Polaris)
- ✅ Clear navigation
- ✅ Help text / tooltips where needed

#### Performance
- ✅ No memory leaks
- ✅ Efficient database queries
- ✅ Proper indexes on database
- ✅ Rate limiting implemented
- ✅ Caching where appropriate

#### Security
- ✅ HTTPS only
- ✅ HMAC verification on webhooks
- ✅ JWT verification on admin routes
- ✅ Input validation
- ✅ SQL injection protection (using Prisma)
- ✅ XSS protection
- ✅ CSRF protection

#### Documentation
- ✅ Clear installation instructions
- ✅ Feature documentation
- ✅ Support contact info
- ✅ Privacy policy published
- ✅ Terms of service (optional but recommended)

### Step 22: Submit for Review

1. In Partners Dashboard → Apps → Your App → Distribution
2. Review all information one final time
3. Click **"Submit for review"**
4. Shopify will send confirmation email

**Review Timeline:**
- Initial review: 1-3 business days
- If changes requested: Address feedback and resubmit
- Average time to approval: 5-10 business days

---

## Part 7: Post-Submission

### Step 23: Monitor Review Status

Check status at: https://partners.shopify.com/[org]/apps/[app]/distribution

**Possible Statuses:**
- **In Review:** Shopify is testing your app
- **Changes Requested:** You need to address feedback
- **Approved:** Your app is live!
- **Rejected:** Major issues found (rare if you followed this guide)

### Step 24: If Changes Are Requested

Shopify will send an email with specific feedback. Common requests:

1. **UI/UX Issues:**
   - Add missing empty states
   - Improve error messages
   - Fix loading states

2. **Performance Issues:**
   - Optimize slow queries
   - Reduce bundle size
   - Fix memory leaks

3. **Compliance Issues:**
   - Add missing GDPR handling
   - Fix accessibility issues
   - Update privacy policy

**How to Address:**
1. Make required changes
2. Test thoroughly
3. Update version number in `package.json`
4. Deploy updated version
5. Reply to Shopify's email or resubmit in Partners Dashboard

### Step 25: After Approval

Once approved:

1. **App is Live:**
   - Appears in Shopify App Store
   - Merchants can install
   - Billing charges will go live

2. **Set Up Monitoring:**
   ```bash
   # Add error tracking (Sentry, LogRocket, etc.)
   npm install @sentry/remix
   
   # Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
   # Monitor your production URL
   ```

3. **Set Up Analytics:**
   - Track installations
   - Monitor uninstalls
   - Track revenue
   - Monitor performance

4. **Create Support System:**
   - Set up support email
   - Create help documentation
   - Set up ticketing system (optional)
   - Monitor Partners Dashboard for merchant feedback

5. **Marketing:**
   - Share on social media
   - Email your existing customers
   - Create landing page
   - Write blog post about launch

---

## Part 8: Maintenance & Updates

### Updating Your App Post-Launch

```bash
# 1. Create new feature branch
git checkout -b feat/new-feature

# 2. Make changes
# ... code changes ...

# 3. Test locally
npm run dev

# 4. Update version in package.json
# Bump version: 1.0.0 → 1.1.0 (minor) or 1.0.1 (patch)

# 5. Commit and push
git add .
git commit -m "feat: description of new feature"
git push origin feat/new-feature

# 6. Merge to main
git checkout main
git merge feat/new-feature
git push origin main

# 7. Deploy to production
fly deploy  # or your hosting platform

# 8. If updating app listing:
# Go to Partners → Apps → Your App → Distribution
# Update description, screenshots, etc.
# Click "Save" (no re-review needed for listing updates)

# 9. If changing app scope/permissions:
# This requires re-approval from Shopify
# Submit update for review
```

---

## Troubleshooting Common Issues

### Issue 1: Migrations Fail in Production

```bash
# Check database connection
fly ssh console -a mattressai-shopify
echo $DATABASE_URL

# Manually run migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

# If using SQLite, ensure file persists:
# Add volume in fly.toml:
# [mounts]
#   source = "data"
#   destination = "/app/prisma"
```

### Issue 2: App Proxy Not Working

**Symptoms:** 404 on `/apps/mattressai/*` routes

**Fix:**
1. Verify proxy configuration in Partners Dashboard
2. Ensure `verifyProxyHmac` is not failing (check logs)
3. Test with: `curl https://your-store.myshopify.com/apps/mattressai/session/start`

### Issue 3: Theme Extension Not Appearing

**Symptoms:** Widget doesn't show on storefront

**Fix:**
1. Verify extension is deployed: `npm run deploy`
2. Check if it's enabled in Theme Editor
3. Verify liquid syntax in `app-embed.liquid`
4. Check browser console for errors

### Issue 4: Billing Not Working

**Symptoms:** Upgrade button doesn't redirect

**Fix:**
1. Verify billing configuration in Partners Dashboard
2. Check if app is approved for billing (test mode vs live)
3. Ensure shop has payment method on file
4. Check billing webhook endpoint is accessible

### Issue 5: High Memory Usage

**Symptoms:** App crashes or slow performance

**Fix:**
```bash
# Identify memory leaks
fly logs -a mattressai-shopify | grep "memory"

# Optimize database queries (add indexes)
# Check for missing `.limit()` on queries
# Use connection pooling
# Implement caching (Redis)
```

---

## Support Resources

### Shopify Resources
- **Partners Dashboard:** https://partners.shopify.com/
- **App Submission Guide:** https://shopify.dev/docs/apps/launch/submit-for-review
- **Built for Shopify:** https://shopify.dev/docs/apps/launch/built-for-shopify
- **Polaris Design System:** https://polaris.shopify.com/
- **API Documentation:** https://shopify.dev/docs/api

### Community
- **Shopify Community Forums:** https://community.shopify.com/
- **Discord:** Shopify Partners Discord
- **Stack Overflow:** Tag `shopify-app`

### Tools
- **Ngrok (tunneling):** https://ngrok.com/
- **Fly.io (hosting):** https://fly.io/
- **Prisma (ORM):** https://www.prisma.io/
- **Remix (framework):** https://remix.run/

---

## Final Checklist

Before submitting, confirm:

- [ ] Code committed and pushed to `feat/phase-5-ux-billing-bfs`
- [ ] Migrations applied in production
- [ ] Billing plans seeded
- [ ] App tested on production test store
- [ ] All features working (experiments, billing, widget)
- [ ] Accessibility audit passed (90+ score)
- [ ] 5+ screenshots captured
- [ ] Demo video created (60-90 seconds)
- [ ] App listing content written
- [ ] Privacy policy published
- [ ] Support email set up
- [ ] Production URLs configured in Partners Dashboard
- [ ] GDPR webhooks tested
- [ ] Billing integration tested (test charges)
- [ ] App submitted for review
- [ ] Monitoring set up (errors, uptime)

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Git & Code Management | 30 min | Commit, push, PR |
| Database Migration | 15 min | Apply migrations, seed data |
| Local Testing | 2-4 hours | Thorough testing of all features |
| Production Deployment | 1-2 hours | Deploy, configure, test |
| Screenshot & Video | 1-2 hours | Capture and edit |
| App Listing Content | 1 hour | Write descriptions |
| Submission | 30 min | Fill out form, submit |
| **Total:** | **6-10 hours** | Can be split over multiple days |
| Shopify Review | 5-10 days | Wait for approval |

---

## Success! 🎉

Once approved, your app will be live in the Shopify App Store and merchants can start installing it.

**Next Steps After Launch:**
1. Monitor installations and uninstalls
2. Collect merchant feedback
3. Iterate on features based on usage data
4. Market your app to drive installations
5. Provide excellent support to build reviews

Good luck with your launch! 🚀


