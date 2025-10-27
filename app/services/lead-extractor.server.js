/**
 * Lead Extractor Service
 * Analyzes conversation messages to detect and extract contact information
 */

/**
 * Extract lead information from conversation messages
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Object} Extracted lead data { email, phone, name, zip, hasConsent }
 */
export function extractLeadFromConversation(messages) {
  const leadData = {
    email: null,
    phone: null,
    name: null,
    zip: null,
    hasConsent: false
  };

  // Only analyze user messages
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .map(msg => typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));

  const conversationText = userMessages.join(' ');

  // Extract email
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = conversationText.match(emailPattern);
  if (emailMatch) {
    leadData.email = emailMatch[0];
  }

  // Extract phone number (various formats)
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // 123-456-7890 or 123.456.7890 or 123 456 7890
    /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/, // (123) 456-7890
    /\b\+?1?\s?\d{10}\b/, // +11234567890 or 1234567890
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = conversationText.match(pattern);
    if (phoneMatch) {
      leadData.phone = phoneMatch[0].replace(/\D/g, ''); // Remove non-digits
      // Format as standard (if 10 digits)
      if (leadData.phone.length === 10) {
        leadData.phone = `(${leadData.phone.slice(0, 3)}) ${leadData.phone.slice(3, 6)}-${leadData.phone.slice(6)}`;
      } else if (leadData.phone.length === 11 && leadData.phone.startsWith('1')) {
        const digits = leadData.phone.slice(1);
        leadData.phone = `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;
    }
  }

  // Extract ZIP code (5 digits, not part of phone)
  const zipPattern = /\b\d{5}\b/g;
  const zipMatches = conversationText.match(zipPattern);
  if (zipMatches) {
    // Filter out zips that are part of phone numbers
    for (const zip of zipMatches) {
      const zipIndex = conversationText.indexOf(zip);
      const beforeZip = conversationText.slice(Math.max(0, zipIndex - 20), zipIndex).toLowerCase();
      const afterZip = conversationText.slice(zipIndex + 5, Math.min(conversationText.length, zipIndex + 25)).toLowerCase();
      
      // Check if context suggests it's a ZIP code
      if (beforeZip.includes('zip') || beforeZip.includes('postal') || 
          afterZip.includes('zip') || afterZip.includes('postal')) {
        leadData.zip = zip;
        break;
      }
      
      // Also accept if it's standalone and not surrounded by other digits
      const charBefore = conversationText[zipIndex - 1];
      const charAfter = conversationText[zipIndex + 5];
      if ((!charBefore || !/\d/.test(charBefore)) && (!charAfter || !/\d/.test(charAfter))) {
        leadData.zip = zip;
        break;
      }
    }
  }

  // Note: Name extraction removed - name field will be left blank for users to fill manually

  // Detect consent indicators
  const consentKeywords = [
    /\b(?:yes|yeah|sure|ok|okay|alright|agreed|consent|accept)\b/i,
    /\b(?:you can|feel free to|please)\s+(?:contact|reach|call|email)\b/i,
    /\b(?:i|i'd)\s+(?:agree|consent|accept)\b/i,
  ];

  const lastFewMessages = userMessages.slice(-3).join(' ').toLowerCase();
  for (const pattern of consentKeywords) {
    if (pattern.test(lastFewMessages)) {
      leadData.hasConsent = true;
      break;
    }
  }

  return leadData;
}

/**
 * Determine if lead form should be triggered
 * @param {Array} messages - Conversation messages
 * @param {Object} runtimeRules - Runtime rules configuration
 * @param {Boolean} formAlreadyShown - Whether form was already shown in this session
 * @param {Object} context - Context information (beforeFirstResponse, hasProducts)
 * @returns {Boolean} Whether to show the lead form
 */
export function shouldTriggerLeadForm(messages, runtimeRules, formAlreadyShown, context = {}) {
  // Don't show if lead capture is disabled
  if (!runtimeRules?.leadCapture?.enabled) {
    return false;
  }

  // Don't show if already shown
  if (formAlreadyShown) {
    return false;
  }

  const position = runtimeRules.leadCapture.position || 'end';
  const userMessageCount = messages.filter(msg => msg.role === 'user').length;

  // Position-based logic
  if (position === 'start') {
    // Show after FIRST user message, BEFORE AI response
    return userMessageCount === 1 && context.beforeFirstResponse;
  }

  if (position === 'end') {
    // Show when products are about to be displayed
    const triggerAfterQuestions = runtimeRules.leadCapture.triggerAfterQuestions || 3;
    return context.hasProducts && userMessageCount >= triggerAfterQuestions;
  }

  return false;
}

/**
 * Get fields to display in the form based on what's already extracted
 * @param {Object} extractedData - Data extracted from conversation
 * @param {Array} configuredFields - Fields configured in runtime rules
 * @returns {Array} Fields that should be shown in the form
 */
export function getFormFields(extractedData, configuredFields) {
  if (!configuredFields || configuredFields.length === 0) {
    return ['email', 'name', 'phone', 'zip'];
  }

  // Always show configured fields, even if pre-filled
  return configuredFields;
}

