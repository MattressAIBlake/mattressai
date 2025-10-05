# Build an AI Agent for Your Storefront

A Shopify template app that lets you embed an AI-powered chat widget on your storefront. Shoppers can search for products, ask about policies or shipping, and complete purchases - all without leaving the conversation. Under the hood it speaks the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) to tap into Shopify’s APIs.

### Overview
- **What it is**: A chat widget + backend that turns any storefront into an AI shopping assistant.
- **Key features**:
  - Natural-language product discovery
  - Store policy & FAQ lookup
  - Create carts, add or remove items, and initiate checkout
  - Track orders and initiate returns

## Developer Docs
- Everything from installation to deep dives lives on https://shopify.dev/docs/apps/build/storefront-mcp.
- Clone this repo and follow the instructions on the dev docs.

## Examples
- `hi` > will return a LLM based response. Note that you can customize the LLM call with your own prompt.
- `can you search for snowboards` > will use the `search_shop_catalog` MCP tool.
- `add The Videographer Snowboard to my cart` > will use the `update_cart` MCP tool and offer a checkout URL.
- `update my cart to make that 2 items please` > will use the `update_cart` MCP tool.
- `can you tell me what is in my cart` > will use the `get_cart` MCP tool.
- `what languages is your store available in?` > will use the `search_shop_policies_and_faqs` MCP tool.
- `I'd like to checkout` > will call checkout from one of the above MCP cart tools.
- `Show me my recent orders` > will use the `get_most_recent_order_status` MCP tool.
- `Can you give me more details about order Id 1` > will use the `get_order_status` MCP tool.

## Architecture

### Components
This app consists of two main components:

1. **Backend**: A Remix app server that handles communication with Claude, processes chat messages, and acts as an MCP Client.
2. **Chat UI**: A Shopify theme extension that provides the customer-facing chat interface.

When you start the app, it will:
- Start Remix in development mode.
- Tunnel your local server so Shopify can reach it.
- Provide a preview URL to install the app on your development store.

For direct testing, point your test suite at the `/chat` endpoint (GET or POST for streaming).

### MCP Tools Integration
- The backend already initializes all Shopify MCP tools—see [`app/mcp-client.js`](./app/mcp-client.js).
- These tools let your LLM invoke product search, cart actions, order lookups, etc.
- More in our [dev docs](https://shopify.dev/docs/apps/build/storefront-mcp).

### Tech Stack
- **Framework**: [Remix](https://remix.run/)
- **AI**: [Claude by Anthropic](https://www.anthropic.com/claude)
- **Shopify Integration**: [@shopify/shopify-app-remix](https://www.npmjs.com/package/@shopify/shopify-app-remix)
- **Database**: SQLite (via Prisma) for session storage

## Customizations
This repo can be customized. You can:
- Edit the prompt
- Change the chat widget UI
- Swap out the LLM

You can learn how from our [dev docs](https://shopify.dev/docs/apps/build/storefront-mcp).

## Deployment
Follow standard Shopify app deployment procedures as outlined in the [Shopify documentation](https://shopify.dev/docs/apps/deployment/web).

## Phase 1: Store-Ready Skeleton

This branch includes Shopify App Store compliance features for production readiness:

### ✅ GDPR Compliance
- **Webhook Handlers**: `customers/data_request`, `customers/redact`, `shop/redact`
- **HMAC Verification**: All webhooks verify Shopify signatures
- **Data Handling**: Placeholder implementations with TODO comments for actual data export/deletion
- **Logging**: Redacted PII logging for compliance tracking

### ✅ App Proxy Integration
- **Widget Script**: `GET /apps/mattressai/widget.js` - Returns boot script for storefront
- **Session Management**:
  - `POST /apps/mattressai/session/start` - Initialize user sessions
  - `POST /apps/mattressai/session/close` - Clean up sessions
- **Chat Interface**: `POST /apps/mattressai/chat` - Process chat messages
- **Lead Capture**: `POST /apps/mattressai/lead` - Handle lead generation
- **HMAC Verification**: All App Proxy endpoints verify Shopify signatures

### ✅ Theme App Extension
- **Extension Name**: `mattressai-widget`
- **Block Type**: App Embed for body injection
- **Configuration**: Settings for auto-open behavior
- **Assets**: `widget.css` for future styling

### ✅ Admin JWT Verification
- **Middleware Helper**: `verifyAdminBearer()` for /admin/* API routes
- **Token Validation**: Verifies issuer, audience, expiration, and shop matching

### 🚀 Post-Install Setup
- **Onboarding Page**: `/admin/onboarding` - Guides merchants through activation
- **Deep Link Integration**: Direct link to Theme Editor for App Embed activation

## Setup Instructions

### 1. Environment Variables
Ensure your `.env` file includes:
```bash
SHOPIFY_APP_SECRET=your_app_secret
SHOPIFY_APP_KEY=your_app_key
```

### 2. Deploy Extensions
```bash
npm run deploy
```

### 3. Install & Configure
1. Install the app on your development store
2. Visit `/admin/onboarding` to activate the App Embed
3. Use the "Activate Storefront App Embed" button to open Theme Editor
4. Add the "MattressAI App Embed" block to your theme

### 4. Test Endpoints
```bash
# Test App Proxy endpoints (replace YOUR_STORE_DOMAIN)
curl -X POST "https://YOUR_STORE_DOMAIN/apps/mattressai/session/start" \
  -H "Content-Type: application/json" \
  -d '{"page": {"href": "https://yourstore.com", "path": "/", "title": "Home"}}'

# Test GDPR webhooks (requires valid Shopify webhook signature)
curl -X POST "https://your-app-domain/webhooks/customers/data_request" \
  -H "X-Shopify-Hmac-Sha256: <signature>" \
  -H "Content-Type: application/json" \
  -d '{"shop_id": 123, "customer": {"id": 456}}'
```

## Development Notes

### App Proxy Verification
All App Proxy routes use `verifyProxyHmac()` to validate requests. The helper:
- Extracts signature from query parameters
- Removes signature params and sorts remaining parameters
- Creates HMAC using app secret and compares with Shopify's signature

### GDPR Implementation Status
- ✅ Webhook handlers created and HMAC verified
- ✅ Logging implemented (redacted PII)
- ⏳ TODO: Implement actual data export/deletion logic
- ⏳ TODO: Integrate with database queries for customer data

### Theme Extension Development
The `mattressai-widget` extension includes:
- `shopify.extension.toml` - Extension configuration
- `blocks/app-embed.liquid` - App Embed block with schema
- `assets/widget.css` - Stylesheet for future customization
- `locales/en.default.json` - Translation strings

### Security Considerations
- All sensitive operations verify Shopify signatures
- Admin routes require valid JWT tokens
- PII is logged in redacted format only
- Session tokens are validated against expected shop domain

## Contributing
We appreciate your interest in contributing to this project. As this is an example repository intended for educational and reference purposes, we are not accepting contributions.
