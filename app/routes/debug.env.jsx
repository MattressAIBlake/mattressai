import { json } from "@remix-run/node";

export const loader = async () => {
  // Debug endpoint to check environment variables
  return json({
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "✅ SET" : "❌ MISSING",
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "✅ SET" : "❌ MISSING",
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "❌ MISSING",
    HOST: process.env.HOST || "❌ MISSING",
    SCOPES: process.env.SCOPES || "❌ MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING",
    NODE_ENV: process.env.NODE_ENV,
  });
};

