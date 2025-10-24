# Lead Capture Fix - Implementation Complete ✅

## Summary

Fixed the root cause preventing lead capture forms from appearing in the chat widget. The issue was a **shop domain format mismatch** between the request headers and database storage.

## Root Cause

The chat endpoints were extracting the full Origin URL (e.g., `https://shop.myshopify.com`) from request headers, but the database stores shop domains without protocol (e.g., `shop.myshopify.com`). This caused `getActivePromptVersion()` lookups to fail, preventing lead capture from triggering.

## Changes Made

### 1. Fixed Shop Domain Extraction in `/chat` Endpoint

**File**: `app/routes/chat.tsx`

- **Lines 135-147**: Added shop domain normalization logic
  - Extracts hostname from Origin URL using `new URL().hostname`
  - Falls back to original value if parsing fails
  - Stores both original and normalized versions

- **Lines 301-352**: Added comprehensive debug logging
  - Logs shop domain lookup
  - Logs prompt version found status
  - Logs lead capture configuration
  - Logs trigger decision and extracted data
  - Logs when SSE event is sent

- **Line 304**: Uses `normalizedShopDomain` for database lookup instead of raw Origin

### 2. Added Lead Capture to `/apps/mattressai/chat` Proxy Endpoint

**File**: `app/routes/apps.mattressai.chat/route.jsx`

- **Lines 16-17**: Added missing imports
  ```javascript
  import { extractLeadFromConversation, shouldTriggerLeadForm, getFormFields } from '~/services/lead-extractor.server';
  import { getActivePromptVersion } from '~/lib/domain/promptVersion.server';
  ```

- **Lines 81-92**: Added shop domain normalization (same as main endpoint)

- **Lines 246-297**: Added complete lead capture logic with debug logging
  - Identical implementation to main `/chat` endpoint
  - Ensures lead capture works regardless of which endpoint is used

### 3. Added Missing Field to Prompt Compilation

**File**: `app/routes/app.admin.prompt.compile/route.jsx`

- **Line 34**: Added `triggerAfterQuestions` field to runtime rules
  ```javascript
  triggerAfterQuestions: parseInt(formData.get('triggerAfterQuestions')) || 3
  ```

## Debug Logging

All lead capture operations now log with `[Lead Capture]` prefix:

```
[Lead Capture] Original shop domain: https://example.myshopify.com
[Lead Capture] Normalized shop domain: example.myshopify.com
[Lead Capture] Looking up prompt version for shop: example.myshopify.com
[Lead Capture] Prompt version found: true
[Lead Capture] Lead capture enabled: true
[Lead Capture] Lead capture position: auto
[Lead Capture] Lead capture fields: ["email", "name", "phone", "zip"]
[Lead Capture] Trigger after questions: 3
[Lead Capture] Should show lead form: true
[Lead Capture] Extracted lead data: { hasEmail: true, hasPhone: false, hasName: false, hasZip: false, hasConsent: false }
[Lead Capture] Form fields to display: ["email", "name", "phone", "zip"]
[Lead Capture] Lead form SSE event sent to client
```

## Testing Instructions

### 1. Verify Active Prompt Version Exists

Check if your shop has an active prompt version with lead capture enabled:

```sql
-- Query the database
SELECT 
  id,
  tenant,
  isActive,
  runtimeRules
FROM "PromptVersion"
WHERE isActive = true;
```

The `runtimeRules` should contain:
```json
{
  "leadCapture": {
    "enabled": true,
    "position": "auto",
    "fields": ["email", "name", "phone", "zip"],
    "triggerAfterQuestions": 3
  }
}
```

### 2. Create/Activate a Prompt Version (if needed)

If no active prompt version exists:

1. Navigate to Shopify Admin → Apps → MattressAI
2. Go to "Prompt Builder"
3. Enable "Lead Capture" checkbox
4. Select capture timing (e.g., "Automatically")
5. Select fields to collect
6. Click "Save & Activate"

### 3. Test Lead Capture Flow

1. Open your store's widget on the frontend
2. Start a chat conversation
3. Share contact information naturally:
   - "My email is test@example.com"
   - "I'm John Smith, call me at (555) 123-4567"
4. Check browser console for `[Lead Capture]` logs
5. After 2-3 messages, the lead form should appear
6. Verify the form has pre-filled data
7. Check consent checkbox and submit

### 4. Check Server Logs

Monitor your server logs while testing to see the debug output:

```bash
# Local development
npm run dev

# Production (Vercel)
vercel logs --follow
```

Look for the `[Lead Capture]` prefixed messages to track execution.

## Expected Behavior

### Position: "auto"
- Triggers when email OR (phone AND name) are extracted
- Requires at least 2 user messages
- Form appears with pre-filled data

### Position: "start"
- Triggers after first user message
- May not have extracted data yet

### Position: "end"
- Triggers after product recommendations
- Requires 3+ user messages (or configured amount)
- Best for natural lead capture flow

## Troubleshooting

### Lead form not appearing?

1. **Check server logs for**:
   - `[Lead Capture] Normalized shop domain: ...`
   - `[Lead Capture] Prompt version found: true`
   - `[Lead Capture] Lead capture enabled: true`

2. **If prompt version not found**:
   - Verify shop domain format in database matches normalized format
   - Check that prompt version exists and is active
   - Ensure `tenant` field matches shop domain exactly

3. **If lead capture disabled**:
   - Go to Prompt Builder and enable lead capture
   - Save and activate the prompt

4. **If trigger conditions not met**:
   - Check the position setting (auto/start/end)
   - Verify trigger after questions value
   - Ensure conversation has enough messages

### Widget using wrong endpoint?

Check which endpoint the widget calls:
- Main app: `/chat`
- Shopify Proxy: `/apps/mattressai/chat`

Both now have lead capture logic, so it should work either way.

## Files Modified

1. ✅ `app/routes/chat.tsx` - Main chat endpoint
2. ✅ `app/routes/apps.mattressai.chat/route.jsx` - Proxy endpoint  
3. ✅ `app/routes/app.admin.prompt.compile/route.jsx` - Prompt compilation

## Benefits

- **Consistent behavior**: Both chat endpoints now support lead capture
- **Better debugging**: Comprehensive logging makes issues visible
- **Format-agnostic**: Works with any shop domain format
- **Future-proof**: Normalized domain extraction is reusable

## Next Steps

1. Deploy changes to production
2. Test with real shop data
3. Monitor logs for any edge cases
4. Remove debug logs after confirming it works (or reduce verbosity)

---

**Status**: ✅ Implementation Complete  
**Ready for Testing**: Yes  
**Breaking Changes**: None

