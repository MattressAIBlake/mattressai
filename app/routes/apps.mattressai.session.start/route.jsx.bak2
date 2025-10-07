import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac.server';
import { createOrGetSession } from '~/lib/session/session-orchestrator.service';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { tenantId, conversationId } = body;

    if (!tenantId) {
      return json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Create or get session (now with A/B variant assignment)
    const { sessionId, variantAssignment } = await createOrGetSession(tenantId, conversationId);

    return json({
      ok: true,
      sessionId,
      conversationId,
      variantId: variantAssignment?.variantId,
      variantName: variantAssignment?.variantName,
      experimentId: variantAssignment?.experimentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
};
