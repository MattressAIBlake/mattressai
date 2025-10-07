import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';
import { createLead } from '~/lib/leads/lead.service';
import { endSession } from '~/lib/session/session-orchestrator.service';
import prisma from '~/db.server';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      tenantId, 
      sessionId, 
      email, 
      phone, 
      name, 
      zip, 
      consent,
      conversationId 
    } = body;

    if (!tenantId || !sessionId) {
      return json(
        { error: 'tenantId and sessionId are required' },
        { status: 400 }
      );
    }

    if (!consent && (email || phone || name)) {
      return json(
        { error: 'Consent is required to capture contact information' },
        { status: 400 }
      );
    }

    // Get Shopify access token for this tenant
    const session = await prisma.session.findFirst({
      where: {
        shop: tenantId,
        isOnline: false
      },
      orderBy: {
        expires: 'desc'
      }
    });

    const shopifyAccessToken = session?.accessToken;

    // Create the lead
    const lead = await createLead({
      tenantId,
      sessionId,
      email,
      phone,
      name,
      zip,
      consent: consent || false,
      shopifyAccessToken
    });

    // End the session with converted status
    if (sessionId) {
      try {
        await endSession({
          sessionId,
          tenantId,
          conversationId,
          endReason: 'converted',
          consent: consent || false
        });
      } catch (error) {
        console.error('Error ending session after lead capture:', error);
        // Continue even if session end fails
      }
    }

    return json({
      ok: true,
      leadId: lead.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error capturing lead:', error);
    return json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
};
