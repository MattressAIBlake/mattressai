# Widget Deployment & Troubleshooting Guide

## Why Your Widget Isn't Showing

The MattressAI widget is built as a **Shopify Theme App Extension** (app embed). This means it requires manual activation in the Shopify theme editor.

---

## Quick Fix (Most Common Issue)

### Enable the App Embed in Theme Editor

1. **Go to Shopify Admin**
   - Open your store's Shopify admin panel

2. **Navigate to Themes**
   - Go to **Online Store → Themes**

3. **Open Theme Editor**
   - Click **Customize** on your active/live theme

4. **Find App Embeds Section**
   - In the theme editor sidebar (left side)
   - Scroll down to find the **App embeds** section
   - It's usually at the bottom of the sidebar

5. **Enable MattressAI Widget**
   - Look for **"MattressAI Widget"** or **"MattressAI App Embed"**
   - Toggle the switch to **ON** (enabled)

6. **Save Changes**
   - Click **Save** in the top-right corner

7. **Test**
   - Open your store in a new tab
   - The chat bubble should now appear in the bottom-right corner

---

## Deploy Extension (If Not Yet Deployed)

If the app embed doesn't appear in the theme editor, you need to deploy it first:

```bash
# Navigate to project directory
cd /Users/blakeaustin/Desktop/mattressaishopify

# Deploy the extension
npm run deploy
# or
shopify app deploy
```

After deployment:
- Go back to the theme editor
- The app embed should now appear in the "App embeds" section
- Enable it as described above

---

## Verify Extension Configuration

Check that your extension is properly configured:

### File: `extensions/mattressai-widget/shopify.extension.toml`

```toml
name = "mattressai-widget"
uid = "78ad7021-e7ab-3ad0-3bbf-d4da6b7a1e67e56ab847"
type = "theme"
handle = "mattressai-widget"

[[extensions]]
type = "theme_app_extension"
name = "MattressAI App Embed"
handle = "mattressai-app-embed"
```

### File: `extensions/mattressai-widget/blocks/app-embed.liquid`

The widget initialization code is in this file and should include:
- `<div id="mattressai-root">` with configuration data attributes
- Script tags loading `tracking.js` and `widget.js`
- Link to `widget.css`

---

## Troubleshooting Checklist

### 1. App Installation
- [ ] App is installed on the store
- [ ] App has required permissions granted

### 2. Extension Deployment
- [ ] Extension has been deployed via Shopify CLI
- [ ] Extension appears in Shopify Partner Dashboard under "Extensions"

### 3. Theme Editor Configuration
- [ ] App embed appears in theme editor "App embeds" section
- [ ] App embed is toggled ON (enabled)
- [ ] Theme changes have been saved

### 4. App Proxy Configuration
The widget relies on the app proxy to work. Verify in `shopify.app.toml`:

```toml
[app_proxy]
url = "https://mattressaishopify.vercel.app/apps/mattressai"
subpath = "mattressai"
prefix = "apps"
```

This creates the proxy path: `https://your-store.myshopify.com/apps/mattressai/*`

### 5. Browser Console Check
Open your store and check the browser console (F12):

**Expected logs:**
```
MattressAI Widget initialized {tenant: "your-store.myshopify.com", ...}
Session started: {ok: true, sessionId: "...", ...}
```

**Common errors:**
- `MattressAI: Root element not found` → Extension not enabled in theme
- `404 on /apps/mattressai/widget.js` → App proxy not configured
- `Failed to start session` → Backend route issue

### 6. Network Tab Check
Check browser Network tab (F12 → Network):

**Expected requests:**
- `GET /apps/mattressai/widget.js` → Status 200
- `POST /apps/mattressai/session/start` → Status 200

---

## Widget Configuration Options

Once enabled, you can customize the widget appearance:

1. **In Theme Editor:**
   - Click on "MattressAI Widget" in the App embeds section
   - Adjust settings like:
     - Chat bubble style (icon/text)
     - Bubble text
     - Bubble size
     - Position (left/right)
     - Colors (primary, avatar background, header text)
     - Widget title and subtitle
     - Welcome message
     - Avatar style (text/image)
     - Auto-open behavior

2. **Live Preview:**
   - Changes in the theme editor show in real-time
   - Test different configurations before saving

---

## Testing Widget Functionality

After the widget appears:

1. **Chat Bubble:**
   - Should appear in bottom-right (or left if configured)
   - Should have the configured text/icon

2. **Click to Open:**
   - Clicking bubble should open the chat widget
   - Widget should slide up smoothly

3. **Send Message:**
   - Type a message and press Enter
   - Should see loading indicator
   - Should receive AI response

4. **Product Recommendations:**
   - Ask about mattress preferences
   - Should see product cards with images and details
   - "View Product" button should work

---

## Common Issues & Solutions

### Widget Not Appearing
**Cause:** App embed not enabled  
**Solution:** Follow "Enable App Embed" steps above

### Widget Loads But No Response
**Cause:** App proxy or backend issue  
**Solution:** Check console for errors, verify app proxy configuration

### Widget Styles Look Broken
**Cause:** CSS not loading properly  
**Solution:** Check that `widget.css` exists in `extensions/mattressai-widget/assets/`

### Session Start Fails
**Cause:** Database connection or backend route issue  
**Solution:** Check Vercel logs, verify DATABASE_URL is set

### Products Not Showing
**Cause:** Products not indexed or API issue  
**Solution:** Run product indexing from admin dashboard

---

## Development vs Production

### Development (Local Testing)
```bash
# Start dev server with extension hot-reload
npm run dev
# or
shopify app dev
```

The extension will auto-update when you edit files.

### Production (Vercel Deployment)
```bash
# Deploy extension to production
shopify app deploy

# Deploy app backend to Vercel
vercel --prod
```

After deployment, enable the app embed in your live theme.

---

## Support

If issues persist after following this guide:

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for failed requests
3. **Check Vercel Logs** for backend errors
4. **Verify all environment variables** are set in Vercel

---

## Quick Reference: Widget URLs

When properly configured, these URLs should work:

- **Widget Script:** `https://your-store.myshopify.com/apps/mattressai/widget.js`
- **Session Start:** `https://your-store.myshopify.com/apps/mattressai/session/start`
- **Chat API:** `https://your-store.myshopify.com/apps/mattressai/chat`
- **Lead Capture:** `https://your-store.myshopify.com/apps/mattressai/lead`

All these route through the **app proxy** to your Vercel backend:
`https://mattressaishopify.vercel.app/apps/mattressai/*`

