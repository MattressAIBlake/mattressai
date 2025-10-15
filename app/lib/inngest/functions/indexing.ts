/**
 * Inngest Indexing Function
 * Background job for processing product indexing
 */

import { inngest } from '../client';
import { ProductIndexer } from '~/workers/indexer';
import { prisma } from '~/db.server';

/**
 * Product indexing job configuration
 */
export const indexingJob = inngest.createFunction(
  { 
    id: 'product-indexing',
    name: 'Product Indexing',
    retries: 3,
    // Timeout after 30 minutes (Vercel serverless function limit)
    timeout: '30m'
  },
  { event: 'product/index.requested' },
  async ({ event, step }) => {
    const { jobId, tenant, useAIEnrichment, confidenceThreshold } = event.data;
    
    console.log(`[Inngest] Starting indexing job ${jobId} for tenant ${tenant}`);
    
    // Update job status to running
    await prisma.indexJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date()
      }
    });
    
    // Create and run indexer
    const indexer = new ProductIndexer(tenant, jobId, {
      useAIEnrichment,
      confidenceThreshold
    });
    
    try {
      await indexer.run();
      
      console.log(`[Inngest] Indexing job ${jobId} completed successfully`);
      
      return {
        success: true,
        jobId,
        tenant,
        message: 'Indexing completed successfully'
      };
    } catch (error) {
      console.error(`[Inngest] Indexing job ${jobId} failed:`, error);
      
      throw error;
    }
  }
);

/**
 * All Inngest functions for export
 */
export const functions = [
  indexingJob
];

