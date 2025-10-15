/**
 * Session Orchestrator Service
 * Manages chat session lifecycle, end detection, and intent scoring
 */

import prisma from '~/db.server';
import Anthropic from '@anthropic-ai/sdk';
import { assignVariant, type VariantAssignment } from '../experiments/ab-testing.service.server';

interface SessionEndOptions {
  sessionId: string;
  tenantId: string;
  conversationId?: string;
  endReason: 'explicit_close' | 'idle_timeout' | 'completed' | 'converted' | 'post_conversion';
  consent?: boolean;
}

interface IntentSignals {
  completedAnswers?: number;
  totalQuestions?: number;
  recsViewed?: boolean;
  recsClicked?: number;
  addedToCart?: boolean;
  dwellMinutes?: number;
  hasLead?: boolean;
}

/**
 * Create or get a chat session
 */
export const createOrGetSession = async (
  tenantId: string,
  conversationId?: string
): Promise<{ sessionId: string; variantAssignment?: VariantAssignment }> => {
  // Check if session exists for this conversation
  if (conversationId) {
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        tenantId,
        conversationId,
        endedAt: null // Only active sessions
      }
    });

    if (existingSession) {
      // Update last activity
      await prisma.chatSession.update({
        where: { id: existingSession.id },
        data: { lastActivityAt: new Date() }
      });
      
      // Return existing session with variant info
      let variantAssignment: VariantAssignment | undefined;
      if (existingSession.variantId) {
        const variant = await prisma.variant.findUnique({
          where: { id: existingSession.variantId }
        });
        if (variant) {
          variantAssignment = {
            variantId: variant.id,
            variantName: variant.name,
            experimentId: variant.experimentId,
            promptVersionId: variant.promptVersionId || undefined,
            rulesOverride: variant.rulesOverrideJson ? JSON.parse(variant.rulesOverrideJson) : undefined
          };
        }
      }
      
      return { 
        sessionId: existingSession.id,
        variantAssignment 
      };
    }
  }

  // Assign variant for new session (Phase 5: A/B testing)
  const variantAssignment = await assignVariant(tenantId);

  // Create new session
  const session = await prisma.chatSession.create({
    data: {
      tenantId,
      conversationId,
      variantId: variantAssignment?.variantId,
      startedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  return { 
    sessionId: session.id, 
    variantAssignment: variantAssignment || undefined 
  };
};

/**
 * Update session activity timestamp
 */
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() }
  });
};

/**
 * Compute intent score based on session signals
 * Simple heuristic: completed answers (+30), recs viewed (+20), clicked card (+20), 
 * added to cart (+20), dwell >3m (+10); cap 100
 */
export const computeIntentScore = async (sessionId: string, signals?: IntentSignals): Promise<number> => {
  let score = 0;

  // If signals provided directly, use them
  if (signals) {
    const completionRate = signals.totalQuestions 
      ? (signals.completedAnswers || 0) / signals.totalQuestions 
      : 0;
    score += Math.floor(completionRate * 30);
    
    if (signals.recsViewed) score += 20;
    if (signals.recsClicked && signals.recsClicked > 0) score += 20;
    if (signals.addedToCart) score += 20;
    if (signals.dwellMinutes && signals.dwellMinutes > 3) score += 10;
    
    return Math.min(score, 100);
  }

  // Otherwise, compute from events
  const events = await prisma.event.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' }
  });

  if (events.length === 0) return 0;

  const eventTypes = new Set(events.map(e => e.type));
  
  // Check for completed data points
  const dataPointsCaptured = events.filter(e => e.type === 'data_point_captured').length;
  if (dataPointsCaptured >= 3) score += 30;
  else if (dataPointsCaptured >= 2) score += 20;
  else if (dataPointsCaptured >= 1) score += 10;

  // Recommendations engagement
  if (eventTypes.has('recommendation_shown')) score += 20;
  
  const recsClicked = events.filter(e => e.type === 'recommendation_clicked').length;
  if (recsClicked > 0) score += 20;

  // Cart and checkout
  if (eventTypes.has('add_to_cart')) score += 20;
  if (eventTypes.has('checkout_started')) score += 10;

  // Dwell time
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const dwellMinutes = (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / 60000;
  if (dwellMinutes > 3) score += 10;

  return Math.min(score, 100);
};

/**
 * Generate LLM summary of conversation (token-capped, PII-aware)
 */
