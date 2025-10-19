#!/bin/bash
# Deployment Verification Script
# Tests that the deployment is serving fresh assets correctly

set -e

DEPLOYMENT_URL="${1:-https://mattressaishopify.vercel.app}"

echo "🔍 Verifying deployment at: $DEPLOYMENT_URL"
echo "================================================"
echo ""

# Test 1: Health endpoint
echo "✓ Test 1: Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s "${DEPLOYMENT_URL}/health")
echo "$HEALTH_RESPONSE" | jq '.' || echo "$HEALTH_RESPONSE"
echo ""

# Test 2: Check if sample assets from manifest are accessible
echo "✓ Test 2: Extracting asset list from health endpoint..."
SAMPLE_ASSETS=$(echo "$HEALTH_RESPONSE" | jq -r '.build.sampleAssets[]?' 2>/dev/null || echo "")

if [ -z "$SAMPLE_ASSETS" ]; then
  echo "⚠️  Warning: Could not extract sample assets from health endpoint"
  echo ""
else
  echo "Sample assets found:"
  echo "$SAMPLE_ASSETS"
  echo ""
  
  # Test 3: Try to access one of the assets
  echo "✓ Test 3: Verifying asset accessibility..."
  FIRST_ASSET=$(echo "$SAMPLE_ASSETS" | head -1)
  if [ ! -z "$FIRST_ASSET" ]; then
    ASSET_URL="${DEPLOYMENT_URL}/${FIRST_ASSET}"
    echo "Testing: $ASSET_URL"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ASSET_URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
      echo "✅ SUCCESS: Asset is accessible (HTTP $HTTP_CODE)"
    else
      echo "❌ FAILED: Asset returned HTTP $HTTP_CODE"
      echo "This indicates assets are not being served correctly!"
      exit 1
    fi
  fi
fi

echo ""
echo "✓ Test 4: Checking cache headers..."
CACHE_HEADERS=$(curl -I -s "${DEPLOYMENT_URL}/assets/styles-BeiPL2RV.css" 2>&1 | grep -i "cache-control" || echo "No cache-control header found")
echo "$CACHE_HEADERS"

echo ""
echo "✓ Test 5: Checking Shopify-specific headers..."
SHOPIFY_HEADERS=$(curl -I -s "${DEPLOYMENT_URL}/" 2>&1 | grep -E "(x-frame-options|content-security-policy)" -i || echo "No Shopify headers found")
echo "$SHOPIFY_HEADERS"

echo ""
echo "================================================"
echo "✅ Deployment verification complete!"
echo ""
echo "📝 Next steps:"
echo "1. Clear browser cache (Cmd+Shift+R)"
echo "2. Clear Shopify admin cache (close and reopen app)"
echo "3. Test in incognito/private window"

