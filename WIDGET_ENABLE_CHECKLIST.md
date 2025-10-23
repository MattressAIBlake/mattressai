# ✅ Widget Enable Checklist

## Before You Start
- [ ] App is installed on your Shopify store
- [ ] App has been granted required permissions
- [ ] Vercel deployment is live and working

---

## Deployment Steps

### 1️⃣ Deploy Extension to Shopify
```bash
npm run deploy
```
**Expected output:** ✓ Successfully deployed!

---

### 2️⃣ Enable in Shopify Theme Editor

**Navigation:**
```
Shopify Admin → Online Store → Themes → Customize (on active theme)
```

**Location in Theme Editor:**
```
Left Sidebar → Scroll to bottom → "App embeds" section
```

**Action:**
- [ ] Find "MattressAI Widget" or "MattressAI App Embed"
- [ ] Toggle switch to **ON** (enabled)
- [ ] Click **Save** button

---

### 3️⃣ Verify Widget is Live

**On your store:**
- [ ] Visit your store URL
- [ ] See chat bubble in bottom-right corner
- [ ] Bubble has text "Mattress Match" (or custom text)
- [ ] Clicking bubble opens chat widget
- [ ] Can send messages and receive responses

**In browser console (F12):**
- [ ] No JavaScript errors
- [ ] See: `MattressAI Widget initialized`
- [ ] See: `Session started: {ok: true, ...}`

**In Network tab (F12):**
- [ ] `GET /apps/mattressai/widget.js` → Status 200
- [ ] `POST /apps/mattressai/session/start` → Status 200

---

## Quick Verification Commands

### Check Local Configuration
```bash
./scripts/check-widget-status.sh
```

### Test Widget.js Endpoint (Production)
```bash
curl https://your-store.myshopify.com/apps/mattressai/widget.js
```
Should return JavaScript code (not 404).

### Test Session Start (Production)
```bash
curl -X POST https://your-store.myshopify.com/apps/mattressai/session/start \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"your-store.myshopify.com"}'
```
Should return: `{"ok":true,"sessionId":"...","variantId":"..."}`

---

## Troubleshooting Quick Reference

| Issue | Most Likely Cause | Fix |
|-------|------------------|-----|
| Widget not visible | App embed not enabled | Enable in theme editor |
| Chat bubble appears but no response | Backend/proxy issue | Check Vercel logs |
| 404 on widget.js | App proxy not configured | Check shopify.app.toml |
| "Root element not found" | Extension not enabled | Enable in theme editor |
| Works in preview but not live | Not saved or wrong theme | Save and check published theme |

---

## Expected File Structure

```
mattressaishopify/
├── extensions/
│   └── mattressai-widget/
│       ├── shopify.extension.toml     ← Extension config
│       ├── blocks/
│       │   └── app-embed.liquid       ← Widget HTML/Liquid
│       ├── assets/
│       │   ├── tracking.js            ← Analytics
│       │   └── widget.css             ← Styles
│       └── locales/
│           └── en.default.json        ← Translations
├── app/
│   └── routes/
│       ├── apps.mattressai.widget[.]js/
│       │   └── route.jsx              ← Serves widget.js
│       ├── apps.mattressai.session.start/
│       │   └── route.jsx              ← Starts sessions
│       ├── apps.mattressai.chat/
│       │   └── route.jsx              ← Handles chat
│       └── apps.mattressai.lead/
│           └── route.jsx              ← Lead capture
└── shopify.app.toml                   ← App config with proxy
```

---

## App Proxy Configuration

**In `shopify.app.toml`:**
```toml
[app_proxy]
url = "https://mattressaishopify.vercel.app/apps/mattressai"
subpath = "mattressai"
prefix = "apps"
```

**This creates:**
- Store URL: `https://your-store.myshopify.com/apps/mattressai/*`
- Backend URL: `https://mattressaishopify.vercel.app/apps/mattressai/*`

**All widget requests flow through this proxy.**

---

## Environment Variables (Vercel)

Required for widget functionality:
```bash
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
OPENAI_API_KEY=...
```

---

## Widget Customization Options

Once enabled, merchants can customize in theme editor:

**Appearance:**
- Bubble style (icon/text)
- Bubble text content
- Bubble size
- Position (left/right)
- Bottom/side spacing

**Branding:**
- Primary color
- Avatar background
- Header text color

**Content:**
- Widget title
- Widget subtitle
- Welcome message
- Avatar style (text/image)
- Avatar text/image

**Behavior:**
- Auto-open on first visit

---

## Success Criteria

✅ **Widget is working if:**
1. Chat bubble appears on store
2. Clicking bubble opens chat widget
3. Can send messages
4. Receives AI responses
5. Product recommendations display correctly
6. Lead form appears when triggered
7. No errors in browser console
8. Network requests succeed (200 status)

---

## Quick Links

- [Full Deployment Guide](WIDGET_DEPLOYMENT_GUIDE.md)
- [Quick Fix Guide](WIDGET_QUICK_FIX.md)
- [Extension Config](extensions/mattressai-widget/shopify.extension.toml)
- [Widget Template](extensions/mattressai-widget/blocks/app-embed.liquid)
- [Widget Route](app/routes/apps.mattressai.widget[.]js/route.jsx)

---

## Most Common Mistake ⚠️

**Forgetting to enable the app embed in the theme editor!**

The extension can be deployed successfully, but it won't show on the store until you:
1. Go to theme editor
2. Find "App embeds" section
3. Toggle MattressAI Widget ON
4. Save

**This is the #1 reason why "the widget isn't showing"!**

---

## Development vs Production

### Development
```bash
npm run dev
# Widget updates automatically with hot-reload
```

### Production
```bash
# Deploy extension
npm run deploy

# Deploy backend
vercel --prod

# Enable in theme editor
# (Manual step in Shopify Admin)
```

---

## Support Resources

1. **Check widget status:** `./scripts/check-widget-status.sh`
2. **Browser console:** Press F12, check Console tab
3. **Network tab:** Press F12, check Network tab for failed requests
4. **Vercel logs:** Check for backend errors
5. **Shopify App Settings:** Verify proxy configuration

---

**📅 Last Updated:** $(date +%Y-%m-%d)

**🔖 Quick Command Reference:**
```bash
# Deploy
npm run deploy

# Check status
./scripts/check-widget-status.sh

# Dev mode
npm run dev

# Test endpoint
curl https://your-store.myshopify.com/apps/mattressai/widget.js
```

