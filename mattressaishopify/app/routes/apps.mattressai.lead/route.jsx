import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac.server';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // TODO: Process lead capture, save to database, trigger notifications
  // For now, just return placeholder response
  return json({
    ok: true,
    action: 'lead',
    todo: true,
    timestamp: new Date().toISOString()
  });
};
