# Testing the Chat Reset Fix

## Quick Test Instructions

### 1. Restart Development Server (if running)
```bash
# If your dev server is running, restart it to pick up changes
# Press Ctrl+C to stop, then run:
npm run dev
```

### 2. Clear Browser Cache
The widget JavaScript may be cached in your browser. To ensure you're testing the new version:

**Chrome/Edge:**
- Open DevTools (F12)
- Go to Network tab
- Check "Disable cache"
- Keep DevTools open while testing

**Or use incognito/private mode**

### 3. Test the Fix

#### Test Case 1: Simple Page Refresh
1. Open your storefront in a browser
2. Click the chat bubble to open the widget
3. Send a message: "Hello, I need help with mattresses"
4. Wait for AI response
5. **Refresh the page (F5)**
6. Open the chat widget again
7. ✅ **Expected:** Chat should be empty with only the welcome message

#### Test Case 2: Navigate Between Pages
1. Go to a product page
2. Open chat and send: "What's the price of this product?"
3. Wait for response
4. Navigate to a different product page
5. Open chat again
6. ✅ **Expected:** Chat should be fresh, no previous messages

#### Test Case 3: Close Tab and Reopen
1. Open chat and have a conversation
2. Close the browser tab completely
3. Open the same page again in a new tab
4. Open chat
5. ✅ **Expected:** Completely fresh conversation

### 4. Verify in Browser Console

Open browser DevTools Console (F12 → Console tab) and look for:
```
MattressAI Widget initialized {config...}
```

You should see a new initialization log on each page load.

### 5. Check Network Requests

In DevTools → Network tab:
1. Filter by "mattressai"
2. Look for the chat request when you send a message
3. Click on it and check the "Payload" tab
4. You should see a `conversation_id` that starts with "conv_" followed by a timestamp
5. On page refresh and new message, the `conversation_id` should be different

## What Changed

### Before Fix ❌
- Conversation ID stored in `sessionStorage`
- Persisted across page loads
- Chat history carried over
- AI remembered previous conversation

### After Fix ✅
- Conversation ID generated fresh on each page load
- Stored in memory only
- Chat starts clean every time
- No memory of previous conversations

## Troubleshooting

### Issue: Still seeing old messages
**Solution:** Clear browser cache completely or test in incognito/private mode

### Issue: Widget not loading
**Solution:** 
1. Check browser console for errors
2. Ensure dev server is running
3. Check that the mattressai-root element exists on the page

### Issue: Changes not appearing
**Solution:**
1. Restart development server
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear sessionStorage manually in console:
   ```javascript
   sessionStorage.clear();
   location.reload();
   ```

## Production Deployment

Once testing is complete, deploy using:
```bash
npm run build
npm run deploy
# or
shopify app deploy
```

Note: The widget script may be cached by CDN or browsers. Users may need to clear cache or wait for cache expiration to see the update.

