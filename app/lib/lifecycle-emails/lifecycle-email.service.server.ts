/**
 * Lifecycle Email Service
 * Handles automated emails for merchant lifecycle events (install, uninstall, upgrades, etc.)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type LifecycleEventType =
  | 'app_installed'
  | 'app_uninstalled'
  | 'trial_started'
  | 'trial_ending_soon'
  | 'trial_ended'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'payment_failed';

export interface LifecycleEventData {
  merchantName?: string;
  shopDomain: string;
  planName?: string;
  trialEndsAt?: string;
  loginUrl?: string;
  upgradeUrl?: string;
  reactivateUrl?: string;
  reinstallUrl?: string;
  updatePaymentUrl?: string;
  supportEmail?: string;
  previousPlan?: string;
  subscriptionEndsAt?: string;
  amount?: string;
  reason?: string;
  sessionCount?: number;
  leadCount?: number;
  conversionRate?: number;
  tokensPerMonth?: number;
  alertsPerHour?: number;
  vectorQueries?: number;
  indexJobs?: number;
  smsEnabled?: boolean;
  prioritySupport?: boolean;
  [key: string]: any;
}

/**
 * Main entry point: Send lifecycle email
 */
export async function sendLifecycleEmail(
  eventType: LifecycleEventType,
  shop: string,
  eventData: LifecycleEventData
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    // Check if lifecycle emails are enabled globally
    const globalSettings = await getGlobalSettings();
    if (!globalSettings.enabled) {
      console.log(`[LifecycleEmail] Lifecycle emails disabled globally, skipping ${eventType}`);
      return { success: true }; // Not an error, just skipped
    }

    // Get template for this event type
    const template = await getTemplateForEvent(eventType);
    if (!template) {
      console.error(`[LifecycleEmail] No template found for event type: ${eventType}`);
      return { success: false, errors: [`No template for ${eventType}`] };
    }

    if (!template.enabled) {
      console.log(`[LifecycleEmail] Template disabled for ${eventType}, skipping`);
      return { success: true };
    }

    // Get merchant email and team emails
    const merchantEmail = await getMerchantEmail(shop);
    const teamEmails = globalSettings.teamEmails;

    const errors: string[] = [];

    // Prepare common template data
    const templateData = {
      ...eventData,
      supportEmail: globalSettings.replyToEmail || process.env.LIFECYCLE_EMAILS_REPLY_TO || 'support@mattressai.com',
      loginUrl: eventData.loginUrl || `https://${shop}/admin/apps/mattressai`,
      upgradeUrl: eventData.upgradeUrl || `https://${shop}/admin/apps/mattressai/plans`,
      reactivateUrl: eventData.reactivateUrl || `https://${shop}/admin/apps/mattressai/plans`,
      reinstallUrl: eventData.reinstallUrl || `https://apps.shopify.com/mattressai`,
      updatePaymentUrl: eventData.updatePaymentUrl || `https://${shop}/admin/settings/billing`
    };

    // Send to merchant
    if (template.sendToMerchant && merchantEmail) {
      try {
        const subject = renderTemplate(template.merchantSubject, templateData);
        const body = renderTemplate(template.merchantBody, templateData);
        
        await sendEmail(merchantEmail, subject, body, globalSettings.replyToEmail);
        await logEmailSent(shop, eventType, merchantEmail, 'merchant', subject, 'sent');
      } catch (error) {
        console.error(`[LifecycleEmail] Failed to send to merchant:`, error);
        errors.push(`Merchant email failed: ${error.message}`);
        await logEmailSent(shop, eventType, merchantEmail, 'merchant', template.merchantSubject, 'failed', error.message);
      }
    }

    // Send to team
    if (template.sendToTeam && teamEmails && teamEmails.length > 0) {
      for (const teamEmail of teamEmails) {
        try {
          const subject = renderTemplate(template.teamSubject || template.merchantSubject, templateData);
          const body = renderTemplate(template.teamBody || template.merchantBody, templateData);
          
          await sendEmail(teamEmail, subject, body, globalSettings.replyToEmail);
          await logEmailSent(shop, eventType, teamEmail, 'team', subject, 'sent');
        } catch (error) {
          console.error(`[LifecycleEmail] Failed to send to team ${teamEmail}:`, error);
          errors.push(`Team email failed for ${teamEmail}: ${error.message}`);
          await logEmailSent(shop, eventType, teamEmail, 'team', template.teamSubject || '', 'failed', error.message);
        }
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error(`[LifecycleEmail] Error in sendLifecycleEmail:`, error);
    return { success: false, errors: [error.message] };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get template for event type
 */
async function getTemplateForEvent(eventType: LifecycleEventType) {
  try {
    const template = await prisma.lifecycleEmailTemplate.findUnique({
      where: { eventType }
    });
    return template;
  } catch (error) {
    console.error(`[LifecycleEmail] Error fetching template:`, error);
    return null;
  }
}

/**
 * Render template with variable substitution
 */
function renderTemplate(template: string, data: LifecycleEventData): string {
  let rendered = template;
  
  // Replace all {{variable}} placeholders
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
  });
  
  // Remove any remaining unreplaced variables
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');
  
  return rendered;
}

/**
 * Send email via SendGrid
 */
async function sendEmail(
  recipient: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'alerts@mattressai.app';
  const fromName = process.env.LIFECYCLE_EMAILS_FROM_NAME || 'MattressAI Team';

  const payload: any = {
    personalizations: [{ to: [{ email: recipient }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content: [{ type: 'text/html', value: html }]
  };

  if (replyTo) {
    payload.reply_to = { email: replyTo };
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${errorText}`);
  }
}

/**
 * Log email sent/failed
 */
async function logEmailSent(
  tenantId: string,
  eventType: string,
  recipient: string,
  recipientType: 'merchant' | 'team',
  subject: string,
  status: 'sent' | 'failed' | 'skipped',
  error?: string
): Promise<void> {
  try {
    await prisma.lifecycleEmailLog.create({
      data: {
        tenantId,
        eventType,
        recipient,
        recipientType,
        subject,
        status,
        error: error || null
      }
    });
  } catch (err) {
    console.error(`[LifecycleEmail] Error logging email:`, err);
    // Don't throw - logging failure shouldn't stop the process
  }
}

/**
 * Get merchant email from shop
 */
async function getMerchantEmail(shop: string): Promise<string | null> {
  try {
    // Try to get from session table (has email field)
    const session = await prisma.session.findFirst({
      where: { shop },
      select: { email: true },
      orderBy: { id: 'desc' }
    });
    
    return session?.email || null;
  } catch (error) {
    console.error(`[LifecycleEmail] Error fetching merchant email:`, error);
    return null;
  }
}

/**
 * Get global settings (or create default if not exists)
 */
async function getGlobalSettings(): Promise<{
  enabled: boolean;
  teamEmails: string[];
  replyToEmail?: string;
}> {
  try {
    let settings = await prisma.lifecycleEmailSettings.findFirst({
      where: { tenantId: null } // null = global settings
    });

    // Create default global settings if not exists
    if (!settings) {
      const defaultTeamEmail = process.env.LIFECYCLE_EMAILS_TEAM_DEFAULT || 'team@mattressai.com';
      settings = await prisma.lifecycleEmailSettings.create({
        data: {
          tenantId: null,
          teamEmails: JSON.stringify([defaultTeamEmail]),
          replyToEmail: process.env.LIFECYCLE_EMAILS_REPLY_TO || 'support@mattressai.com',
          enabled: true
        }
      });
    }

    return {
      enabled: settings.enabled,
      teamEmails: JSON.parse(settings.teamEmails),
      replyToEmail: settings.replyToEmail || undefined
    };
  } catch (error) {
    console.error(`[LifecycleEmail] Error fetching settings:`, error);
    // Return safe defaults
    return {
      enabled: true,
      teamEmails: ['team@mattressai.com'],
      replyToEmail: 'support@mattressai.com'
    };
  }
}

/**
 * Update global settings
 */
export async function updateGlobalSettings(settings: {
  enabled?: boolean;
  teamEmails?: string[];
  replyToEmail?: string;
}): Promise<void> {
  try {
    const existing = await prisma.lifecycleEmailSettings.findFirst({
      where: { tenantId: null }
    });

    const data: any = {};
    if (settings.enabled !== undefined) data.enabled = settings.enabled;
    if (settings.teamEmails) data.teamEmails = JSON.stringify(settings.teamEmails);
    if (settings.replyToEmail !== undefined) data.replyToEmail = settings.replyToEmail;

    if (existing) {
      await prisma.lifecycleEmailSettings.update({
        where: { id: existing.id },
        data
      });
    } else {
      await prisma.lifecycleEmailSettings.create({
        data: {
          tenantId: null,
          teamEmails: JSON.stringify(settings.teamEmails || ['team@mattressai.com']),
          replyToEmail: settings.replyToEmail || 'support@mattressai.com',
          enabled: settings.enabled !== undefined ? settings.enabled : true
        }
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get all email logs with optional filters
 */
export async function getEmailLogs(filters?: {
  tenantId?: string;
  eventType?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.sentAt = {};
      if (filters.dateFrom) where.sentAt.gte = filters.dateFrom;
      if (filters.dateTo) where.sentAt.lte = filters.dateTo;
    }

    const [logs, total] = await Promise.all([
      prisma.lifecycleEmailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      }),
      prisma.lifecycleEmailLog.count({ where })
    ]);

    return { logs, total };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Resend a failed email
 */
export async function resendEmail(logId: string): Promise<boolean> {
  try {
    const log = await prisma.lifecycleEmailLog.findUnique({
      where: { id: logId }
    });

    if (!log) {
      console.error(`[LifecycleEmail] Log not found: ${logId}`);
      return false;
    }

    if (log.status === 'sent') {
      console.log(`[LifecycleEmail] Email already sent, skipping resend`);
      return true;
    }

    // Get template and resend
    const template = await getTemplateForEvent(log.eventType as LifecycleEventType);
    if (!template) {
      console.error(`[LifecycleEmail] Template not found for ${log.eventType}`);
      return false;
    }

    const globalSettings = await getGlobalSettings();
    const body = log.recipientType === 'merchant' ? template.merchantBody : template.teamBody;
    
    if (!body) {
      console.error(`[LifecycleEmail] No body for recipient type ${log.recipientType}`);
      return false;
    }

    try {
      await sendEmail(log.recipient, log.subject, body, globalSettings.replyToEmail);
      
      // Update log status
      await prisma.lifecycleEmailLog.update({
        where: { id: logId },
        data: {
          status: 'sent',
          error: null,
          sentAt: new Date()
        }
      });
      
      return true;
    } catch (error) {
      // Update log with new error
      await prisma.lifecycleEmailLog.update({
        where: { id: logId },
        data: {
          error: error.message,
          sentAt: new Date()
        }
      });
      
      return false;
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get all templates
 */
export async function getAllTemplates() {
  try {
    return await prisma.lifecycleEmailTemplate.findMany({
      orderBy: { eventType: 'asc' }
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Update a template
 */
export async function updateTemplate(eventType: string, data: {
  merchantSubject?: string;
  merchantBody?: string;
  teamSubject?: string;
  teamBody?: string;
  enabled?: boolean;
  sendToMerchant?: boolean;
  sendToTeam?: boolean;
}) {
  try {
    const template = await prisma.lifecycleEmailTemplate.findUnique({
      where: { eventType }
    });

    if (!template) {
      throw new Error(`Template not found: ${eventType}`);
    }

    return await prisma.lifecycleEmailTemplate.update({
      where: { eventType },
      data
    });
  } finally {
    await prisma.$disconnect();
  }
}

