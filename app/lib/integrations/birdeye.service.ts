/**
 * Birdeye Integration Service
 * Sends leads to Birdeye CRM platform
 * Documentation: https://birdeye.com/api
 */

interface BirdeyeLeadPayload {
  businessId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  source: string;
  customAttributes?: Record<string, string>;
}

interface SendLeadToBirdeyeOptions {
  businessId: string;
  apiKey: string;
  leadEmail?: string;
  leadName?: string;
  leadPhone?: string;
  intentScore?: number;
  summary?: string;
  sessionId?: string;
}

/**
 * Send lead to Birdeye
 */
export const sendLeadToBirdeye = async (options: SendLeadToBirdeyeOptions): Promise<void> => {
  const {
    businessId,
    apiKey,
    leadEmail,
    leadName,
    leadPhone,
    intentScore,
    summary,
    sessionId
  } = options;

  if (!businessId || !apiKey) {
    throw new Error('Birdeye businessId and apiKey are required');
  }

  // Parse name into first and last
  let firstName = 'Unknown';
  let lastName = '';
  if (leadName) {
    const nameParts = leadName.trim().split(' ');
    firstName = nameParts[0] || 'Unknown';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  // Build payload
  const payload: BirdeyeLeadPayload = {
    businessId,
    customerFirstName: firstName,
    customerLastName: lastName,
    source: 'MattressAI'
  };

  // Add optional fields
  if (leadEmail) {
    payload.customerEmail = leadEmail;
  }

  if (leadPhone) {
    payload.customerPhoneNumber = leadPhone;
  }

  // Add custom attributes (Birdeye requires strings)
  if (intentScore !== undefined || summary || sessionId) {
    payload.customAttributes = {};
    if (intentScore !== undefined) {
      payload.customAttributes.intentScore = String(intentScore);
    }
    if (summary) {
      payload.customAttributes.sessionSummary = summary;
    }
    if (sessionId) {
      payload.customAttributes.mattressAiSessionId = sessionId;
    }
  }

  // Get API URL from env or use default
  const apiUrl = process.env.BIRDEYE_API_URL || 'https://api.birdeye.com/v2';

  try {
    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Birdeye API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Lead sent to Birdeye successfully:', result);
  } catch (error: any) {
    console.error('Error sending lead to Birdeye:', error);
    throw new Error(`Failed to send lead to Birdeye: ${error.message}`);
  }
};

/**
 * Test Birdeye connection
 */
export const testBirdeyeConnection = async (businessId: string, apiKey: string): Promise<boolean> => {
  try {
    await sendLeadToBirdeye({
      businessId,
      apiKey,
      leadName: 'Test Lead',
      leadEmail: 'test@mattressai.app',
      leadPhone: '+15555555555',
      intentScore: 100,
      summary: 'This is a test lead from MattressAI'
    });
    return true;
  } catch (error) {
    console.error('Birdeye connection test failed:', error);
    return false;
  }
};

