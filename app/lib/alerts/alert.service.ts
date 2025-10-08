/**
 * Alert Service
 * Handles alert delivery across multiple channels: email, SMS, Slack, webhook
 */

import prisma from '~/db.server';
import crypto from 'crypto';

interface AlertPayload {
  sessionId: string;
  intentScore: number;
  endReason: string;
  summary?: string;
  leadEmail?: string;
  leadName?: string;
  timestamp: string;
  config?: any;
}

/**
 * Send an alert via the specified channel
 */
export const sendAlert = async (alertId: string): Promise<void> => {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      session: {
        select: {
          summary: true,
          intentScore: true,
          endReason: true,
          consent: true
        }
      }
    }
  });

  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }

  if (alert.status !== 'queued') {
    // Already processed
    return;
  }

  try {
    // Parse payload
    const payload: AlertPayload = JSON.parse(alert.payload);

    // Get alert settings to check quiet hours
    const settings = await prisma.alertSettings.findUnique({
      where: { tenantId: alert.tenantId }
    });

    if (settings && settings.quietHours) {
      const quietHours = JSON.parse(settings.quietHours);
      if (isInQuietHours(quietHours)) {
        // Skip for now, will be included in digest
        await prisma.alert.update({
          where: { id: alertId },
          data: { status: 'skipped', error: 'quiet_hours' }
        });
        return;
      }
    }

    // Redact PII if no consent
    const consent = alert.session?.consent || false;
    const sanitizedPayload = consent ? payload : redactPII(payload);

    // Send via appropriate channel
    switch (alert.channel) {
      case 'email':
        await sendEmailAlert(alert.tenantId, sanitizedPayload, payload.config);
        break;
      case 'sms':
        await sendSMSAlert(alert.tenantId, sanitizedPayload, payload.config);
        break;
      case 'slack':
        await sendSlackAlert(alert.tenantId, sanitizedPayload, payload.config);
        break;
      case 'webhook':
        await sendWebhookAlert(alert.tenantId, sanitizedPayload, payload.config);
        break;
      default:
        throw new Error(`Unknown channel: ${alert.channel}`);
    }

    // Mark as sent
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        attempts: alert.attempts + 1
      }
    });
  } catch (error: any) {
    console.error(`Error sending alert ${alertId}:`, error);

    // Increment attempts and mark as failed if max retries reached
    const maxRetries = 3;
    const newAttempts = alert.attempts + 1;

    await prisma.alert.update({
      where: { id: alertId },
      data: {
        attempts: newAttempts,
        status: newAttempts >= maxRetries ? 'failed' : 'queued',
        error: error.message
      }
    });

    // Rethrow to trigger retry
    if (newAttempts < maxRetries) {
      throw error;
    }
  }
};

/**
 * Check if current time is in quiet hours
 */
const isInQuietHours = (quietHours: {
  start: string;
  end: string;
  tz: string;
}): boolean => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: quietHours.tz,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const [hours, minutes] = timeStr.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = quietHours.start.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = quietHours.end.split(':').map(Number);
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (startTotalMinutes < endTotalMinutes) {
      // Same day range (e.g., 22:00 - 23:59)
      return currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes;
    } else {
      // Crosses midnight (e.g., 22:00 - 07:00)
      return currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
};

/**
 * Redact PII from payload
 */
const redactPII = (payload: AlertPayload): AlertPayload => {
  return {
    ...payload,
    leadEmail: payload.leadEmail ? '[REDACTED]' : undefined,
    leadName: payload.leadName ? '[REDACTED]' : undefined,
    summary: '[Summary redacted - no consent]'
  };
};

/**
 * Send email alert
 */
const sendEmailAlert = async (
  tenantId: string,
  payload: AlertPayload,
  config: any
): Promise<void> => {
  const provider = process.env.MAIL_PROVIDER || 'sendgrid';

  if (provider === 'sendgrid') {
    await sendEmailViaSendGrid(config.to || config.email, tenantId, payload);
  } else {
    console.warn(`Email provider ${provider} not implemented`);
  }
};

/**
 * Send email via SendGrid
 */
const sendEmailViaSendGrid = async (
  to: string,
  tenantId: string,
  payload: AlertPayload
): Promise<void> => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const subject = `New ${payload.endReason} - Intent Score: ${payload.intentScore}`;
  const html = `
    <h2>Chat Session Alert</h2>
    <p><strong>Tenant:</strong> ${tenantId}</p>
    <p><strong>Intent Score:</strong> ${payload.intentScore}/100</p>
    <p><strong>End Reason:</strong> ${payload.endReason}</p>
    <p><strong>Time:</strong> ${new Date(payload.timestamp).toLocaleString()}</p>
    ${payload.summary ? `<p><strong>Summary:</strong> ${payload.summary}</p>` : ''}
    ${payload.leadName ? `<p><strong>Lead Name:</strong> ${payload.leadName}</p>` : ''}
    ${payload.leadEmail ? `<p><strong>Lead Email:</strong> ${payload.leadEmail}</p>` : ''}
    <p><a href="https://${tenantId}/admin/apps/mattressai/sessions/${payload.sessionId}">View Session</a></p>
  `;

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL || 'alerts@mattressai.app' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${errorText}`);
  }
};

/**
 * Send SMS alert
 */
const sendSMSAlert = async (
  tenantId: string,
  payload: AlertPayload,
  config: any
): Promise<void> => {
  const provider = process.env.SMS_PROVIDER || 'twilio';

  if (provider === 'twilio') {
    await sendSMSViaTwilio(config.to || config.phone, tenantId, payload);
  } else {
    console.warn(`SMS provider ${provider} not implemented`);
  }
};

/**
 * Send SMS via Twilio
 */
const sendSMSViaTwilio = async (
  to: string,
  tenantId: string,
  payload: AlertPayload
): Promise<void> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const message = `MattressAI Alert: ${payload.endReason} (Intent: ${payload.intentScore}/100)`;

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio error: ${errorText}`);
  }
};

