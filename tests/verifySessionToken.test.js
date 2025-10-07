import { verifyAdminBearer } from '../app/lib/shopify/verifySessionToken.js';
import jwt from 'jsonwebtoken';

// Mock JWT secret key for testing
const MOCK_APP_KEY = 'test-secret-key';
const MOCK_SHOP = 'test-shop.myshopify.com';

// Mock JWT payload
const createMockToken = (overrides = {}) => {
  const payload = {
    iss: `https://${MOCK_SHOP}/admin`,
    dest: `https://${MOCK_SHOP}`,
    aud: 'test-audience',
    sub: 'test-subject',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    ...overrides
  };

  return jwt.sign(payload, MOCK_APP_KEY, { algorithm: 'HS256' });
};

describe('verifyAdminBearer', () => {
  test('accepts valid bearer token', () => {
    const token = createMockToken();
    const authHeader = `Bearer ${token}`;

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(true);
    expect(result.decoded).toBeDefined();
    expect(result.decoded.iss).toBe(`https://${MOCK_SHOP}/admin`);
  });

  test('rejects missing authorization header', () => {
    const result = verifyAdminBearer(undefined, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no bearer');
  });

  test('rejects malformed authorization header', () => {
    const authHeader = 'InvalidHeader';

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no bearer');
  });

  test('rejects token without Bearer prefix', () => {
    const token = createMockToken();
    const authHeader = token; // Missing "Bearer " prefix

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no bearer');
  });

  test('rejects token with wrong shop domain', () => {
    const token = createMockToken({
      iss: 'https://wrong-shop.myshopify.com/admin'
    });
    const authHeader = `Bearer ${token}`;

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('shop mismatch');
  });

  test('rejects invalid JWT signature', () => {
    // Create token with wrong secret
    const payload = {
      iss: `https://${MOCK_SHOP}/admin`,
      dest: `https://${MOCK_SHOP}`,
      aud: 'test-audience',
      sub: 'test-subject',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    };
    const token = jwt.sign(payload, 'wrong-secret', { algorithm: 'HS256' });
    const authHeader = `Bearer ${token}`;

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid token');
  });

  test('rejects expired token', () => {
    const token = createMockToken({
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
    });
    const authHeader = `Bearer ${token}`;

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid token');
  });

  test('accepts token with different valid shop domain', () => {
    const differentShop = 'different-shop.myshopify.com';
    const token = createMockToken({
      iss: `https://${differentShop}/admin`
    });
    const authHeader = `Bearer ${token}`;

    const result = verifyAdminBearer(authHeader, differentShop, MOCK_APP_KEY);

    expect(result.ok).toBe(true);
    expect(result.decoded.iss).toBe(`https://${differentShop}/admin`);
  });

  test('handles token with missing optional fields', () => {
    const token = createMockToken({
      nbf: undefined // Remove optional nbf field
    });
    const authHeader = `Bearer ${token}`;

    const result = verifyAdminBearer(authHeader, MOCK_SHOP, MOCK_APP_KEY);

    expect(result.ok).toBe(true);
  });
});
