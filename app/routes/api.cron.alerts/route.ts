/**
 * Alert Worker Cron Endpoint
 * Processes queued alerts and sends them via configured channels
 * Should be called by Vercel Cron every 5 minutes
 */

import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { processQueuedAlerts, processDLQ, processIdleSessions } from '~/workers/alert-worker';

/**
 * POST /api/cron/alerts
 * Triggered by Vercel Cron to process alerts
 */
export const action: ActionFunction = async ({ request }) => {
  // Verify this is a cron job request (Vercel sets this header)
  const authHeader = request.headers.get('authorization');
  
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Alert Cron] Unauthorized request');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('[Alert Cron] Starting alert processing...');

    // Process idle sessions first (may create new alerts)
    console.log('[Alert Cron] Checking idle sessions...');
    await processIdleSessions(15);

    // Process queued alerts
    console.log('[Alert Cron] Processing queued alerts...');
    const stats = await processQueuedAlerts(20);
    console.log('[Alert Cron] Stats:', stats);

    // Process DLQ
    console.log('[Alert Cron] Processing DLQ...');
    const dlqCount = await processDLQ();
    console.log(`[Alert Cron] Moved ${dlqCount} alerts to DLQ`);

    return json({
      success: true,
      stats,
      dlqCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Alert Cron] Error:', error);
    return json(
      { 
        error: 'Alert processing failed', 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
};

// Also support GET for testing
export const loader = action;

