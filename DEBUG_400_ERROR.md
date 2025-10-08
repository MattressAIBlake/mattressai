# Debug 400 Bad Request Error - Billing Page

## How to See the Actual Error

The 400 error has details we need to see. Follow these steps:

### Step 1: Check Network Tab Response

1. Open your app in Shopify admin
2. Open Browser DevTools (F12 or Cmd+Option+I)
3. Go to **Network** tab
4. Click "Upgrade to Pro" button
5. Find the failed request: `POST /app/admin/plans?_data=routes%2Fapp.admin.plans`
6. Click on it
7. Click **Response** tab
8. **Copy the entire response** and share it

It will show something like:
```json
{
  "error": "Failed to create subscription",
  "details": "actual error message here"
}
```

### Step 2: Check Vercel Function Logs

1. Go to https://vercel.com/dashboard
2. Click your `mattressaishopify` project
3. Go to **Deployments** tab
4. Click the **latest deployment** (top of list)
5. Click **Functions** tab
6. Find the function named `api/index` or similar
7. Click on it to see live logs
8. Try clicking "Upgrade" again while watching logs
9. **Copy any error messages** you see

### Step 3: Add Better Error Logging

We can add more detailed logging to help debug. But first, let's see what the error actually says.

---

## Common Causes of 400 Error

Based on the code, here are the possible causes:

### 1. Invalid Plan Name
```javascript
if (!planConfig) {
  return json({ error: 'Invalid plan' }, { status: 400 });
}
```
**What to check**: Make sure the button is sending `planName: 'pro'` or `planName: 'enterprise'`

### 2. GraphQL userErrors
```javascript
if (result.userErrors && result.userErrors.length > 0) {
  return json({ 
    error: 'Failed to create subscription',
    details: result.userErrors.map(e => e.message).join(', ')
  }, { status: 400 });
}
```
**Common userErrors**:
- "Billing is not enabled for this app"
- "Invalid return URL"
- "Missing required fields"
- "App does not have billing permission"

### 3. Missing Shopify API Credentials
- `SHOPIFY_API_KEY` not set
- `SHOPIFY_API_SECRET` not set
- Authentication failing

### 4. GraphQL Request Failed
The `admin.graphql()` call might be failing if:
- Admin API access not configured
- OAuth scopes missing
- Network/connection issue

---

## Quick Diagnostic Check

Can you check these in your browser console right now?

### In the Network Tab Response:

Look for the actual error response. It should say something specific like:

**Example 1 - Invalid Plan:**
```json
{"error": "Invalid plan"}
```
→ Button sending wrong plan name

**Example 2 - Billing Not Enabled:**
```json
{
  "error": "Failed to create subscription",
  "details": "Billing is not enabled for this app"
}
```
→ Need to enable billing in Shopify Partners

**Example 3 - Missing API Key:**
```json
{
  "error": "Failed to create billing charge",
  "details": "Cannot read properties of undefined..."
}
```
→ Environment variables not set

---

## Next Steps

Please share:
1. ✅ **The Response body** from Network tab (exact error message)
2. ✅ **Vercel Function logs** (if any errors shown)

Then I can give you the exact fix!