export const generateSessionSummary = async (
  conversationId: string,
  consent: boolean = false
): Promise<string | null> => {
  try {
    // Get conversation messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20 // Limit to last 20 messages
    });

    if (messages.length === 0) return null;

    // Build conversation context
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Call Claude for summary
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const summaryPrompt = consent
      ? `Summarize this customer conversation in 2-3 sentences. Include key preferences and intent signals:\n\n${conversationText}`
      : `Summarize this customer conversation in 2-3 sentences. Focus on product preferences and intent. DO NOT include any personally identifiable information (names, email, phone, addresses):\n\n${conversationText}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Use Haiku for cost efficiency
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ]
    });

    const summary = response.content[0].type === 'text' 
      ? response.content[0].text 
      : null;

    return summary;
  } catch (error) {
    console.error('Error generating session summary:', error);
    return null;
  }
};

/**
 * End a chat session
 */
export const endSession = async (options: SessionEndOptions): Promise<void> => {
  const { sessionId, tenantId, conversationId, endReason, consent } = options;

  // Get session
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  if (session.endedAt) {
    // Already ended
    return;
  }

  // Compute intent score
  const intentScore = await computeIntentScore(sessionId);

  // Generate summary if we have a conversation
  let summary: string | null = null;
  if (conversationId) {
    summary = await generateSessionSummary(conversationId, consent || false);
  }

  // Update session
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      endReason,
      intentScore,
      summary,
      consent: consent || false
    }
  });

  // Enqueue alert
  await enqueueAlert(sessionId, tenantId, endReason, intentScore);
};

/**
 * Enqueue alert for session end
 */
const enqueueAlert = async (
  sessionId: string,
  tenantId: string,
  endReason: string,
  intentScore: number
): Promise<void> => {
  // Get alert settings for tenant
  const settings = await prisma.alertSettings.findUnique({
    where: { tenantId }
  });

  if (!settings) {
    // No alert settings configured
    return;
  }

  const triggers = JSON.parse(settings.triggers);
  const throttles = JSON.parse(settings.throttles);

  // Determine alert type based on end reason and intent
  let alertType: string | null = null;
  
  if (endReason === 'converted') {
    alertType = 'lead_captured';
  } else if (intentScore >= 70) {
    alertType = 'high_intent';
  } else if (endReason === 'idle_timeout' && intentScore >= 40) {
    alertType = 'abandoned';
  } else if (endReason === 'post_conversion') {
    alertType = 'post_conversion';
  } else {
    alertType = 'chat_end';
  }

  // Check if this trigger is enabled
  if (!triggers.all && !triggers[alertType]) {
    return;
  }

  // Check throttles based on tenant plan
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentAlerts = await prisma.alert.count({
    where: {
      tenantId,
      createdAt: { gte: oneDayAgo }
    }
  });

  // Get tenant plan to check daily alert limit
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (tenant?.quotas) {
    const quotas = JSON.parse(tenant.quotas);
    const dailyLimit = quotas.alertsPerDay || throttles.perDay || 2;
    
    // -1 means unlimited
    if (dailyLimit !== -1 && recentAlerts >= dailyLimit) {
      // Throttle limit reached
      await prisma.alert.create({
        data: {
          tenantId,
          sessionId,
          type: alertType,
          channel: 'throttled',
          payload: JSON.stringify({ reason: 'daily_limit_reached' }),
          status: 'skipped'
        }
      });
      return;
    }
  }

  // Check per-session throttle
  const sessionAlerts = await prisma.alert.count({
    where: {
      sessionId,
      status: { in: ['queued', 'sent'] }
    }
  });

  if (sessionAlerts >= (throttles.perSession || 2)) {
    return;
  }

  // Create alert records for each enabled channel
  const channels = JSON.parse(settings.channels);
  const payload = {
    sessionId,
    intentScore,
    endReason,
    timestamp: new Date().toISOString()
  };

  for (const [channel, config] of Object.entries(channels)) {
    if (config && typeof config === 'object' && Object.keys(config).length > 0) {
      await prisma.alert.create({
        data: {
          tenantId,
          sessionId,
          type: alertType,
          channel,
          payload: JSON.stringify({ ...payload, config }),
          status: 'queued'
        }
      });
    }
  }
};

/**
 * Check for idle sessions and end them
 * Should be called by a cron job
 */
export const checkIdleSessions = async (idleMinutes: number = 15): Promise<void> => {
  const idleThreshold = new Date(Date.now() - idleMinutes * 60 * 1000);

  const idleSessions = await prisma.chatSession.findMany({
    where: {
      endedAt: null,
      lastActivityAt: {
        lt: idleThreshold
      }
    }
  });

  for (const session of idleSessions) {
    await endSession({
      sessionId: session.id,
      tenantId: session.tenantId,
      conversationId: session.conversationId || undefined,
      endReason: 'idle_timeout',
      consent: session.consent || false
    });
  }
};

