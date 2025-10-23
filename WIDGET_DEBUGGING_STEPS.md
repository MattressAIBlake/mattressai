# Widget Debugging Steps - Enabled But Not Showing

## Issue: Widget is enabled in theme editor but not appearing on store

---

## Step 1: Check Browser Console

Open your store page and press **F12** (or Cmd+Option+I on Mac) to open DevTools.

### Look for these messages:

**✅ Success (widget working):**
```
MattressAI Widget initialized {tenant: "...", ...}
Session started: {ok: true, sessionId: "...", ...}
```

**❌ Errors to look for:**
```
MattressAI: Root element not found
TypeError: Cannot read properties of null
Failed to start session
```

---

## Step 2: Check if Root Element Exists

In the browser Console tab, type:

```javascript
document.getElementById('mattressai-root')
```

### Expected Results:

**If it returns `null`:**
- The Liquid template isn't rendering
- Extension may not be properly deployed
- Theme may be stripping the embed

**If it returns an element:**
```javascript
<div id="mattressai-root" data-tenant="..." ...></div>
```
- ✅ Element exists
- Check if data attributes are populated
- Issue is likely in JavaScript initialization

---

## Step 3: Check Data Attributes

If the root element exists, check its attributes:

```javascript
const root = document.getElementById('mattressai-root');
console.log('Tenant:', root?.dataset.tenant);
console.log('All data:', root?.dataset);
```

**Should see:**
- `tenant`: Your shop domain
- `primaryColor`: Color code
- `widgetTitle`, `bubbleText`, etc.

**If missing:**
- Liquid template variables aren't being passed correctly

---

## Step 4: Check if Widget JavaScript Loaded

```javascript
window.MattressAI
```

**If `undefined`:**
- widget.js didn't load or execute
- Check Network tab for the widget.js request

**If object exists:**
- JavaScript loaded successfully
- Check: `window.MattressAI.initialized`

---

## Step 5: Manually Initialize (Test)

If widget JavaScript loaded but didn't initialize:

```javascript
window.MattressAI.init()
```

**Watch console for errors during initialization.**

---

## Step 6: Check for CSS/Visibility Issues

Even if initialized, widget might be hidden:

```javascript
const bubble = document.getElementById('mattressai-chat-bubble');
console.log('Bubble element:', bubble);
if (bubble) {
  console.log('Display:', getComputedStyle(bubble).display);
  console.log('Visibility:', getComputedStyle(bubble).visibility);
  console.log('Opacity:', getComputedStyle(bubble).opacity);
  console.log('Z-index:', getComputedStyle(bubble).zIndex);
  console.log('Position:', getComputedStyle(bubble).position);
}
```

**Should see:**
- `display: flex`
- `visibility: visible`
- `opacity: 1` or close to it
- `z-index: 9999`
- `position: fixed`

---

## Step 7: Check Network Requests

In DevTools → Network tab, filter by "mattressai":

### Expected requests:

| URL | Status | Notes |
|-----|--------|-------|
| `/apps/mattressai/widget.js?v=20` | 200 | Widget JavaScript |
| `/apps/mattressai/session/start` | 200 | Session initialization |

**If 404 or 500:**
- Check Vercel deployment
- Check app proxy configuration

---

## Step 8: Inspect DOM Structure

Look for these elements in the DOM:

```javascript
console.log('Root:', document.getElementById('mattressai-root'));
console.log('Bubble:', document.getElementById('mattressai-chat-bubble'));
console.log('Widget:', document.getElementById('mattressai-chat-widget'));
```

**Expected after initialization:**
- ✅ `mattressai-root` exists (from Liquid template)
- ✅ `mattressai-chat-bubble` exists (created by JavaScript)
- ❓ `mattressai-chat-widget` (only after opening)

---

## Step 9: Check Theme Compatibility

Some themes may conflict with app embeds:

```javascript
// Check for theme-specific issues
console.log('Body classes:', document.body.className);
console.log('Theme name:', Shopify?.theme?.name || 'Unknown');
```

Common conflicts:
- Themes with aggressive CSS resets
- Themes that modify fixed positioning
- Other chat widgets installed

---

## Step 10: Verify Extension Deployment

### Check if extension is actually deployed:

1. **Shopify Partner Dashboard:**
   - Go to your app
   - Click "Extensions"
   - Verify "mattressai-widget" is listed
   - Check "Status" is "Active"

