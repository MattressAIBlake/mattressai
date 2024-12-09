# MattressAI API Documentation

## Authentication

All API endpoints require authentication using Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

Error responses follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Rate Limiting

- 1000 requests per minute per IP
- 10000 requests per day per user

## Endpoints

### Sessions

#### GET /api/v1/sessions
Get a list of sessions with pagination and filtering.

Query Parameters:
- page (optional): Page number (default: 1)
- limit (optional): Items per page (default: 20)
- search (optional): Search term
- verified (optional): Filter by verification status
- startDate (optional): Filter by start date
- endDate (optional): Filter by end date

Response:
```json
{
  "data": [
    {
      "id": "string",
      "date": "string",
      "customerName": "string",
      "contactNumber": "string",
      "assistant": "lite" | "plus",
      "verified": boolean,
      "time": "string"
    }
  ],
  "meta": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

### Brands

#### GET /api/v1/brands
Get all available brands.

Response:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "enabled": boolean
    }
  ]
}
```

### Settings

#### GET /api/v1/settings/assistant
Get assistant configuration.

Response:
```json
{
  "data": {
    "name": "string",
    "companyDescription": "string",
    "persona": "string",
    "greeting": "string"
  }
}
```

## Webhooks

### Session Completed Webhook
Triggered when a chat session is completed.

Payload:
```json
{
  "event": "session.completed",
  "data": {
    "sessionId": "string",
    "customerName": "string",
    "contactNumber": "string",
    "assistant": "lite" | "plus",
    "timestamp": "string"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { MattressAIClient } from '@mattressai/sdk';

const client = new MattressAIClient({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Get sessions
const sessions = await client.sessions.list({
  page: 1,
  limit: 20
});

// Update brand
const updatedBrand = await client.brands.update('brand_id', {
  enabled: true
});
```

## Rate Limits & Quotas

| Plan      | Rate Limit       | Daily Quota |
|-----------|------------------|-------------|
| Standard  | 1000 req/min    | 10000       |
| Premium   | 2000 req/min    | 50000       |
| Unlimited | 5000 req/min    | Unlimited   |