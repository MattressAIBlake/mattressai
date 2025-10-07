import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Construct app URL from environment variables
const appUrl = process.env.SHOPIFY_APP_URL || 
  (process.env.HOST ? `https://${process.env.HOST}` : "") ||
  "https://placeholder.com"; // Fallback to prevent crash

// Log environment variables for debugging
console.log('🔧 SHOPIFY CONFIG:', {
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || '❌ MISSING',
  HOST: process.env.HOST || '❌ MISSING',
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '❌ MISSING',
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? '✅ SET' : '❌ MISSING',
  SCOPES: process.env.SCOPES || '❌ MISSING',
  NODE_ENV: process.env.NODE_ENV,
  appUrl: appUrl,
});

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.Unstable,
  scopes: process.env.SCOPES?.split(","),
  appUrl: appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

// Wrapper to allow iframe embedding in Shopify admin
const addDocumentResponseHeadersWrapper = (request, headers) => {
  shopify.addDocumentResponseHeaders(request, headers);
  // Remove X-Frame-Options to allow embedding
  headers.delete("X-Frame-Options");
  // Set proper CSP for Shopify admin
  headers.set("Content-Security-Policy", "frame-ancestors https://*.myshopify.com https://admin.shopify.com;");
  return headers;
};

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = addDocumentResponseHeadersWrapper;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
