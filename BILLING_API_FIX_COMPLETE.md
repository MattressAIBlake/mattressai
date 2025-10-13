# ✅ Billing API Fix - COMPLETE

**Date**: October 13, 2025  
**Status**: **Ready for Testing**

---

## 🎯 Summary

Fixed the Billing API to properly handle charge acceptance, decline, and reinstall scenarios as required by Shopify App Store reviewers. The app now correctly implements the complete billing flow including callback handling and automatic charge requests on reinstall.

---

## ✅ What Was Fixed

### 1. Billing Callback Route ✅
**File**: `app/routes/app.admin.billing.callback/route.jsx` (NEW)

Created a dedicated route to handle returns from Shopify's billing approval page:
- Receives `charge_id` parameter from Shopify redirect
- Queries Shopify GraphQL to verify subscription status (ACTIVE/DECLINED/PENDING)
- Only upgrades tenant plan if status is ACTIVE
- Provides user feedback via status messages
- Handles both normal upgrades and reinstall scenarios

**Key Features**:
```javascript
// Query subscription status
const response = await admin.graphql(`
  query GetSubscription($id: ID!) {
    node(id: $id) {
      ... on AppSubscription {
        id
        status
      }
    }
  }
`);

// Only upgrade if ACTIVE
if (subscription?.status === 'ACTIVE') {
  await upgradePlan(shop, planName, chargeId);
}
```

### 2. Updated Return URL ✅
**File**: `app/routes/app.admin.plans/route.jsx`

Changed return URL to point to the new callback route:
```javascript
// Before:
const returnUrl = `https://${appUrl}/app/admin/plans`;

