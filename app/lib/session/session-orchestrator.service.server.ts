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
 * Improved scoring: deep conversations (+40), product clicks (+25-30), 
 * cart actions (+20), checkout (+15), engagement time (+5-15); cap 100
 */
export const computeIntentScore = async (sessionId: string, signals?: IntentSignals): Promise<number> => {
  let score = 0;

  // If signals provided directly, use them
  if (signals) {
    const completionRate = signals.totalQuestions 
      ? (signals.completedAnswers || 0) / signals.totalQuestions 
      : 0;
    score += Math.floor(completionRate * 40); // Increased from 30
    
    if (signals.recsViewed) score += 15; // Slightly reduced
    if (signals.recsClicked && signals.recsClicked >= 2) score += 30; // Higher for multiple clicks
    else if (signals.recsClicked && signals.recsClicked > 0) score += 25; // Increased from 20
    if (signals.addedToCart) score += 20;
    if (signals.dwellMinutes && signals.dwellMinutes >= 5) score += 15; // Higher for longer dwell
    else if (signals.dwellMinutes && signals.dwellMinutes >= 3) score += 10;
    else if (signals.dwellMinutes && signals.dwellMinutes >= 1) score += 5;
    
    return Math.min(score, 100);
  }

  // Otherwise, compute from events
  const events = await prisma.event.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' }
  });

  if (events.length === 0) return 0;

  const eventTypes = new Set(events.map(e => e.type));
  
  // Conversation engagement (max 40 points - increased from 30)
  const dataPointsCaptured = events.filter(e => e.type === 'data_point_captured').length;
  if (dataPointsCaptured >= 5) score += 40; // Deep conversation
  else if (dataPointsCaptured >= 3) score += 30; // Good engagement
  else if (dataPointsCaptured >= 2) score += 20;
  else if (dataPointsCaptured >= 1) score += 10;

  // Product recommendations engagement (higher weight for clicks)
  if (eventTypes.has('recommendation_shown')) score += 15; // Reduced from 20
  
  const recsClicked = events.filter(e => e.type === 'recommendation_clicked').length;
  if (recsClicked >= 2) score += 30; // Clicked multiple products = high intent
  else if (recsClicked === 1) score += 25; // Increased from 20

  // Cart and checkout (strong intent signals)
  if (eventTypes.has('add_to_cart')) score += 20;
  if (eventTypes.has('checkout_started')) score += 15; // Increased from 10

  // Dwell time (engagement indicator)
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const dwellMinutes = (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / 60000;
  if (dwellMinutes >= 5) score += 15; // Spent significant time
  else if (dwellMinutes >= 3) score += 10;
  else if (dwellMinutes >= 1) score += 5;

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
 * Check if alert should be skipped due to low quality lead
 * Prevents spam alerts for sessions with no value
 */
const shouldSkipLowQualityAlert = async (
  sessionId: string,
  tenantId: string,
  intentScore: number,
  endReason: string
): Promise<boolean> => {
  // Always allow converted/post_conversion alerts (actual lead captures)
  if (endReason === 'converted' || endReason === 'post_conversion') {
    // But still check if there's actual lead data
    const lead = await prisma.lead.findFirst({
      where: { sessionId, tenantId },
      orderBy: { createdAt: 'desc' }
    });

    if (!lead) {
      return true; // Skip: no lead record
    }

    // Skip if lead has no contact information
    const hasContact = lead.email || lead.phone;
    if (!hasContact) {
      return true; // Skip: no email or phone
    }

    // Skip if lead is anonymous with no real info
    const isAnonymous = !lead.name || 
                        lead.name.toLowerCase() === 'anonymous' || 
                        lead.name.trim() === '';
    if (isAnonymous && !lead.email && !lead.phone) {
      return true; // Skip: anonymous with no contact
    }

    return false; // Don't skip: valid lead capture
  }

  // For non-converted sessions, apply stricter filtering
  
  // Skip if intent score is 0 or extremely low
  if (intentScore < 10) {
    return true; // Skip: no meaningful engagement
  }

  // Check if there's any lead information at all
  const lead = await prisma.lead.findFirst({
    where: { sessionId, tenantId },
    orderBy: { createdAt: 'desc' }
  });

  // If no lead exists and low intent, skip
  if (!lead && intentScore < 40) {
    return true; // Skip: no lead and low intent
  }

  // If lead exists but is anonymous/empty with no contact
  if (lead) {
    const hasContact = lead.email || lead.phone;
    const isAnonymous = !lead.name || 
                        lead.name.toLowerCase() === 'anonymous' || 
                        lead.name.trim() === '';
    
    if (isAnonymous && !hasContact) {
      return true; // Skip: anonymous with no contact info
    }
  }

  return false; // Don't skip: potentially valuable alert
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

  // Filter out low-quality leads to prevent spam
  const shouldSkipAlert = await shouldSkipLowQualityAlert(sessionId, tenantId, intentScore, endReason);
  if (shouldSkipAlert) {
    console.log(`Skipping alert for session ${sessionId}: low quality lead (intent: ${intentScore})`);
    return;
  }

  // Create alert records for each enabled channel (unlimited - no throttling)
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

