/**
 * Analytics Service
 * Handles event tracking, funnel analysis, and attribution
 */

import prisma from '~/db.server';

interface FunnelData {
  widget_viewed: number;
  opened: number;
  first_message: number;
  data_point_captured: number;
  recommendation_shown: number;
  recommendation_clicked: number;
  add_to_cart: number;
  checkout_started: number;
  order_placed: number;
  conversionRates: {
    viewToOpen: number;
    openToMessage: number;
    messageToData: number;
    dataToRecs: number;
    recsToClick: number;
    clickToCart: number;
    cartToCheckout: number;
    checkoutToOrder: number;
  };
}

interface ProductInsight {
  productId: string;
  productTitle: string;
  recommendedCount: number;
  clickedCount: number;
  addedToCartCount: number;
  orderedCount: number;
  conversionRate: number;
}

/**
 * Track an event
 */
export const trackEvent = async (
  tenantId: string,
  sessionId: string | null,
  type: string,
  metadata: any = {},
  clickId?: string
): Promise<void> => {
  // Rate limit check
  const rateLimitKey = `events:${tenantId}`;
  const maxEventsPerMinute = parseInt(process.env.ANALYTICS_MAX_EVENTS_PER_MINUTE || '100', 10);

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentEventCount = await prisma.event.count({
    where: {
      tenantId,
      timestamp: { gte: oneMinuteAgo }
    }
  });

  if (recentEventCount >= maxEventsPerMinute) {
    console.warn(`Rate limit exceeded for tenant ${tenantId}`);
    return;
  }

  // Create event
  await prisma.event.create({
    data: {
      tenantId,
      sessionId,
      type,
      metadata: JSON.stringify(metadata),
      clickId,
      timestamp: new Date()
    }
  });

  // Update session activity if session provided
  if (sessionId) {
    try {
      await prisma.chatSession.updateMany({
        where: {
          id: sessionId,
          endedAt: null
        },
        data: {
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      // Session might not exist yet, that's okay
    }
  }
};

/**
 * Get funnel data for a date range
 */
export const getFunnelData = async (
  tenantId: string,
  from: Date,
  to: Date
): Promise<FunnelData> => {
  // Get event counts by type
  const events = await prisma.event.groupBy({
    by: ['type'],
    where: {
      tenantId,
      timestamp: {
        gte: from,
        lte: to
      }
    },
    _count: {
      type: true
    }
  });

  const counts: Record<string, number> = {};
  events.forEach(e => {
    counts[e.type] = e._count.type;
  });

  const widget_viewed = counts.widget_viewed || 0;
  const opened = counts.opened || 0;
  const first_message = counts.first_message || 0;
  const data_point_captured = counts.data_point_captured || 0;
  const recommendation_shown = counts.recommendation_shown || 0;
  const recommendation_clicked = counts.recommendation_clicked || 0;
  const add_to_cart = counts.add_to_cart || 0;
  const checkout_started = counts.checkout_started || 0;
  const order_placed = counts.order_placed || 0;

  // Calculate conversion rates
  const calcRate = (from: number, to: number) => 
    from > 0 ? Math.round((to / from) * 100) : 0;

  const conversionRates = {
    viewToOpen: calcRate(widget_viewed, opened),
    openToMessage: calcRate(opened, first_message),
    messageToData: calcRate(first_message, data_point_captured),
    dataToRecs: calcRate(data_point_captured, recommendation_shown),
    recsToClick: calcRate(recommendation_shown, recommendation_clicked),
    clickToCart: calcRate(recommendation_clicked, add_to_cart),
    cartToCheckout: calcRate(add_to_cart, checkout_started),
    checkoutToOrder: calcRate(checkout_started, order_placed)
  };

  return {
    widget_viewed,
    opened,
    first_message,
    data_point_captured,
    recommendation_shown,
    recommendation_clicked,
    add_to_cart,
    checkout_started,
    order_placed,
    conversionRates
  };
};

/**
 * Get product insights for a date range
 */
export const getProductInsights = async (
  tenantId: string,
  from: Date,
  to: Date,
  limit: number = 20
): Promise<ProductInsight[]> => {
  // Get all relevant events
  const events = await prisma.event.findMany({
    where: {
      tenantId,
      timestamp: {
        gte: from,
        lte: to
      },
      type: {
        in: [
          'recommendation_shown',
          'recommendation_clicked',
          'add_to_cart',
          'order_placed'
        ]
      }
    }
  });

  // Group by product
  const productMap = new Map<string, {
    title: string;
    recommended: number;
    clicked: number;
    addedToCart: number;
    ordered: number;
  }>();

  events.forEach(event => {
    const metadata = JSON.parse(event.metadata);
    const productId = metadata.productId || metadata.product_id;
    const productTitle = metadata.productTitle || metadata.product_title || 'Unknown Product';

    if (!productId) return;

    if (!productMap.has(productId)) {
      productMap.set(productId, {
        title: productTitle,
        recommended: 0,
        clicked: 0,
        addedToCart: 0,
        ordered: 0
      });
    }

    const stats = productMap.get(productId)!;

    switch (event.type) {
      case 'recommendation_shown':
        stats.recommended++;
        break;
      case 'recommendation_clicked':
        stats.clicked++;
        break;
      case 'add_to_cart':
        stats.addedToCart++;
        break;
      case 'order_placed':
        stats.ordered++;
        break;
    }
  });

  // Convert to array and calculate conversion rates
  const insights: ProductInsight[] = Array.from(productMap.entries()).map(
    ([productId, stats]) => ({
      productId,
      productTitle: stats.title,
      recommendedCount: stats.recommended,
      clickedCount: stats.clicked,
      addedToCartCount: stats.addedToCart,
      orderedCount: stats.ordered,
      conversionRate: stats.recommended > 0 
        ? Math.round((stats.ordered / stats.recommended) * 100) 
        : 0
    })
  );

  // Sort by recommended count (most recommended first)
  insights.sort((a, b) => b.recommendedCount - a.recommendedCount);

  return insights.slice(0, limit);
};

/**
 * Get session analytics
 */
export const getSessionAnalytics = async (
  tenantId: string,
  from: Date,
  to: Date
): Promise<{
  totalSessions: number;
  activeSessions: number;
  avgIntentScore: number;
  endReasons: Record<string, number>;
}> => {
  const sessions = await prisma.chatSession.findMany({
    where: {
      tenantId,
      startedAt: {
        gte: from,
        lte: to
      }
    },
    select: {
      id: true,
      endedAt: true,
      endReason: true,
      intentScore: true
    }
  });

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => !s.endedAt).length;

  const intentScores = sessions
    .map(s => s.intentScore)
    .filter((score): score is number => score !== null);
  
  const avgIntentScore = intentScores.length > 0
    ? Math.round(intentScores.reduce((a, b) => a + b, 0) / intentScores.length)
    : 0;

  const endReasons: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.endReason) {
      endReasons[s.endReason] = (endReasons[s.endReason] || 0) + 1;
    }
  });

  return {
    totalSessions,
    activeSessions,
    avgIntentScore,
    endReasons
  };
};

