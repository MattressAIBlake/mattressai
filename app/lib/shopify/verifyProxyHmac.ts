import crypto from 'crypto';

/**
 * Verifies App Proxy HMAC signature from Shopify
 * @param requestUrl - The full URL including query parameters
 * @param sharedSecret - Shopify app shared secret
 * @returns boolean - true if signature is valid
 */
export function verifyProxyHmac(requestUrl: string, sharedSecret: string): boolean {
  const url = new URL(requestUrl);
  const hmac = url.searchParams.get('signature') || url.searchParams.get('hmac');
  if (!hmac) return false;

  // Remove signature/hmac from params, then sort and join
  const params = new URLSearchParams(url.search);
  params.delete('signature');
  params.delete('hmac');

  const message = params.toString(); // Already URL-encoded & sorted by URLSearchParams iteration
  const digest = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');

  // Shopify sends hex hmac; compare in constant time
  return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(hmac, 'utf8'));
}