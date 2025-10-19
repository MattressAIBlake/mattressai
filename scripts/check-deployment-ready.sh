#!/bin/bash
# Quick deployment readiness check

DEPLOYMENT_URL="${1:-https://mattressaishopify.vercel.app}"

echo "🔍 Checking deployment at: $DEPLOYMENT_URL"
echo ""

# Test health endpoint
echo "1️⃣  Checking health endpoint..."
HEALTH=$(curl -s "${DEPLOYMENT_URL}/health" | jq -r '.status' 2>/dev/null)
if [ "$HEALTH" = "ok" ]; then
  echo "✅ Health endpoint: OK"
else
  echo "❌ Health endpoint: FAILED"
  exit 1
fi

# Test sample asset
echo ""
echo "2️⃣  Testing asset file..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOYMENT_URL}/assets/Divider-CfiGoO6r.js")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Asset serving: Working (HTTP $HTTP_CODE)"
  echo ""
  echo "🎉 DEPLOYMENT IS READY!"
  echo ""
  echo "Next steps:"
  echo "1. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)"
  echo "2. Close and reopen Shopify admin app"
  echo "3. Or test in incognito/private window"
else
  echo "⚠️  Asset serving: Not ready yet (HTTP $HTTP_CODE)"
  echo ""
  echo "Wait 30-60 seconds and run this script again:"
  echo "./scripts/check-deployment-ready.sh"
  exit 1
fi

