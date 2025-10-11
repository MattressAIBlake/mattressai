# Quick Fix Reference - Product Sync Issue

## What Was Broken

❌ Widget couldn't find mattress products  
❌ RecommendationService existed but was never used  
❌ Chat system used wrong MCP endpoints  
❌ No automatic indexing on install  

## What We Fixed

✅ Added custom `search_mattresses` tool that queries Pinecone directly  
✅ Integrated RecommendationService into chat flow  
✅ Automatic indexing on first install  
✅ Real-time webhook sync  
✅ Strong tenant isolation  
✅ Graceful fallback messages  

## Key Code Changes

### 1. Custom Tools in MCP Client

```javascript
// app/mcp-client.js

// Store shop domain for tenant queries
this.shopDomain = hostUrl.replace(/^https?:\/\//, '');

// Define custom tools
this.customTools = [{
  name: 'search_mattresses',
  description: 'Search enriched mattress catalog...'
}, {
  name: 'check_index_status',
  description: 'Check if catalog is indexed...'
}];

// Handle custom tool calls
async callCustomTool(toolName, toolArgs) {
  const { getProductRecommendations } = await import('./lib/recommendations/recommendation.service');
  
  if (toolName === 'search_mattresses') {
    // Query with tenant isolation
    const recommendations = await getProductRecommendations(
      this.shopDomain,  // CRITICAL: Tenant identifier
      toolArgs,
      { topK: 5 }
    );
    return { content: [{ type: 'text', text: JSON.stringify(recommendations) }] };
  }
}
```

### 2. Automatic Indexing

```javascript
// app/routes/auth.$.jsx

if (!tenant.firstIndexCompleted) {
  // Trigger indexing automatically
  fetch(`${appUrl}/app/admin/index/start`, {
    method: 'POST',
    body: new URLSearchParams({
      useAIEnrichment: 'true',
      confidenceThreshold: '0.7'
    })
  });
  
  await prisma.tenant.update({
    where: { shop: session.shop },
    data: { firstIndexCompleted: true }
  });
}
```

### 3. Enhanced System Prompt

```json
{
  "systemPrompts": {
    "standardAssistant": {
      "content": "...IMPORTANT - MATTRESS SEARCH TOOLS:\n1. At the START of every conversation, call 'check_index_status'\n2. ALWAYS use the 'search_mattresses' tool (NEVER generic product search)..."
    }
  }
}
```

### 4. Always Process Webhooks

```javascript
// app/routes/webhooks.products.update/route.tsx

// Before: if (!activeJob) { await processProductUpdate(...) }
// After: ALWAYS process
await processProductUpdate(shopifyProductId, shopDomain);
```

## Testing Commands

```bash
# Regenerate Prisma client
npx prisma generate

# Check for linting errors
npm run lint

# Start development server
npm run dev
```

## Critical Checks

- [ ] Custom tools defined in mcp-client.js
- [ ] Tenant isolation: filter by `tenant_id`
- [ ] Auto-indexing in auth.$.jsx
- [ ] System prompts updated
- [ ] Webhooks always process
- [ ] Admin dashboard shows status
- [ ] firstIndexCompleted in schema

## Tenant Isolation Pattern

**ALWAYS include in queries:**
```javascript
// In Pinecone
filter: { tenant_id: this.shopDomain }

// In Prisma
where: { tenant: session.shop }
```

## Quick Debug

### Check if custom tools are registered
```javascript
// Browser console
console.log(mcpClient.customTools);
// Should show: search_mattresses, check_index_status
```

### Check if products are indexed
```javascript
// Check admin dashboard at /app/admin/catalog-indexing
// Look for: "✅ Catalog Indexed - Widget is Ready"
```

### Check tool execution
```javascript
// Server logs should show:
"Calling custom tool: search_mattresses"
"CRITICAL: Pass shop domain for tenant-specific search"
```

## Common Issues

### Issue: Widget still can't find products

**Check**:
1. Are products indexed? (Check admin dashboard)
2. Is indexing job running? (May take 5-10 minutes)
3. Are products tagged as "mattress"? (Check product type/tags)
4. Check server logs for custom tool calls

### Issue: Products mixed between merchants

**Check**:
1. Verify `this.shopDomain` is set in MCP client
2. Check Pinecone queries include `tenant_id` filter
3. Review server logs for tenant identifier

### Issue: Indexing doesn't start automatically

**Check**:
1. Verify auth callback is executing
2. Check `firstIndexCompleted` flag in database
3. Review server logs for "First-time install detected"

## File Locations

| What | Where |
|------|-------|
| Custom tools | `app/mcp-client.js` (lines 35-91) |
| Auto-indexing | `app/routes/auth.$.jsx` (lines 23-70) |
| System prompts | `app/prompts/prompts.json` |
| Webhook handler | `app/routes/webhooks.products.update/route.tsx` |
| Admin dashboard | `app/routes/app.admin.catalog-indexing/route.jsx` |
| Database schema | `prisma/schema.prisma` (line 289) |

## One-Line Summary

**Fixed product sync by integrating RecommendationService directly into chat through custom MCP tools with strong tenant isolation and automatic indexing.**

---

**Status**: ✅ Implementation Complete  
**Testing**: See PRODUCT_SYNC_FIX_TESTING.md  
**Details**: See PRODUCT_SYNC_FIX_SUMMARY.md

