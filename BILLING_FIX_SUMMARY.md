# Billing Fix Summary

## Issue
When clicking "Upgrade Plan" on the Plans & Billing page, a 500 error occurred:
```
mattressaishopify.vercel.app/app/admin/plans?_data=routes%2Fapp.admin.plans:1
Failed to load resource: the server responded with a status of 500
```

## Root Cause
The billing object from `authenticate.admin(request)` was not properly configured in the Shopify App Remix package, causing the `billing.request()` and `billing.require()` methods to fail.

## Solution

### 1. Updated Billing Action (`app/routes/app.admin.plans/route.jsx`)
- **Changed from**: Using the `billing` object with `billing.require()` and `billing.request()`
- **Changed to**: Using the `admin.graphql()` method to directly call Shopify's AppSubscriptionCreate mutation
- **Benefits**: 
  - More reliable and explicit
  - Works with any version of Shopify App Remix
  - Better error handling with GraphQL userErrors

### 2. Removed Billing Configuration (`app/shopify.server.js`)
- Removed the billing configuration from `shopifyApp()` as it wasn't compatible with the package version
- The GraphQL approach doesn't require this configuration

### 3. Added Webhook Handler (`app/routes/webhooks.app_subscriptions.update/route.jsx`)
- Created new webhook handler to process app subscription updates
- Automatically upgrades tenant to paid plan when subscription becomes ACTIVE
- Automatically downgrades tenant to starter plan when subscription is CANCELLED or EXPIRED
- Uses `upgradePlan()` and `downgradePlan()` from `billing.service.ts`

### 4. Updated Webhook Router (`app/routes/api.webhooks.jsx`)
- Added case for `APP_SUBSCRIPTIONS_UPDATE` to acknowledge the webhook

## How It Works Now

1. **User clicks "Upgrade Plan"**
   - Frontend sends POST request with plan name (pro/enterprise)
   
2. **Server creates subscription**
   - Uses GraphQL Admin API to call `appSubscriptionCreate` mutation
   - Includes plan name, price, return URL, and test mode flag
   - Returns confirmation URL from Shopify
   
3. **User confirms in Shopify**
   - Redirected to Shopify's billing confirmation page
   - User approves or declines the charge
   
4. **Shopify sends webhook**
   - `app_subscriptions/update` webhook fired when status changes
   - Our webhook handler updates the tenant record in database
   - Plan features and quotas are updated

## Testing Checklist

- [x] No linter errors
- [ ] Test upgrade flow in development with test charges
- [ ] Verify webhook handler receives and processes updates
- [ ] Confirm tenant plan is updated in database
- [ ] Test return URL after approval/decline
- [ ] Verify downgrade when subscription is cancelled

## Files Changed

1. `app/routes/app.admin.plans/route.jsx` - Updated action to use GraphQL
2. `app/shopify.server.js` - Removed incompatible billing config
3. `app/routes/webhooks.app_subscriptions.update/route.jsx` - New webhook handler
4. `app/routes/api.webhooks.jsx` - Added APP_SUBSCRIPTIONS_UPDATE case

## Additional Notes

- The GraphQL mutation uses `test: true` in non-production environments for safe testing
- Return URL points back to the Plans page for seamless UX
- Webhook handler includes comprehensive logging for debugging
- All existing billing service functions (`upgradePlan`, `downgradePlan`) are reused

