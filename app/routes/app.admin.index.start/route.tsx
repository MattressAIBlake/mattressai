import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { checkIndexingQuota } from '~/lib/quota/quota.service';
import { prisma } from '~/db.server';
import { INDEXING_CONFIG } from '~/lib/config/indexing.config';

/**
 * POST /admin/index/start
 * Starts a new product indexing job for the authenticated shop
 */
export async function action({ request }) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    if (request.method !== 'POST') {
      throw json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const useAIEnrichment = formData.get('useAIEnrichment') !== 'false';
    const confidenceThreshold = parseFloat(formData.get('confidenceThreshold') || '0.7');

    // Validate confidence threshold
    if (confidenceThreshold < 0.0 || confidenceThreshold > 1.0) {
      throw json(
        { error: 'Confidence threshold must be between 0.0 and 1.0' },
        { status: 422 }
      );
    }

    // Check quotas before proceeding
    const quotaCheck = await checkIndexingQuota(shop);
    if (!quotaCheck.allowed) {
      throw json(
        {
          error: 'Quota exceeded',
          reason: quotaCheck.reason,
          upgradeRequired: true
        },
        { status: 429 }
      );
    }

    // Check if there's already a running job for this tenant
    const existingJob = await prisma.indexJob.findFirst({
      where: {
        tenant: shop,
        status: { in: ['pending', 'running'] }
      },
      orderBy: { startedAt: 'desc' }
    });

    if (existingJob) {
      // Check if the job is stale (running for more than configured threshold)
      const jobAge = Date.now() - existingJob.startedAt.getTime();
      const isStale = jobAge > INDEXING_CONFIG.STALE_JOB_THRESHOLD_MS;

      if (isStale) {
        // Mark stale job as failed
        await prisma.indexJob.update({
          where: { id: existingJob.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            errorMessage: 'Job timed out - exceeded 30 minute limit'
          }
        });
        console.log(`Marked stale job ${existingJob.id} as failed`);
      } else {
        // Job is still active
        throw json(
          {
            error: 'An indexing job is already running for this shop',
            jobId: existingJob.id,
            status: existingJob.status,
            startedAt: existingJob.startedAt
          },
          { status: 409 }
        );
      }
    }

    // Create new indexing job
    const indexJob = await prisma.indexJob.create({
      data: {
        tenant: shop,
        status: 'pending',
        useAIEnrichment,
        confidenceThreshold,
        // Estimate based on product count (will be updated when job starts)
        costEstimate: 0.0
      }
    });

    // Trigger background indexing job via Inngest
    await startIndexingJob(indexJob.id, shop, useAIEnrichment, confidenceThreshold);

    return json({
      success: true,
      jobId: indexJob.id,
      message: 'Indexing job started successfully',
      configuration: {
        useAIEnrichment,
        confidenceThreshold
      }
    });

  } catch (error) {
    console.error('Error starting indexing job:', error);

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
 * GET /admin/index/start
 * Returns API documentation
 */
export async function loader({ request }) {
  // Authenticate the request
  await authenticateAdmin(request);

  return json({
    endpoint: 'POST /admin/index/start',
    description: 'Starts a new product indexing job for the authenticated shop',
    parameters: {
      useAIEnrichment: 'boolean (default: true) - Enable AI-powered product enrichment',
      confidenceThreshold: 'number (0.0-1.0, default: 0.7) - Minimum confidence for AI extractions'
    },
    response: {
      success: 'boolean',
      jobId: 'string',
      message: 'string',
      configuration: 'object'
    },
    errors: {
      409: 'An indexing job is already running for this shop',
      422: 'Invalid parameters'
    }
  });
}

/**
 * Start the indexing job using Inngest (background job queue)
 */
async function startIndexingJob(jobId: string, shop: string, useAIEnrichment: boolean, confidenceThreshold: number) {
  // Import Inngest client
  const { inngest } = await import('~/lib/inngest/client');

  // Trigger Inngest job (queued for background processing)
  await inngest.send({
    name: 'product/index.requested',
    data: {
      jobId,
      tenant: shop,
      useAIEnrichment,
      confidenceThreshold
    }
  });

  console.log(`Indexing job ${jobId} queued for shop ${shop}`, {
    useAIEnrichment,
    confidenceThreshold,
    processor: 'inngest'
  });
}
