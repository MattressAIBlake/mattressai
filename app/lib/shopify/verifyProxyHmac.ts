import crypto from 'crypto';

/**
 * Verifies App Proxy HMAC signature from Shopify
 * @param requestUrl - The full URL including query parameters
 * @param sharedSecret - Shopify app shared secret
 * @returns boolean - true if signature is valid
 */
export function verifyProxyHmac(requestUrl: string, sharedSecret: string): boolean {
  try {
    // Trim the secret to remove any whitespace/quotes that might have been added
    const trimmedSecret = sharedSecret.trim().replace(/^["']|["']$/g, '');
    
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
    const paramsExcludingEmpty: Array<{ key: string; value: string; raw: string }> = [];
    
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
        
        // Also track non-empty parameters
        if (value !== '') {
          paramsExcludingEmpty.push({ key, value, raw: pair });
        }
      }
    });

    // Test 1: Unsorted with all params (including empty)
    const unsortedQueryString = params.map(p => p.raw).join('&');
    const unsortedSignature = crypto
      .createHmac('sha256', trimmedSecret)
      .update(unsortedQueryString)
      .digest('hex');
    
    // Test 2: Sorted with all params (including empty)
    const sortedParams = [...params].sort((a, b) => a.key.localeCompare(b.key));
    const sortedQueryString = sortedParams.map(p => p.raw).join('&');
    const computedSignature = crypto
      .createHmac('sha256', trimmedSecret)
      .update(sortedQueryString)
      .digest('hex');
    
    // Test 3: Unsorted excluding empty params
    const unsortedNoEmptyQS = paramsExcludingEmpty.map(p => p.raw).join('&');
    const unsortedNoEmptySignature = crypto
      .createHmac('sha256', trimmedSecret)
      .update(unsortedNoEmptyQS)
      .digest('hex');
    
    // Test 4: Sorted excluding empty params
    const sortedNoEmpty = [...paramsExcludingEmpty].sort((a, b) => a.key.localeCompare(b.key));
    const sortedNoEmptyQS = sortedNoEmpty.map(p => p.raw).join('&');
    const sortedNoEmptySignature = crypto
      .createHmac('sha256', trimmedSecret)
      .update(sortedNoEmptyQS)
      .digest('hex');

    // DEBUG LOGGING
    console.log('🔍 Signature Verification Debug:', {
      fullUrl: requestUrl,
      path: url.pathname,
      totalParams: params.length,
      nonEmptyParams: paramsExcludingEmpty.length,
      sortedQueryString: sortedQueryString,
      unsortedQueryString: unsortedQueryString,
      sortedNoEmptyQS: sortedNoEmptyQS,
      unsortedNoEmptyQS: unsortedNoEmptyQS,
      secretLength: sharedSecret?.length,
      trimmedSecretLength: trimmedSecret?.length,
      secretHasQuotes: sharedSecret !== trimmedSecret
    });

    console.log('🔐 Signature Comparison (4 tests):', {
      test1_sortedWithEmpty: computedSignature.substring(0, 16) + '...',
      test2_unsortedWithEmpty: unsortedSignature.substring(0, 16) + '...',
      test3_sortedNoEmpty: sortedNoEmptySignature.substring(0, 16) + '...',
      test4_unsortedNoEmpty: unsortedNoEmptySignature.substring(0, 16) + '...',
      receivedSignature: signature.substring(0, 16) + '...',
      match1: computedSignature === signature.toLowerCase(),
      match2: unsortedSignature === signature.toLowerCase(),
      match3: sortedNoEmptySignature === signature.toLowerCase(),
      match4: unsortedNoEmptySignature === signature.toLowerCase()
    });

    // Validate format
    const signatureLower = signature.toLowerCase();
    if (!/^[0-9a-f]+$/.test(signatureLower) || signatureLower.length !== computedSignature.length) {
      console.log('❌ Signature format mismatch');
      return false;
    }

    // Try all 4 variations
    if (computedSignature === signatureLower) {
      console.log('✅ Signature Valid (sorted with empty params)');
      return true;
    }
    else if (unsortedSignature === signatureLower) {
      console.log('✅ Signature Valid (unsorted with empty params)');
      return true;
    }
    else if (sortedNoEmptySignature === signatureLower) {
      console.log('✅ Signature Valid (sorted excluding empty params)');
      return true;
    }
    else if (unsortedNoEmptySignature === signatureLower) {
      console.log('✅ Signature Valid (unsorted excluding empty params)');
      return true;
    }
    else {
      console.log('❌ Signature Invalid (tried all 4 variations)');
      console.log('💡 This means the SHOPIFY_API_SECRET is likely incorrect');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying proxy signature:', error);
    return false;
  }
}