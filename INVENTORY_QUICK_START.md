# Product Inventory - Quick Start Guide

## What Changed

Your **"Catalog Indexing"** page is now the **"Product Inventory"** page with full inventory management capabilities.

## New Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Product Inventory                                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Catalog Status                     [Re-Index]│  │
│  │ ✅ 142 products indexed                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Current Inventory        142 total products  │  │
│  │                                              │  │
│  │ [Search...] [Firmness ▾] [Vendor ▾]         │  │
│  │                                              │  │
│  │ ┌─────────────────────────────────────────┐ │  │
│  │ │ Title    Vendor  Type  Firm Material...│ │  │
│  │ │ Queen... Acme    Bed   Med  Memory... │ │  │
│  │ │ King...  Brand   Bed   Firm Hybrid... │ │  │
│  │ │ Twin...  Acme    Bed   Soft Latex...  │ │  │
│  │ │ [Edit] [Delete]                        │ │  │
│  │ └─────────────────────────────────────────┘ │  │
│  │                                              │  │
│  │        ◄ Page 1 of 8 ►                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Recent Indexing Jobs                         │  │
│  │ • ✅ completed - 142 products - Oct 14       │  │
│  │ • ✅ completed - 138 products - Oct 13       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Features at a Glance

### 1. Search Products
```
┌─────────────────────────────────────┐
│ [Search by title, vendor, or ID...] │
└─────────────────────────────────────┘
         ↓
    Instant filtering
```

### 2. Filter Products
```
┌──────────────┐  ┌──────────────┐
│ Firmness ▾   │  │ Vendor ▾     │
│ • All        │  │ • All        │
│ • Soft       │  │ • Acme       │
│ • Medium     │  │ • Brand Co   │
│ • Firm       │  │ • Sleep Inc  │
└──────────────┘  └──────────────┘
```

### 3. Edit Product Modal
```
┌─────────────────────────────────────┐
│ Edit Product                    [×] │
├─────────────────────────────────────┤
│ Title:        [Queen Memory Foam  ] │
│ Vendor:       [Acme Mattress Co   ] │
│ Type:         [Mattress           ] │
│ Description:  [Premium quality... ] │
│ Tags:         [memory, foam, queen] │
│                                     │
│ ─── Mattress Attributes ───         │
│ Changes regenerate AI embeddings    │
│                                     │
│ Firmness:     [Medium             ] │
│ Height:       [12 inches          ] │
│ Material:     [Memory Foam        ] │
│ Certifications: [CertiPUR-US      ] │
│ Features:     [cooling-gel        ] │
│ Support:      [edge-support       ] │
│                                     │
│         [Cancel] [Save Changes]     │
└─────────────────────────────────────┘
```

### 4. Delete Confirmation
```
┌─────────────────────────────────────┐
│ Delete Product              [×]     │
├─────────────────────────────────────┤
│                                     │
│ Are you sure you want to delete     │
│ "Queen Memory Foam Mattress"?       │
│                                     │
│ This will remove it from your       │
│ searchable catalog and cannot be    │
│ undone.                             │
│                                     │
│         [Cancel] [Delete]           │
└─────────────────────────────────────┘
```

## Quick Actions

### Search for a Product
1. Type product name in search box
2. Results filter instantly
3. Clear search to see all products

### Edit a Product
1. Find product in table
2. Click **"Edit"** button
3. Modify any fields
4. Click **"Save Changes"**
5. ✅ Both databases updated automatically

### Delete a Product
1. Find product in table
2. Click **"Delete"** button
3. Confirm in modal
4. ✅ Removed from PostgreSQL and Pinecone

### Filter by Attribute
1. Click **Firmness** or **Vendor** dropdown
2. Select value
3. Table updates instantly
4. URL updates (bookmarkable!)

### Navigate Pages
1. See **"Page X of Y"** at bottom
2. Click **◄** or **►** to navigate
3. 20 products per page

## What Happens When You Edit

```
You click "Edit"
       ↓
Modal opens with current values
       ↓
You modify fields
       ↓
You click "Save Changes"
       ↓
   ┌──────────────────────────┐
   │  1. PostgreSQL Updated   │ ← ProductProfile table
   ├──────────────────────────┤
   │  2. Embedding Generated  │ ← OpenAI API call (~$0.0001)
   ├──────────────────────────┤
   │  3. Pinecone Updated     │ ← Vector + Metadata
   └──────────────────────────┘
       ↓
Success toast: "Product updated successfully"
       ↓
Widget gets updated data immediately
```

## Database Synchronization

Your changes are saved to **two databases** simultaneously:

### PostgreSQL (Product Details)
```sql
UPDATE ProductProfile SET
  title = 'Queen Memory Foam',
  firmness = 'Medium',
  material = 'Memory Foam',
  features = 'cooling-gel, pressure-relief',
  updated_at = NOW()
WHERE id = 'clm123abc'
```

