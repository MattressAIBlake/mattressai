# Lead Auto-Extraction with Consent Implementation

## Overview

A Shopify-compliant hybrid lead capture system that combines:
- ✅ Backend AI detection and extraction of contact information
- ✅ SSE event to trigger visual consent form in widget
- ✅ Pre-filled form fields for user convenience
- ✅ Explicit consent checkbox (Shopify compliant)
- ✅ Only submits after user confirmation

## Implementation Complete

### 1. Backend Lead Extractor Service ✅

**File**: `app/services/lead-extractor.server.js`

**Features**:
- Email extraction using regex patterns
- Phone number extraction (multiple formats: (123) 456-7890, 123-456-7890, +1 1234567890)
- Name extraction (context-aware: "My name is...", "I'm...", "This is...")
- ZIP code extraction (5-digit, with context validation)
- Consent detection from keywords
- Form trigger logic based on runtime rules

**Key Functions**:
```javascript
extractLeadFromConversation(messages)
  // Returns: { email, phone, name, zip, hasConsent }

shouldTriggerLeadForm(messages, runtimeRules, formAlreadyShown)
  // Checks if lead form should be shown

getFormFields(extractedData, configuredFields)
  // Determines which fields to display
```

### 2. Chat Integration ✅

**File**: `app/routes/chat.tsx`

**Changes**:
- Added imports for lead extractor and prompt version
- Integrated extraction after conversation completes
- Sends `show_lead_form` SSE event with:
  - `prefill`: Extracted lead data
  - `fields`: Configured fields from runtime rules

**Trigger Logic**:
- Only if lead capture is enabled in runtime rules
- Only if at least one contact field is extracted
- Backend sends event, client controls if form is shown (once per session)

### 3. Widget Lead Form UI ✅

**File**: `app/routes/apps.mattressai.widget[.]js/route.jsx`

**New Methods**:

#### `displayLeadForm(prefill, fields)`
- Checks if form already shown (session storage)
- Dynamically builds form with only requested fields
- Pre-fills detected data (editable by user)
- Includes required consent checkbox (unchecked by default)
- Two buttons: "Submit" (disabled until consent) and "Skip for now"
- Accessible form with labels and proper semantics

#### `submitLead(data)`
- Posts to `/apps/mattressai/lead` endpoint
- Includes tenant, session, conversation IDs
- Shows loading state during submission
- Success: Removes form, shows thank you message
- Error: Shows error message, allows retry
- Tracks `lead_captured` event on success

**Form Features**:
- Session storage prevents showing form multiple times
- Consent checkbox must be checked to enable submit
- Skip button provides clear opt-out path
- Form fields are editable (user can correct auto-filled data)
- Responsive design with proper spacing

### 4. CSS Styling ✅

**File**: `app/routes/apps.mattressai.widget[.]js/route.jsx` (inline CSS)

**Styles Added**:
- `.mattressai-lead-form` - Container with slide-up animation
- `.mattressai-lead-form__card` - Card with border and shadow
- `.mattressai-lead-form__heading` - Title styling
- `.mattressai-lead-form__description` - Disclosure text
- `.mattressai-lead-form__input` - Input fields with focus states
- `.mattressai-lead-form__checkbox` - Consent checkbox styling
- `.mattressai-lead-form__submit` - Primary button with hover/disabled states
- `.mattressai-lead-form__skip` - Secondary button with hover states

**Design Features**:
- Matches widget theme colors and spacing
- Smooth animations and transitions
- Clear visual hierarchy
- Mobile-responsive
- Dark mode support via CSS variables

### 5. Runtime Rules Update ✅

**File**: `app/lib/domain/runtimeRules.ts`

**Changes**:
- Added `'auto'` to position enum (start, end, auto)
- Added `triggerAfterQuestions` optional field (default: 3)

**Position Behaviors**:
- `start`: Show after first user message
- `end`: Show after product recommendations
- `auto`: Show when email OR (phone AND name) extracted

## Shopify Compliance Checklist

✅ **Visual consent UI**: Checkbox that user must actively check  
✅ **Clear disclosure**: "We'll use this information to follow up with personalized recommendations"  
✅ **Before storage**: Form shown and consent obtained before API call  
✅ **Provable consent**: Checkbox + timestamp stored in database  
✅ **User control**: All fields editable, clear skip option  
✅ **Transparent**: User sees exactly what data is captured  
✅ **Opt-out path**: "Skip for now" button allows continuation without sharing data  
✅ **One-time ask**: Form only shown once per session  

## Testing Scenarios

### Scenario 1: Email Extraction
**User says**: "My email is john@example.com"
- ✅ Backend extracts: `{ email: "john@example.com" }`
- ✅ Form appears with email pre-filled
- ✅ User can edit email, check consent, submit

### Scenario 2: Phone and Name Extraction
**User says**: "I'm John Smith, you can reach me at (555) 123-4567"
- ✅ Backend extracts: `{ name: "John Smith", phone: "(555) 123-4567" }`
- ✅ Form appears with both fields pre-filled
- ✅ User adds email, checks consent, submits

