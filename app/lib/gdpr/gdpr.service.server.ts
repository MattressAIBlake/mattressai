/**
 * GDPR Compliance Service
 * 
 * Handles customer data export, deletion, and shop data deletion
 * as required by Shopify's GDPR webhooks.
 * 
 * IMPORTANT: This must be fully functional before App Store submission.
 */

import prisma from '~/db.server';

/**
 * Export all customer data in machine-readable format
 * Called by: webhooks.customers.data_request
 * 
 * @param shopId - Shop domain (e.g., "shop.myshopify.com")
 * @param customerId - Shopify customer ID
 * @param customerEmail - Customer email (optional but helpful)
 * @returns Object containing all customer data
 */
export const exportCustomerData = async (
  shopId: string,
  customerId: string,
  customerEmail?: string
) => {
  console.log(`[GDPR] Exporting data for customer ${customerId} in shop ${shopId}`);

  try {
    // Find leads by Shopify customer ID
    const leadsByCustomerId = await prisma.lead.findMany({
      where: {
        tenantId: shopId,
        shopifyCustomerId: customerId
      }
    });

    // Also find leads by email if provided
    const leadsByEmail = customerEmail
      ? await prisma.lead.findMany({
          where: {
            tenantId: shopId,
            email: customerEmail
          }
        })
      : [];

    // Combine and deduplicate leads
    const allLeads = [...leadsByCustomerId, ...leadsByEmail];
    const uniqueLeads = Array.from(
      new Map(allLeads.map((lead) => [lead.id, lead])).values()
    );

    // Get all session IDs from leads
    const sessionIds = uniqueLeads.map((lead) => lead.sessionId);

    // Find all chat sessions
    const sessions = await prisma.chatSession.findMany({
      where: {
        id: { in: sessionIds }
      },
      include: {
        events: true,
        alerts: true,
        leads: true
      }
    });

    // Get conversation IDs
    const conversationIds = sessions
      .map((s) => s.conversationId)
      .filter((id): id is string => id !== null);

    // Get all messages from conversations
    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get customer tokens
    const customerTokens = await prisma.customerToken.findMany({
      where: {
        conversationId: { in: conversationIds }
      }
    });

    // Compile export data
    const exportData = {
      customer_id: customerId,
      customer_email: customerEmail || null,
      shop_id: shopId,
      exported_at: new Date().toISOString(),
      data: {
        leads: uniqueLeads.map((lead) => ({
          id: lead.id,
          email: lead.email,
          phone: lead.phone,
          name: lead.name,
          zip: lead.zip,
          consent: lead.consent,
          status: lead.status,
          created_at: lead.createdAt.toISOString(),
          updated_at: lead.updatedAt.toISOString()
        })),
        sessions: sessions.map((session) => ({
          id: session.id,
          conversation_id: session.conversationId,
          started_at: session.startedAt.toISOString(),
          ended_at: session.endedAt?.toISOString() || null,
          end_reason: session.endReason,
          intent_score: session.intentScore,
          summary: session.summary,
          consent: session.consent,
          variant_id: session.variantId
        })),
        events: sessions.flatMap((s) =>
          s.events.map((event) => ({
            id: event.id,
            session_id: event.sessionId,
            type: event.type,
            timestamp: event.timestamp.toISOString(),
            metadata: event.metadata,
            click_id: event.clickId
          }))
        ),
        alerts: sessions.flatMap((s) =>
          s.alerts.map((alert) => ({
            id: alert.id,
            session_id: alert.sessionId,
            type: alert.type,
            channel: alert.channel,
            status: alert.status,
            created_at: alert.createdAt.toISOString(),
            sent_at: alert.sentAt?.toISOString() || null
          }))
        ),
        messages: messages.map((msg) => ({
          id: msg.id,
          conversation_id: msg.conversationId,
          role: msg.role,
          content: msg.content,
          created_at: msg.createdAt.toISOString()
        })),
        customer_tokens: customerTokens.map((token) => ({
          id: token.id,
          conversation_id: token.conversationId,
          expires_at: token.expiresAt.toISOString(),
          created_at: token.createdAt.toISOString()
        }))
      }
    };

    console.log(`[GDPR] Successfully exported data for customer ${customerId}`);
    console.log(`  - ${uniqueLeads.length} leads`);
    console.log(`  - ${sessions.length} sessions`);
    console.log(`  - ${messages.length} messages`);

    return exportData;
  } catch (error) {
    console.error(`[GDPR] Error exporting customer data:`, error);
    throw error;
  }
};

