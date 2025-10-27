# Queen Mattress Price Extraction - Implementation Complete ✅

## Summary

Successfully implemented intelligent price extraction that **prioritizes Queen-sized mattress variants**, falling back to the first available variant if no Queen size is found. This ensures the most relevant and commonly-searched mattress price is stored in the database and used for recommendations.

---

## What Was Done

### 1. **Updated Bulk Operation Query** (`app/workers/indexer.ts`)
- Increased variant fetch from `first: 1` to `first: 10` to capture multiple sizes
- Added `id` and `title` fields to variant nodes to enable size identification
- Added debug logging to track variant and metafield reconstruction

**Changes:**
```typescript
variants(first: 10) {
  edges {
    node {
      id
      title          // NEW - needed to identify Queen variants
      price
      compareAtPrice
      availableForSale
    }
  }
}
```

### 2. **Created `extractQueenPrice()` Helper Method**
Added intelligent price extraction logic that:
- Searches through all variants for Queen-sized options
- Uses multiple Queen identifiers: `queen`, `q `, ` q`, `queen size`, `qn`
- Falls back to first variant if no Queen variant found
- Logs which variant price was selected for debugging

**Implementation in `app/workers/indexer.ts`:**
```typescript
private extractQueenPrice(product: any): number | null {
  const variants = product.variants?.edges || [];
  
  if (variants.length === 0) {
    return null;
  }
  
  // Common Queen size identifiers in variant titles
  const queenKeywords = ['queen', 'q ', ' q', 'queen size', 'qn'];
  
  // Try to find Queen variant
  const queenVariant = variants.find((edge: any) => {
    const title = edge.node?.title?.toLowerCase() || '';
    return queenKeywords.some(keyword => title.includes(keyword));
  });
  
  if (queenVariant?.node?.price) {
    const price = parseFloat(queenVariant.node.price);
    console.log(`    👑 Using Queen variant price: $${price} (from "${queenVariant.node.title}")`);
    return price;
  }
  
  // Fallback to first variant
  const firstVariant = variants[0]?.node;
  if (firstVariant?.price) {
    const price = parseFloat(firstVariant.price);
    console.log(`    📦 Using first variant price: $${price} (from "${firstVariant.title || 'default'}")`);
    return price;
  }
  
  return null;
}
```

### 3. **Updated Price Extraction in Indexer**
Replaced simple first-variant extraction with intelligent Queen-based extraction:

**Before:**
```typescript
const firstVariant = product.variants?.edges?.[0]?.node;
const price = firstVariant?.price ? parseFloat(firstVariant.price) : null;
```

**After:**
```typescript
const price = this.extractQueenPrice(product);
if (price) {
  console.log(`    💰 Price found: $${price}`);
} else {
  console.log(`    ⚠️  No price available`);
}
```

### 4. **Updated Webhook Handler** (`app/routes/webhooks.products.update/route.tsx`)
Applied the same changes to ensure consistency:
- Updated GraphQL query to fetch 10 variants with titles
- Added identical `extractQueenPrice()` helper function
- Updated price extraction logic to use Queen-based extraction

---

## How It Works

### Price Selection Priority:
1. **🥇 Queen Variant** - If a variant contains "queen" (or similar) in the title → Use that price
2. **🥈 First Variant** - If no Queen variant found → Use first available variant price
3. **🥉 Null** - If no variants at all → Store as `null`

### Database Storage:
- Price stored in `ProductProfile.price` field (Float)
- ProductURL stored in `ProductProfile.productUrl` field (String)
- Both fields properly indexed for fast queries

### Vector Store:
- Queen price also stored in Pinecone metadata as `price`
- ProductURL stored in Pinecone metadata as `product_url`
- Used for semantic search and recommendations

---

## Example Output

When the indexer runs, you'll now see logs like:

```
🔄 Processing product: "Helix Midnight Luxe" (gid://shopify/Product/8560596615464)
    👑 Using Queen variant price: $1699.99 (from "Queen")
    💰 Price found: $1699.99
    📝 Enriching product profile...
    ✅ Enrichment complete
```

Or if no Queen variant exists:

```
🔄 Processing product: "Birch Kids Natural Mattress" (gid://shopify/Product/9138670305576)
    📦 Using first variant price: $599.99 (from "Twin")
    💰 Price found: $599.99
    📝 Enriching product profile...
```

---

## Verification

### Database Check:
```sql
SELECT 
  title, 
  price, 
  "productUrl" 
FROM "ProductProfile" 
WHERE tenant = 'freedommattress.myshopify.com' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

After the next indexing job runs, you should see:
- ✅ `price` populated with Queen variant prices (or first variant as fallback)
- ✅ `productUrl` populated with product URLs

---

## Files Modified

1. **`app/workers/indexer.ts`**
   - Updated bulk operation query (lines 505-515)
   - Added variant/metafield debug logging (lines 625-649)
   - Added `extractQueenPrice()` method (lines 916-950)
   - Updated price extraction logic (lines 719-725)

2. **`app/routes/webhooks.products.update/route.tsx`**
   - Updated GraphQL query (lines 224-234)
   - Added `extractQueenPrice()` function (lines 259-293)
   - Updated price extraction (line 106-107)

---

## Next Steps

### To See This In Action:
1. **Trigger a new indexing job** via the admin panel or Inngest
2. **Check the logs** - you'll see `👑 Using Queen variant price` messages
3. **Verify database** - query `ProductProfile` to confirm prices are populated

### Expected Results:
- Products with Queen variants → Queen price stored
- Products without Queen variants → First variant price stored
- Products with no variants → `null` price (will need manual investigation)

---

## Why This Matters

✅ **Better User Experience** - Chat shows most relevant price (Queen is most common)
✅ **Accurate Recommendations** - Vector search uses realistic prices
✅ **Consistent Data** - Both indexer and webhook use same logic
✅ **Debugging** - Clear logs show which variant was selected

---

## Status: ✅ COMPLETE

Both the bulk indexer and webhook handler now intelligently extract Queen mattress prices and store them in the database along with product URLs.

