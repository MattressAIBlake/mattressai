# How to Verify Your Shopify Secret is Correct

## 1. Get the Secret from Shopify Partners

1. Go to: https://partners.shopify.com/
2. Navigate to: **Apps → MattressAI → Configuration**
3. Scroll to: **"App credentials"** or **"Client credentials"** section
4. Click: **[Show]** next to "Client secret"
5. **Copy the ENTIRE value** (triple-click to select all)

## 2. Verify the Secret Format

Paste it into a text editor and check:

- ✅ Should start with: `shpss_`
- ✅ Should be approximately 48-64 characters long
- ❌ Should NOT have spaces before or after
- ❌ Should NOT contain line breaks
- ❌ Should NOT be the Client ID (which is: `6b1ed5786311fcaad075b3a7cc5f348e`)

Example format: `shpss_` followed by approximately 40-60 alphanumeric characters

## 3. Add to Vercel

1. Go to: https://vercel.com/blake-austins-projects/mattressaishopify/settings/environment-variables
2. Find: `SHOPIFY_API_SECRET`
3. Click: **"⋯"** menu → **"Edit"**
4. Paste the secret (ensure no extra spaces)
5. Verify: **Production** is checked ✅
6. Click: **"Save"**

## 4. Redeploy

1. Go to: **Deployments** tab
2. Click: **"⋯"** on latest → **"Redeploy"**
3. Uncheck: "Use existing Build Cache"
4. Click: **"Redeploy"**

## 5. If It Still Doesn't Work

The issue might be that Shopify's App Proxy HMAC calculation is different from what we expect.
We'll implement a temporary bypass to get your widget working while we investigate.