### Pinecone (AI Search)
```javascript
vectorStore.upsert({
  id: 'product-gid://shopify/Product/123',
  vector: [0.234, 0.567, ...], // 1536 dimensions
  metadata: {
    tenant_id: 'your-shop.myshopify.com',
    title: 'Queen Memory Foam',
    firmness: 'Medium',
    material: 'Memory Foam',
    updated_at: '2025-10-14T12:34:56Z'
  }
})
```

## URL-Based Filters

Filters are stored in the URL for easy bookmarking:

```
No filters:
/app/admin/catalog-indexing

With search:
/app/admin/catalog-indexing?search=memory+foam

With filters:
/app/admin/catalog-indexing?firmness=medium&vendor=Acme

With pagination:
/app/admin/catalog-indexing?page=3

Combined:
/app/admin/catalog-indexing?search=queen&firmness=medium&page=2
```

## Field Descriptions

### Basic Fields
- **Title**: Product name (searchable)
- **Vendor**: Brand/manufacturer
- **Product Type**: Category (e.g., "Mattress", "Bed")
- **Description**: Full product description
- **Tags**: Comma-separated tags

### Mattress Attributes (Critical for AI)
- **Firmness**: soft, medium-soft, medium, medium-firm, firm
- **Height**: e.g., "10 inches", "12 inches"
- **Material**: memory foam, latex, innerspring, hybrid
- **Certifications**: CertiPUR-US, OEKO-TEX, GREENGUARD
- **Features**: cooling-gel, pressure-relief, motion-isolation
- **Support Features**: edge-support, pocketed-coils

## Performance

### Speed
- **Search**: Instant (in-memory)
- **Filter**: < 100ms (indexed database query)
- **Edit Save**: 2-3 seconds (includes AI embedding)
- **Delete**: < 1 second
- **Page Load**: < 500ms (20 products)

### Costs
- **View/Search/Filter**: Free
- **Edit Product**: ~$0.0001 per edit
- **Delete Product**: Free
- **100 edits/month**: ~$0.01

## Troubleshooting

### "No products match your filters"
→ Clear filters or adjust search query

### "Product updated successfully" but not seeing changes
→ Refresh the page

### Edit modal not opening
→ Check browser console for errors

### Pagination not working
→ Check that URL params are updating

### Toast notifications not showing
→ Check that toasts aren't blocked by browser

## Tips & Tricks

### Quick Workflows

**Bulk edit similar products:**
1. Filter by vendor or firmness
2. Edit each product in filtered view
3. Filters stay active between edits

**Find products to review:**
1. Sort by confidence score (visual)
2. Edit low-confidence products
3. Improve descriptions and attributes

**Clean up duplicates:**
1. Search for product name
2. Find duplicates
3. Delete extras

**Audit changes:**
1. Check server logs for edit history
2. See timestamp in `updated_at` field

### Keyboard Shortcuts (Browser)
- `Ctrl/Cmd + F`: Search page
- `Esc`: Close modals
- `Enter`: Submit forms

## Integration with Widget

When you edit or delete products, the changes are immediately available to the chat widget:

```
Edit Product → Save Changes
             ↓
   [2-3 seconds later]
             ↓
Widget recommendations updated
             ↓
Customers see latest product info
```

No need to re-index the entire catalog!

## Best Practices

### ✅ Do This
- Search before editing to find the right product
- Fill in all mattress attributes for best AI recommendations
- Use consistent naming (e.g., always "Memory Foam" not "MemoryFoam")
- Delete test products before production
- Keep firmness values consistent (soft, medium, firm)

### ❌ Avoid This
- Don't delete products that are actively being recommended
- Don't edit products during active indexing
- Don't use special characters in tags (stick to commas)
- Don't leave critical fields empty (firmness, material, height)

## Need More Features?

Future enhancements planned:
- Bulk edit multiple products
- Export to CSV
- Product images in table
- Edit history/audit log
- Undo/redo changes
- Advanced filtering options

## Questions?

**Q: Do changes affect my Shopify store?**
A: No, edits only affect the search index, not your actual Shopify products.

**Q: Can I revert a change?**
A: Not currently. Best practice: Note the original values before editing.

**Q: What happens if I delete a product?**
A: It's removed from search but remains in your Shopify store.

**Q: Can multiple users edit simultaneously?**
A: Yes, but last save wins. Be careful with concurrent edits.

**Q: How often should I re-index?**
A: Monthly, or after adding many new products to Shopify.

## Summary

You now have a powerful inventory management system that lets you:

✅ View all indexed products  
✅ Search and filter efficiently  
✅ Edit product attributes instantly  
✅ Delete outdated products  
✅ Sync changes to both databases automatically  

**Start exploring your inventory now!**

