import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac.server';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // TODO: Clean up session, save conversation history, etc.
  // For now, just return placeholder response
  return json({
    ok: true,
    action: 'session/close',
    todo: true,
    timestamp: new Date().toISOString()
  });
};
