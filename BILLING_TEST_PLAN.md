# Shopify Billing Test Plan

## Overview
Testing the Shopify native billing integration to ensure subscription creation, upgrades, and webhook handling work correctly.

## Environment Configuration

### ✅ Required Environment Variables
- `SHOPIFY_API_KEY`: ✅ Configured (6b1ed5786311fcaad075b3a7cc5f348e)
- `SHOPIFY_API_SECRET`: ✅ Configured
- `HOST`: ⚠️ Currently set to fly.dev, needs to be updated for Vercel
- `NODE_ENV`: Should be 'development' for test mode

### Update Required
```bash
# For local testing
HOST=http://localhost:3000

# For Vercel deployment
SHOPIFY_APP_URL=mattressaishopify.vercel.app
```

## Test Scenarios

### 1. Free to Pro Upgrade (Test Mode)
**Goal**: Verify subscription creation with test charges

**Steps**:
1. Access admin panel: `/app/admin/plans`
2. Current plan should show "Starter" with trial badge
3. Click "Upgrade to Pro" button
4. Verify GraphQL mutation executes without errors
5. Check for redirect to Shopify confirmation page
6. Approve test charge in Shopify
7. Verify webhook fires and updates tenant plan

**Expected Results**:
- ✅ No errors in console
- ✅ Redirects to Shopify billing confirmation
- ✅ `test: true` flag is set (development mode)
- ✅ Price shows as $49/month
- ✅ Returns to `/app/admin/plans` after confirmation

### 2. Webhook Handling
**Goal**: Verify webhook updates tenant plan automatically

**Endpoint**: `POST /webhooks/app_subscriptions/update`

**Test Webhook Payload**:
```json
{
  "app_subscription": {
    "id": "gid://shopify/AppSubscription/12345",
    "name": "Pro Plan",
    "status": "ACTIVE",
    "test": true
  }
}
```

**Headers Required**:
- `X-Shopify-Shop-Domain`: your-test-store.myshopify.com
- `X-Shopify-Hmac-Sha256`: (valid HMAC signature)

**Expected Database Updates**:
```sql
-- Tenant record should be updated:
UPDATE Tenant SET 
  planName = 'pro',
  billingId = 'gid://shopify/AppSubscription/12345',
  quotas = '{"tokens":500000,"alertsPerDay":50,...}'
WHERE shop = 'your-test-store.myshopify.com'
```

### 3. Pro to Enterprise Upgrade
**Steps**:
1. After Pro plan is active
2. Click "Upgrade to Enterprise"
3. Verify $199/month charge creation
4. Confirm and verify unlimited quotas applied

### 4. Subscription Cancellation
**Goal**: Verify downgrade to free tier

**Test Webhook Payload**:
```json
{
  "app_subscription": {
    "id": "gid://shopify/AppSubscription/12345",
    "status": "CANCELLED"
  }
}
```

**Expected**:
- ✅ Tenant downgraded to "starter" plan
- ✅ billingId set to null
- ✅ Quotas reset to free tier limits

## Manual Testing Checklist

### Pre-Testing
- [ ] Dev server running (`npm run dev`)
- [ ] Connected to Shopify test store
- [ ] Database accessible (check Prisma Studio)
- [ ] Environment variables loaded

### Billing Flow Testing
- [ ] Navigate to `/app/admin/plans`
- [ ] Verify current plan display (Free/Starter)
- [ ] Check usage stats render correctly
- [ ] Click "Upgrade to Pro"
- [ ] Verify no console errors
- [ ] Confirm redirect to Shopify
- [ ] Check URL contains `charge_id` parameter
- [ ] Test mode charge is clearly indicated
- [ ] Approve test charge
- [ ] Verify return to plans page
- [ ] Check plan updated in UI

### Webhook Testing
- [ ] Use Shopify webhook testing tool
- [ ] Send APP_SUBSCRIPTIONS_UPDATE webhook
- [ ] Check server logs for webhook receipt
- [ ] Verify HMAC validation passes
- [ ] Confirm database update
- [ ] Test status: ACTIVE
- [ ] Test status: CANCELLED
- [ ] Test status: EXPIRED

### Edge Cases
- [ ] Click upgrade when already on highest plan
- [ ] Test with invalid plan name
- [ ] Test webhook with invalid signature
- [ ] Test webhook with missing shop domain
- [ ] Concurrent subscription attempts

## Automated Test Script

Create a test script to verify billing:

```javascript
// test-billing.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBilling() {
  const testShop = 'test-store.myshopify.com';
  
  // 1. Check tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { shop: testShop }
  });
  
  console.log('Current Plan:', tenant?.planName);
  console.log('Billing ID:', tenant?.billingId);
  console.log('Quotas:', tenant?.quotas);
  
  // 2. Simulate upgrade
  console.log('\n✅ Manual test: Visit /app/admin/plans and click upgrade');
  
  // 3. Wait for webhook
  console.log('⏳ Waiting for webhook...');
}

testBilling();
```

## Debugging Guide

### Common Issues

#### Issue: "Failed to create subscription"
**Cause**: Invalid GraphQL mutation or missing permissions
**Fix**: 
- Check Shopify app scopes include billing
- Verify API credentials
- Check admin.graphql() is available

#### Issue: "Webhook signature invalid"
**Cause**: HMAC verification failing
**Fix**:
- Verify SHOPIFY_API_SECRET matches Partners dashboard
- Check webhook is registered with correct URL
- Test HMAC calculation independently

#### Issue: "Return URL not working"
**Cause**: HOST/SHOPIFY_APP_URL misconfigured
**Fix**:
```bash
# Local testing
HOST=http://localhost:3000

# Production
SHOPIFY_APP_URL=mattressaishopify.vercel.app
```

#### Issue: "Subscription not updating plan"
**Cause**: Webhook not firing or handler failing
**Fix**:
- Check webhook registration in Partners dashboard
- Enable webhook logging
- Test webhook manually with curl

### Logging Commands

```bash
# Watch server logs
npm run dev

# Check database
npx prisma studio

# Test webhook locally (use ngrok)
ngrok http 3000
# Update webhook URL in Partners dashboard

# Manual webhook test
curl -X POST http://localhost:3000/webhooks/app_subscriptions/update \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: test-hmac" \
  -d '{"app_subscription": {"status": "ACTIVE", "name": "Pro Plan", "id": "123"}}'
```

## Success Criteria

✅ **Billing Integration is Working When**:
1. User can click upgrade and redirect to Shopify
2. Test mode charges work in development
3. Webhook receives and processes subscription updates
4. Database correctly reflects plan changes
5. Quotas are properly applied per plan tier
6. Return URL works after approval/decline
7. Cancellation downgrades to free tier
8. No console errors during flow

## Next Steps After Testing

1. [ ] Update HOST environment variable for production
2. [ ] Register webhook in Shopify Partners dashboard
3. [ ] Test with real charges in production
4. [ ] Set up monitoring for failed webhooks
5. [ ] Add admin UI for subscription management
6. [ ] Create billing analytics dashboard
7. [ ] Document customer billing process
8. [ ] Set up Stripe for non-Shopify billing (if needed)

## Notes

- Test mode charges are free and work in development
- Real charges require production approval from Shopify
- Shopify takes 20-25% of subscription revenue
- Webhooks must be publicly accessible (use ngrok for local testing)
- HMAC verification is critical for security

