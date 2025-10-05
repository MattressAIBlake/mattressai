import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac.server';

export const loader = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // Return the widget JavaScript
  const widgetScript = `(function(){
  const shop = document.currentScript?.dataset?.tenant || '';
  const page = { href: location.href, path: location.pathname, title: document.title };

  fetch('/apps/mattressai/session/start?shop=' + encodeURIComponent(shop), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page })
  }).catch(()=>{});

  window.MattressAI = { version: '0.1', started: true };
})();`;

  return new Response(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};
