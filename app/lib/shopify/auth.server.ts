import { verifyAdminBearer } from './verifySessionToken';
import { json } from '@remix-run/node';
import jwt from 'jsonwebtoken';

/**
 * Enhanced authentication middleware for admin routes
 * Verifies JWT session token and handles token expiry
 */
export async function authenticateAdmin(request: Request, expectedShop?: string) {
  const authHeader = request.headers.get('Authorization');
  
  // First try to get shop from JWT token (most reliable for embedded apps)
  let shop = expectedShop || getShopFromJWT(authHeader) || getShopFromRequest(request);

  if (!shop) {
    throw json(
      { error: 'Shop domain not found' },
      { status: 401 }
    );
  }

  const appKey = process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_API_SECRET;
  if (!appKey) {
    throw json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const verification = verifyAdminBearer(authHeader, shop, appKey);

  if (!verification.ok) {
    if (verification.reason === 'no bearer') {
      throw json(
        {
          error: 'Authentication required',
          redirectTo: getOAuthUrl(shop)
        },
        { status: 401 }
      );
    }

    if (verification.reason === 'invalid token' || verification.reason === 'shop mismatch') {
      throw json(
        {
          error: 'Session expired or invalid',
          redirectTo: getOAuthUrl(shop)
        },
        { status: 401 }
      );
    }

    throw json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }

  return {
    shop,
    decoded: verification.decoded,
    isAuthenticated: true
  };
}

/**
 * Extract shop domain from JWT token without verification
 * This is safe as we still verify the token afterwards
 */
function getShopFromJWT(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    // Decode without verification to extract shop
    const decoded = jwt.decode(token) as { iss?: string; dest?: string } | null;
    
    if (decoded?.iss) {
      // iss format: https://{shop}/admin
      const shop = decoded.iss.replace(/^https?:\/\//, '').replace(/\/admin$/, '');
      return shop;
    }
    
    if (decoded?.dest) {
      // dest format: https://{shop}
      const shop = decoded.dest.replace(/^https?:\/\//, '');
      return shop;
    }
  } catch (error) {
    // If decode fails, return null and let other methods try
    console.error('Error decoding JWT for shop extraction:', error);
  }

  return null;
}

/**
 * Extract shop domain from request headers or URL
 */
function getShopFromRequest(request: Request): string | null {
  // Try to get from X-Shopify-Shop-Domain header first (Shopify provides this)
  const shopifyShopDomain = request.headers.get('X-Shopify-Shop-Domain');
  if (shopifyShopDomain) {
    return shopifyShopDomain;
  }

  // Fallback to extracting from host header
  const host = request.headers.get('host');
  if (host && host.includes('.myshopify.com')) {
    return host;
  }

  // If embedded in Shopify admin, we might get it from referer
  const referer = request.headers.get('referer');
  if (referer) {
    const url = new URL(referer);
    if (url.hostname.includes('.myshopify.com')) {
      return url.hostname;
    }
  }

  return null;
}

/**
 * Generate OAuth re-authentication URL for expired sessions
 */
function getOAuthUrl(shop: string): string {
  const baseUrl = process.env.SHOPIFY_APP_URL || 'https://your-app.ngrok.io';
  return `${baseUrl}/auth?shop=${encodeURIComponent(shop)}`;
}
