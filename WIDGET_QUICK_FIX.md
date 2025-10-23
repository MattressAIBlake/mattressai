# 🚀 Widget Not Showing? Quick Fix!

## TL;DR - The Most Likely Reason

**Your widget extension needs to be enabled in the Shopify theme editor.**

Shopify Theme App Extensions (app embeds) are **disabled by default** and must be manually turned ON by the merchant.

---

## ✅ Step-by-Step Fix (5 Minutes)

### Step 1: Deploy Extension (If Not Done Yet)

```bash
npm run deploy
```

**What this does:**
- Pushes your widget extension to Shopify
- Makes it available in the theme editor
- Only needs to be done once (or when you update the extension)

**Expected output:**
```
✓ Deploying your extension(s)
✓ Building extensions...
✓ Successfully deployed!
```

---

### Step 2: Enable in Theme Editor

#### 2.1 - Navigate to Theme Editor
1. Go to your **Shopify Admin** (`https://your-store.myshopify.com/admin`)
2. Click **Online Store** in left sidebar
3. Click **Themes**
4. Click **Customize** button on your active theme

#### 2.2 - Find App Embeds Section
1. In the theme editor **left sidebar**
2. Scroll all the way to the **bottom**
3. Look for a section called **"App embeds"**

   ```
   ┌─────────────────────────┐
   │ Theme settings          │
   │  ├─ Logo                │
   │  ├─ Colors              │
   │  └─ Typography          │
   │                         │
   │ Sections                │
   │  ├─ Header              │
   │  ├─ Footer              │
   │  └─ ...                 │
   │                         │
   │ ▼ App embeds           │  ← Click here to expand
   │  ├─ MattressAI Widget  │  ← Your widget should appear here
   │  └─ Other apps...       │
   └─────────────────────────┘
   ```

#### 2.3 - Enable MattressAI Widget
1. Find **"MattressAI Widget"** or **"MattressAI App Embed"** in the list
2. Click on it to see settings (optional)
3. **Toggle the switch to ON** (it will turn green/blue)
4. Click **Save** in the top-right corner

---

### Step 3: Test on Your Store

1. **Open your store** in a new browser tab
   - Example: `https://your-store.myshopify.com`
   - Or use your custom domain

2. **Look for the chat bubble**
   - Should appear in the **bottom-right corner**
   - Default text: "Mattress Match"
   - Should have a blue background

3. **Click the bubble**
   - Chat widget should slide up
   - You should see a welcome message
   - Quick reply buttons should be visible

4. **Send a test message**
   - Type anything and press Enter
   - You should see a loading animation
   - AI should respond within a few seconds

---

## 🎨 Customize Widget Appearance (Optional)

Once enabled, you can customize the widget in the theme editor:

1. In **App embeds** section, click on **"MattressAI Widget"**
2. You'll see customization options:

### Chat Bubble
- **Bubble style:** Icon only or Text
- **Bubble text:** Customize the text (default: "Mattress Match")
- **Bubble size:** 52px - 80px

### Position
- **Horizontal position:** Left or Right side
- **Bottom spacing:** Distance from bottom (10-100px)
- **Side spacing:** Distance from edge (10-100px)

### Colors & Branding
- **Primary color:** Main button/header color
- **Avatar background:** Background for assistant avatar
- **Header text color:** Text color in widget header

### Widget Text
- **Widget title:** Main heading (default: "Chat with us")
- **Widget subtitle:** Subtitle text (default: "We're here to help")
- **Welcome message:** First message shown (default: "Hi! How can we help you today?")

### Avatar
- **Avatar style:** Text initials or Custom image
- **Avatar text:** 1-2 characters (default: "AI")
- **Avatar image:** Upload custom avatar (optional)

### Behavior
- **Auto open on first visit:** Automatically open chat for new visitors

---

## 🔍 Troubleshooting

### Widget Still Not Showing?

#### 1. Check Browser Console
- Press **F12** to open DevTools
- Go to **Console** tab
- Look for errors or these success messages:
  ```
  MattressAI Widget initialized {tenant: "...", ...}
  Session started: {ok: true, sessionId: "...", ...}
  ```

#### 2. Check if Widget Root Element Exists
In the Console tab, type:
```javascript
document.getElementById('mattressai-root')
```

**If it returns `null`:**
- The app embed is not enabled
- Go back to Step 2 above

**If it returns an element:**
- The embed is enabled
- Check for JavaScript errors in console

#### 3. Check Network Tab
- In DevTools, go to **Network** tab
- Refresh the page
- Look for these requests:

