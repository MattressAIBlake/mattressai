import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // TODO: Process chat message, integrate with AI service, return response
  // For now, just return placeholder response
  return json({
    ok: true,
    action: 'chat',
    todo: true,
    timestamp: new Date().toISOString()
  });
};
