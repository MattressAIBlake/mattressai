import { json } from '@remix-run/node';
import { endSession } from '~/lib/session/session-orchestrator.service.server';

export const action = async ({ request }) => {
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
