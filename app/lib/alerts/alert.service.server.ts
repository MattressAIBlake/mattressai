/**
 * Alert Service
 * Handles alert delivery across multiple channels: email, SMS, Slack, webhook, Podium, Birdeye
 */

import prisma from '~/db.server';
import crypto from 'crypto';
import { sendLeadToPodium } from '~/lib/integrations/podium.service';
import { sendLeadToBirdeye } from '~/lib/integrations/birdeye.service';

interface AlertPayload {
  sessionId: string;
  intentScore: number;
  endReason: string;
  summary?: string;
  leadEmail?: string;
  leadName?: string;
  leadPhone?: string;
  leadZip?: string;
  products?: Array<{
    title: string;
    imageUrl?: string;
    wasClicked: boolean;
  }>;
  timestamp: string;
  config?: any;
}

/**
 * Enrich alert payload with product and lead data
 */
const enrichPayload = async (payload: AlertPayload, tenantId: string): Promise<void> => {
  try {
    // Fetch lead information
    const lead = await prisma.lead.findFirst({
      where: { 
        sessionId: payload.sessionId,
        tenantId 
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lead) {
      payload.leadName = lead.name || undefined;
      payload.leadEmail = lead.email || undefined;
      payload.leadPhone = lead.phone || undefined;
      payload.leadZip = lead.zip || undefined;
    }

    // Fetch product events (recommendations shown and clicked)
    const events = await prisma.event.findMany({
      where: { 
        sessionId: payload.sessionId,
        type: { in: ['recommendation_shown', 'recommendation_clicked'] }
      },
      orderBy: { timestamp: 'desc' },
      take: 5 // Get top 5 to deduplicate
    });

    if (events.length > 0) {
      // Track unique products by ID
      const seenProductIds = new Set<string>();
      const productDetails: Array<{ title: string; imageUrl?: string; wasClicked: boolean }> = [];

      for (const event of events) {
        try {
          const metadata = typeof event.metadata === 'string' 
            ? JSON.parse(event.metadata) 
            : event.metadata;
          
          const productId = metadata.productId || metadata.variantId;
          
          // Skip if we've already seen this product
          if (seenProductIds.has(productId)) {
            continue;
          }
          
          seenProductIds.add(productId);

          // Try to get product details from ProductProfile
          const product = await prisma.productProfile.findFirst({
            where: { 
              shopifyProductId: productId,
              tenant: tenantId 
            }
          });

          productDetails.push({
            title: metadata.productTitle || product?.title || 'Unknown Product',
            imageUrl: product?.imageUrl || undefined,
            wasClicked: event.type === 'recommendation_clicked'
          });

          // Limit to 3 products in the alert
          if (productDetails.length >= 3) {
            break;
          }
        } catch (err) {
          console.error('Error parsing event metadata:', err);
        }
      }

      payload.products = productDetails;
    }
  } catch (error) {
    console.error('Error enriching payload:', error);
    // Continue without enrichment rather than failing
  }
};

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

    // Enrich payload with product and lead data
    await enrichPayload(payload, alert.tenantId);

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
      case 'podium':
        await sendPodiumAlert(alert.tenantId, sanitizedPayload, payload.config, consent);
        break;
      case 'birdeye':
        await sendBirdeyeAlert(alert.tenantId, sanitizedPayload, payload.config, consent);
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
    leadPhone: payload.leadPhone ? '[REDACTED]' : undefined,
    leadZip: payload.leadZip ? '[REDACTED]' : undefined,
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

  const subject = `🔔 New ${payload.endReason.replace(/_/g, ' ')} - Intent Score: ${payload.intentScore}/100`;
  
  // Build lead contact section
  const hasLeadInfo = payload.leadName || payload.leadEmail || payload.leadPhone || payload.leadZip;
  const leadSection = hasLeadInfo ? `
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">👤 Contact Information</h3>
      ${payload.leadName ? `<p style="margin: 8px 0;"><strong>Name:</strong> ${payload.leadName}</p>` : ''}
      ${payload.leadEmail ? `<p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${payload.leadEmail}" style="color: #0066cc;">${payload.leadEmail}</a></p>` : ''}
      ${payload.leadPhone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> <a href="tel:${payload.leadPhone}" style="color: #0066cc;">${payload.leadPhone}</a></p>` : ''}
      ${payload.leadZip ? `<p style="margin: 8px 0;"><strong>Zip Code:</strong> ${payload.leadZip}</p>` : ''}
    </div>
  ` : '';

  // Build conversation summary section
  const summarySection = payload.summary ? `
    <div style="background: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">💬 Conversation Summary</h3>
      <p style="margin: 0; line-height: 1.6;">${payload.summary}</p>
    </div>
  ` : '';

  // Build products section
  const productsSection = payload.products && payload.products.length > 0 ? `
    <div style="margin: 20px 0;">
      <h3 style="color: #333;">🛏️ Products of Interest</h3>
      ${payload.products.map(product => `
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; display: flex; align-items: center;">
          ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" style="max-width: 100px; max-height: 100px; margin-right: 15px; border-radius: 3px;" />` : ''}
          <div>
            <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>${product.title}</strong></p>
            ${product.wasClicked ? '<span style="background: #4caf50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">✓ Clicked</span>' : '<span style="background: #999; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">Viewed</span>'}
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">🔔 MattressAI Lead Alert</h2>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Intent Score:</strong> <span style="font-size: 20px; color: #0066cc;">${payload.intentScore}/100</span></p>
        <p style="margin: 8px 0;"><strong>Status:</strong> ${payload.endReason.replace(/_/g, ' ')}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${new Date(payload.timestamp).toLocaleString()}</p>
      </div>

      ${leadSection}
      ${summarySection}
      ${productsSection}

      <div style="margin: 30px 0; text-align: center;">
        <a href="https://${tenantId}/admin/apps/mattressai/sessions/${payload.sessionId}" 
           style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Full Session in Shopify
        </a>
      </div>

      <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 15px; font-size: 12px; color: #666;">
        <p style="margin: 0;">MattressAI - Intelligent Product Recommendations</p>
      </div>
    </div>
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

  // Build concise message with lead info and top product
  const leadName = payload.leadName || 'Anonymous';
  const phone = payload.leadPhone ? ` | ${payload.leadPhone}` : '';
  const topProduct = payload.products && payload.products.length > 0 
    ? ` | ${payload.products[0].title.substring(0, 40)}` 
    : '';
  const clicked = payload.products && payload.products.length > 0 && payload.products[0].wasClicked ? ' ✓' : '';
  
  const message = `MattressAI Lead: ${leadName}${phone}${topProduct}${clicked} | Intent: ${payload.intentScore}/100`;

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

  const message: any = {
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

  // Add lead contact information
  if (payload.leadName || payload.leadEmail || payload.leadPhone || payload.leadZip) {
    const fields: any[] = [];
    if (payload.leadName) {
      fields.push({
        type: 'mrkdwn',
        text: `*Name:*\n${payload.leadName}`
      });
    }
    if (payload.leadEmail) {
      fields.push({
        type: 'mrkdwn',
        text: `*Email:*\n<mailto:${payload.leadEmail}|${payload.leadEmail}>`
      });
    }
    if (payload.leadPhone) {
      fields.push({
        type: 'mrkdwn',
        text: `*Phone:*\n<tel:${payload.leadPhone}|${payload.leadPhone}>`
      });
    }
    if (payload.leadZip) {
      fields.push({
        type: 'mrkdwn',
        text: `*Zip:*\n${payload.leadZip}`
      });
    }
    message.blocks.push({
      type: 'section',
      fields
    });
  }

  // Add conversation summary
  if (payload.summary) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*💬 Summary:*\n${payload.summary}`
      }
    });
  }

  // Add product information with images
  if (payload.products && payload.products.length > 0) {
    message.blocks.push({
      type: 'divider'
    });
    
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🛏️ Products of Interest:*'
      }
    });

    payload.products.forEach(product => {
      const block: any = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${product.title}*\n${product.wasClicked ? '✅ Clicked by customer' : '👁️ Viewed by customer'}`
        }
      };

      // Add product image as accessory if available
      if (product.imageUrl) {
        block.accessory = {
          type: 'image',
          image_url: product.imageUrl,
          alt_text: product.title
        };
      }

      message.blocks.push(block);
    });
  }

  // Add action buttons
  message.blocks.push({
    type: 'divider'
  });

  message.blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '👁️ View Full Session'
        },
        url: `https://${tenantId}/admin/apps/mattressai/sessions/${payload.sessionId}`,
        style: 'primary'
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

  const secret = process.env.WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET || '';
  
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
 * Send Podium alert
 */