/**
 * Delete or anonymize all customer personal data
 * Called by: webhooks.customers.redact
 * 
 * @param shopId - Shop domain
 * @param customerId - Shopify customer ID
 * @param customerEmail - Customer email (optional but helpful)
 */
export const redactCustomerData = async (
  shopId: string,
  customerId: string,
  customerEmail?: string
) => {
  console.log(`[GDPR] Redacting data for customer ${customerId} in shop ${shopId}`);

  try {
    // Find all leads for this customer
    const leadsByCustomerId = await prisma.lead.findMany({
      where: {
        tenantId: shopId,
        shopifyCustomerId: customerId
      }
    });

    const leadsByEmail = customerEmail
      ? await prisma.lead.findMany({
          where: {
            tenantId: shopId,
            email: customerEmail
          }
        })
      : [];

    // Combine and deduplicate
    const allLeads = [...leadsByCustomerId, ...leadsByEmail];
    const uniqueLeads = Array.from(
      new Map(allLeads.map((lead) => [lead.id, lead])).values()
    );

    const sessionIds = uniqueLeads.map((lead) => lead.sessionId);
    const leadIds = uniqueLeads.map((lead) => lead.id);

    // Get conversation IDs before deleting leads
    const sessions = await prisma.chatSession.findMany({
      where: { id: { in: sessionIds } },
      select: { conversationId: true }
    });

    const conversationIds = sessions
      .map((s) => s.conversationId)
      .filter((id): id is string => id !== null);

    // Delete in correct order (respecting foreign keys)

    // 1. Delete alerts associated with these sessions
    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        sessionId: { in: sessionIds }
      }
    });

    // 2. Delete events associated with these sessions
    const deletedEvents = await prisma.event.deleteMany({
      where: {
        sessionId: { in: sessionIds }
      }
    });

    // 3. Delete leads (this removes PII: email, phone, name, zip)
    const deletedLeads = await prisma.lead.deleteMany({
      where: {
        id: { in: leadIds }
      }
    });

    // 4. Anonymize chat sessions (remove summary if it contains PII)
    const updatedSessions = await prisma.chatSession.updateMany({
      where: {
        id: { in: sessionIds }
      },
      data: {
        consent: false,
        summary: '[REDACTED - GDPR REQUEST]'
      }
    });

    // 5. Delete messages from conversations (contains customer PII)
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversationId: { in: conversationIds }
      }
    });

    // 6. Delete customer tokens
    const deletedTokens = await prisma.customerToken.deleteMany({
      where: {
        conversationId: { in: conversationIds }
      }
    });

    // 7. Delete conversation records
    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        id: { in: conversationIds }
      }
    });

    // 8. Delete customer account URLs
    const deletedAccountUrls = await prisma.customerAccountUrl.deleteMany({
      where: {
        conversationId: { in: conversationIds }
      }
    });

    console.log(`[GDPR] Successfully redacted customer ${customerId} data:`);
    console.log(`  - ${deletedLeads.count} leads deleted`);
    console.log(`  - ${updatedSessions.count} sessions anonymized`);
    console.log(`  - ${deletedMessages.count} messages deleted`);
    console.log(`  - ${deletedEvents.count} events deleted`);
    console.log(`  - ${deletedAlerts.count} alerts deleted`);
    console.log(`  - ${deletedTokens.count} tokens deleted`);
    console.log(`  - ${deletedConversations.count} conversations deleted`);
    console.log(`  - ${deletedAccountUrls.count} account URLs deleted`);

    return {
      success: true,
      customer_id: customerId,
      shop_id: shopId,
      deleted_at: new Date().toISOString(),
      summary: {
        leads: deletedLeads.count,
        sessions: updatedSessions.count,
        messages: deletedMessages.count,
        events: deletedEvents.count,
        alerts: deletedAlerts.count,
        tokens: deletedTokens.count,
        conversations: deletedConversations.count,
        account_urls: deletedAccountUrls.count
      }
    };
  } catch (error) {
    console.error(`[GDPR] Error redacting customer data:`, error);
    throw error;
  }
};

/**
 * Delete ALL data for a shop (when shop uninstalls permanently)
 * Called by: webhooks.shop.redact
 * 
 * @param shopId - Shop domain
 */
