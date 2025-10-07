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
  console.log('GDPR Shop Redact:', {
    shop_id: payload.shop_id,
    shop_domain: payload.shop_domain,
    request_id: payload.data_request_id,
    timestamp: new Date().toISOString()
  });

  // TODO: Implement actual shop data deletion
  // This should:
  // 1. Delete all data associated with the shop
  // 2. Remove shop-specific configurations
  // 3. Clean up any cached data
  // 4. Log completion

  return json({
    received: true,
    shop_id: payload.shop_id,
    timestamp: new Date().toISOString()
  });
};