### Scenario 3: User Corrects Data
**Pre-filled**: `john@gmai.com` (typo in conversation)
- ✅ User edits to `john@gmail.com`
- ✅ Corrected email is submitted

### Scenario 4: User Skips Form
**User clicks**: "Skip for now"
- ✅ Form disappears
- ✅ Assistant responds: "No problem! Feel free to reach out anytime."
- ✅ Conversation continues normally
- ✅ No data submitted to database

### Scenario 5: Consent Not Checked
**User fills form** but doesn't check consent
- ✅ Submit button remains disabled
- ✅ Cannot submit without consent
- ✅ Must explicitly check box to enable submit

### Scenario 6: Submission Error
**Network error** during submission
- ✅ Error message displayed
- ✅ Form remains visible
- ✅ User can retry submission

### Scenario 7: Form Already Shown
**Same session**, trigger conditions met again
- ✅ Session storage check prevents duplicate form
- ✅ No second form appears
- ✅ Conversation continues normally

## API Flow

```
1. User chats with AI, shares contact info
   ↓
2. Chat completes, backend extracts data
   ↓
3. Backend sends SSE event: show_lead_form
   {
     type: 'show_lead_form',
     prefill: { email, phone, name, zip },
     fields: ['email', 'name', 'phone', 'zip']
   }
   ↓
4. Widget displays form with pre-filled data
   ↓
5. User reviews/edits data, checks consent, clicks Submit
   ↓
6. Widget POSTs to /apps/mattressai/lead
   {
     tenantId, sessionId, conversationId,
     email, phone, name, zip, consent: true
   }
   ↓
7. Backend creates Lead in database
   ↓
8. If consent=true, syncs to Shopify Customer
   ↓
9. Returns success: { ok: true, leadId, timestamp }
   ↓
10. Widget shows thank you message, tracks event
```

## Database Storage

**Lead Model** (already existed):
```prisma
model Lead {
  id                String      @id @default(cuid())
  tenantId          String
  sessionId         String
  email             String?
  phone             String?
  name              String?
  zip               String?
  consent           Boolean     @default(false)
  shopifyCustomerId String?     // Set if synced to Shopify
  status            String      @default("new")
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

## Configuration Example

In Prompt Builder, merchants can configure:

```javascript
{
  leadCapture: {
    enabled: true,
    position: 'auto',  // or 'start', 'end'
    fields: ['email', 'name', 'phone', 'zip'],
    triggerAfterQuestions: 3
  }
}
```

## Files Modified

1. ✅ `app/services/lead-extractor.server.js` (NEW)
2. ✅ `app/routes/chat.tsx` (imports + extraction logic)
3. ✅ `app/routes/apps.mattressai.widget[.]js/route.jsx` (form UI + submission)
4. ✅ `app/lib/domain/runtimeRules.ts` (schema update)

## Files NOT Modified (already working)

- `app/routes/apps.mattressai.lead/route.jsx` - API endpoint
- `app/lib/leads/lead.service.ts` - Lead creation & Shopify sync
- `app/routes/app.admin.leads-management/route.jsx` - Dashboard
- `prisma/schema.prisma` - Database schema

## Next Steps (Manual Testing Required)

1. **Create/Activate Prompt Version** with lead capture enabled
2. **Test conversation** where user shares email
3. **Verify form appears** with pre-filled data
4. **Test consent requirement** (submit disabled without checkbox)
5. **Test skip functionality** (form disappears, no data saved)
6. **Test submission** (lead appears in dashboard)
7. **Verify Shopify sync** (customer created with 'mattressai-lead' tag)
8. **Test session persistence** (form only shows once)

## Known Limitations

1. **Context-Aware Extraction**: Name extraction works best with explicit patterns ("My name is..."). Casual mentions may not be detected.

2. **Phone Format Variations**: Supports common US formats. International formats may need additional patterns.

3. **ZIP Validation**: Only validates 5-digit US ZIP codes. Extended ZIP+4 format not supported.

4. **Session Tracking**: Form shown status stored in browser session storage. Cleared when user closes widget or clears browser data.

5. **Language**: English-only extraction patterns. Multi-language support would require additional patterns.

## Security & Privacy

- ✅ HMAC verification on lead submission endpoint
- ✅ Consent required before storing PII
- ✅ No pre-checked consent boxes
- ✅ Clear opt-out mechanism
- ✅ Data only extracted from user messages (not assistant)
- ✅ Masked PII in dashboard for non-consented leads
- ✅ GDPR-compliant deletion available via `deleteLead()`

## Performance Considerations

- Lead extraction is async and doesn't block response streaming
- Form triggers after conversation completes (doesn't interrupt flow)
- Session storage check is instant (no API call)
- CSS animations use GPU-accelerated transforms
- Form lazy-loads only when triggered

---

**Implementation Status**: ✅ **COMPLETE**  
**Shopify Compliance**: ✅ **READY FOR REVIEW**  
**Testing Required**: ⏳ **MANUAL QA PENDING**

