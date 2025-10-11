/**
 * Podium Integration Service
 * Sends leads to Podium CRM platform
 * Documentation: https://docs.podium.com/reference/leads-api
 */

interface PodiumLeadPayload {
  locationId: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone?: string;
  contactEmail?: string;
  source: string;
  customFields?: Record<string, any>;
}

interface SendLeadToPodiumOptions {
  locationId: string;
  apiKey: string;
  leadEmail?: string;
  leadName?: string;
  leadPhone?: string;
  intentScore?: number;
  summary?: string;
  sessionId?: string;
}

/**
 * Send lead to Podium
 */
export const sendLeadToPodium = async (options: SendLeadToPodiumOptions): Promise<void> => {
  const {
    locationId,
    apiKey,
    leadEmail,
    leadName,
    leadPhone,
    intentScore,
    summary,
    sessionId
  } = options;

  if (!locationId || !apiKey) {
    throw new Error('Podium locationId and apiKey are required');
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
  const payload: PodiumLeadPayload = {
    locationId,
    contactFirstName: firstName,
    contactLastName: lastName,
    source: 'MattressAI'
  };

  // Add optional fields
  if (leadPhone) {
    payload.contactPhone = leadPhone;
  }

  if (leadEmail) {
    payload.contactEmail = leadEmail;
  }

  // Add custom fields
  if (intentScore || summary || sessionId) {
    payload.customFields = {};
    if (intentScore !== undefined) {
      payload.customFields.intentScore = intentScore;
    }
    if (summary) {
      payload.customFields.sessionSummary = summary;
    }
    if (sessionId) {
      payload.customFields.mattressAiSessionId = sessionId;
    }
  }

  // Get API URL from env or use default
  const apiUrl = process.env.PODIUM_API_URL || 'https://api.podium.com/v4';

  try {
    const response = await fetch(`${apiUrl}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Podium API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Lead sent to Podium successfully:', result);
  } catch (error: any) {
    console.error('Error sending lead to Podium:', error);
    throw new Error(`Failed to send lead to Podium: ${error.message}`);
  }
};

/**
 * Test Podium connection
 */
export const testPodiumConnection = async (locationId: string, apiKey: string): Promise<boolean> => {
  try {
    await sendLeadToPodium({
      locationId,
      apiKey,
      leadName: 'Test Lead',
      leadEmail: 'test@mattressai.app',
      leadPhone: '+15555555555',
      intentScore: 100,
      summary: 'This is a test lead from MattressAI'
    });
    return true;
  } catch (error) {
    console.error('Podium connection test failed:', error);
    return false;
  }
};

