# Chat Widget Reset Fix

## Problem
The chat widget was not resetting the conversation when users left the page and came back. The chat memory persisted across page navigations, causing the AI to remember previous conversations even on new visits.

## Root Cause
The conversation ID was being stored in `sessionStorage`, which persists for the entire browser tab session - even when users navigate away and come back to the page.

## Solution
Modified the widget to generate a fresh conversation ID on each page load instead of persisting it in `sessionStorage`.

## Changes Made

### File: `app/routes/apps.mattressai.widget[.]js/route.jsx`

#### 1. Added `conversationId` property to MattressAI object
```javascript
const MattressAI = {
  initialized: false,
  config: {},
  sessionId: null,
  conversationId: null,  // Added this property
  variantId: null,
  compareList: [],
  unreadCount: 0,
  isOpen: false,
  stickToBottom: true,
  lastDayLabel: null,
```

#### 2. Clear chat-specific storage on initialization
```javascript
init: function() {
  // Clear chat-specific storage items for a fresh conversation on each page load
  sessionStorage.removeItem('mattressai_lead_form_shown');
  sessionStorage.removeItem('mattressai_widget_open');
  sessionStorage.removeItem('mattressai_unread');
  
  // ... rest of initialization
}
```

#### 3. Modified `getConversationId()` to use in-memory storage
**Before:**
```javascript
getConversationId: function() {
  let conversationId = sessionStorage.getItem('mattressai_conversation_id');
  if (!conversationId) {
    conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('mattressai_conversation_id', conversationId);
  }
  return conversationId;
}
```

**After:**
```javascript
getConversationId: function() {
  // Generate a fresh conversation ID on each page load
  // Store in a property instead of sessionStorage so it resets on page reload
  if (!this.conversationId) {
    this.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  return this.conversationId;
}
```

## How It Works

1. **On Page Load:** When the user visits a page with the chat widget, the `init()` function runs
2. **Clear Storage:** Chat-specific sessionStorage items are cleared (conversation state, lead form shown, widget open state, unread count)
3. **Generate New ID:** A new conversation ID is generated and stored in memory (as a property of the MattressAI object)
4. **Fresh Conversation:** When messages are sent, they use the new conversation ID, which has no history in the database
5. **On Page Reload:** The process repeats, generating a new conversation ID and starting fresh

## What Persists vs What Resets

### Resets on Each Page Load ✓
- Conversation ID (new chat)
- Chat messages
- Widget open/closed state
- Unread message count
- Lead form shown status

### Persists Across Page Loads
- Session ID (for analytics)
- Variant ID (for A/B testing)
- Visited flag (for auto-open behavior)

## Testing

To test the fix:

1. **Open the storefront** with the chat widget
2. **Start a conversation** with the AI assistant
3. **Ask a few questions** and get responses
4. **Refresh the page** or navigate to another page and come back
5. **Open the chat widget** again
6. **Verify:** The chat should be empty with only the welcome message, no previous conversation history

### Expected Behavior
- ✅ Chat starts fresh with welcome message
- ✅ No previous messages visible
- ✅ AI doesn't reference previous conversation
- ✅ Lead form can be shown again (if configured)

### Test Cases
1. **Simple Refresh:** Chat on page → F5 refresh → Chat again
2. **Navigation:** Chat on Product A → Navigate to Product B → Chat again
3. **Tab Close/Reopen:** Chat → Close tab → Reopen page → Chat again
4. **Multiple Users:** User A chats → User B opens same page → Should not see User A's chat

## Deployment

No database changes or environment variables required. The fix is entirely client-side in the widget JavaScript.

### Deploy Steps
1. Commit the changes
2. Deploy to production
3. The widget script is served with cache-control headers, but may need time to propagate
4. Clear CDN cache if applicable
5. Test on a live storefront

## Notes

- The session ID and variant ID are intentionally preserved across page loads for analytics and experimentation tracking
- The "visited" flag is preserved so auto-open behavior works correctly (only auto-opens on first visit)
- This approach ensures a completely fresh conversation while maintaining proper user tracking