// After:
const returnUrl = `https://${appUrl}/app/admin/billing/callback?plan=${planName}`;
```

Added user feedback banners to display billing status:
- Success banner for approved charges
- Warning banner for declined charges
- Error banner for failed operations
- Info banner for pending approvals

### 3. Reinstall Billing Logic ✅
**File**: `app/routes/auth.$.jsx`

Added automatic billing request on reinstall for merchants with previous paid plans:
```javascript
// Check if reinstall with previous paid plan
if (tenant.planName !== 'starter' && !tenant.billingId) {
  // Automatically redirect to billing approval
  const { confirmationUrl } = await requestBillingApproval(
    session.shop,
    admin,
    tenant.planName,
    returnUrl
  );
  
  if (confirmationUrl) {
    return redirect(confirmationUrl);
  }
}
```

**Flow**:
1. Merchant uninstalls app (keeps planName in database)
2. Merchant reinstalls app
3. App detects previous paid plan without active billing
4. Automatically redirects to Shopify billing approval
5. After approval, plan is restored

### 4. Updated Webhook Handler ✅
**File**: `app/routes/webhooks.app_subscriptions.update/route.jsx`

Modified webhook to only process cancellations/expirations:
- ACTIVE status is now handled by callback route (not webhook)
- CANCELLED/EXPIRED status triggers downgrade to starter
- Prevents duplicate processing of activations

```javascript
// Only process cancellations and expirations
if (app_subscription.status === 'CANCELLED' || app_subscription.status === 'EXPIRED') {
  await downgradePlan(shopDomain);
} else if (app_subscription.status === 'ACTIVE') {
  // Log but don't process - callback handles this
  console.log('ACTIVE subscription webhook received - skipping (handled by callback)');
}
```

### 5. Enhanced Billing Service ✅
**File**: `app/lib/billing/billing.service.ts`

Added two new helper functions:

**a) getActiveSubscription()**
- Queries Shopify for current active subscriptions
- Returns subscription details if found
- Used for checking existing billing status

**b) requestBillingApproval()**
- Creates subscription charge
- Returns confirmation URL for redirect
- Reusable for both manual upgrades and reinstalls
- Handles GraphQL errors properly

### 6. Database Schema Update ✅
**File**: `prisma/schema.prisma`

Added `billingStatus` field to Tenant model:
```prisma
model Tenant {
  id            String    @id
  shop          String    @unique
  planName      String    @default("starter")
  billingId     String?
  billingStatus String?   // NEW: Tracks ACTIVE/CANCELLED/DECLINED
  // ... other fields
  
  @@index([billingStatus])
}
```

**Migration**: `prisma/migrations/20251013115957_add_billing_status/migration.sql`

Updated billing service functions to set billingStatus:
- `upgradePlan()` sets status to 'ACTIVE'
- `downgradePlan()` sets status to null

---

## 🔄 Complete Billing Flow

### Scenario 1: User Accepts Charge
1. User clicks "Upgrade Plan" button
2. Server creates subscription via GraphQL
3. User redirected to Shopify billing approval page
4. User approves charge
5. Shopify redirects to callback route with `charge_id`
6. Callback queries subscription status → ACTIVE
7. Tenant plan upgraded, billingId and billingStatus saved
8. User redirected to plans page with success message

### Scenario 2: User Declines Charge
1. User clicks "Upgrade Plan" button
2. Server creates subscription via GraphQL
3. User redirected to Shopify billing approval page
4. User declines charge
5. Shopify redirects to callback route without `charge_id`
6. Callback detects missing charge_id
7. User redirected to plans page with declined message
8. Tenant remains on current plan

### Scenario 3: Reinstall with Previous Paid Plan
1. Merchant had Pro plan, then uninstalled app
2. Merchant reinstalls app
3. Auth route detects: `planName=pro` but `billingId=null`
4. Automatically requests billing approval for Pro plan
5. Merchant redirected to Shopify billing page
6. After approval, plan is restored via callback
7. Merchant continues with Pro features

### Scenario 4: Subscription Cancelled
1. Merchant cancels subscription in Shopify admin
2. Shopify sends `app_subscriptions/update` webhook
3. Webhook handler detects CANCELLED status
4. Tenant downgraded to starter plan
5. billingId and billingStatus cleared

---

## 📁 Files Modified

### Created (1 new file):
1. `app/routes/app.admin.billing.callback/route.jsx` - Billing callback handler

### Modified (5 files):
1. `app/routes/app.admin.plans/route.jsx` - Updated return URL and added status banners
2. `app/routes/auth.$.jsx` - Added reinstall billing logic
3. `app/routes/webhooks.app_subscriptions.update/route.jsx` - Removed activation from webhook
4. `app/lib/billing/billing.service.ts` - Added helper functions and billingStatus handling
5. `prisma/schema.prisma` - Added billingStatus field

### Migrations:
1. `prisma/migrations/20251013115957_add_billing_status/migration.sql` - Database migration

---

## 🧪 Testing Checklist

### Manual Testing Required:

- [ ] **Accept Charge**: Click upgrade → approve → verify plan upgraded
- [ ] **Decline Charge**: Click upgrade → decline → verify stays on current plan
- [ ] **Reinstall with Paid Plan**: 
  - Upgrade to Pro
  - Uninstall app
  - Reinstall app
  - Verify automatic billing request
  - Approve and verify plan restored
- [ ] **Webhook Cancellation**: Cancel subscription in Shopify → verify downgrade
- [ ] **Status Messages**: Verify all banners display correctly

### Database Migration:

Before deploying to production:
```bash
# Run migration on production database
npx prisma migrate deploy
```

---

## 🚀 Deployment Notes

### Environment Variables (Already Set):
- `SHOPIFY_APP_URL` or `HOST` - Used for return URLs
- `NODE_ENV` - Controls test mode for subscriptions

### No Breaking Changes:
- Existing tenants will continue to work
- billingStatus field is optional (nullable)
- Backward compatible with existing billing records

### Monitoring:
Watch for these log messages:
- `Billing callback received:` - Callback invocations
- `Reinstall detected for` - Reinstall scenarios
- `ACTIVE subscription webhook received` - Webhook events

---

## 📊 Shopify App Store Compliance

This fix addresses the reviewer feedback:
> "implement the Billing API so it can accept, decline, and request approval for charges again on reinstall"

✅ **Accept**: Callback route handles ACTIVE status and upgrades plan  
✅ **Decline**: Callback route handles missing charge_id and keeps current plan  
✅ **Reinstall**: Auth route automatically requests approval for previous plan  

The implementation follows Shopify's best practices:
- Uses GraphQL Admin API for billing operations
- Properly verifies charge status before upgrading
- Handles all subscription states (ACTIVE/CANCELLED/EXPIRED/DECLINED/PENDING)
- Provides clear user feedback
- Supports test mode for development

---

## 🎉 Ready for Resubmission

The billing API is now fully compliant with Shopify App Store requirements. The app correctly handles all billing scenarios including charge acceptance, decline, and automatic approval requests on reinstall.

**Next Steps**:
1. Test all scenarios in development
2. Deploy to production
3. Run migration on production database
4. Resubmit to Shopify App Store with these fixes

