import crypto from 'crypto';

/**
 * Verifies webhook HMAC signature from Shopify
 * @param body - Raw request body
 * @param signature - HMAC signature from headers
 * @param sharedSecret - Shopify app shared secret
 * @returns boolean - true if signature is valid
 */
export function verifyWebhookHmac(body: string, signature: string, sharedSecret: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const hmac = signature.slice(7); // Remove 'sha256=' prefix
  const digest = crypto.createHmac('sha256', sharedSecret).update(body, 'utf8').digest('hex');

  return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(hmac, 'hex'));
}
