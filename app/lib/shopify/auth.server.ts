import { verifyAdminBearer } from './verifySessionToken';
import { json } from '@remix-run/node';

/**
 * Enhanced authentication middleware for admin routes
 * Verifies JWT session token and handles token expiry
 */
export async function authenticateAdmin(request: Request, expectedShop?: string) {
  const authHeader = request.headers.get('Authorization');
  const shop = expectedShop || getShopFromRequest(request);

  if (!shop) {
    throw json(
      { error: 'Shop domain not found' },
      { status: 401 }
    );
  }

  const appKey = process.env.SHOPIFY_API_SECRET_KEY;
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
