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
    
    // DEBUG LOGGING - REMOVE IN PRODUCTION
    console.log('🔍 HMAC Verification Debug:', {
      fullUrl: requestUrl,
      path: url.pathname,
      hasHmac: !!hmac,
      hmacLength: hmac?.length,
      secretLength: sharedSecret?.length,
      secretPrefix: sharedSecret?.substring(0, 8) + '...',
      queryParams: Array.from(url.searchParams.keys()),
      hasSignature: url.searchParams.has('signature'),
      hasHmacParam: url.searchParams.has('hmac')
    });
    
    if (!hmac) {
      console.log('❌ No HMAC/signature found in request');
      return false;
    }

    // Remove signature/hmac from query string, keeping URL encoding intact
    const queryString = url.search.slice(1); // Remove leading '?'
    const pairs = queryString.split('&').filter(pair => {
      const key = pair.split('=')[0];
      return key !== 'signature' && key !== 'hmac';
    });

    // Shopify requires parameters to be sorted alphabetically by key
    // Must preserve URL encoding (e.g., %2F should stay as %2F, not become /)
    const sortedParams = pairs.sort((a, b) => {
      const keyA = a.split('=')[0];
      const keyB = b.split('=')[0];
      return keyA.localeCompare(keyB);
    }).join('&');

    const message = sortedParams;
    const digest = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');

    console.log('🔐 HMAC Comparison:', {
      message: message,
      messageLength: message.length,
      parametersSorted: true,
      computedDigest: digest.substring(0, 12) + '...' + digest.substring(digest.length - 8),
      receivedHmac: hmac.substring(0, 12) + '...' + hmac.substring(hmac.length - 8),
      digestLength: digest.length,
      hmacLength: hmac.length,
      exactMatch: digest === hmac.toLowerCase()
    });

    // Validate that both are valid hex strings of same length before comparing
    const hmacLower = hmac.toLowerCase();
    if (!/^[0-9a-f]+$/.test(hmacLower) || hmacLower.length !== digest.length) {
      console.log('❌ HMAC format mismatch - invalid hex or length mismatch');
      return false;
    }

    // Shopify sends hex hmac; compare in constant time
    // Both digest and hmac are hex strings, so use 'hex' encoding
    const isValid = crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(hmacLower, 'hex'));
    console.log(isValid ? '✅ HMAC Valid' : '❌ HMAC Invalid');
    return isValid;
  } catch (error) {
    // If any error occurs during verification, treat as invalid
    console.error('❌ Error verifying proxy HMAC:', error);
    return false;
  }
}