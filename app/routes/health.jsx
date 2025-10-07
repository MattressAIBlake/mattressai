import { json } from "@remix-run/node";

export const loader = async () => {
  return json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "❌ MISSING",
      HOST: process.env.HOST || "❌ MISSING",
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "✅ SET" : "❌ MISSING",
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "✅ SET" : "❌ MISSING",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING",
      SCOPES: process.env.SCOPES || "❌ MISSING",
      NODE_ENV: process.env.NODE_ENV,
    }
  }, {
    headers: {
      "Cache-Control": "no-store",
    }
  });
};

