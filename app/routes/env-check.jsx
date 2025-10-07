// Simple environment check that doesn't import shopify.server
export const loader = async () => {
  return new Response(JSON.stringify({
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "MISSING",
    HOST: process.env.HOST || "MISSING",
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "SET" : "MISSING",
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    SCOPES: process.env.SCOPES || "MISSING",
    NODE_ENV: process.env.NODE_ENV,
  }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    }
  });
};

