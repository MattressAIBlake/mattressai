# Lead Capture - Quick Test Guide

## What Was Fixed

✅ **Shop domain normalization** - Extracts `shop.myshopify.com` from `https://shop.myshopify.com`  
✅ **Debug logging added** - Track lead capture execution with `[Lead Capture]` logs  
✅ **Both endpoints fixed** - `/chat` and `/apps/mattressai/chat` now support lead capture  
✅ **Complete field support** - `triggerAfterQuestions` now included in compilation

## Quick Test (3 Minutes)

### Step 1: Check for Active Prompt Version

Run this SQL query or check in Shopify Admin:

```sql
SELECT tenant, isActive, runtimeRules 
FROM "PromptVersion" 
WHERE isActive = true 
LIMIT 5;
```

Look for `"leadCapture": { "enabled": true }` in the runtimeRules JSON.

### Step 2: Create One (If None Exists)

1. Go to Shopify Admin → Apps → MattressAI → Prompt Builder
2. Check "Enable lead capture" ✓
3. Select "Automatically" for timing
4. Select fields: Email, Name, Phone
5. Click "Save & Activate"

### Step 3: Test the Widget

Open your store and start a chat:

```
User: "Hi, looking for a mattress"
Bot: [responds with questions]
User: "My email is test@example.com, I sleep on my side"
Bot: [responds]
```

**Expected**: After 2-3 messages, a lead form should appear with your email pre-filled.

### Step 4: Check Logs

**Browser Console** (F12):
```
[Lead Capture] Normalized shop domain: yourshop.myshopify.com
[Lead Capture] Prompt version found: true
[Lead Capture] Lead capture enabled: true
[Lead Capture] Should show lead form: true
[Lead Capture] Lead form SSE event sent to client
```

**Server Logs**:
```bash
npm run dev  # or check Vercel logs
```

## If It Still Doesn't Work

1. **Domain mismatch?**
   - Check what domain is logged: `[Lead Capture] Normalized shop domain: ...`
   - Compare to tenant value in PromptVersion table
   - They must match exactly

2. **Trigger conditions not met?**
   - Position "auto" requires: email OR (phone AND name)
   - Position "end" requires: 3+ messages + product mentions
   - Position "start" triggers after 1 message

3. **No prompt version?**
   - Create one in Prompt Builder
   - Make sure to click "Save & Activate"

## Success Indicators

- ✅ Console shows `[Lead Capture]` logs
- ✅ Logs show `Prompt version found: true`
- ✅ Logs show `Lead capture enabled: true`
- ✅ Lead form appears in chat widget
- ✅ Form has pre-filled email/phone/name

## After Verification

Once confirmed working:
- You can reduce log verbosity if desired
- Lead data will save to database on submit
- Check Leads Management page to see captured leads

---

**Need Help?** Check `LEAD_CAPTURE_FIX_COMPLETE.md` for detailed troubleshooting.