/**
 * Send Slack alert
 */
const sendSlackAlert = async (
  tenantId: string,
  payload: AlertPayload,
  config: any
): Promise<void> => {
  const webhookUrl = config.url || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('Slack webhook URL not configured');
  }

  const message = {
    text: `🔔 Chat Session Alert`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔔 ${payload.endReason.replace(/_/g, ' ').toUpperCase()}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Intent Score:*\n${payload.intentScore}/100`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${new Date(payload.timestamp).toLocaleString()}`
          }
        ]
      }
    ]
  };

  if (payload.summary) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Summary:*\n${payload.summary}`
      }
    });
  }

  if (payload.leadName || payload.leadEmail) {
    const fields: any[] = [];
    if (payload.leadName) {
      fields.push({
        type: 'mrkdwn',
        text: `*Lead:*\n${payload.leadName}`
      });
    }
    if (payload.leadEmail) {
      fields.push({
        type: 'mrkdwn',
        text: `*Email:*\n${payload.leadEmail}`
      });
    }
    message.blocks.push({
      type: 'section',
      fields
    });
  }

  message.blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Session'
        },
        url: `https://${tenantId}/admin/apps/mattressai/sessions/${payload.sessionId}`
      }
    ]
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook error: ${errorText}`);
  }
};

/**
 * Send webhook alert (signed with HMAC)
 */
const sendWebhookAlert = async (
  tenantId: string,
  payload: AlertPayload,
  config: any
): Promise<void> => {
  const webhookUrl = config.url;
  if (!webhookUrl) {
    throw new Error('Webhook URL not configured');
  }

  const secret = process.env.WEBHOOK_SECRET || process.env.SHOPIFY_APP_SECRET || '';
  
  const body = JSON.stringify({
    tenant: tenantId,
    ...payload
  });

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Tenant': tenantId
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook error: ${errorText}`);
  }
};

/**
 * Get or create default alert settings for a tenant
 */
export const getOrCreateAlertSettings = async (tenantId: string): Promise<any> => {
  let settings = await prisma.alertSettings.findUnique({
    where: { tenantId }
  });

  if (!settings) {
    // Create default settings
    settings = await prisma.alertSettings.create({
      data: {
        tenantId,
        triggers: JSON.stringify({
          all: false,
          lead_captured: true,
          high_intent: false,
          abandoned: false,
          post_conversion: false,
          chat_end: false
        }),
        channels: JSON.stringify({
          email: {},
          sms: {},
          slack: {},
          webhook: {}
        }),
        throttles: JSON.stringify({
          perDay: 2,
          perSession: 2
        })
      }
    });
  }

  return {
    ...settings,
    triggers: JSON.parse(settings.triggers),
    channels: JSON.parse(settings.channels),
    quietHours: settings.quietHours ? JSON.parse(settings.quietHours) : null,
    throttles: JSON.parse(settings.throttles),
    digest: settings.digest ? JSON.parse(settings.digest) : null
  };
};

/**
 * Update alert settings
 */
export const updateAlertSettings = async (
  tenantId: string,
  updates: {
    triggers?: any;
    channels?: any;
    quietHours?: any;
    throttles?: any;
    digest?: any;
  }
): Promise<any> => {
  const current = await getOrCreateAlertSettings(tenantId);

  const data: any = {
    updatedAt: new Date()
  };

  if (updates.triggers) {
    data.triggers = JSON.stringify({ ...current.triggers, ...updates.triggers });
  }
  if (updates.channels) {
    data.channels = JSON.stringify({ ...current.channels, ...updates.channels });
  }
  if (updates.quietHours) {
    data.quietHours = JSON.stringify(updates.quietHours);
  }
  if (updates.throttles) {
    data.throttles = JSON.stringify({ ...current.throttles, ...updates.throttles });
  }
  if (updates.digest) {
    data.digest = JSON.stringify(updates.digest);
  }

  const settings = await prisma.alertSettings.update({
    where: { tenantId },
    data
  });

  return {
    ...settings,
    triggers: JSON.parse(settings.triggers),
    channels: JSON.parse(settings.channels),
    quietHours: settings.quietHours ? JSON.parse(settings.quietHours) : null,
    throttles: JSON.parse(settings.throttles),
    digest: settings.digest ? JSON.parse(settings.digest) : null
  };
};

/**
 * Send test alert
 */
export const sendTestAlert = async (
  tenantId: string,
  channel: string,
  config: any
): Promise<void> => {
  const testPayload: AlertPayload = {
    sessionId: 'test-session-id',
    intentScore: 85,
    endReason: 'test',
    summary: 'This is a test alert from MattressAI',
    timestamp: new Date().toISOString(),
    config
  };

  switch (channel) {
    case 'email':
      await sendEmailAlert(tenantId, testPayload, config);
      break;
    case 'sms':
      await sendSMSAlert(tenantId, testPayload, config);
      break;
    case 'slack':
      await sendSlackAlert(tenantId, testPayload, config);
      break;
    case 'webhook':
      await sendWebhookAlert(tenantId, testPayload, config);
      break;
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
};

