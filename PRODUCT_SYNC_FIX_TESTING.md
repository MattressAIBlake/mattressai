# Product Synchronization Fix - Testing Guide

## Overview

This document outlines the fixes implemented to resolve the Shopify App Store reviewer's issue: "the widget was unable to provide our one mattress product."

## What Was Fixed

### Root Cause
The app had a sophisticated product indexing system with Pinecone vector search and AI enrichment, but the chat widget was **never using it**. Instead, it was trying to use Shopify's generic MCP endpoints which don't have access to the enriched mattress data.

### Solution
1. **Added Custom Tools** - Created `search_mattresses` and `check_index_status` tools that query the indexed product database directly
2. **Tenant Isolation** - Ensured all queries filter by shop domain to prevent data mixing between merchants
3. **Automatic Indexing** - Products are now automatically indexed on first app install
4. **Real-time Sync** - Webhook handler now always processes product updates (even during bulk indexing)
5. **Graceful Fallbacks** - Helpful messages when products aren't indexed yet
6. **Enhanced Prompts** - AI is now instructed to use custom tools for mattress search

## Files Modified

1. **`app/mcp-client.js`** - Added custom tool definitions and handlers
2. **`app/routes/auth.$.jsx`** - Triggers automatic indexing on first install
3. **`app/prompts/prompts.json`** - Updated system prompts with tool usage instructions
4. **`app/routes/webhooks.products.update/route.tsx`** - Always processes updates
5. **`app/routes/app.admin.catalog-indexing/route.jsx`** - Better status indicators
6. **`app/lib/ports/provider-registry.ts`** - Auto-initializes providers
7. **`prisma/schema.prisma`** - Added `firstIndexCompleted` field to Tenant model

## Testing Checklist

### 1. Fresh Install Test (Critical)

**Objective**: Verify automatic indexing triggers on new merchant install

**Steps**:
1. Uninstall the app from your test store (if installed)
2. Install the app fresh from the development store
3. Complete OAuth flow
4. Navigate to the admin dashboard

**Expected Results**:
- ✅ Indexing job automatically starts in background
- ✅ Admin dashboard shows "Products Not Indexed" warning initially
- ✅ After 5-10 minutes, indexing completes
- ✅ Banner changes to "Catalog Indexed - Widget is Ready"

**Verification**:
```bash
# Check logs for:
"First-time install detected for [shop-name], triggering automatic indexing..."
"Automatic indexing initiated for [shop-name]"
```

### 2. Product Search Test (Critical)

**Objective**: Verify the widget can find and recommend products

**Prerequisites**: At least one mattress product in the store

**Steps**:
1. Ensure catalog is indexed (check admin dashboard)
2. Open the chat widget on the storefront
3. Ask: "I need a mattress"
4. Observe the AI's response

**Expected Results**:
- ✅ AI calls `check_index_status` tool first
- ✅ AI then calls `search_mattresses` tool
- ✅ AI recommends the mattress product
- ✅ Recommendations include "why it fits" explanations
- ✅ Product details are accurate and complete

**Debug Console**:
Check browser console for:
```javascript
"Calling custom tool: check_index_status"
"Calling custom tool: search_mattresses"
```

### 3. Tenant Isolation Test (Critical)

**Objective**: Ensure merchants don't see each other's products

**Prerequisites**: Two different test stores with different products

**Steps**:
1. Install app on Store A (has "Luxury Foam Mattress")
2. Index Store A's products
3. Install app on Store B (has "Budget Spring Mattress")
4. Index Store B's products
5. Open widget on Store A, search for mattresses
6. Open widget on Store B, search for mattresses

**Expected Results**:
- ✅ Store A widget shows ONLY "Luxury Foam Mattress"
- ✅ Store B widget shows ONLY "Budget Spring Mattress"
- ✅ No cross-contamination of products

**Verification**:
Check console logs for tenant_id filters:
```javascript
filter: { tenant_id: 'store-a.myshopify.com' }
filter: { tenant_id: 'store-b.myshopify.com' }
```

### 4. Webhook Sync Test

**Objective**: Verify product changes sync immediately

**Steps**:
1. Ensure catalog is indexed
2. In Shopify admin, edit a mattress product (change title or description)
3. Save the product
4. Wait 30 seconds
5. Open widget and search for that mattress

**Expected Results**:
- ✅ Webhook receives product update
- ✅ Product is re-indexed with new data
- ✅ Widget shows updated product information

**Debug**:
Check server logs for:
```
Processing product update webhook for [product-id] in [shop]
Successfully processed product update for [product-id]
```

### 5. Fallback Behavior Test

**Objective**: Verify graceful handling when no products are indexed

**Steps**:
1. Create a brand new test store with NO products
2. Install the app
3. Open the widget immediately (before indexing completes)
4. Ask: "I need a mattress"

**Expected Results**:
- ✅ AI calls `check_index_status` and sees catalog not ready
- ✅ AI provides helpful message: "catalog is currently being indexed"
- ✅ AI offers general guidance or fallback contact
- ✅ No errors or crashes

### 6. Edge Cases

#### Test A: Empty Catalog
- Store has NO mattress products
- Expected: Friendly message, fallback contact information

#### Test B: Product Added After Initial Index
- Index catalog with 1 product
- Add a 2nd mattress product
- Expected: Webhook syncs new product within 1 minute

#### Test C: Product Deleted
- Index catalog with 2 products
- Delete 1 product
- Expected: Widget no longer shows deleted product

## Production Deployment Checklist

Before submitting to Shopify App Store:

- [ ] Verify `DATABASE_URL` and `DIRECT_DATABASE_URL` are set in production
- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Verify `PINECONE_API_KEY` is set
- [ ] Verify `OPENAI_API_KEY` is set
- [ ] Test with real Shopify reviewer test store (fresh install)
- [ ] Confirm products/update webhook is registered
- [ ] Monitor logs for any indexing errors
- [ ] Verify tenant isolation in production Pinecone index

## Database Migration

The schema has been updated to include `firstIndexCompleted` field. In production, run:

```bash
npx prisma migrate deploy
```

This will apply the migration without prompting (safe for production).

## Monitoring

### Key Metrics to Watch

1. **Indexing Success Rate**
   - Check IndexJob table for failed jobs
   - Monitor webhook processing errors

2. **Custom Tool Usage**
   - Verify `search_mattresses` is being called
   - Check for fallback message frequency

3. **Tenant Data Integrity**
   - Spot-check Pinecone vectors have correct tenant_id
   - Verify no cross-merchant data leakage

### Logs to Monitor

```bash
# Good signs:
"Calling custom tool: search_mattresses"
"Successfully processed product update"
"First-time install detected"

# Warning signs:
"Error in search_mattresses"
"Failed to process product update"
"Unable to check index status"
```

## Rollback Plan

If issues arise in production:

1. **Emergency Disable**: Remove custom tools from MCP client
2. **Quick Fix**: Revert to commit before changes
3. **Data Integrity**: Tenant data is isolated, safe to rollback

## Success Criteria

The fix is successful when:

✅ Shopify reviewer can install app  
✅ Indexing starts automatically  
✅ Widget finds and recommends mattress products  
✅ No data leakage between merchants  
✅ Real-time product updates via webhooks  
✅ Graceful handling of edge cases  

## Contact

If issues persist, check:
1. Server logs for tool execution
2. Pinecone dashboard for vector counts
3. Database for IndexJob status
4. Browser console for MCP tool calls

---

**Implementation Date**: October 11, 2025  
**Status**: Ready for Testing  
**Next Steps**: Complete testing checklist before resubmission to Shopify

