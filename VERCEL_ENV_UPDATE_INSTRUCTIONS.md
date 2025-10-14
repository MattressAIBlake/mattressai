# Vercel Environment Variables Update Instructions

## DNS Error Fix - Required Environment Variable Updates

To fix the billing DNS error, you need to update your Vercel environment variables to use the correct production URL.

## Steps to Update

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/blake-austins-projects/mattressaishopify/settings/environment-variables

2. **Update SHOPIFY_APP_URL**
   - Find the existing `SHOPIFY_APP_URL` variable
   - Click "Edit"
   - Change the value to: `https://mattressaishopify.vercel.app`
   - Ensure "Production" is checked
   - Save changes

3. **Update HOST**
   - Find the existing `HOST` variable
   - Click "Edit"
   - Change the value to: `mattressaishopify.vercel.app` (without https://)
   - Ensure "Production" is checked
   - Save changes

## Important Notes

- **SHOPIFY_APP_URL** should include `https://`
- **HOST** should NOT include `https://`
- The code now automatically strips `https://` if present, preventing double protocol issues
- These URLs match your `application_url` in `shopify.app.toml`

## After Updating

1. **Redeploy your application** (or wait for the next automatic deployment)
   - Vercel will automatically redeploy when you update environment variables

2. **Test the billing flow**:
   - Go to your app in Shopify admin
   - Navigate to Plans & Billing
   - Click "Upgrade to Pro" or "Upgrade to Enterprise"
   - You should now be redirected to Shopify's billing approval page without DNS errors
   - After approving, you should be redirected back to: `https://mattressaishopify.vercel.app/app/admin/billing/callback?plan=pro`

## What Was Fixed

The DNS error was caused by the code prepending `https://` to environment variables that already contained `https://`, resulting in malformed URLs like:
```
https://https://mattressaishopify.vercel.app/...
```

The fix ensures that any `http://` or `https://` prefix is stripped before constructing the return URL, preventing this issue regardless of how the environment variables are configured.

## Verification

After deployment, check your server logs when clicking "Approve" on a billing charge. You should see:
```
returnUrl: https://mattressaishopify.vercel.app/app/admin/billing/callback?plan=pro
```

Not:
```
returnUrl: https://https://mattressaishopify.vercel.app/...
```

