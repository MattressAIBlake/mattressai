import { createHash } from 'crypto';
import { getEmbeddingProvider, getVectorStoreProvider } from '../lib/ports/provider-registry';
import { enrichProductProfile } from '../lib/enrichment/product-enrichment.service.server';
import { prisma } from '../db.server';
import { INDEXING_CONFIG } from '../lib/config/indexing.config';
import { 
  ErrorSeverity, 
  ErrorCounter, 
  ShopifyAPIError, 
  BulkOperationError,
  ProductEnrichmentError,
  handleIndexingError 
} from '../lib/errors/indexing-errors';
import { logger, PerformanceLogger } from '../lib/logger';
import { retryWithBackoff, retryIfRetryable } from '../lib/utils/retry';

/**
 * Main indexer worker that processes products for a tenant
 */
export class ProductIndexer {
  private tenant: string;
  private jobId: string;
  private useAIEnrichment: boolean;
  private confidenceThreshold: number;
  private errorCounter: ErrorCounter;

  constructor(
    tenant: string,
    jobId: string,
    options: { useAIEnrichment?: boolean; confidenceThreshold?: number } = {}
  ) {
    this.tenant = tenant;
    this.jobId = jobId;
    this.useAIEnrichment = options.useAIEnrichment ?? true;
    this.confidenceThreshold = options.confidenceThreshold ?? INDEXING_CONFIG.DEFAULT_CONFIDENCE_THRESHOLD;
    this.errorCounter = new ErrorCounter();
  }

