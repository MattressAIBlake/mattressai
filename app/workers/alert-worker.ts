/**
 * Alert Worker
 * Processes queued alerts with retry logic and DLQ
 * Can be invoked via cron job or background process
 */

import prisma from '~/db.server';
import { sendAlert } from '~/lib/alerts/alert.service';
import { checkIdleSessions } from '~/lib/session/session-orchestrator.service';

/**
 * Process queued alerts
 * Fetches queued alerts and attempts to send them
 */
export const processQueuedAlerts = async (batchSize: number = 10): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> => {
  const stats = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Get queued alerts
    const queuedAlerts = await prisma.alert.findMany({
      where: {
        status: 'queued',
        attempts: { lt: 3 } // Max 3 attempts
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: batchSize
    });

    for (const alert of queuedAlerts) {
      stats.processed++;

      try {
        await sendAlert(alert.id);
        
        // Check final status
        const updatedAlert = await prisma.alert.findUnique({
          where: { id: alert.id }
        });

        if (updatedAlert?.status === 'sent') {
          stats.sent++;
        } else if (updatedAlert?.status === 'failed') {
          stats.failed++;
        } else if (updatedAlert?.status === 'skipped') {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        stats.failed++;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error in processQueuedAlerts:', error);
    throw error;
  }
};

/**
 * Process failed alerts (DLQ)
 * Move permanently failed alerts to a separate table or mark them
 */
export const processDLQ = async (): Promise<number> => {
  try {
    // Find alerts that have exceeded max retries
    const failedAlerts = await prisma.alert.updateMany({
      where: {
        status: 'queued',
        attempts: { gte: 3 }
      },
      data: {
        status: 'failed',
        error: 'Max retry attempts exceeded'
      }
    });

    return failedAlerts.count;
  } catch (error) {
    console.error('Error processing DLQ:', error);
    throw error;
  }
};

/**
 * Check for idle sessions and end them
 * This triggers session end alerts
 */
export const processIdleSessions = async (idleMinutes: number = 15): Promise<void> => {
  try {
    await checkIdleSessions(idleMinutes);
  } catch (error) {
    console.error('Error processing idle sessions:', error);
    throw error;
  }
};

/**
 * Main worker function
 * Call this from a cron job or background process
 */
export const runAlertWorker = async (): Promise<void> => {
  console.log('[Alert Worker] Starting...');

  try {
    // Process idle sessions first (may create new alerts)
    console.log('[Alert Worker] Checking idle sessions...');
    await processIdleSessions(15);

    // Process queued alerts
    console.log('[Alert Worker] Processing queued alerts...');
    const stats = await processQueuedAlerts(20);
    console.log('[Alert Worker] Stats:', stats);

    // Process DLQ
    console.log('[Alert Worker] Processing DLQ...');
    const dlqCount = await processDLQ();
    console.log(`[Alert Worker] Moved ${dlqCount} alerts to DLQ`);

    console.log('[Alert Worker] Completed successfully');
  } catch (error) {
    console.error('[Alert Worker] Error:', error);
    throw error;
  }
};

// If run directly (e.g., node alert-worker.js)
if (require.main === module) {
  runAlertWorker()
    .then(() => {
      console.log('Worker finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Worker failed:', error);
      process.exit(1);
    });
}

