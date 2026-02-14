/**
 * WooCommerce Store Registration
 * 
 * Registers a new WooCommerce store and returns the widget API key.
 * 
 * POST /api/woo/register
 * {
 *   "domain": "mattresswarehousetx.com",
 *   "name": "Mattress Warehouse TX",
 *   "consumerKey": "ck_...",
 *   "consumerSecret": "cs_...",
 *   "apiUrl": "https://mattresswarehousetx.com/wp-json/wc/v3" (optional)
 * }
 */
import { json } from '@remix-run/node';
import prisma from '~/db.server.js';
import crypto from 'crypto';

// Simple admin auth - in production, use proper auth
const ADMIN_SECRET = process.env.WOO_ADMIN_SECRET || 'mattressai-woo-admin';

export const action = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(request)
    });
  }

  try {
    // Check admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return json({ error: 'Unauthorized' }, { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    const body = await request.json();
    const { domain, name, consumerKey, consumerSecret, apiUrl } = body;

    // Validate required fields
    if (!domain || !consumerKey || !consumerSecret) {
      return json({ 
        error: 'Missing required fields: domain, consumerKey, consumerSecret' 
      }, { 
        status: 400, 
        headers: getCorsHeaders(request) 
      });
    }

    // Normalize domain (remove protocol, trailing slash)
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .toLowerCase();

    // Check if store already exists
    const existing = await prisma.wooStore.findUnique({
      where: { domain: normalizedDomain }
    });

    if (existing) {
      return json({ 
        error: 'Store already registered',
        widgetApiKey: existing.widgetApiKey 
      }, { 
        status: 409, 
        headers: getCorsHeaders(request) 
      });
    }

    // Generate a unique widget API key
    const widgetApiKey = 'woo_' + crypto.randomBytes(24).toString('hex');

    // Create the store
    const store = await prisma.wooStore.create({
      data: {
        domain: normalizedDomain,
        name: name || normalizedDomain,
        consumerKey,
        consumerSecret,
        apiUrl: apiUrl || `https://${normalizedDomain}/wp-json/wc/v3`,
        widgetApiKey,
        status: 'active' // Auto-activate for now
      }
    });

    return json({
      success: true,
      store: {
        id: store.id,
        domain: store.domain,
        name: store.name,
        widgetApiKey: store.widgetApiKey,
        status: store.status
      },
      embedCode: `<script src="https://themattressai.com/api/woo/embed?key=${store.widgetApiKey}" async></script>`
    }, { 
      status: 201, 
      headers: getCorsHeaders(request) 
    });

  } catch (error) {
    console.error('WooCommerce registration error:', error);
    return json({ error: error.message }, { 
      status: 500, 
      headers: getCorsHeaders(request) 
    });
  }
};

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
