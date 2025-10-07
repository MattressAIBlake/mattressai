import { json } from '@remix-run/node';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac';

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
    customer_id: payload.customer?.id,
    request_id: payload.data_request_id,
    timestamp: new Date().toISOString()
  });

  // TODO: Implement actual data export for customer
  // This should:
  // 1. Query database for customer data (conversations, sessions, etc.)
  // 2. Compile into exportable format
  // 3. Send to Shopify's GDPR API or customer email
  // 4. Log completion

  return json({
    received: true,
    request_id: payload.data_request_id,
    timestamp: new Date().toISOString()
  });
};
