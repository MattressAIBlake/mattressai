import { json } from '@remix-run/node';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac.server';

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
    customer_id: payload.customer?.id,
    request_id: payload.data_request_id,
    timestamp: new Date().toISOString()
  });

  // TODO: Implement actual customer data deletion
  // This should:
  // 1. Find all customer data (conversations, sessions, leads, etc.)
  // 2. Anonymize or delete customer-identifiable information
  // 3. Keep necessary business records (order data, etc.) but remove PII
  // 4. Log completion

  return json({
    received: true,
    customer_id: payload.customer?.id,
    timestamp: new Date().toISOString()
  });
};
