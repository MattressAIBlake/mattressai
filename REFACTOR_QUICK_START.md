# Indexing Refactor - Quick Start Guide

## 🎯 What Was Done

Your indexing system has been completely refactored with:

1. ✅ **Critical Bug Fixes**
   - Fixed Prisma connection pool exhaustion
   - Fixed Shopify JSONL parsing bug
   - Centralized configuration
   - Standardized error handling

2. ✅ **Background Job Processing**
   - Added Inngest for serverless job queue
   - Jobs survive server restarts
   - Automatic 3x retries

3. ✅ **Production-Ready Features**
   - Structured JSON logging
   - Retry logic with exponential backoff
   - Performance tracking
   - Error categorization

---

## 🚀 Next Steps (5 Minutes)

### 1. Install Inngest

```bash
npm install inngest
```

### 2. Sign Up for Inngest (Free)

1. Go to https://www.inngest.com/
2. Sign up (free account is fine for your usage)
3. Create a new project
4. Go to "Keys" section
5. Copy your keys

### 3. Add Environment Variables to Vercel

In your Vercel project settings, add:

```env
INNGEST_EVENT_KEY=your_event_key_from_inngest
INNGEST_SIGNING_KEY=your_signing_key_from_inngest
```

### 4. Deploy

```bash
git add .
git commit -m "feat: refactor indexing system with Inngest and improved error handling"
git push origin main
```

Vercel will auto-deploy.

### 5. Register with Inngest

After deployment:
1. In Inngest Dashboard, go to your project
2. Click "Apps" → "Add App"
3. Enter your URL: `https://your-app.vercel.app/api/inngest`
4. Inngest will auto-discover your indexing function

---

## ✅ Testing

1. Go to your admin dashboard
2. Click "Re-Index Catalog"
3. Watch in Inngest Dashboard:
   - Job appears immediately
   - See real-time progress
   - View any retries or errors

---

## 📊 What You Get

### Before Refactor:
- ❌ Jobs lost on server restart
- ❌ Connection pool issues
- ❌ Parsing errors with Shopify data
- ❌ Poor error visibility
- ❌ No retry logic

### After Refactor:
- ✅ Jobs queued in Inngest (resilient)
- ✅ Single Prisma connection (no pool exhaustion)
- ✅ Correct JSONL parsing
- ✅ Structured logs with performance metrics
- ✅ Automatic retries (3x) with backoff
- ✅ Categorized errors (critical/batch/product)

---

## 📁 New Files Created

```
app/
├── db.server.ts                          # Prisma singleton
├── lib/
│   ├── config/
│   │   └── indexing.config.ts            # Centralized config
│   ├── errors/
│   │   └── indexing-errors.ts            # Error classes
│   ├── inngest/
│   │   ├── client.ts                     # Inngest client
│   │   └── functions/
│   │       └── indexing.ts               # Job definition
│   ├── logger.ts                         # Structured logging
│   └── utils/
│       └── retry.ts                      # Retry logic
└── routes/
    └── api.inngest/
        └── route.ts                      # Inngest webhook
```

---

## 🔧 Configuration

Edit `app/lib/config/indexing.config.ts` to tune:

- `PRODUCT_BATCH_SIZE`: How many products per batch (default: 50)
- `AI_CLASSIFICATION_BATCH_SIZE`: AI batch size (default: 15)
- `MAX_POLL_ATTEMPTS`: Shopify polling attempts (default: 60)
- And more...

---

## 📈 Monitoring

### Inngest Dashboard
- Real-time job status
- Retry history
- Error details
- Performance metrics

### Vercel Logs
- Structured JSON logs
- Performance timing
- Error categorization

Example log:
```json
{
  "level": "info",
  "message": "Indexing job completed",
  "jobId": "job-123",
  "duration_ms": 45000,
  "status": "completed",
  "processedProducts": 47,
  "failedProducts": 0
}
```

---

## 🆘 Troubleshooting

### "Module not found: inngest"
Run: `npm install inngest`

### Jobs not appearing in Inngest
1. Check environment variables are set in Vercel
2. Verify webhook URL is registered in Inngest
3. Check Vercel deployment logs

### Old code still running
Clear Vercel deployment cache or trigger new deploy

---

## 💰 Cost

**Inngest Free Tier:**
- 50,000 function runs/month
- Perfect for your 50-200 product catalogs
- Re-indexing once/day = ~30 runs/month

**No additional costs** for your current usage.

---

## 📞 Questions?

Check these files:
- `INDEXING_REFACTOR_COMPLETE.md` - Full technical details
- `indexing-system-refactoring.plan.md` - Original plan

---

**Ready to deploy!** 🚀

