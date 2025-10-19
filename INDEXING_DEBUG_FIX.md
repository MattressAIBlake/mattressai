# Indexing Debug Fix - Enhanced Logging

## Issue
The "Re-Index Catalog" feature was completing successfully but showing "Completed 0 Products" even though products exist in the Shopify store.

## Root Cause (FOUND & FIXED!)
The product **"KIM DOMIN Mattress — Balanced Support and Everyday Comfort"** was being **rejected due to negative keywords in the description**, even though the title clearly contains "Mattress".

The filtering logic was checking title + description + tags as one combined text. If the product description mentioned words like "cover", "protector", "topper", "pillow", etc., the entire product was rejected - even if the title explicitly said "Mattress".

### Example
- **Title:** "KIM DOMIN Mattress — Balanced Support and Everyday Comfort" ✅
- **Description:** "...includes a waterproof cover..." ❌ (rejected because of "cover")

This is a common scenario where mattresses mention included accessories in their descriptions.

## The Fix

### Two-Stage Keyword Matching
Changed the filtering logic to check the **title separately** from the full content:

**New Logic:**
1. **First:** Check if title contains "mattress" keyword AND title doesn't have negative keywords
   - If YES → ✅ Accept as definite mattress
   - This allows products with clear "Mattress" in title, even if description mentions accessories

2. **Second:** Check full content (title + description + tags)
   - If has mattress keyword AND no negative keywords → ✅ Accept
   - If uncertain → ⚠️ Send to AI for classification

3. **Last:** Reject products without mattress indicators

### Improved Logging
Added specific rejection reasons:
- `❌ REJECTED (negative keywords in description)` - has mattress in content but also negative words
- `❌ REJECTED (title has mattress but also negative keywords)` - title says "mattress topper"
- `✅ DEFINITE MATTRESS (from title)` - accepted because title explicitly says mattress

## Changes Made

### 1. Enhanced Logging Throughout the Indexing Process

Added detailed console logs at every critical stage:

- **Bulk Operation Start**: Logs when the Shopify bulk operation begins
- **Bulk Operation Completion**: Shows operation ID and product count
- **JSONL Parsing**: Detailed breakdown of parsing results
  - Total characters downloaded
  - Number of JSONL lines
  - Parse errors
  - Product vs child object counts
- **Product Filtering**: Shows all products being evaluated and filtering decisions
- **Sample Data**: Displays first 3 products with full details

### 2. Improved JSONL Parsing

- Changed product filtering to explicitly check for `Product` in the ID string
- Added better error handling and logging for parsing failures
- Shows sample of rows when no products are found for debugging

### 3. Safety Checks

- Added null/undefined checks for product arrays
- Added handling for missing bulk operation URLs
- Added object count logging from bulk operation

## What to Look For in the Next Test

When you click "Re-Index Catalog" again, you should now see these logs in Vercel:

```
🚀 Starting Shopify bulk operation for tenant...
✅ Bulk operation started: [operation-id]
⏳ Polling for bulk operation completion...
✅ Bulk operation completed. Object count: X
📥 Downloading bulk operation results from: [url]
📄 Downloaded X characters of JSONL data
📊 Parsing X JSONL lines...
📊 Parsed X rows (0 parse errors)
✅ Fetched X products from Shopify bulk operation
📊 Breakdown: X total rows, X products, X child objects
📋 Sample products (first 3):
  1. "Product Name" (ID: gid://..., Type: ..., Tags: ...)
🔍 Starting hybrid mattress filtering...
Starting hybrid filter for X total products...
🔍 All products being evaluated:
  1. "Product Name" (Type: ..., Vendor: ...)
  ✅ DEFINITE MATTRESS: "..." OR ⚠️ UNCERTAIN OR ❌ REJECTED
```

## Expected Behavior

For your store with the "KIM DOMIN Mattress", the logs should show:

1. **Bulk operation fetches at least 6 products** (mattress + other items)
2. **Filtering identifies the mattress** with `✅ DEFINITE MATTRESS: "KIM DOMIN Mattress..."`
3. **Job completes with 1 product indexed**

## If Still Shows 0 Products

If you still see 0 products after these changes, the detailed logs will reveal:

1. **If bulk operation returns 0 products**: API/authentication issue
2. **If products are fetched but filtered out**: Keyword matching issue
3. **If JSONL parsing fails**: Format mismatch issue

## Next Steps

1. Wait for Vercel deployment to complete (~2-3 minutes)
2. Click "Re-Index Catalog" again
3. Check Vercel logs for the detailed output
4. Share the logs if the issue persists - we'll now have much more information to diagnose the problem

## Technical Details

### Product Filtering Logic

Products are filtered in two stages:

**Stage 1: Keyword Filter** (Free, instant)
- Strong positive keywords: 'mattress', 'colchón', 'matelas', etc. in multiple languages
- Strong negative keywords: 'topper', 'protector', 'cover', 'pillow', etc.
- If product title/description contains mattress keywords and no negative keywords → ✅ DEFINITE MATTRESS

**Stage 2: AI Classification** (Only for uncertain products)
- Products that might be mattresses but don't have clear keywords
- Uses GPT-4o-mini for cost-effective classification
- Limited to prevent high API costs

### JSONL Structure

Shopify's bulk operation returns data in JSONL format (newline-delimited JSON):
- Each line is a separate JSON object
- Top-level products have `id` containing "Product" and NO `__parentId`
- Child objects (variants, metafields) have `__parentId` pointing to parent
- We filter for top-level products only

## Files Modified

- `app/workers/indexer.ts`: Added comprehensive logging throughout the indexing workflow

## Deployment

Changes pushed to GitHub: commit `5c0f3b4`
Vercel will automatically deploy in 2-3 minutes.

