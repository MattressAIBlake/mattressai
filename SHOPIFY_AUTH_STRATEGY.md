# Shopify Authentication Strategy for MattressAI Widget

## Problem Statement

The widget makes requests through Shopify's App Proxy, but HMAC validation is failing because:
1. Widget requests originate from unauthenticated storefront visitors
2. Shopify's App Proxy HMAC is designed for authenticated admin-to-app requests
3. We need backend access to Shopify APIs for analytics, lead gen, etc.

## Solution Architecture

### 1. Widget Requests (Public/Unauthenticated)
- **Source**: Storefront visitors
- **Authentication**: Custom tenant-based validation (not HMAC)
- **Endpoints**: `/apps/mattressai/chat`, `/session/start`, `/event`, `/lead`
- **Strategy**: Validate by `tenantId` (shop domain) instead of HMAC

### 2. Admin Requests (Authenticated)
- **Source**: Shopify Admin embedded app
- **Authentication**: Session tokens + HMAC
- **Endpoints**: All `/app.*` routes
- **Strategy**: Full OAuth + HMAC validation

### 3. Backend Operations (Server-to-Shopify)
- **Source**: Our server calling Shopify APIs
- **Authentication**: OAuth access tokens stored per shop
- **APIs**: Admin API, Storefront API
- **Strategy**: Use stored access tokens from merchant installation

## Implementation Plan

### Phase 1: Fix Widget Authentication ✅ (Done)
- Remove HMAC validation requirement for widget endpoints
- Use tenant/shop domain validation instead
- Keep HMAC validation for admin routes

### Phase 2: Implement Proper Backend API Access
- Store OAuth access tokens during merchant installation
- Use these tokens for:
  - Product queries
  - Customer data
  - Analytics/events
  - Order tracking

### Phase 3: Secure Widget Endpoints
- Add rate limiting by shop domain
- Implement request signing with shop-specific secrets
- Add IP allowlisting (Shopify's IP ranges)

## Authentication Flow

```
Storefront Visitor
    ↓
    Opens Widget
    ↓
    Widget.js loads with tenantId (shop domain)
    ↓
    Makes POST /apps/mattressai/session/start
    ↓
    Goes through Shopify App Proxy
    ↓
    Our Server validates:
    - tenantId exists in database
    - Shop is active/installed
    - Rate limits not exceeded
    ↓
    Returns session
    ↓
    Widget functions normally
```

## Backend API Access Flow

```
Widget Request (e.g., "show me mattresses")
    ↓
    Our Server receives request with tenantId
    ↓
    Looks up shop's OAuth access token from DB
    ↓
    Uses token to call Shopify Admin API:
    - Query products
    - Track events
    - Create draft orders
    ↓
    Returns results to widget
```

## Why This Works

1. **Widget requests don't need HMAC** because:
   - They're public-facing by design
   - Validated by shop installation status
   - Rate-limited and monitored

2. **Backend operations use proper OAuth** because:
   - Tokens are obtained during app installation
   - Stored securely in database
   - Used for all Shopify API calls

3. **Admin requests keep HMAC** because:
   - These are sensitive configuration/admin operations
   - Need full authentication chain
   - Already have proper session context

## Security Considerations

1. **Widget Endpoints**: 
   - Public but validated by shop installation
   - Rate limited per shop
   - No sensitive data exposed without proper context

2. **OAuth Tokens**:
   - Stored encrypted in database
   - Scoped to necessary permissions
   - Refreshed as needed

3. **Admin Routes**:
   - Full HMAC validation
   - Session token verification
   - Shop ownership validation

## Next Steps

1. Verify OAuth tokens are being stored during installation
2. Update widget endpoints to use stored tokens for Shopify API calls
3. Add rate limiting and monitoring
4. Remove temporary HMAC bypass once proper auth is confirmed working

