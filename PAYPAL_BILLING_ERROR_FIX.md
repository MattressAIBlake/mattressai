# PayPal Billing Error Fix

## Error: "Expected intent=tokenize...but got intent=capture"

This error appears on Shopify's billing approval page and indicates a PayPal/Shopify configuration issue.

## Why This Happens

- **Our app**: Correctly creates recurring subscriptions using `appRecurringPricingDetails`
- **Shopify**: Creates a billing approval page
- **PayPal SDK on Shopify's page**: Misconfigured for one-time payments instead of recurring billing

## Solutions

### Option 1: Use Shopify Payments (Recommended for Testing)

1. Go to your Shopify Admin → Settings → Payments
2. Activate **Shopify Payments** (the recommended payment provider)
3. This will properly support recurring billing in test mode
4. Try the upgrade flow again

### Option 2: Ignore in Test Mode

The error appears in test mode but doesn't prevent testing:
- You can still "approve" test charges despite the error
- Click through the approval process (Shopify usually adds a "test approve" button)
- The subscription will be created in test mode
- This error typically doesn't appear in production with real payment methods

### Option 3: Configure PayPal for Recurring Billing

If you must use PayPal:
1. Your PayPal account must support **Reference Transactions**
2. Contact PayPal to enable this feature (it's not enabled by default)
3. Configure it in Shopify Settings → Payments → PayPal

### Option 4: Set Production Mode (Not Recommended Yet)

To disable test mode:
1. In Vercel, set environment variable: `NODE_ENV=production`
2. Redeploy the app
3. **WARNING**: This will charge REAL money for subscriptions!
4. Only do this when ready for production billing

## What We're Already Doing Correctly

Our code in `app/routes/app.admin.plans/route.jsx`:

```javascript
test: process.env.NODE_ENV !== 'production'
```

This automatically:
- Uses test mode in development (safe, no real charges)
- Uses production mode when NODE_ENV=production (real charges)

## Recommended Testing Flow

1. Use Shopify Payments for testing (Option 1)
2. Complete the billing flow in test mode
3. Verify the subscription appears as "TEST" in your Shopify admin
4. Before App Store submission, switch to production mode and test with real payment methods

## Vercel Environment Check

On Vercel, verify your environment variables:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Check `NODE_ENV`:
  - `development` = Test mode billing (safe for testing, may show PayPal errors)
  - `production` = Real billing (charges real money, proper PayPal setup)
- For development/testing, keep it as `development`

## Still Having Issues?

If the error persists even with Shopify Payments:
1. Check console for any app errors
2. Share the full URL of the billing page
3. Share any server-side logs from Vercel
4. This may be a Shopify platform issue requiring their support

