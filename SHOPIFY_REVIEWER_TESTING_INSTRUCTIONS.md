# Testing Instructions for Shopify App Reviewers

## Setup (5 minutes)

1. **Install the app** on your test store and grant permissions
2. **Activate widget:**
   - Go to Apps → MattressAI → Onboarding
   - Click "Activate Storefront App Embed"
   - Enable the extension in Theme Editor and save
3. **Configure AI:**
   - Navigate to Apps → MattressAI → Prompt Builder
   - Complete 4-step wizard (select tone, question limit, lead capture settings)
   - Click "Activate"
4. **Index products:**
   - Go to Apps → MattressAI → Catalog Indexing
   - Click "Index Now" and wait 2-5 minutes

## Test Storefront (5 minutes)

1. **Visit your storefront** and click the chat bubble (bottom-right)
2. **Chat with AI:** Type "I need help finding a mattress"
3. **Answer questions:** Respond with sleep position, firmness, size preferences
4. **Review recommendations:**
   - Verify product cards show fit scores and "why it fits" bullets
   - Click "Add to Cart" on a product
5. **Compare products:**
   - Check "Compare" on 2-3 products
   - Click "Compare X Products" button
   - Verify side-by-side specs display
   - Close with ESC key
6. **Capture lead:**
   - Fill in lead form when prompted
   - Check consent checkbox and submit
   - Verify confirmation message

## Test Admin (5 minutes)

1. **Leads:** Apps → MattressAI → Leads
   - Verify captured lead appears
   - Update status and export CSV
2. **Analytics:** Apps → MattressAI → Analytics
   - Review funnel, products, and trends tabs
3. **Billing:** Apps → MattressAI → Plans
   - Verify usage bars and plan comparison
   - Test upgrade flow (test mode charge)
4. **A/B Testing (optional):** Apps → MattressAI → Experiments
   - Create test experiment with 2 variants

## App-Specific Settings

- **Prompt Builder:** AI conversation tone and flow
- **Catalog Indexing:** Product enrichment with AI attributes
- **Lead Capture:** When/how to collect customer info
- **Alert Settings:** Email/SMS/Slack notifications (optional)

## Expected Results

✅ Widget loads on storefront  
✅ AI provides personalized recommendations  
✅ Product comparison works  
✅ Add to cart functions correctly  
✅ Leads captured with consent  
✅ Admin UI loads without errors  
✅ Mobile responsive  
✅ Keyboard accessible (Tab, Enter, ESC)

**Total Time:** 15-20 minutes  
**Note:** Billing uses test mode (no real charges)

