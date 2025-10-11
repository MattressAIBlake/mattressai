# Lead Capture Testing Guide

## Quick Test Script

### Test 1: Email Detection & Form Trigger

**Conversation Script**:
```
1. Open widget
2. User: "Hi, I'm looking for a mattress"
3. AI: "Great! I'd love to help..."
4. User: "My email is test@example.com"
5. Continue conversation...
```

**Expected Result**:
- ✅ After response completes, lead form appears
- ✅ Email field pre-filled with "test@example.com"
- ✅ Consent checkbox unchecked
- ✅ Submit button disabled

### Test 2: Consent Requirement

**Steps**:
```
1. Fill form fields
2. Try clicking Submit without checking consent
```

**Expected Result**:
- ✅ Button remains disabled
- ✅ Form does not submit

**Next**:
```
3. Check consent checkbox
```

**Expected Result**:
- ✅ Submit button becomes enabled
- ✅ Can now submit form

### Test 3: Successful Submission

**Steps**:
```
1. Fill form with valid data
2. Check consent
3. Click Submit
```

**Expected Result**:
- ✅ Button shows "Submitting..."
- ✅ Form disappears
- ✅ Assistant message: "Thank you! We'll be in touch soon..."
- ✅ Lead appears in `/app/admin/leads-management`
- ✅ Customer created in Shopify with tag 'mattressai-lead'

### Test 4: Skip Functionality

**Steps**:
```
1. Form appears
2. Click "Skip for now"
```

**Expected Result**:
- ✅ Form disappears
- ✅ Assistant message: "No problem! Feel free to reach out anytime."
- ✅ No lead created in database
- ✅ Conversation continues normally

### Test 5: Form Only Shows Once

**Steps**:
```
1. Complete conversation with lead form
2. Continue chatting, share more contact info
3. Complete another conversation turn
```

**Expected Result**:
- ✅ Form does not appear again
- ✅ Session storage prevents duplicate display

### Test 6: Phone & Name Detection

**Conversation Script**:
```
User: "I'm John Smith and you can call me at (555) 123-4567"
```

**Expected Result**:
- ✅ Form appears with:
  - Name: "John Smith"
  - Phone: "(555) 123-4567"
- ✅ User can add email and other fields
- ✅ Can submit with consent

### Test 7: Data Correction

**Scenario**: User made typo in conversation

**Steps**:
```
User: "My email is john@gmai.com"  [typo]
Form appears with: john@gmai.com
```

**Action**:
```
1. Edit email field to: john@gmail.com
2. Check consent
3. Submit
```

**Expected Result**:
- ✅ Corrected email is saved to database
- ✅ Lead created with john@gmail.com

### Test 8: Submission Error Handling

**Steps** (simulate by turning off network):
```
1. Fill form
2. Check consent  
3. Submit while offline
```

**Expected Result**:
- ✅ Error message appears
- ✅ Form remains visible
- ✅ Submit button re-enabled
- ✅ User can retry

## Dashboard Verification

After successful submission, check:

1. **Navigate to**: `/app/admin/leads-management`
2. **Click Search** (default: last 7 days)
3. **Verify lead shows**:
   - Date: Today
   - Name: As submitted
   - Email: As submitted
   - Phone: As submitted
   - Status: New
   - Consent: Yes (green badge)

4. **Check Shopify Admin**:
   - Navigate to Customers
   - Search for email
   - Verify customer exists with tag: `mattressai-lead`
   - Verify marketing consent: Subscribed

## Configuration Testing

### Enable Lead Capture

1. Navigate to `/app/admin/prompt-builder`
2. Step 3: Lead Capture
3. Check "Enable lead capture"
4. Select position: Auto
5. Select fields: Email, Name, Phone, ZIP
6. Click "Compile & Preview"
7. Click "Activate This Version"

### Disable Lead Capture

1. Go back to Prompt Builder
2. Uncheck "Enable lead capture"
3. Compile & Activate

**Expected**: Form should not appear in conversations

## Mobile Testing

Test on mobile device:

1. Open widget on phone
2. Complete conversation with contact info
3. Verify form displays properly
4. Verify inputs are accessible
5. Verify consent checkbox is tappable
6. Verify submit button works

**Expected**:
- ✅ Form is responsive
- ✅ All fields accessible
- ✅ No layout issues
- ✅ Keyboard doesn't obscure fields

## Edge Cases

### Empty Field Submission
```
Leave required fields empty, check consent, try submit
```
**Expected**: Browser validation prevents submission

### Very Long Name
```
Enter name: "This is a really really really long name that goes on and on"
```
**Expected**: Field handles long text, doesn't break layout

### Special Characters in Email
```
Enter: user+test@example.co.uk
```
**Expected**: Accepts valid email formats

### Multiple Spaces in Name
```
Enter: "John    Smith"
```
**Expected**: Accepts and stores as-is

## Security Testing

### Without Consent
1. Fill form
2. DO NOT check consent
3. Try to submit (should be disabled)
4. Use browser console: `document.querySelector('.mattressai-lead-form__submit').disabled = false`
5. Try to submit

**Expected**: Backend validation still requires consent=true

### HMAC Verification
1. Try to POST to `/apps/mattressai/lead` without valid HMAC

**Expected**: 401 Unauthorized response

## Performance Testing

### Form Load Time
1. Trigger form
2. Measure time to display

**Expected**: < 100ms (instant)

### Submission Time
1. Submit form
2. Measure time to success message

**Expected**: < 2 seconds (network dependent)

## Accessibility Testing

### Keyboard Navigation
1. Tab through form fields
2. Check consent with Space
3. Submit with Enter

**Expected**:
- ✅ All fields reachable via Tab
- ✅ Checkbox toggles with Space
- ✅ Submit works with Enter

### Screen Reader
1. Use VoiceOver (Mac) or NVDA (Windows)
2. Navigate through form

**Expected**:
- ✅ Labels read correctly
- ✅ Field purposes announced
- ✅ Checkbox state announced
- ✅ Button states announced

## Regression Testing

Verify existing features still work:

- ✅ Product recommendations display
- ✅ Chat messaging works
- ✅ Event tracking functions
- ✅ Session management works
- ✅ Widget open/close works
- ✅ Mobile responsive layout intact

## Shopify App Review Prep

Before submitting to Shopify:

1. ✅ Test all scenarios above
2. ✅ Verify consent requirement cannot be bypassed
3. ✅ Verify opt-out path works
4. ✅ Verify data deletion works (GDPR)
5. ✅ Verify privacy policy includes lead capture disclosure
6. ✅ Screenshot form for review submission
7. ✅ Document consent flow for reviewers

## Common Issues & Solutions

### Form Doesn't Appear
- Check: Is lead capture enabled in runtime rules?
- Check: Is active prompt version set?
- Check: Was form already shown? (Clear session storage)

### Submit Button Disabled
- Check: Is consent checkbox checked?
- Check: Are required fields filled?

### Lead Not in Dashboard
- Check: Was submission successful? (Check network tab)
- Check: Searching correct date range?
- Check: Correct tenant/shop?

### Shopify Customer Not Created
- Check: Was consent checked?
- Check: Was valid email provided?
- Check: Shopify API credentials valid?
- Check: Server logs for sync errors

---

**Ready to Test**: ✅  
**Estimated Testing Time**: 30-45 minutes  
**Required Access**: Merchant admin panel + Shopify admin

