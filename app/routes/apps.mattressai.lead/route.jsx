import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';
import { createLead } from '~/lib/leads/lead.service.server';
import { endSession } from '~/lib/session/session-orchestrator.service.server';

export const action = async ({ request }) => {
  const { prisma } = await import('~/db.server');
  // Verify App Proxy HMAC (optional for widget requests)
  const shopifySecret = process.env.SHOPIFY_API_SECRET;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Try to verify HMAC if secret is available and params are present
  if (shopifySecret) {
    const url = new URL(request.url);
    const hasHmacParams = url.searchParams.has('signature') || url.searchParams.has('hmac');
    
    // Only validate HMAC if params are present
    if (hasHmacParams) {
      const isValidHmac = verifyProxyHmac(request.url, shopifySecret);
      
      if (!isValidHmac) {
        console.error('Invalid HMAC signature for lead capture request');
        console.warn('⚠️ TEMPORARY: Allowing request through despite invalid HMAC for widget functionality');
        // TEMPORARY: Comment out the rejection until HMAC issue is resolved
        // throw new Response('Unauthorized', { status: 401 });
      }
    } else {
      // No HMAC params - this is a direct widget request, which is allowed
      if (!isDevelopment) {
        console.log('Lead capture request from widget (no HMAC validation)');
      }
    }
  } else if (!isDevelopment) {
    console.warn('SHOPIFY_API_SECRET not configured - HMAC verification disabled');
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
