import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { sendAlert } from '~/lib/alerts/alert.service.server';

/**
 * GET /admin/alerts/history
 * Returns alert history with pagination
 */
export const loader = async ({ request }) => {
  const { prisma } = await import('~/db.server');
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const status = url.searchParams.get('status') || undefined;

    const where = {
      tenantId: shop,
      ...(status && { status })
    };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          session: {
            select: {
              intentScore: true,
              endReason: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.alert.count({ where })
    ]);

    return json({
      success: true,
      alerts,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

/**
 * POST /admin/alerts/history
 * Retry a failed alert
 */
export const action = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    if (request.method !== 'POST') {
      throw json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await request.json();
    const { alertId, action: actionType } = body;

    if (!alertId) {
      return json(
        { error: 'alertId is required' },
        { status: 400 }
      );
    }

    // Verify alert belongs to this tenant
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        tenantId: shop
      }
    });

    if (!alert) {
      return json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (actionType === 'retry') {
      // Reset status and attempts for retry
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: 'queued',
          attempts: 0,
          error: null
        }
      });

      // Trigger immediate retry
      try {
        await sendAlert(alertId);
      } catch (error) {
        // Error will be logged in the alert record
        console.error('Retry failed:', error);
      }

      return json({
        success: true,
        message: 'Alert retry initiated'
      });
    }

    return json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing alert action:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