| Request | Expected Status | What It Does |
|---------|----------------|--------------|
| `/apps/mattressai/widget.js` | 200 | Loads widget JavaScript |
| `/apps/mattressai/session/start` | 200 | Starts chat session |

**If you see 404 errors:**
- App proxy may not be configured correctly
- Check `shopify.app.toml` for `[app_proxy]` section

#### 4. Clear Cache & Hard Reload
- Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- This forces browser to reload all files

#### 5. Check App Installation
- Make sure the app is installed on the store
- Go to: **Shopify Admin → Apps**
- Verify **MattressAI** is in the list

---

## 📝 Common Scenarios

### Scenario 1: "I just installed the app"
✅ **Do this:**
1. Deploy extension: `npm run deploy`
2. Enable in theme editor (Steps above)

### Scenario 2: "I updated the widget code"
✅ **Do this:**
1. Re-deploy: `npm run deploy`
2. Hard refresh store page: **Cmd+Shift+R**

### Scenario 3: "It worked before, now it's gone"
✅ **Check this:**
1. Merchant may have disabled it in theme editor
2. Theme may have been changed/updated
3. Re-enable in theme editor (Steps above)

### Scenario 4: "It shows in preview but not on live store"
✅ **Do this:**
1. Make sure you clicked **Save** in theme editor
2. Check that you're viewing the **live/published** theme
3. Enable app embed on the published theme

---

## 🎯 Quick Commands

```bash
# Check widget status
./scripts/check-widget-status.sh

# Deploy extension
npm run deploy

# Start dev mode with extension hot-reload
npm run dev

# View widget configuration
cat extensions/mattressai-widget/shopify.extension.toml

# Test widget.js endpoint locally
curl http://localhost:3000/apps/mattressai/widget.js

# Test session start locally
curl -X POST http://localhost:3000/apps/mattressai/session/start \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"test.myshopify.com"}'
```

---

## 🎬 What Should Happen When Working

### 1. Page Load
```
→ Store page loads
→ mattressai-root div is injected by Liquid template
→ widget.js loads from app proxy
→ Widget initializes
→ Session starts via /apps/mattressai/session/start
→ Chat bubble appears in corner
```

### 2. User Clicks Bubble
```
→ Chat widget slides up
→ Welcome message appears
→ Quick reply buttons show
→ User can type messages
```

### 3. User Sends Message
```
→ Message appears in chat
→ Loading indicator shows
→ POST to /apps/mattressai/chat
→ AI response streams back
→ Response appears in chat
```

### 4. Product Recommendations
```
→ AI analyzes preferences
→ Queries product database
→ Returns matching products
→ Product cards display with:
  - Images
  - Prices
  - Fit scores
  - "Why it fits" reasons
  - "View Product" buttons
```

---

## 💡 Pro Tips

1. **Test in incognito mode** to see the first-time user experience
2. **Enable auto-open** to show widget to new visitors automatically
3. **Customize colors** to match your brand
4. **Use custom avatar image** for a more personalized feel
5. **Monitor browser console** during development for debugging

---

## 📚 Related Documentation

- [`WIDGET_DEPLOYMENT_GUIDE.md`](WIDGET_DEPLOYMENT_GUIDE.md) - Full detailed guide
- [`extensions/mattressai-widget/blocks/app-embed.liquid`](extensions/mattressai-widget/blocks/app-embed.liquid) - Widget template
- [`app/routes/apps.mattressai.widget[.]js/route.jsx`](app/routes/apps.mattressai.widget[.]js/route.jsx) - Widget JavaScript

---

## 🆘 Still Having Issues?

1. **Run diagnostics:**
   ```bash
   ./scripts/check-widget-status.sh
   ```

2. **Check these files exist:**
   - `extensions/mattressai-widget/shopify.extension.toml` ✓
   - `extensions/mattressai-widget/blocks/app-embed.liquid` ✓
   - `extensions/mattressai-widget/assets/tracking.js` ✓
   - `extensions/mattressai-widget/assets/widget.css` ✓

3. **Verify app proxy in `shopify.app.toml`:**
   ```toml
   [app_proxy]
   url = "https://mattressaishopify.vercel.app/apps/mattressai"
   subpath = "mattressai"
   prefix = "apps"
   ```

4. **Check Vercel deployment:**
   - Make sure app is deployed to Vercel
   - Environment variables are set
   - No errors in Vercel logs

---

**🎉 Once enabled, your widget should be live and working!**

The chat bubble will appear on all pages of your store, and customers can interact with the AI assistant to find the perfect mattress.