const sendPodiumAlert = async (
  tenantId: string,
  payload: AlertPayload,
  config: any,
  consent: boolean
): Promise<void> => {
  if (!consent) {
    throw new Error('Cannot send lead to Podium without user consent (GDPR compliance)');
  }

  const locationId = config.locationId;
  const apiKey = config.apiKey || process.env.PODIUM_API_KEY;

  if (!locationId || !apiKey) {
    throw new Error('Podium locationId and apiKey are required in channel config');
  }

  // Fetch lead details from session
  const lead = await prisma.lead.findFirst({
    where: {
      sessionId: payload.sessionId,
      tenantId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!lead) {
    throw new Error(`No lead found for session ${payload.sessionId}`);
  }

  await sendLeadToPodium({
    locationId,
    apiKey,
    leadEmail: lead.email || undefined,
    leadName: lead.name || undefined,
    leadPhone: lead.phone || undefined,
    intentScore: payload.intentScore,
    summary: payload.summary,
    sessionId: payload.sessionId
  });
};

/**
 * Send Birdeye alert
 */
const sendBirdeyeAlert = async (
  tenantId: string,
  payload: AlertPayload,
  config: any,
  consent: boolean
): Promise<void> => {
  if (!consent) {
    throw new Error('Cannot send lead to Birdeye without user consent (GDPR compliance)');
  }

  const businessId = config.businessId;
  const apiKey = config.apiKey || process.env.BIRDEYE_API_KEY;

  if (!businessId || !apiKey) {
    throw new Error('Birdeye businessId and apiKey are required in channel config');
  }

  // Fetch lead details from session
  const lead = await prisma.lead.findFirst({
    where: {
      sessionId: payload.sessionId,
      tenantId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!lead) {
    throw new Error(`No lead found for session ${payload.sessionId}`);
  }

  await sendLeadToBirdeye({
    businessId,
    apiKey,
    leadEmail: lead.email || undefined,
    leadName: lead.name || undefined,
    leadPhone: lead.phone || undefined,
    intentScore: payload.intentScore,
    summary: payload.summary,
    sessionId: payload.sessionId
  });
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
          webhook: {},
          podium: {},
          birdeye: {}
        }),
        throttles: JSON.stringify({
          perDay: -1,
          perSession: -1
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
    summary: 'Customer interested in medium-firm queen mattress with cooling features. Asked about delivery options and return policy.',
    leadEmail: 'test@mattressai.app',
    leadName: 'Test Customer',
    leadPhone: '+1-555-123-4567',
    leadZip: '90210',
    products: [
      {
        title: 'Premium Queen Memory Foam Mattress',
        imageUrl: 'https://cdn.shopify.com/s/files/1/example/mattress.jpg',
        wasClicked: true
      },
      {
        title: 'Cooling Gel Queen Mattress',
        imageUrl: 'https://cdn.shopify.com/s/files/1/example/cooling.jpg',
        wasClicked: false
      }
    ],
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
    case 'podium':
      await sendPodiumAlert(tenantId, testPayload, config, true);
      break;
    case 'birdeye':
      await sendBirdeyeAlert(tenantId, testPayload, config, true);
      break;
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
};

