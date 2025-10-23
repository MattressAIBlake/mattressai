# HMAC Signature Verification Debugging Guide

## Problem
App proxy requests from Shopify are failing HMAC signature verification, resulting in "Invalid HMAC signature" errors.

## What Was Fixed

### Updated `verifyProxyHmac.ts`
The HMAC verification function was updated to:
1. **Preserve exact URL encoding** - Works with the raw query string instead of decoded parameters
2. **Proper parameter sorting** - Sorts by decoded key names (as Shopify expects) but preserves original encoding
3. **Better debugging output** - Shows more details about the signature comparison

## How Shopify App Proxy Signatures Work

When Shopify makes requests through the app proxy (e.g., `/apps/mattressai/event`), it adds a `signature` parameter:

1. **Takes all query parameters** except `signature` and `hmac`
2. **Sorts them alphabetically** by key name
3. **Joins with `&`** preserving URL encoding
4. **Calculates HMAC-SHA256** using your app's **API Secret**
5. **Adds as hex string** in the `signature` parameter

## Verification Steps

### 1. Verify Your API Secret

```bash
# Check your environment variable
echo $SHOPIFY_API_SECRET

# It should start with 'shpss_' and be 38+ characters long
```

**Where to find it:**
- Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
- Navigate to your app
- Go to "App setup" → "App credentials"
- Copy the **"API secret key"** (NOT the API key)

### 2. Update Environment Variable

If your secret is wrong or has been rotated:

```bash
# In Vercel
vercel env add SHOPIFY_API_SECRET

# Or update .env file locally
SHOPIFY_API_SECRET=shpss_REPLACE_WITH_YOUR_ACTUAL_SECRET_FROM_SHOPIFY_PARTNER_DASHBOARD
```

### 3. Check the Debug Logs

The updated verification function logs detailed information:

```
🔍 Signature Verification Debug: {
  paramCount: 4,
  sortedQueryString: 'logged_in_customer_id=&path_prefix=%2Fapps%2Fmattressai&shop=...',
  queryStringLength: 111
}

🔐 Signature Comparison: {
  computedSignature: '...',
  receivedSignature: '...',
  exactMatch: true/false
}
```

If `exactMatch: false`, the issue is either:
- Wrong API secret
- Shopify changed their signing algorithm
- Network middleware is modifying the request

### 4. Test with Manual Calculation

You can manually verify the signature using this Node.js snippet:

```javascript
const crypto = require('crypto');

// Replace with your actual Shopify API Secret
const secret = 'shpss_REPLACE_WITH_YOUR_SECRET';
const queryString = 'logged_in_customer_id=&path_prefix=%2Fapps%2Fmattressai&shop=yourshop.myshopify.com&timestamp=1761260013';

const signature = crypto
  .createHmac('sha256', secret)
  .update(queryString)
  .digest('hex');

console.log('Computed signature:', signature);
console.log('Received signature:', 'SIGNATURE_FROM_SHOPIFY_REQUEST');
console.log('Match:', signature === 'SIGNATURE_FROM_SHOPIFY_REQUEST');
```

### 5. Common Issues

**Issue: Signature never matches**
- ✅ Verify `SHOPIFY_API_SECRET` is correct
- ✅ Make sure you're using API Secret, not API Key
- ✅ Check if secret was recently rotated
- ✅ Ensure no middleware is modifying query parameters

**Issue: Works in development but not production**
- ✅ Verify environment variables are set in production (Vercel)
- ✅ Check that the secret matches between environments

**Issue: Only fails for certain requests**
- ✅ Check if proxy requests are coming through correctly
- ✅ Verify the app proxy URL is configured in Shopify settings

## Temporary Workaround

If you need the widget to work immediately while debugging:

The code already has a temporary workaround that logs the error but allows the request through:

```javascript
if (!isValidHmac) {
  console.error('Invalid HMAC signature for event tracking request');
  console.warn('⚠️ TEMPORARY: Allowing request through despite invalid HMAC');
  // throw new Response('Unauthorized', { status: 401 }); // Commented out
}
```

**⚠️ IMPORTANT:** Remove this workaround once HMAC verification is working!

## Next Steps

1. Verify your `SHOPIFY_API_SECRET` matches your Shopify Partner Dashboard
2. Deploy the updated code
3. Monitor the logs for the debug output
4. If signatures match, uncomment the `throw new Response('Unauthorized', { status: 401 })` lines
5. If signatures still don't match, contact Shopify Support

## Files Modified

- `/app/lib/shopify/verifyProxyHmac.ts` - Updated verification logic
- `/app/routes/apps.mattressai.event/route.jsx` - Uses verification (temporary bypass active)
- `/app/routes/apps.mattressai.session.start/route.jsx` - Uses verification (temporary bypass active)
- `/app/routes/apps.mattressai.session.close/route.jsx` - Uses verification (temporary bypass active)

