/**
 * Digest Worker
 * Generates and sends weekly analytics digests
 * Can be invoked via cron job (e.g., every Monday at 9am)
 */

import prisma from '~/db.server';
import { generateWeeklyDigest } from '~/lib/analytics/analytics.service.server';

interface DigestEmail {
  to: string;
  subject: string;
  html: string;
}

interface SlackDigest {
  url: string;
  message: any;
}

/**
 * Generate HTML email content for digest
 */
const generateDigestHTML = (tenantId: string, digest: any): string => {
  const { weekStart, weekEnd, funnel, sessions, leads, topProducts } = digest;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5c6ac4; color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
        .stat { display: inline-block; margin: 10px 20px 10px 0; }
        .stat-value { font-size: 24px; font-weight: bold; color: #5c6ac4; }
        .stat-label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #5c6ac4; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Weekly MattressAI Report</h1>
          <p>${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>📈 Key Metrics</h2>
          <div class="stat">
            <div class="stat-value">${sessions.totalSessions}</div>
            <div class="stat-label">Total Sessions</div>
          </div>
          <div class="stat">
            <div class="stat-value">${leads.totalLeads}</div>
            <div class="stat-label">Leads Captured</div>
          </div>
          <div class="stat">
            <div class="stat-value">${sessions.avgIntentScore}</div>
            <div class="stat-label">Avg Intent Score</div>
          </div>
          <div class="stat">
            <div class="stat-value">${funnel.order_placed}</div>
            <div class="stat-label">Orders</div>
          </div>
        </div>

        <div class="section">
          <h2>🔄 Conversion Funnel</h2>
          <table>
            <tr>
              <th>Stage</th>
              <th>Count</th>
              <th>Rate</th>
            </tr>
            <tr>
              <td>Widget Viewed</td>
              <td>${funnel.widget_viewed}</td>
              <td>100%</td>
            </tr>
            <tr>
              <td>Chat Opened</td>
              <td>${funnel.opened}</td>
              <td>${funnel.conversionRates.viewToOpen}%</td>
            </tr>
            <tr>
              <td>First Message</td>
              <td>${funnel.first_message}</td>
              <td>${funnel.conversionRates.openToMessage}%</td>
            </tr>
            <tr>
              <td>Recommendations Shown</td>
              <td>${funnel.recommendation_shown}</td>
              <td>${funnel.conversionRates.dataToRecs}%</td>
            </tr>
            <tr>
              <td>Added to Cart</td>
              <td>${funnel.add_to_cart}</td>
              <td>${funnel.conversionRates.clickToCart}%</td>
            </tr>
            <tr>
              <td>Order Placed</td>
              <td>${funnel.order_placed}</td>
              <td>-</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>🛏️ Top Products</h2>
          <table>
            <tr>
              <th>Product</th>
              <th>Recommended</th>
              <th>Orders</th>
              <th>Conv. Rate</th>
            </tr>
            ${topProducts.slice(0, 5).map((product: any) => `
              <tr>
                <td>${product.productTitle}</td>
                <td>${product.recommendedCount}</td>
                <td>${product.orderedCount}</td>
                <td>${product.conversionRate}%</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h2>👥 Lead Performance</h2>
          <div class="stat">
            <div class="stat-value">${leads.consentRate}%</div>
            <div class="stat-label">Consent Rate</div>
          </div>
          <div class="stat">
            <div class="stat-value">${leads.statusBreakdown?.won || 0}</div>
            <div class="stat-label">Won Leads</div>
          </div>
          <div class="stat">
            <div class="stat-value">${leads.statusBreakdown?.contacted || 0}</div>
            <div class="stat-label">Contacted</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><a href="https://${tenantId}/admin/apps/mattressai/analytics" style="color: #5c6ac4;">View Full Analytics Dashboard</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Slack message for digest
 */
const generateSlackMessage = (tenantId: string, digest: any): any => {
  const { weekStart, weekEnd, funnel, sessions, leads, topProducts } = digest;

  return {
    text: '📊 Weekly MattressAI Report',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Your Weekly MattressAI Report'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}*`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Sessions:*\n${sessions.totalSessions}`
          },
          {
            type: 'mrkdwn',
            text: `*Leads:*\n${leads.totalLeads}`
          },
          {
            type: 'mrkdwn',
            text: `*Avg Intent:*\n${sessions.avgIntentScore}`
          },
          {
            type: 'mrkdwn',
            text: `*Orders:*\n${funnel.order_placed}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Conversion Funnel*\n• Viewed → Opened: ${funnel.conversionRates.viewToOpen}%\n• Opened → Message: ${funnel.conversionRates.openToMessage}%\n• Message → Recs: ${funnel.conversionRates.dataToRecs}%\n• Cart → Order: ${funnel.conversionRates.cartToCheckout}%`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Top Products*\n${topProducts.slice(0, 3).map((p: any, i: number) => 
            `${i + 1}. ${p.productTitle} (${p.recommendedCount} recs, ${p.orderedCount} orders)`
          ).join('\n')}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Full Dashboard'
            },
            url: `https://${tenantId}/admin/apps/mattressai/analytics`
          }
        ]
      }
    ]
  };
};

