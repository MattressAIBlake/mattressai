import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { prisma } from '~/db.server';

/**
 * GET /admin/index/status
 * Returns the status of the current or most recent indexing job for the authenticated shop
 */
export async function loader({ request }) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    // Get the current or most recent job for this tenant
    const currentJob = await prisma.indexJob.findFirst({
      where: {
        tenant: shop,
        status: { in: ['pending', 'running'] }
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!currentJob) {
      return json({
        success: true,
        status: 'idle',
        message: 'No active indexing job',
        lastJob: null
      });
    }

    // Calculate progress and ETA
    const progress = currentJob.totalProducts > 0
      ? (currentJob.processedProducts / currentJob.totalProducts) * 100
      : 0;

    const elapsedMs = currentJob.startedAt.getTime() - Date.now();
    const elapsedSeconds = Math.abs(elapsedMs) / 1000;

    // Estimate ETA based on current progress
    const eta = currentJob.totalProducts > 0 && progress > 0
      ? new Date(Date.now() + (elapsedSeconds / (progress / 100)) * 1000)
      : null;

    // Get recent job history (last 10 jobs)
    const recentJobs = await prisma.indexJob.findMany({
      where: { tenant: shop },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        totalProducts: true,
        processedProducts: true,
        failedProducts: true,
        tokensUsed: true,
        costEstimate: true,
        actualCost: true,
        errorMessage: true
      }
    });

    return json({
      success: true,
      status: 'active',
      currentJob: {
        id: currentJob.id,
        status: currentJob.status,
        startedAt: currentJob.startedAt,
        finishedAt: currentJob.finishedAt,
        progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
        eta: eta?.toISOString(),
        configuration: {
          useAIEnrichment: currentJob.useAIEnrichment,
          confidenceThreshold: currentJob.confidenceThreshold
        },
        metrics: {
          totalProducts: currentJob.totalProducts,
          processedProducts: currentJob.processedProducts,
          failedProducts: currentJob.failedProducts,
          tokensUsed: currentJob.tokensUsed,
          costEstimate: currentJob.costEstimate,
          actualCost: currentJob.actualCost
        },
        errorMessage: currentJob.errorMessage
      },
      recentJobs: recentJobs.map(job => ({
        ...job,
        progress: job.totalProducts > 0 ? (job.processedProducts / job.totalProducts) * 100 : 0,
        duration: job.finishedAt
          ? Math.round((job.finishedAt.getTime() - job.startedAt.getTime()) / 1000)
          : null
      }))
    });

  } catch (error) {
    console.error('Error getting indexing status:', error);

    if (error.status) {
      // Remix response error (authentication, etc.)
      return error;
    }

    // Unexpected error
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /admin/index/status
 * Not allowed - use GET to check status
 */
export async function action({ request }) {
  throw json(
    { error: 'Method not allowed. Use GET to check indexing status.' },
    { status: 405 }
  );
}


