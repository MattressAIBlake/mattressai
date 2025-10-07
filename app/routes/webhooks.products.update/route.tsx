import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac';
import { getVectorStoreProvider } from '~/lib/ports/provider-registry';
import { enrichProductProfile } from '~/lib/enrichment/product-enrichment.service';
import { getEmbeddingProvider } from '~/lib/ports/provider-registry';

const prisma = new PrismaClient();

/**
 * POST /webhooks/products/update
 * Handles Shopify product update webhooks to keep vector database in sync
 */
export async function action({ request }) {
  try {
    // Verify webhook HMAC
    const isValid = verifyWebhookHmac(request);
    if (!isValid) {
      throw json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    if (request.method !== 'POST') {
      throw json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await request.json();
    const { id: shopifyProductId } = body;

    if (!shopifyProductId) {
      throw json({ error: 'Missing product ID' }, { status: 400 });
    }

    // Get shop domain from webhook headers
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain');
    if (!shopDomain) {
      throw json({ error: 'Missing shop domain' }, { status: 400 });
    }

    console.log(`Processing product update webhook for ${shopifyProductId} in ${shopDomain}`);

    // Check if we have an active indexing job for this shop
    const activeJob = await prisma.indexJob.findFirst({
      where: {
        tenant: shopDomain,
        status: { in: ['pending', 'running'] }
      }
    });

    // If there's an active indexing job, let it handle this update
    // Otherwise, process the update immediately
    if (!activeJob) {
      await processProductUpdate(shopifyProductId, shopDomain);
    }

    return json({ success: true, processed: true });

  } catch (error) {
    console.error('Product update webhook error:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process a single product update
 */
async function processProductUpdate(shopifyProductId: string, tenant: string) {
  try {
    // Get Shopify session for this tenant
    const session = await prisma.session.findFirst({
      where: { shop: tenant },
      orderBy: { createdAt: 'desc' }
    });

    if (!session?.accessToken) {
      console.error(`No valid session found for tenant ${tenant}`);
      return;
    }

    // Fetch updated product data from Shopify
    const productData = await fetchProductFromShopify(shopifyProductId, session.accessToken, tenant);

    if (!productData) {
      console.error(`Failed to fetch product ${shopifyProductId} from Shopify`);
      return;
    }

    // Enrich the product
    const enrichedProfile = await enrichProductProfile(productData, {
      useAIEnrichment: true,
      confidenceThreshold: 0.7,
      tenant
    });

    // Generate embedding
    const embeddingProvider = getEmbeddingProvider(tenant);
    const contentForEmbedding = createEmbeddingContent(productData, enrichedProfile);
    const embeddings = await embeddingProvider.generateEmbeddings([contentForEmbedding]);
    const embedding = embeddings[0];

    // Update vector in database
    const vectorStoreProvider = getVectorStoreProvider(tenant);

    await vectorStoreProvider.upsert([{
      id: `product-${shopifyProductId}`,
      vector: embedding,
      metadata: {
        tenant_id: tenant,
        shopify_product_id: shopifyProductId,
        title: productData.title,
        product_type: productData.productType,
        vendor: productData.vendor,
        enriched_profile: JSON.stringify(enrichedProfile),
        updated_at: new Date().toISOString()
      }
    }]);

    console.log(`Successfully updated vector for product ${shopifyProductId}`);

  } catch (error) {
    console.error(`Failed to process product update ${shopifyProductId}:`, error);
    throw error;
  }
}

/**
 * Fetch product data from Shopify GraphQL API
 */
async function fetchProductFromShopify(productId: string, accessToken: string, shopDomain: string) {
  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
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
  `;

  const response = await fetch(`https://${shopDomain}/admin/api/2023-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query,
      variables: { id: productId }
    })
  });

  const result = await response.json();

  if (result.errors || !result.data?.product) {
    throw new Error(`Failed to fetch product: ${JSON.stringify(result.errors)}`);
  }

  return result.data.product;
}

/**
 * Create content for embedding from product data
 */
function createEmbeddingContent(product: any, enrichedProfile: any): string {
  const parts = [
    product.title,
    product.description,
    product.vendor,
    product.productType,
    enrichedProfile.firmness && `Firmness: ${enrichedProfile.firmness}`,
    enrichedProfile.height && `Height: ${enrichedProfile.height}`,
    enrichedProfile.material && `Material: ${enrichedProfile.material}`,
    enrichedProfile.certifications && `Certifications: ${enrichedProfile.certifications.join(', ')}`,
    enrichedProfile.features && `Features: ${enrichedProfile.features.join(', ')}`,
    enrichedProfile.supportFeatures && `Support: ${enrichedProfile.supportFeatures.join(', ')}`
  ].filter(Boolean);

  return parts.join(' | ');
}

/**
 * GET /webhooks/products/update
 * Returns webhook documentation
 */
export async function loader({ request }) {
  return json({
    webhook: 'products/update',
    description: 'Handles Shopify product update webhooks to keep vector database in sync',
    triggers: [
      'Product created or updated',
      'Product variants changed',
      'Product metafields updated'
    ],
    processing: [
      'Fetches latest product data from Shopify',
      'Enriches product with mattress attributes',
      'Generates new vector embedding',
      'Updates vector in database'
    ],
    notes: [
      'Only processes updates when no active indexing job is running',
      'Uses existing enrichment pipeline for consistency',
      'Updates vectors immediately for real-time sync'
    ]
  });
}