2. **Or via CLI:**
   ```bash
   shopify app versions list
   ```

---

## Common Issues & Fixes

### Issue 1: Root element exists but no chat bubble

**Cause:** JavaScript initialization failed

**Debug:**
```javascript
window.MattressAI.init()  // Try manual init
```

Check console for errors during init.

---

### Issue 2: Chat bubble created but not visible

**Cause:** CSS conflict or z-index issue

**Fix:**
```javascript
const bubble = document.getElementById('mattressai-chat-bubble');
if (bubble) {
  bubble.style.zIndex = '999999';
  bubble.style.display = 'flex';
  bubble.style.opacity = '1';
}
```

---

### Issue 3: Extension enabled but root element missing

**Cause:** Extension not properly deployed or theme cache

**Fix:**
1. Re-deploy extension:
   ```bash
   npm run deploy
   ```

2. Clear theme cache:
   - Save theme again
   - Or edit theme.liquid and add/remove a space

3. Hard refresh browser: **Cmd+Shift+R**

---

### Issue 4: Widget shows in preview but not on live site

**Cause:** Different theme or not saved to published theme

**Fix:**
1. Make sure you're editing the **published/live** theme
2. Click "Save" in theme editor
3. Test on actual store URL (not preview URL)

---

### Issue 5: "Failed to start session"

**Cause:** Backend API issue

**Fix:**
1. Check Vercel logs
2. Verify DATABASE_URL env var
3. Test endpoint:
   ```bash
   curl -X POST https://freedommattressstl.com/apps/mattressai/session/start \
     -H "Content-Type: application/json" \
     -d '{"tenantId":"freedommattress.myshopify.com"}'
   ```

---

## Advanced Debugging Script

Run this in browser console for full diagnostic:

```javascript
(function() {
  console.log('=== MattressAI Widget Diagnostic ===');
  
  // Check root element
  const root = document.getElementById('mattressai-root');
  console.log('1. Root element:', root ? '✅ EXISTS' : '❌ MISSING');
  
  if (root) {
    console.log('   - Tenant:', root.dataset.tenant);
    console.log('   - Primary Color:', root.dataset.primaryColor);
    console.log('   - Bubble Text:', root.dataset.bubbleText);
  }
  
  // Check widget JavaScript
  console.log('2. Widget JS:', window.MattressAI ? '✅ LOADED' : '❌ NOT LOADED');
  
  if (window.MattressAI) {
    console.log('   - Initialized:', window.MattressAI.initialized);
    console.log('   - Session ID:', window.MattressAI.sessionId);
    console.log('   - Config:', window.MattressAI.config);
  }
  
  // Check bubble element
  const bubble = document.getElementById('mattressai-chat-bubble');
  console.log('3. Chat bubble:', bubble ? '✅ EXISTS' : '❌ MISSING');
  
  if (bubble) {
    const styles = getComputedStyle(bubble);
    console.log('   - Display:', styles.display);
    console.log('   - Visibility:', styles.visibility);
    console.log('   - Opacity:', styles.opacity);
    console.log('   - Z-index:', styles.zIndex);
    console.log('   - Position:', styles.position);
    console.log('   - Bottom:', styles.bottom);
    console.log('   - Right:', styles.right);
  }
  
  // Check for errors
  console.log('4. Check above for any JavaScript errors');
  
  console.log('=== End Diagnostic ===');
})();
```

---

## Next Steps Based on Results

### If root element is MISSING:
1. Re-deploy extension: `npm run deploy`
2. Re-enable in theme editor
3. Save theme
4. Hard refresh browser

### If root element EXISTS but widget JS NOT LOADED:
1. Check Network tab for widget.js request
2. Check for JavaScript errors
3. Verify app proxy is working

### If everything loaded but bubble MISSING:
1. Try manual init: `window.MattressAI.init()`
2. Check console for initialization errors
3. Check if another chat widget is conflicting

### If bubble EXISTS but HIDDEN:
1. Check z-index conflicts
2. Check CSS overrides
3. Try forcing visibility (see Issue 2 above)

---

## Contact Support With:

If still not working, collect this info:

1. **Console output** from diagnostic script above
2. **Network tab** screenshot showing mattressai requests
3. **Elements tab** screenshot showing (or not showing) mattressai-root
4. **Theme name** and any other chat apps installed
5. **Browser** and version
6. **Any JavaScript errors** in console

This will help identify the exact issue!

