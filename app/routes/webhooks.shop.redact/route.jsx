import { json } from '@remix-run/node';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac';
import { redactShopData } from '~/lib/gdpr/gdpr.service.server';

export const action = async ({ request }) => {
  // Verify webhook HMAC
  const shopifySecret = process.env.SHOPIFY_API_SECRET;
  const signature = request.headers.get('X-Shopify-Hmac-Sha256');
  const rawBody = await request.text();

  if (!shopifySecret || !signature || !verifyWebhookHmac(rawBody, signature, shopifySecret)) {
    console.error('Webhook HMAC verification failed for shop redact');
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

  try {
    // Delete ALL data for the shop
    const result = await redactShopData(payload.shop_domain);

    console.log('GDPR Shop Redaction completed:', {
      request_id: payload.data_request_id,
      shop_id: payload.shop_id,
      shop_domain: payload.shop_domain,
      records_deleted: result.summary
    });

    return json({
      received: true,
      shop_id: payload.shop_id,
      shop_domain: payload.shop_domain,
      request_id: payload.data_request_id,
      timestamp: new Date().toISOString(),
      status: 'completed',
      summary: result.summary
    });
  } catch (error) {
    console.error('GDPR Shop Redaction failed:', error);

    return json(
      {
        received: true,
        request_id: payload.data_request_id,
        shop_id: payload.shop_id,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};
