import jwt from 'jsonwebtoken';

interface Decoded {
  iss: string; // https://{shop}/admin
  dest?: string; // https://{shop}
  aud: string;
  sub: string;
  exp: number;
  nbf?: number;
}

/**
 * Verifies Admin JWT session token from Shopify
 * @param authHeader - Authorization header with Bearer token
 * @param expectedShop - Expected shop domain (e.g., 'mystore.myshopify.com')
 * @param appKey - Shopify app API secret key
 * @returns Object with ok status and decoded token or error reason
 */
export function verifyAdminBearer(authHeader: string | undefined, expectedShop: string, appKey: string) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, reason: 'no bearer' };
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, appKey, { algorithms: ['HS256'] }) as Decoded;
    const shopFromIss = decoded.iss?.replace(/^https?:\/\//, '').replace(/\/admin$/, '');
    if (!shopFromIss || shopFromIss !== expectedShop) {
      return { ok: false, reason: 'shop mismatch' };
    }
    return { ok: true, decoded };
  } catch (err) {
    return { ok: false, reason: 'invalid token' };
  }
}