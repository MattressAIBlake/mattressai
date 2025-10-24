# Metafields Map Error Fix - Complete

## Issue
The error `TypeError: _a2.map is not a function` was occurring during product enrichment, causing all mattress products to fail processing during indexing jobs.

## Root Cause
The enrichment service expected `metafields` to be a flat array:
```typescript
Array<{ key: string; value: string; namespace: string }>
```

But Shopify's GraphQL bulk operation returns metafields in a nested edges format:
```typescript
{ edges: [{ node: { key: string; value: string; namespace: string } }] }
```

When the code tried to call `.map()` on the edges object, it failed because the object is not an array.

## Solution Implemented

### 1. Created Utility Function
**File:** `app/lib/enrichment/deterministic-mapping.service.ts`

Added `normalizeMetafields()` utility function that:
- Handles GraphQL edges format
- Handles flat array format
- Handles null/undefined
- Returns a consistent flat array format

```typescript
export const normalizeMetafields = (metafields: MetafieldInput): Array<{ key: string; value: string; namespace: string }> => {
  if (!metafields) return [];
  if ('edges' in metafields && Array.isArray(metafields.edges)) {
    return metafields.edges.map(edge => edge.node);
  }
  if (Array.isArray(metafields)) return metafields;
  return [];
};
```

### 2. Updated Type Definitions
Updated `ShopifyProduct` and `ProductForEnrichment` interfaces to accept both formats:
```typescript
metafields?: Array<{...}> | { edges: Array<{ node: {...} }> }
```

### 3. Fixed All Metafield Access Points

#### deterministic-mapping.service.ts
- Line 103: Applied normalization in `extractAttributes()`

#### product-enrichment.service.server.ts
- Line 192: Applied normalization in `createContentHash()`
- Line 300: Applied normalization in `isProductDataWeak()`

#### llm-enrichment.service.ts
- Line 181: Applied normalization in `buildPrompt()`

## Files Modified
1. `app/lib/enrichment/deterministic-mapping.service.ts`
2. `app/lib/enrichment/product-enrichment.service.server.ts`
3. `app/lib/enrichment/llm-enrichment.service.ts`

## Testing
The fix is backward compatible and handles both data formats:
- GraphQL bulk operations (edges format)
- Direct API responses (flat array format)
- Null/undefined values

All linter checks pass with no errors.

## Result
Products from the Shopify bulk operation will now process successfully without the "map is not a function" error. The enrichment pipeline is fully operational for all product formats.