export const redactShopData = async (shopId: string) => {
  console.log(`[GDPR] Redacting ALL data for shop ${shopId}`);

  try {
    // Delete in correct order (respecting foreign keys)

    // 1. Delete alerts
    const deletedAlerts = await prisma.alert.deleteMany({
      where: { tenantId: shopId }
    });

    // 2. Delete events
    const deletedEvents = await prisma.event.deleteMany({
      where: { tenantId: shopId }
    });

    // 3. Delete leads
    const deletedLeads = await prisma.lead.deleteMany({
      where: { tenantId: shopId }
    });

    // 4. Delete chat sessions
    const deletedSessions = await prisma.chatSession.deleteMany({
      where: { tenantId: shopId }
    });

    // 5. Delete alert settings
    const deletedAlertSettings = await prisma.alertSettings.deleteMany({
      where: { tenantId: shopId }
    });

    // 6. Delete variants first (child of experiments)
    const experiments = await prisma.experiment.findMany({
      where: { tenantId: shopId },
      select: { id: true }
    });
    const experimentIds = experiments.map((e) => e.id);

    const deletedVariants = await prisma.variant.deleteMany({
      where: { experimentId: { in: experimentIds } }
    });

    // 7. Delete experiments
    const deletedExperiments = await prisma.experiment.deleteMany({
      where: { tenantId: shopId }
    });

    // 8. Delete product profiles
    const deletedProfiles = await prisma.productProfile.deleteMany({
      where: { tenant: shopId }
    });

    // 9. Delete index jobs
    const deletedIndexJobs = await prisma.indexJob.deleteMany({
      where: { tenant: shopId }
    });

    // 10. Delete prompt versions
    const deletedPromptVersions = await prisma.promptVersion.deleteMany({
      where: { tenant: shopId }
    });

    // 11. Delete tenant record
    const deletedTenant = await prisma.tenant.deleteMany({
      where: { shop: shopId }
    });

    // Note: We keep Session records (OAuth sessions) as they're needed
    // for app functionality and don't contain customer PII

    console.log(`[GDPR] Successfully redacted ALL data for shop ${shopId}:`);
    console.log(`  - ${deletedAlerts.count} alerts`);
    console.log(`  - ${deletedEvents.count} events`);
    console.log(`  - ${deletedLeads.count} leads`);
    console.log(`  - ${deletedSessions.count} chat sessions`);
    console.log(`  - ${deletedAlertSettings.count} alert settings`);
    console.log(`  - ${deletedVariants.count} variants`);
    console.log(`  - ${deletedExperiments.count} experiments`);
    console.log(`  - ${deletedProfiles.count} product profiles`);
    console.log(`  - ${deletedIndexJobs.count} index jobs`);
    console.log(`  - ${deletedPromptVersions.count} prompt versions`);
    console.log(`  - ${deletedTenant.count} tenant records`);

    return {
      success: true,
      shop_id: shopId,
      deleted_at: new Date().toISOString(),
      summary: {
        alerts: deletedAlerts.count,
        events: deletedEvents.count,
        leads: deletedLeads.count,
        sessions: deletedSessions.count,
        alert_settings: deletedAlertSettings.count,
        variants: deletedVariants.count,
        experiments: deletedExperiments.count,
        product_profiles: deletedProfiles.count,
        index_jobs: deletedIndexJobs.count,
        prompt_versions: deletedPromptVersions.count,
        tenant: deletedTenant.count
      }
    };
  } catch (error) {
    console.error(`[GDPR] Error redacting shop data:`, error);
    throw error;
  }
};

/**
 * Helper: Check if customer has any data in the system
 * Useful for verification
 */
export const checkCustomerData = async (
  shopId: string,
  customerId: string,
  customerEmail?: string
) => {
  const leadsByCustomerId = await prisma.lead.count({
    where: {
      tenantId: shopId,
      shopifyCustomerId: customerId
    }
  });

  const leadsByEmail = customerEmail
    ? await prisma.lead.count({
        where: {
          tenantId: shopId,
          email: customerEmail
        }
      })
    : 0;

  return {
    has_data: leadsByCustomerId > 0 || leadsByEmail > 0,
    leads_by_customer_id: leadsByCustomerId,
    leads_by_email: leadsByEmail
  };
};

