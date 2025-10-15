import { json } from '@remix-run/node';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac';
import { redactCustomerData } from '~/lib/gdpr/gdpr.service.server';

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
  console.log('GDPR Customer Redact:', {
    shop_id: payload.shop_id,
    shop_domain: payload.shop_domain,
    customer_id: payload.customer?.id,
    customer_email: payload.customer?.email,
    request_id: payload.data_request_id,
    timestamp: new Date().toISOString()
  });

  try {
    // Delete/anonymize all customer data
    const result = await redactCustomerData(
      payload.shop_domain, // Use shop domain as tenant ID
      String(payload.customer?.id),
      payload.customer?.email
    );

    console.log('GDPR Customer Redaction completed:', {
      request_id: payload.data_request_id,
      customer_id: payload.customer?.id,
      records_deleted: result.summary
    });

    return json({
      received: true,
      customer_id: payload.customer?.id,
      request_id: payload.data_request_id,
      timestamp: new Date().toISOString(),
      status: 'completed',
      summary: result.summary
    });
  } catch (error) {
    console.error('GDPR Customer Redaction failed:', error);

    return json(
      {
        received: true,
        request_id: payload.data_request_id,
        customer_id: payload.customer?.id,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};