/**
 * Get lead analytics
 */
export const getLeadAnalytics = async (
  tenantId: string,
  from: Date,
  to: Date
): Promise<{
  totalLeads: number;
  consentRate: number;
  statusBreakdown: Record<string, number>;
}> => {
  const leads = await prisma.lead.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: from,
        lte: to
      }
    },
    select: {
      consent: true,
      status: true
    }
  });

  const totalLeads = leads.length;
  const consentedLeads = leads.filter(l => l.consent).length;
  const consentRate = totalLeads > 0 
    ? Math.round((consentedLeads / totalLeads) * 100) 
    : 0;

  const statusBreakdown: Record<string, number> = {};
  leads.forEach(l => {
    statusBreakdown[l.status] = (statusBreakdown[l.status] || 0) + 1;
  });

  return {
    totalLeads,
    consentRate,
    statusBreakdown
  };
};

/**
 * Generate weekly digest data
 */
export const generateWeeklyDigest = async (
  tenantId: string
): Promise<{
  weekStart: Date;
  weekEnd: Date;
  funnel: FunnelData;
  sessions: any;
  leads: any;
  topProducts: ProductInsight[];
}> => {
  const weekEnd = new Date();
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [funnel, sessions, leads, topProducts] = await Promise.all([
    getFunnelData(tenantId, weekStart, weekEnd),
    getSessionAnalytics(tenantId, weekStart, weekEnd),
    getLeadAnalytics(tenantId, weekStart, weekEnd),
    getProductInsights(tenantId, weekStart, weekEnd, 10)
  ]);

  return {
    weekStart,
    weekEnd,
    funnel,
    sessions,
    leads,
    topProducts
  };
};

/**
 * Track attribution (link click_id to order)
 */
export const trackAttribution = async (
  tenantId: string,
  orderId: string,
  clickId: string
): Promise<void> => {
  // Find the original recommendation event
  const recommendationEvent = await prisma.event.findFirst({
    where: {
      tenantId,
      clickId,
      type: 'recommendation_clicked'
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  if (!recommendationEvent) {
    console.warn(`No recommendation event found for clickId ${clickId}`);
    return;
  }

  // Create order event with attribution
  const metadata = JSON.parse(recommendationEvent.metadata);
  
  await prisma.event.create({
    data: {
      tenantId,
      sessionId: recommendationEvent.sessionId,
      type: 'order_placed',
      clickId,
      metadata: JSON.stringify({
        ...metadata,
        orderId,
        attributedToSession: recommendationEvent.sessionId,
        attributedToRecommendation: true
      }),
      timestamp: new Date()
    }
  });
};

