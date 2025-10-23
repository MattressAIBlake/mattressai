import crypto from 'crypto';

/**
 * Verifies App Proxy HMAC signature from Shopify
 * @param requestUrl - The full URL including query parameters
 * @param sharedSecret - Shopify app shared secret
 * @returns boolean - true if signature is valid
 */
export function verifyProxyHmac(requestUrl: string, sharedSecret: string): boolean {
  try {
    const url = new URL(requestUrl);
    const hmac = url.searchParams.get('signature') || url.searchParams.get('hmac');
    if (!hmac) return false;

    // Remove signature/hmac from params, then sort and join
    const params = new URLSearchParams(url.search);
    params.delete('signature');
    params.delete('hmac');

    const message = params.toString(); // Already URL-encoded & sorted by URLSearchParams iteration
    const digest = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');

    // Validate that both are valid hex strings of same length before comparing
    const hmacLower = hmac.toLowerCase();
    if (!/^[0-9a-f]+$/.test(hmacLower) || hmacLower.length !== digest.length) {
      return false;
    }

    // Shopify sends hex hmac; compare in constant time
    // Both digest and hmac are hex strings, so use 'hex' encoding
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(hmacLower, 'hex'));
  } catch (error) {
    // If any error occurs during verification, treat as invalid
    console.error('Error verifying proxy HMAC:', error);
    return false;
  }
}