/**
 * Send digest via email
 */
const sendDigestEmail = async (email: DigestEmail): Promise<void> => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('SENDGRID_API_KEY not configured, skipping email digest');
    return;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email.to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL || 'digests@mattressai.app' },
      subject: email.subject,
      content: [{ type: 'text/html', value: email.html }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${errorText}`);
  }
};

/**
 * Send digest via Slack
 */
const sendSlackDigest = async (slackDigest: SlackDigest): Promise<void> => {
  const response = await fetch(slackDigest.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackDigest.message)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack error: ${errorText}`);
  }
};

/**
 * Generate and send weekly digests for all tenants
 */
export const runDigestWorker = async (): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> => {
  console.log('[Digest Worker] Starting...');

  const stats = {
    processed: 0,
    sent: 0,
    failed: 0
  };

  try {
    // Get all tenants with digest enabled
    const settingsWithDigest = await prisma.alertSettings.findMany({
      where: {
        digest: { not: null }
      }
    });

    for (const settings of settingsWithDigest) {
      const digest = settings.digest ? JSON.parse(settings.digest) : null;
      
      if (!digest?.enabled) {
        continue;
      }

      stats.processed++;
      const { tenantId, channels } = settings;

      try {
        // Generate digest data
        const digestData = await generateWeeklyDigest(tenantId);

        const parsedChannels = JSON.parse(channels);

        // Send via email if configured
        if (parsedChannels.email?.to) {
          const html = generateDigestHTML(tenantId, digestData);
          await sendDigestEmail({
            to: parsedChannels.email.to,
            subject: '📊 Your Weekly MattressAI Report',
            html
          });
          console.log(`[Digest Worker] Email sent to ${tenantId}`);
        }

        // Send via Slack if configured
        if (parsedChannels.slack?.url) {
          const message = generateSlackMessage(tenantId, digestData);
          await sendSlackDigest({
            url: parsedChannels.slack.url,
            message
          });
          console.log(`[Digest Worker] Slack message sent to ${tenantId}`);
        }

        stats.sent++;
      } catch (error) {
        console.error(`[Digest Worker] Error for tenant ${tenantId}:`, error);
        stats.failed++;
      }
    }

    console.log('[Digest Worker] Completed:', stats);
    return stats;
  } catch (error) {
    console.error('[Digest Worker] Error:', error);
    throw error;
  }
};

// If run directly (e.g., node digest-worker.js)
if (require.main === module) {
  runDigestWorker()
    .then((stats) => {
      console.log('Digest worker finished:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Digest worker failed:', error);
      process.exit(1);
    });
}

