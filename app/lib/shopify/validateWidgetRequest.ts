import { prisma } from '~/db.server';

/**
 * Validates widget requests based on shop installation status
 * This replaces HMAC validation for public-facing widget endpoints
 * 
 * Widget requests come from storefront visitors (unauthenticated),
 * so we validate by checking if the shop has the app installed.
 */
export async function validateWidgetRequest(
  request: Request
): Promise<{ valid: boolean; shop: string | null; error?: string }> {
  try {
    const url = new URL(request.url);
    
    // Get shop domain from query parameters (added by Shopify App Proxy)
    const shop = url.searchParams.get('shop');
    
    if (!shop) {
      return {
        valid: false,
        shop: null,
        error: 'Shop parameter missing from request'
      };
    }

    // Validate shop format
    if (!isValidShopDomain(shop)) {
      return {
        valid: false,
        shop,
        error: 'Invalid shop domain format'
      };
    }

    // Check if shop has an active session (app is installed)
    const session = await prisma.session.findFirst({
      where: {
        shop,
        // Check that access token exists (app is installed)
        accessToken: {
          not: null
        }
      },
      select: {
        id: true,
        shop: true,
        accessToken: true,
        scope: true
      }
    });

    if (!session) {
      console.warn(`Widget request from uninstalled/unknown shop: ${shop}`);
      return {
        valid: false,
        shop,
        error: 'Shop does not have app installed'
      };
    }

    // Valid request from installed shop
    return {
      valid: true,
      shop: session.shop
    };
  } catch (error) {
    console.error('Error validating widget request:', error);
    return {
      valid: false,
      shop: null,
      error: 'Internal validation error'
    };
  }
}

/**
 * Get OAuth access token for a shop to make Shopify API calls
 */
export async function getShopAccessToken(shop: string): Promise<string | null> {
  try {
    const session = await prisma.session.findFirst({
      where: { shop },
      select: { accessToken: true },
      orderBy: { id: 'desc' } // Get most recent session
    });

    return session?.accessToken || null;
  } catch (error) {
    console.error(`Error getting access token for shop ${shop}:`, error);
    return null;
  }
}

/**
 * Validates shop domain format
 */
function isValidShopDomain(shop: string): boolean {
  // Shop should be in format: example.myshopify.com
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

/**
 * Rate limiting helper (basic in-memory implementation)
 * For production, use Redis or similar
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(shop: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const key = `ratelimit:${shop}`;
  
  const current = requestCounts.get(key);
  
  if (!current || current.resetAt < now) {
    // New window
    requestCounts.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}