  /**
   * Main indexing workflow
   */
  async run(): Promise<void> {
    const perfLogger = new PerformanceLogger('Indexing Job', {
      jobId: this.jobId,
      tenant: this.tenant
    });
    
    try {
      logger.info('Starting indexing job', {
        jobId: this.jobId,
        tenant: this.tenant,
        useAIEnrichment: this.useAIEnrichment,
        confidenceThreshold: this.confidenceThreshold
      });

      // Initialize providers
      const embeddingProvider = getEmbeddingProvider(this.tenant);
      const vectorStoreProvider = getVectorStoreProvider(this.tenant);

      // Get Shopify access token for this tenant
      const session = await this.getShopifySession();
      if (!session?.accessToken) {
        throw new ShopifyAPIError('No valid Shopify session found', { tenant: this.tenant });
      }

      // Start Shopify bulk operation
      console.log(`🚀 Starting Shopify bulk operation for tenant ${this.tenant}...`);
      const operationId = await this.startBulkOperation(session.accessToken);
      console.log(`✅ Bulk operation started: ${operationId}`);

      // Poll for bulk operation completion
      console.log(`⏳ Polling for bulk operation completion...`);
      const bulkData = await this.pollBulkOperation(operationId, session.accessToken);
      console.log(`✅ Bulk operation completed. Retrieved ${bulkData.products?.length || 0} products`);

      // Filter for mattress products only using hybrid AI approach
      console.log(`🔍 Starting hybrid mattress filtering...`);
      const mattresses = await this.filterMattressesHybrid(bulkData.products);
      console.log(`✅ Hybrid filtering complete. Found ${mattresses.length} mattresses`);

      // Check if we found any mattresses
      if (mattresses.length === 0) {
        await this.updateJobProgress({ 
          totalProducts: 0,
          processedProducts: 0
        });
        await prisma.indexJob.update({
          where: { id: this.jobId },
          data: {
            status: 'completed',
            finishedAt: new Date(),
            errorMessage: 'NO_MATTRESSES_FOUND'
          }
        });
        console.log(`No mattresses found for tenant ${this.tenant}`);
        return;
      }

      // Update job with total product count
      await this.updateJobProgress({ totalProducts: mattresses.length });

      // Process products in batches
      const batchSize = INDEXING_CONFIG.PRODUCT_BATCH_SIZE;
      let processedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < mattresses.length; i += batchSize) {
        const batch = mattresses.slice(i, i + batchSize);

        try {
          console.log(`🔄 Processing batch ${i / batchSize + 1} with ${batch.length} products...`);
          const results = await this.processBatch(batch, embeddingProvider, vectorStoreProvider);

          processedCount += results.processed;
          failedCount += results.failed;
          
          console.log(`✅ Batch complete: ${results.processed} processed, ${results.failed} failed`);
          console.log(`📊 Total progress: ${processedCount}/${mattresses.length} processed, ${failedCount} failed`);

          // Update progress
          await this.updateJobProgress({
            processedProducts: processedCount,
            failedProducts: failedCount
          });

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, INDEXING_CONFIG.BATCH_DELAY_MS));

        } catch (error) {
          console.error(`❌ BATCH ERROR: ${error.message}`, error);
          const errorResult = handleIndexingError(error, ErrorSeverity.BATCH);
          this.errorCounter.increment(errorResult.severity);
          failedCount += batch.length;

          await this.updateJobProgress({
            processedProducts: processedCount,
            failedProducts: failedCount
          });
          
          // If critical error, re-throw
          if (!errorResult.shouldContinue) {
            throw error;
          }
        }
      }

      // Mark job as completed
      await this.completeJob();

      const errorSummary = this.errorCounter.getSummary();
      perfLogger.end({
        status: 'completed',
        processedProducts: processedCount,
        failedProducts: failedCount,
        errors: errorSummary
      });

    } catch (error) {
      const errorResult = handleIndexingError(error, ErrorSeverity.CRITICAL);
      this.errorCounter.increment(errorResult.severity);
      
      perfLogger.fail(error, {
        status: 'failed',
        errors: this.errorCounter.getSummary()
      });
      
      await this.failJob(error.message);
      throw error;
    }
  }

  /**
   * Filter products to only include mattresses (legacy keyword-only method)
   * Kept as fallback for the hybrid approach
   */
  private filterMattresses(products: any[]): any[] {
    return products.filter(product => {
      const title = product.title?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const productType = product.productType?.toLowerCase() || '';
      const tags = product.tags?.map((tag: string) => tag.toLowerCase()) || [];

      // Check if product is a mattress based on various signals
      const isMattress = 
        title.includes('mattress') ||
        description.includes('mattress') ||
        productType.includes('mattress') ||
        productType.includes('bed') ||
        tags.some((tag: string) => tag.includes('mattress'));

      return isMattress;
    });
  }

  /**
   * Two-stage hybrid filtering: keyword first, then AI for uncertain cases
   * Stage 1: Quick multilingual keyword filtering (free, instant)
   * Stage 2: AI classification for uncertain products (accurate, low cost)
   */
  private async filterMattressesHybrid(products: any[]): Promise<any[]> {
    const definitelyMattresses: any[] = [];
    const uncertainProducts: any[] = [];
    
    // Safety check
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log(`⚠️ No products to filter (received ${products ? products.length : 'null/undefined'})`);
      return [];
    }
    
    console.log(`Starting hybrid filter for ${products.length} total products...`);
    console.log(`🔍 All products being evaluated:`);
    products.forEach((p, idx) => {
      console.log(`  ${idx + 1}. "${p.title}" (Type: ${p.productType || 'N/A'}, Vendor: ${p.vendor || 'N/A'})`);
    });
    
    // Stage 1: Quick keyword filtering with multilingual support
    for (const product of products) {
      const titleLower = (product.title || '').toLowerCase();
      const text = `${product.title} ${product.description} ${product.productType} ${product.tags?.join(' ')}`.toLowerCase();
      
      // Strong positive signals (mattress keywords in multiple languages)
      const strongMattressKeywords = [
        'mattress', 'colchón', 'colchon', 'matelas', 'materasso', 
        'matratze', 'colchão', 'colchao', 'matras', 'madrass',
        'マットレス', '床垫', '床墊', '매트리스', 'مرتبة'
      ];
      
      // Strong negative signals (accessories, not actual mattresses)
      const notMattressKeywords = [
        'topper', 'protector', 'cover', 'pillow', 'sheet',
        'frame', 'foundation', 'accessory', 'pet bed', 'dog bed',
        'air mattress', 'inflatable', 'pad only', 'cover only'
      ];
      
      // Check if title explicitly contains mattress keyword
      const titleHasMattress = strongMattressKeywords.some(kw => titleLower.includes(kw));
      
      // Check if title has negative keywords (more restrictive for title)
      const titleHasNegative = notMattressKeywords.some(kw => titleLower.includes(kw));
      
      // Check full text
      const hasStrongPositive = strongMattressKeywords.some(kw => text.includes(kw));
      const hasStrongNegative = notMattressKeywords.some(kw => text.includes(kw));
      
      // If title explicitly says "mattress" and doesn't have negative keywords in title, accept it
      if (titleHasMattress && !titleHasNegative) {
        console.log(`  ✅ DEFINITE MATTRESS (from title): "${product.title}"`);
        definitelyMattresses.push(product);
      } else if (hasStrongPositive && !hasStrongNegative) {
        // Mattress keyword in description/tags and no negative signals
        console.log(`  ✅ DEFINITE MATTRESS (from content): "${product.title}"`);
        definitelyMattresses.push(product);
      } else if (!hasStrongNegative && text.length > 10) {
        // Uncertain - could be a mattress with unusual naming
        // Only include products that might be beds/sleep products
        const mightBeMattress = 
          text.includes('bed') || 
          text.includes('sleep') || 
          text.includes('comfort') ||
          text.includes('rest') ||
          text.includes('foam') ||
          text.includes('spring');
        
        if (mightBeMattress) {
          console.log(`  ⚠️  UNCERTAIN (will AI classify): "${product.title}"`);
          uncertainProducts.push(product);
        } else {
          console.log(`  ❌ REJECTED (no mattress keywords): "${product.title}"`);
        }
      } else if (titleHasMattress && titleHasNegative) {
        console.log(`  ❌ REJECTED (title has mattress but also negative keywords): "${product.title}"`);
      } else if (hasStrongNegative) {
        console.log(`  ❌ REJECTED (negative keywords in description): "${product.title}"`);
      } else {
        console.log(`  ❌ REJECTED (no keywords): "${product.title}"`);
      }
    }
    
    console.log(`Stage 1 (Keyword Filter): ${definitelyMattresses.length} definite mattresses, ${uncertainProducts.length} uncertain products`);
    
    // Stage 2: AI classification for uncertain products only
    let aiClassifiedMattresses: any[] = [];
    
    if (uncertainProducts.length > 0 && uncertainProducts.length < INDEXING_CONFIG.MAX_UNCERTAIN_PRODUCTS_FOR_AI) {
      // Only use AI if we have a reasonable number of uncertain products
      try {
        console.log(`Stage 2 (AI Classification): Analyzing ${uncertainProducts.length} uncertain products...`);
        aiClassifiedMattresses = await this.classifyProductsWithAI(uncertainProducts);
        console.log(`Stage 2 (AI Classification): Found ${aiClassifiedMattresses.length} additional mattresses`);
      } catch (error) {
        console.error('AI classification failed, using keyword fallback:', error);
        // Fallback: be conservative with uncertain products that have strong bed indicators
        aiClassifiedMattresses = uncertainProducts.filter(p => {
          const text = `${p.title} ${p.productType}`.toLowerCase();
          return text.includes('bed mattress') || text.includes('sleeping mattress');
        });
        console.log(`Stage 2 (Fallback): Classified ${aiClassifiedMattresses.length} products using conservative keywords`);
      }
    } else if (uncertainProducts.length >= INDEXING_CONFIG.MAX_UNCERTAIN_PRODUCTS_FOR_AI) {
      // Too many uncertain products - log warning and use permissive keyword fallback
      console.warn(`Too many uncertain products (${uncertainProducts.length}). Using keyword fallback to avoid high AI costs.`);
      aiClassifiedMattresses = uncertainProducts.filter(p => {
        const text = `${p.title} ${p.productType}`.toLowerCase();
        return text.includes('bed') && !text.includes('pet');
      });
    }
    
    const totalMattresses = definitelyMattresses.length + aiClassifiedMattresses.length;
    console.log(`Hybrid filter complete: ${totalMattresses} total mattresses found (${definitelyMattresses.length} keyword + ${aiClassifiedMattresses.length} AI)`);
    
    return [...definitelyMattresses, ...aiClassifiedMattresses];
  }

  /**
   * Use OpenAI to classify products as mattresses or not
   * Processes products in batches to optimize API usage
   */
  private async classifyProductsWithAI(products: any[]): Promise<any[]> {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const batchSize = INDEXING_CONFIG.AI_CLASSIFICATION_BATCH_SIZE;
    const mattresses: any[] = [];
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      // Create compact product descriptions to minimize token usage
      const productDescriptions = batch.map((p, idx) => ({
        index: idx,
        title: p.title || 'Untitled',
        type: p.productType || '',
        description: (p.description || '').substring(0, 150), // First 150 chars only
        tags: (p.tags || []).slice(0, 5) // First 5 tags only
      }));
      
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Cost-effective model: ~$0.15 per 1M input tokens
          messages: [
            {
              role: 'system',
              content: 'You are a product classifier specializing in identifying mattresses. A mattress is a large rectangular pad for supporting a person while sleeping, typically placed on a bed frame. It is NOT: air mattresses, pet beds, mattress toppers, mattress protectors, pillows, or other accessories. Respond ONLY with a JSON array of booleans, nothing else.'
            },
            {
              role: 'user',
              content: `Classify these products as mattresses (true) or not mattresses (false). Return only a JSON array: [true, false, true, ...]\n\nProducts:\n${JSON.stringify(productDescriptions, null, 2)}`
            }
          ],
          temperature: 0.1, // Low temperature for consistent, deterministic results
          max_tokens: 300
        });
        
        const content = response.choices[0].message.content.trim();
        
        // Parse response, handling both array format and potential variations
        let classifications: boolean[];
        
        try {
          // Try to parse as JSON array
          if (content.startsWith('[')) {
            classifications = JSON.parse(content);
          } else {
            // Extract array from response if wrapped in text
            const arrayMatch = content.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              classifications = JSON.parse(arrayMatch[0]);
            } else {
              throw new Error('No array found in response');
            }
          }
          
          // Validate array length
          if (classifications.length !== batch.length) {
            console.warn(`AI returned ${classifications.length} classifications for ${batch.length} products. Skipping batch.`);
            continue;
          }
          
          // Add classified mattresses to results
          batch.forEach((product, idx) => {
            if (classifications[idx] === true) {
              mattresses.push(product);
            }
          });
          
        } catch (parseError) {
          console.error('Failed to parse AI classification response:', content);
          console.error('Parse error:', parseError);
          // Skip this batch on parse error
        }
        
        // Rate limit protection: wait between API calls
        await new Promise(resolve => setTimeout(resolve, INDEXING_CONFIG.AI_BATCH_DELAY_MS));
        
      } catch (error) {
        console.error(`AI classification batch error (batch ${i / batchSize + 1}):`, error.message);
        // Continue with next batch instead of failing completely
      }
    }
    
    return mattresses;
  }

  /**
   * Get Shopify session for this tenant
   */
  private async getShopifySession() {
    return await prisma.session.findFirst({
      where: { shop: this.tenant }
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
      throw new BulkOperationError('Failed to start bulk operation', {
        errors: result.errors,
        userErrors: result.data?.bulkOperationRunQuery?.userErrors
      });
    }

    return result.data.bulkOperationRunQuery.bulkOperation.id;
  }

  /**
   * Poll for bulk operation completion
   */
  private async pollBulkOperation(operationId: string, accessToken: string, maxAttempts = INDEXING_CONFIG.MAX_POLL_ATTEMPTS): Promise<any> {
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
        console.log(`✅ Bulk operation completed. Status: ${operation.status}, Object count: ${operation.objectCount}`);

        // Download bulk operation results (JSONL format)
        if (operation.url) {
          console.log(`📥 Downloading bulk operation results from: ${operation.url}`);
          const downloadResponse = await fetch(operation.url);
          const text = await downloadResponse.text();
          console.log(`📄 Downloaded ${text.length} characters of JSONL data`);
          
          const lines = text.split('\n').filter(line => line.trim());
          console.log(`📊 Parsing ${lines.length} JSONL lines...`);
          
          // Parse JSONL (newline-delimited JSON) and group by product
          const allRows: any[] = [];
          let parseErrors = 0;
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              allRows.push(parsed);
            } catch (err) {
              parseErrors++;
            }
          }
          
          console.log(`📊 Parsed ${allRows.length} rows (${parseErrors} parse errors)`);
          
          // Filter for product rows only (no __parentId = top level products)
          const products = allRows.filter(row => !row.__parentId && row.id && row.id.includes('Product'));
          
          console.log(`✅ Fetched ${products.length} products from Shopify bulk operation`);
          console.log(`📊 Breakdown: ${allRows.length} total rows, ${products.length} products, ${allRows.length - products.length} child objects`);
          
          if (products.length > 0) {
            console.log(`📋 Sample products (first 3):`);
            products.slice(0, 3).forEach((p, idx) => {
              console.log(`  ${idx + 1}. "${p.title}" (ID: ${p.id}, Type: ${p.productType || 'N/A'}, Tags: ${Array.isArray(p.tags) ? p.tags.join(', ') : 'N/A'})`);
            });
          } else {
            console.log(`⚠️ No products found in bulk operation results`);
            if (allRows.length > 0) {
              console.log(`⚠️ Sample of first 3 rows to debug:`);
              allRows.slice(0, 3).forEach((row, idx) => {
                console.log(`  ${idx + 1}. ${JSON.stringify(row).substring(0, 200)}...`);
              });
            }
          }

          return {
            operationId,
            products
          };
        } else {
          console.log(`⚠️ Bulk operation completed but no download URL provided`);
          return {
            operationId,
            products: []
          };
        }
      }

      if (result.data?.node?.status === 'FAILED') {
        throw new BulkOperationError('Bulk operation failed', {
          operationId,
          status: result.data?.node?.status
        });
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, INDEXING_CONFIG.POLL_INTERVAL_MS));
    }

    throw new BulkOperationError('Bulk operation timed out', {
      operationId,
      maxAttempts,
      duration: maxAttempts * INDEXING_CONFIG.POLL_INTERVAL_MS
    });
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
        console.log(`  🔄 Processing product: "${product.title}" (${product.id})`);
        
        // Enrich product profile with retry logic
        console.log(`    📝 Enriching product profile...`);
        const enrichedProfile = await retryIfRetryable(
          () => this.enrichProduct(product),
          { maxRetries: 2, initialDelay: 500 }
        );
        console.log(`    ✅ Enrichment complete`);

        // Generate embedding for the enriched content with retry
        console.log(`    🔮 Generating embeddings...`);
        const contentForEmbedding = this.createEmbeddingContent(enrichedProfile);
        const embeddings = await retryIfRetryable(
          () => embeddingProvider.generateEmbeddings([contentForEmbedding]),
          { maxRetries: 3, initialDelay: 1000 }
        );
        const embedding = embeddings[0];
        console.log(`    ✅ Embedding generated (${embedding.length} dimensions)`);

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
        console.log(`    ✅ Product processed successfully`);

      } catch (error) {
        console.error(`    ❌ Failed to process product "${product.title}": ${error.message}`);
        console.error(`    Error stack:`, error.stack);
        const enrichError = new ProductEnrichmentError(
          `Failed to process product ${product.id}`,
          product.id,
          { title: product.title }
        );
        handleIndexingError(enrichError, ErrorSeverity.PRODUCT);
        this.errorCounter.increment(ErrorSeverity.PRODUCT);
        failed++;
      }
    }

    // Upsert vectors in batch with retry
    if (vectorsToUpsert.length > 0) {
      console.log(`  🚀 Upserting ${vectorsToUpsert.length} vectors to Pinecone...`);
      await retryIfRetryable(
        () => vectorStoreProvider.upsert(vectorsToUpsert),
        { maxRetries: 3, initialDelay: 2000 }
      );
      console.log(`  ✅ Vectors upserted successfully to Pinecone`);
    } else {
      console.log(`  ⚠️  No vectors to upsert (all products failed)`);
    }

    return { processed, failed };
  }

  /**
   * Enrich a single product
   */
  private async enrichProduct(product: any) {
    console.log(`      🔍 Checking for existing profile...`);
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
      console.log(`      ♻️  Found existing profile (ID: ${existingProfile.id}), reusing`);
      return existingProfile;
    }

    console.log(`      🆕 No existing profile, creating new one...`);

    // Enrich the product profile
    console.log(`      🤖 Running AI enrichment...`);
    const enrichedProfile = await enrichProductProfile(product, {
      useAIEnrichment: this.useAIEnrichment,
      confidenceThreshold: this.confidenceThreshold,
      tenant: this.tenant
    });
    console.log(`      ✅ AI enrichment complete:`, {
      firmness: enrichedProfile.firmness,
      height: enrichedProfile.height,
      material: enrichedProfile.material,
      confidence: enrichedProfile.confidence
    });

    // Store the enriched profile
    console.log(`      💾 Storing ProductProfile in database...`);
    console.log(`      📌 Tenant: "${this.tenant}"`);
    console.log(`      📌 Shopify Product ID: "${product.id}"`);
    console.log(`      📌 ContentHash: "${contentHash}"`);
    
    try {
      const created = await prisma.productProfile.create({
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
      console.log(`      ✅ ProductProfile created with ID: ${created.id}`);
      return enrichedProfile;
    } catch (dbError) {
      console.error(`      ❌ DATABASE ERROR during ProductProfile.create:`);
      console.error(`         Error code: ${dbError.code}`);
      console.error(`         Error message: ${dbError.message}`);
      console.error(`         Full error:`, dbError);
      throw dbError; // Re-throw so it's caught by the outer try-catch
    }
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

