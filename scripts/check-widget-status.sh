#!/bin/bash
# Widget Status Checker
# Verifies that all widget components are properly configured

echo "🔍 MattressAI Widget Status Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check extension files exist
echo "📁 Checking Extension Files..."
if [ -f "extensions/mattressai-widget/shopify.extension.toml" ]; then
    echo -e "${GREEN}✓${NC} Extension config exists"
else
    echo -e "${RED}✗${NC} Extension config missing"
fi

if [ -f "extensions/mattressai-widget/blocks/app-embed.liquid" ]; then
    echo -e "${GREEN}✓${NC} App embed block exists"
else
    echo -e "${RED}✗${NC} App embed block missing"
fi

if [ -f "extensions/mattressai-widget/assets/tracking.js" ]; then
    echo -e "${GREEN}✓${NC} Tracking script exists"
else
    echo -e "${RED}✗${NC} Tracking script missing"
fi

if [ -f "extensions/mattressai-widget/assets/widget.css" ]; then
    echo -e "${GREEN}✓${NC} Widget CSS exists"
else
    echo -e "${RED}✗${NC} Widget CSS missing"
fi

echo ""
echo "🔧 Checking App Proxy Configuration..."
if grep -q "app_proxy" shopify.app.toml; then
    echo -e "${GREEN}✓${NC} App proxy configured in shopify.app.toml"
    echo "   Proxy URL: $(grep 'url =' shopify.app.toml | cut -d'"' -f2)"
    echo "   Proxy Path: /apps/$(grep 'subpath =' shopify.app.toml | cut -d'"' -f2)"
else
    echo -e "${RED}✗${NC} App proxy not configured"
fi

echo ""
echo "📡 Checking Widget Routes..."
if [ -f "app/routes/apps.mattressai.widget[.]js/route.jsx" ]; then
    echo -e "${GREEN}✓${NC} Widget.js route exists"
else
    echo -e "${RED}✗${NC} Widget.js route missing"
fi

if [ -f "app/routes/apps.mattressai.session.start/route.jsx" ]; then
    echo -e "${GREEN}✓${NC} Session start route exists"
else
    echo -e "${RED}✗${NC} Session start route missing"
fi

if [ -f "app/routes/apps.mattressai.chat/route.jsx" ]; then
    echo -e "${GREEN}✓${NC} Chat route exists"
else
    echo -e "${RED}✗${NC} Chat route missing"
fi

if [ -f "app/routes/apps.mattressai.lead/route.jsx" ]; then
    echo -e "${GREEN}✓${NC} Lead capture route exists"
else
    echo -e "${RED}✗${NC} Lead capture route missing"
fi

echo ""
echo "🎨 Checking Extension Type..."
if grep -q 'type = "theme"' extensions/mattressai-widget/shopify.extension.toml; then
    echo -e "${GREEN}✓${NC} Extension type is 'theme' (correct for app embeds)"
else
    echo -e "${RED}✗${NC} Extension type is not 'theme'"
fi

echo ""
echo "=================================="
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Deploy the extension (if not already deployed):"
echo "   ${GREEN}npm run deploy${NC}"
echo ""
echo "2. Enable the app embed in your Shopify theme:"
echo "   a. Go to: Online Store → Themes → Customize"
echo "   b. Scroll to 'App embeds' section in sidebar"
echo "   c. Find 'MattressAI Widget'"
echo "   d. Toggle it ON"
echo "   e. Click Save"
echo ""
echo "3. Test on your store:"
echo "   - Visit your store URL"
echo "   - Look for chat bubble in bottom-right corner"
echo "   - Open browser console (F12) to check for errors"
echo ""
echo "📖 See WIDGET_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""

