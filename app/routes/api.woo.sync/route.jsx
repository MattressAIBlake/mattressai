/**
 * WooCommerce Product Sync
 * 
 * Syncs products from a WooCommerce store into our database.
 * 
 * POST /api/woo/sync
 * Headers: X-API-Key: <widgetApiKey>
 * 
 * Or admin-triggered:
 * POST /api/woo/sync
 * Headers: Authorization: Bearer <admin_secret>
 * Body: { "domain": "mattresswarehousetx.com" }
 */
import { json } from '@remix-run/node';
import prisma from '~/db.server.js';

const ADMIN_SECRET = process.env.WOO_ADMIN_SECRET || 'mattressai-woo-admin';

export const action = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(request)
    });
  }

  try {
    let store;

    // Check for widget API key or admin auth
    const apiKey = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');

    if (apiKey) {
      store = await prisma.wooStore.findUnique({
        where: { widgetApiKey: apiKey }
      });
    } else if (authHeader === `Bearer ${ADMIN_SECRET}`) {
      const body = await request.json();
      if (body.domain) {
        store = await prisma.wooStore.findUnique({
          where: { domain: body.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') }
        });
      }
    }

    if (!store) {
      return json({ error: 'Store not found or unauthorized' }, { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    // Fetch products from WooCommerce
    const products = await fetchWooCommerceProducts(store);

    // Upsert products into our database
    let synced = 0;
    let errors = 0;

    for (const product of products) {
      try {
        await prisma.wooProduct.upsert({
          where: {
            storeId_wooProductId: {
              storeId: store.id,
              wooProductId: String(product.id)
            }
          },
          create: {
            storeId: store.id,
            wooProductId: String(product.id),
            title: product.name,
            description: product.description,
            shortDescription: product.short_description,
            permalink: product.permalink,
            imageUrl: product.images?.[0]?.src || null,
            price: parseFloat(product.price) || null,
            regularPrice: parseFloat(product.regular_price) || null,
            salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
            sku: product.sku || null,
            stockStatus: product.stock_status,
            categories: JSON.stringify(product.categories?.map(c => c.name) || []),
            tags: JSON.stringify(product.tags?.map(t => t.name) || []),
            attributes: JSON.stringify(product.attributes || [])
          },
          update: {
            title: product.name,
            description: product.description,
            shortDescription: product.short_description,
            permalink: product.permalink,
            imageUrl: product.images?.[0]?.src || null,
            price: parseFloat(product.price) || null,
            regularPrice: parseFloat(product.regular_price) || null,
            salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
            sku: product.sku || null,
            stockStatus: product.stock_status,
            categories: JSON.stringify(product.categories?.map(c => c.name) || []),
            tags: JSON.stringify(product.tags?.map(t => t.name) || []),
            attributes: JSON.stringify(product.attributes || []),
            updatedAt: new Date()
          }
        });
        synced++;
      } catch (e) {
        console.error(`Failed to sync product ${product.id}:`, e.message);
        errors++;
      }
    }

    // Update store sync info
    await prisma.wooStore.update({
      where: { id: store.id },
      data: {
        lastSyncAt: new Date(),
        productCount: synced
      }
    });

    return json({
      success: true,
      store: store.domain,
      synced,
      errors,
      total: products.length
    }, { 
      headers: getCorsHeaders(request) 
    });

  } catch (error) {
    console.error('WooCommerce sync error:', error);
    return json({ error: error.message }, { 
      status: 500, 
      headers: getCorsHeaders(request) 
    });
  }
};

/**
 * Fetch all products from WooCommerce REST API
 */
async function fetchWooCommerceProducts(store) {
  const allProducts = [];
  let page = 1;
  const perPage = 100;

  // Build auth header (WooCommerce uses Basic auth with consumer key/secret)
  const auth = Buffer.from(`${store.consumerKey}:${store.consumerSecret}`).toString('base64');

  while (true) {
    const url = `${store.apiUrl}/products?page=${page}&per_page=${perPage}&status=publish`;
    
    console.log(`Fetching WooCommerce products: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WooCommerce API error: ${response.status} - ${text}`);
    }

    const products = await response.json();
    
    if (!products || products.length === 0) {
      break;
    }

    // Filter to only mattress products (if category available)
    const mattressProducts = products.filter(p => {
      const categories = p.categories?.map(c => c.name.toLowerCase()) || [];
      const tags = p.tags?.map(t => t.name.toLowerCase()) || [];
      const title = p.name.toLowerCase();
      
      // Include if it looks like a mattress
      const isMattress = 
        categories.some(c => c.includes('mattress')) ||
        tags.some(t => t.includes('mattress')) ||
        title.includes('mattress');
      
      // For now, include all products - filter can be refined later
      return true;
    });

    allProducts.push(...mattressProducts);

    // Check if there are more pages
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  console.log(`Fetched ${allProducts.length} products from ${store.domain}`);
  return allProducts;
}

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };
}
