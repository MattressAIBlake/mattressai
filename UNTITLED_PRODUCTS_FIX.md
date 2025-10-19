# "Untitled" Products Bug - Root Cause & Fix

## The Problem

"Untitled" products with all empty fields were appearing in the Product Inventory on **every indexing run**, even after deletion.

**Symptoms:**
- Product with title="Untitled" (actually empty string)
- All fields empty: vendor="-", type="-", firmness="-", material="-"
- Confidence: 100% (suspicious!)
- Kept reappearing after deletion

## Root Cause Analysis

### Initial Hypothesis ❌
We initially thought empty products were from:
1. Failed indexing runs (partially correct)
2. Missing title validation (we added this, but didn't fix it)

### Actual Root Cause ✅

The **enrichment caching system** in `app/lib/enrichment/product-enrichment.service.server.ts` was creating invalid ProductProfile records on **every enrichment**.

**The Problematic Code (lines 215-260):**
```typescript
private async cacheProfile(profile: ProductProfile, contentHash: string, tenant?: string) {
  await prisma.productProfile.upsert({
    where: { contentHash },
    create: {
      tenant: tenant || 'unknown',
      shopifyProductId: '',  // ❌ EMPTY STRING!
      title: '',              // ❌ EMPTY STRING!
      contentHash,
      // ...
    }
  });
}
```

**Why This Was Called:**
- The enrichment service runs during indexing
- It tries to cache enriched profiles to the database
- The `create` clause had empty strings for critical fields
- This bypassed our title validation (which only checked the indexer)

**Why It Appeared as "Untitled":**
- Database had records with `title: ''` (empty string)
- UI code: `product.title || 'Untitled'` displays "Untitled" for empty strings
- Empty `shopifyProductId` meant no real Shopify product was associated

## The Fix

### 1. Disabled the Enrichment Cache ✅

**File:** `app/lib/enrichment/product-enrichment.service.server.ts`

Completely disabled the `cacheProfile()` method because:
- The indexer already has proper caching based on `contentHash`
- The enrichment cache was redundant
- It was creating invalid database records

**Changed from:**
```typescript
private async cacheProfile(...) {
  await prisma.productProfile.upsert({
    // Complex upsert logic with empty strings
  });
}
```

**To:**
```typescript
private async cacheProfile(...) {
  // Cache disabled - indexer handles caching properly
  return;
}
```

### 2. Enhanced Cleanup Script ✅

**File:** `scripts/cleanup-empty-products.mjs`

Updated to delete products with:
- Empty or null `title`
- Empty or null `shopifyProductId`

```typescript
await prisma.productProfile.deleteMany({
  where: {
    OR: [
      { title: null },
      { title: '' },
      { shopifyProductId: null },
      { shopifyProductId: '' }
    ]
  }
});
```

### 3. Validation in Indexer ✅

**File:** `app/workers/indexer.ts`

Already added validation to reject products with empty titles:
```typescript
if (!product.title || product.title.trim() === '') {
  throw new Error('Product missing required title - cannot index');
}
```

This prevents the **indexer** from creating empty products (wasn't the issue, but good safeguard).

## Testing the Fix

### After Deployment (2-3 minutes)

**Step 1: Delete Existing "Untitled" Products**

Option A - Manual (Easiest):
1. Go to Product Inventory
2. Click "Delete" on any "Untitled" products

Option B - Cleanup Script (Production):
```bash
node scripts/cleanup-empty-products.mjs
```

**Step 2: Re-Index Catalog**
1. Click "Re-Index Catalog"
2. Wait for completion

**Expected Results:**
- ✅ "KIM DOMIN Mattress" indexed successfully
- ✅ NO new "Untitled" products created
- ✅ Only 1 product in inventory (the real mattress)

**Step 3: Verify Fix**
- Re-index again
- "Untitled" should NOT reappear
- Product count stays at 1

## Why Previous Fixes Didn't Work

### Fix Attempt #1: Title Validation in Indexer
**Why it failed:** The indexer validation was correct, but the "Untitled" products weren't created by the indexer - they were created by the enrichment cache.

### Fix Attempt #2: Cleanup Script
**Why it didn't help:** We cleaned up the database, but the enrichment cache kept creating new "Untitled" products on every run.

### Fix Attempt #3: Database Schema Fix
**Why it was needed but insufficient:** Fixed the array serialization issue, allowing products to save, but the enrichment cache was still creating empties.

## The Complete Solution

All three fixes working together:

1. **Enrichment cache disabled** → Stops creating new "Untitled" products ✅
2. **Indexer title validation** → Prevents indexer from creating empties ✅  
3. **Cleanup script** → Removes existing "Untitled" products ✅

## Files Modified

1. `app/lib/enrichment/product-enrichment.service.server.ts` - Disabled cacheProfile()
2. `scripts/cleanup-empty-products.mjs` - Enhanced to check shopifyProductId too
3. `app/workers/indexer.ts` - Already had title validation

## Deployment

**Commits:**
- `75a0562` - Disabled enrichment cache (main fix)
- `3a1c406` - Updated cleanup script
- `37dad68` - Database schema fix (arrays to strings)

**Status:** ✅ Deployed to Vercel

## Summary

The "Untitled" products bug was caused by a well-intentioned but flawed caching mechanism that created invalid database records on every enrichment run. By disabling this redundant cache and relying on the indexer's proper caching, we've eliminated the root cause.

The fix is simple but effective: **don't create database records from the enrichment cache - only the indexer should create ProductProfile records with full, validated data.**

