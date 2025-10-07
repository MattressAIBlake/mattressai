# Quick Start Checklist - Phase 5 Deployment

Use this checklist to track your progress through deployment and submission.

## 🚀 Immediate Actions (Today)

### Git & Code
- [ ] Commit changes: `git commit -m "feat: Phase 5..."`
- [ ] Push branch: `git push -u origin feat/phase-5-ux-billing-bfs`
- [ ] (Optional) Create GitHub PR

### Database
- [ ] Run migrations: `npm run setup`
- [ ] Seed plans: `npx tsx app/lib/billing/seed-plans.ts`
- [ ] Verify in Prisma Studio: `npx prisma studio`

### Local Testing (2-4 hours)
- [ ] Start dev server: `npm run dev`
- [ ] Test billing page: `/admin/plans`
- [ ] Create test experiment: `/admin/experiments/new`
- [ ] Test widget on dev storefront
- [ ] Run accessibility audit (Chrome Lighthouse)

## 🌐 Production Deployment (1-2 hours)

### Deploy
- [ ] Choose hosting: Fly.io / Railway / Render
- [ ] Set up environment variables
- [ ] Deploy app: `fly deploy` (or equivalent)
- [ ] Deploy extensions: `npm run deploy`

### Configure
- [ ] Run production migrations
- [ ] Seed production plans
- [ ] Update Shopify URLs in Partners Dashboard
- [ ] Test on clean test store (not dev store)

## 📸 App Store Prep (2-3 hours)

### Screenshots (need 5-6)
- [ ] 1. Prompt Builder (`/admin/prompt-builder`)
- [ ] 2. Catalog Indexing (`/admin/catalog-indexing`)
- [ ] 3. Experiments (`/admin/experiments/:id`)
- [ ] 4. Plans & Usage (`/admin/plans`)
- [ ] 5. Storefront Widget (with recommendations)
- [ ] 6. Product Comparison (compare drawer)

### Video
- [ ] Record 60-90 second demo (Loom/QuickTime)
- [ ] Show: Admin setup → Storefront chat → Add to cart
- [ ] Export as MP4 (1920x1080, <500MB)

### Content
- [ ] Write/copy long description (from guide)
- [ ] Prepare key features list
- [ ] Set up support email
- [ ] Publish privacy policy URL
- [ ] List pricing plans with features

## 📝 Submission (30 min)

- [ ] Go to Partners → Apps → Distribution
- [ ] Click "Create app listing"
- [ ] Fill out all sections
- [ ] Upload screenshots and video
- [ ] Configure pricing plans
- [ ] Add support URLs
- [ ] Check all compliance boxes
- [ ] Submit for review

## ⏰ Wait for Review (5-10 days)

- [ ] Monitor Partners Dashboard for status
- [ ] Check email for Shopify feedback
- [ ] Address any change requests if needed

## 🎉 Post-Approval

- [ ] Set up error monitoring (Sentry)
- [ ] Set up uptime monitoring
- [ ] Create support documentation
- [ ] Announce launch
- [ ] Monitor installations and feedback

---

## Quick Commands Reference

```bash
# Git
git commit -m "feat: Phase 5 - UX + A/B Testing + Billing"
git push -u origin feat/phase-5-ux-billing-bfs

# Database
npm run setup
npx tsx app/lib/billing/seed-plans.ts
npx prisma studio

# Development
npm run dev
npm run deploy

# Production (Fly.io example)
fly deploy
fly ssh console -a mattressai-shopify
fly secrets set KEY=value

# Accessibility
# Use Chrome DevTools → Lighthouse → Accessibility
```

---

## Time Estimates

| Task | Time | When |
|------|------|------|
| Git & Local Setup | 1 hour | Today |
| Local Testing | 2-4 hours | Today |
| Production Deploy | 1-2 hours | Tomorrow |
| Screenshots & Video | 2-3 hours | Tomorrow |
| Write Listing Content | 1 hour | Tomorrow |
| Submit to App Store | 30 min | Tomorrow |
| **Total Active Work** | **7-11 hours** | **Over 2-3 days** |
| Shopify Review | 5-10 days | Wait period |

---

## Critical Success Factors

✅ **Must Have Before Submitting:**
1. App works on production test store
2. No console errors
3. All features functional
4. Accessibility score 90+
5. 5+ quality screenshots
6. Working demo video
7. Privacy policy published
8. Support email active

⚠️ **Common Rejection Reasons:**
1. Missing empty states
2. Poor error handling
3. Slow load times
4. Accessibility issues
5. Missing GDPR compliance
6. Unclear pricing
7. Low-quality screenshots

---

## Support Contacts

- **Shopify Partner Support:** partners@shopify.com
- **App Review Team:** Via Partners Dashboard
- **Community Forum:** https://community.shopify.com/

---

## Next Steps After This Checklist

1. Follow detailed guide: `DEPLOYMENT_AND_SUBMISSION_GUIDE.md`
2. Use for troubleshooting: Part 8 in guide
3. Refer to Phase 5 summary: `PHASE5_SUMMARY.md`
4. Check main docs: `README.md` Phase 5 section

**You've got this! 🚀**


