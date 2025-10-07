import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac.server';
import { endSession } from '~/lib/session/session-orchestrator.service';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { sessionId, tenantId, conversationId, consent } = body;

    if (!sessionId || !tenantId) {
      return json(
        { error: 'sessionId and tenantId are required' },
        { status: 400 }
      );
    }

    // End the session
    await endSession({
      sessionId,
      tenantId,
      conversationId,
      endReason: 'explicit_close',
      consent
    });

    return json({
      ok: true,
      sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error closing session:', error);
    return json(
      { error: 'Failed to close session' },
      { status: 500 }
    );
  }
};
