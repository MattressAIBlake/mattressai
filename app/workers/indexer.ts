import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { getEmbeddingProvider, getVectorStoreProvider } from '../lib/ports/provider-registry';
import { enrichProductProfile } from '../lib/enrichment/product-enrichment.service';

const prisma = new PrismaClient();

/**
 * Main indexer worker that processes products for a tenant
 */
export class ProductIndexer {
  private tenant: string;
  private jobId: string;
  private useAIEnrichment: boolean;
  private confidenceThreshold: number;

  constructor(
    tenant: string,
    jobId: string,
    options: { useAIEnrichment?: boolean; confidenceThreshold?: number } = {}
  ) {
    this.tenant = tenant;
    this.jobId = jobId;
    this.useAIEnrichment = options.useAIEnrichment ?? true;
    this.confidenceThreshold = options.confidenceThreshold ?? 0.7;
  }

  /**
   * Main indexing workflow
   */
  async run(): Promise<void> {
    try {
      console.log(`Starting indexing job ${this.jobId} for tenant ${this.tenant}`);

      // Initialize providers
      const embeddingProvider = getEmbeddingProvider(this.tenant);
      const vectorStoreProvider = getVectorStoreProvider(this.tenant);

      // Get Shopify access token for this tenant
      const session = await this.getShopifySession();
      if (!session?.accessToken) {
        throw new Error('No valid Shopify session found');
      }

      // Start Shopify bulk operation
      const operationId = await this.startBulkOperation(session.accessToken);

      // Poll for bulk operation completion
      const bulkData = await this.pollBulkOperation(operationId, session.accessToken);

      // Update job with total product count
      await this.updateJobProgress({ totalProducts: bulkData.products.length });

      // Process products in batches
      const batchSize = 50;
      let processedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < bulkData.products.length; i += batchSize) {
        const batch = bulkData.products.slice(i, i + batchSize);

        try {
          const results = await this.processBatch(batch, embeddingProvider, vectorStoreProvider);

          processedCount += results.processed;
          failedCount += results.failed;

          // Update progress
          await this.updateJobProgress({
            processedProducts: processedCount,
            failedProducts: failedCount
          });

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Batch processing error:`, error);
          failedCount += batch.length;

          await this.updateJobProgress({
            processedProducts: processedCount,
            failedProducts: failedCount
          });
        }
      }

      // Mark job as completed
      await this.completeJob();

      console.log(`Indexing job ${this.jobId} completed successfully`);

    } catch (error) {
      console.error(`Indexing job ${this.jobId} failed:`, error);
      await this.failJob(error.message);
      throw error;
    }
  }

  /**
   * Get Shopify session for this tenant
   */
  private async getShopifySession() {
    return await prisma.session.findFirst({
      where: { shop: this.tenant },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Start Shopify GraphQL bulk operation
   */
  private async startBulkOperation(accessToken: string): Promise<string> {
    const query = `
      mutation {
        bulkOperationRunQuery(
          query: """
            {
              products {
                edges {
                  node {
                    id
                    title
                    description
                    vendor
                    productType
                    tags
                    metafields(namespace: "custom", first: 10) {
                      edges {
                        node {
                          key
                          value
                          namespace
                        }
                      }
                    }
                    variants(first: 1) {
                      edges {
                        node {
                          price
                          compareAtPrice
                          availableForSale
                        }
                      }
                    }
                  }
                }
              }
            }
          """
        ) {
          bulkOperation {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`https://${this.tenant}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();

    if (result.errors || result.data?.bulkOperationRunQuery?.userErrors?.length > 0) {
      throw new Error('Failed to start bulk operation');
    }

    return result.data.bulkOperationRunQuery.bulkOperation.id;
  }

  /**
   * Poll for bulk operation completion
   */
  private async pollBulkOperation(operationId: string, accessToken: string, maxAttempts = 60): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const query = `
        query {
          node(id: "${operationId}") {
            ... on BulkOperation {
              id
              status
              objectCount
              url
            }
          }
        }
      `;

      const response = await fetch(`https://${this.tenant}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query })
      });

      const result = await response.json();

      if (result.data?.node?.status === 'COMPLETED') {
        const operation = result.data.node;

        // Download bulk operation results
        if (operation.url) {
          const downloadResponse = await fetch(operation.url);
          const data = await downloadResponse.json();

          return {
            operationId,
            products: data.data.products.edges.map(edge => edge.node)
          };
        }
      }

      if (result.data?.node?.status === 'FAILED') {
        throw new Error('Bulk operation failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Bulk operation timed out');
  }

  /**
   * Process a batch of products
   */
  private async processBatch(
    products: any[],
    embeddingProvider: any,
    vectorStoreProvider: any
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    const vectorsToUpsert = [];

    for (const product of products) {
      try {
        // Enrich product profile
        const enrichedProfile = await this.enrichProduct(product);

        // Generate embedding for the enriched content
        const contentForEmbedding = this.createEmbeddingContent(enrichedProfile);
        const embeddings = await embeddingProvider.generateEmbeddings([contentForEmbedding]);
        const embedding = embeddings[0];

        // Prepare vector record
        const vectorRecord = {
          id: `product-${product.id}`,
          vector: embedding,
          metadata: {
            tenant_id: this.tenant,
            shopify_product_id: product.id,
            title: product.title,
            product_type: product.productType,
            vendor: product.vendor,
            enriched_profile: JSON.stringify(enrichedProfile),
            updated_at: new Date().toISOString()
          }
        };

        vectorsToUpsert.push(vectorRecord);
        processed++;

      } catch (error) {
        console.error(`Failed to process product ${product.id}:`, error);
        failed++;
      }
    }

    // Upsert vectors in batch
    if (vectorsToUpsert.length > 0) {
      await vectorStoreProvider.upsert(vectorsToUpsert);
    }

    return { processed, failed };
  }

  /**
   * Enrich a single product
   */
  private async enrichProduct(product: any) {
    // Create content hash for change detection
    const content = JSON.stringify({
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      metafields: product.metafields?.edges?.map(edge => edge.node) || []
    });

    const contentHash = createHash('sha256').update(content).digest('hex');

    // Check if we already have an enriched profile for this content
    const existingProfile = await prisma.productProfile.findUnique({
      where: { contentHash }
    });

    if (existingProfile) {
      return existingProfile;
    }

    // Enrich the product profile
    const enrichedProfile = await enrichProductProfile(product, {
      useAIEnrichment: this.useAIEnrichment,
      confidenceThreshold: this.confidenceThreshold,
      tenant: this.tenant
    });

    // Store the enriched profile
    await prisma.productProfile.create({
      data: {
        tenant: this.tenant,
        shopifyProductId: product.id,
        title: product.title,
        body: product.description,
        vendor: product.vendor,
        productType: product.productType,
        tags: JSON.stringify(product.tags || []),
        contentHash,
        ...enrichedProfile
      }
    });

    return enrichedProfile;
  }

  /**
   * Create content for embedding
   */
  private createEmbeddingContent(profile: any): string {
    const parts = [
      profile.title,
      profile.body,
      profile.vendor,
      profile.productType,
      profile.firmness && `Firmness: ${profile.firmness}`,
      profile.height && `Height: ${profile.height}`,
      profile.material && `Material: ${profile.material}`,
      profile.certifications && `Certifications: ${profile.certifications.join(', ')}`,
      profile.features && `Features: ${profile.features.join(', ')}`,
      profile.supportFeatures && `Support: ${profile.supportFeatures.join(', ')}`
    ].filter(Boolean);

    return parts.join(' | ');
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(updates: {
    totalProducts?: number;
    processedProducts?: number;
    failedProducts?: number;
    tokensUsed?: number;
    costEstimate?: number;
  }) {
    await prisma.indexJob.update({
      where: { id: this.jobId },
      data: updates
    });
  }

  /**
   * Complete the job successfully
   */
  private async completeJob() {
    await prisma.indexJob.update({
      where: { id: this.jobId },
      data: {
        status: 'completed',
        finishedAt: new Date()
      }
    });
  }

  /**
   * Fail the job with error message
   */
  private async failJob(errorMessage: string) {
    await prisma.indexJob.update({
      where: { id: this.jobId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage
      }
    });
  }
}

/**
 * Factory function to start indexing for a job
 */
export async function startIndexingJob(
  jobId: string,
  tenant: string,
  options: { useAIEnrichment?: boolean; confidenceThreshold?: number } = {}
): Promise<void> {
  const indexer = new ProductIndexer(tenant, jobId, options);

  // In a real implementation, this would be handled by a job queue
  // For now, we'll run it synchronously
  await indexer.run();
}

