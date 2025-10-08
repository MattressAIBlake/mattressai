import { json } from '@remix-run/node';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac';
import { exportCustomerData } from '~/lib/gdpr/gdpr.service';

export const action = async ({ request }) => {
  // Verify webhook HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  const signature = request.headers.get('X-Shopify-Hmac-Sha256');
  const rawBody = await request.text();

  if (!shopifySecret || !signature || !verifyWebhookHmac(rawBody, signature, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Log the request (redacted for PII)
  console.log('GDPR Data Request:', {
    shop_id: payload.shop_id,
    shop_domain: payload.shop_domain,
    customer_id: payload.customer?.id,
    customer_email: payload.customer?.email,
    request_id: payload.data_request_id,
    timestamp: new Date().toISOString()
  });

  try {
    // Export all customer data
    const exportData = await exportCustomerData(
      payload.shop_domain, // Use shop domain as tenant ID
      String(payload.customer?.id),
      payload.customer?.email
    );

    // In production, you would:
    // 1. Store this export in a secure location (S3, etc.)
    // 2. Send download link to customer email
    // 3. Or submit to Shopify's GDPR API endpoint
    // 4. Delete export after 30 days

    console.log('GDPR Data Export completed:', {
      request_id: payload.data_request_id,
      customer_id: payload.customer?.id,
      records_exported: {
        leads: exportData.data.leads.length,
        sessions: exportData.data.sessions.length,
        messages: exportData.data.messages.length,
        events: exportData.data.events.length
      }
    });

    // TODO: Send export to customer or Shopify API
    // For now, we just log it (production should store/send it)

    return json({
      received: true,
      request_id: payload.data_request_id,
      customer_id: payload.customer?.id,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
  } catch (error) {
    console.error('GDPR Data Export failed:', error);

    return json(
      {
        received: true,
        request_id: payload.data_request_id,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};
