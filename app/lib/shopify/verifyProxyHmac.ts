import crypto from 'crypto';

/**
 * Verifies App Proxy HMAC signature from Shopify
 * @param requestUrl - The full URL including query parameters
 * @param sharedSecret - Shopify app shared secret
 * @returns boolean - true if signature is valid
 */
export function verifyProxyHmac(requestUrl: string, sharedSecret: string): boolean {
  try {
    // Extract the raw query string BEFORE creating URL object
    // This is critical because URL object may reorder parameters
    const queryStartIndex = requestUrl.indexOf('?');
    if (queryStartIndex === -1) {
      console.log('❌ No query string found');
      return false;
    }
    
    const rawQueryString = requestUrl.substring(queryStartIndex + 1);
    
    // Now create URL object just to extract signature
    const url = new URL(requestUrl);
    const signature = url.searchParams.get('signature') || url.searchParams.get('hmac');
    
    if (!signature) {
      console.log('❌ No signature/hmac found in request');
      return false;
    }

    // Parse parameters manually from the RAW query string
    const params: Array<{ key: string; value: string; raw: string }> = [];
    
    rawQueryString.split('&').forEach(pair => {
      const equalsIndex = pair.indexOf('=');
      if (equalsIndex === -1) {
        // Parameter without value (shouldn't happen with Shopify)
        return;
      }
      
      const key = pair.substring(0, equalsIndex);
      const value = pair.substring(equalsIndex + 1);
      
      // Exclude signature and hmac parameters
      if (key !== 'signature' && key !== 'hmac') {
        params.push({ key, value, raw: pair });
      }
    });

    // Sort parameters alphabetically by key
    params.sort((a, b) => a.key.localeCompare(b.key));

    // Rebuild the query string with sorted parameters
    const sortedQueryString = params.map(p => p.raw).join('&');

    // Calculate HMAC-SHA256
    const computedSignature = crypto
      .createHmac('sha256', sharedSecret)
      .update(sortedQueryString)
      .digest('hex');

    // DEBUG LOGGING
    console.log('🔍 Signature Verification Debug:', {
      fullUrl: requestUrl,
      path: url.pathname,
      paramCount: params.length,
      sortedParams: params.map(p => p.key),
      sortedQueryString: sortedQueryString,
      queryStringLength: sortedQueryString.length,
      secretLength: sharedSecret?.length,
      secretPrefix: sharedSecret?.substring(0, 8) + '...'
    });

    console.log('🔐 Signature Comparison:', {
      computedSignature: computedSignature.substring(0, 16) + '...' + computedSignature.substring(computedSignature.length - 16),
      receivedSignature: signature.substring(0, 16) + '...' + signature.substring(signature.length - 16),
      signatureLength: signature.length,
      computedLength: computedSignature.length,
      exactMatch: computedSignature === signature.toLowerCase()
    });

    // Validate format
    const signatureLower = signature.toLowerCase();
    if (!/^[0-9a-f]+$/.test(signatureLower) || signatureLower.length !== computedSignature.length) {
      console.log('❌ Signature format mismatch');
      return false;
    }

    // Constant-time comparison for security
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'), 
      Buffer.from(signatureLower, 'hex')
    );
    
    console.log(isValid ? '✅ Signature Valid' : '❌ Signature Invalid');
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying proxy signature:', error);
    return false;
  }
}