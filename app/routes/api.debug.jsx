// Simple diagnostic endpoint
export function loader() {
  const envDebug = {
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "MISSING",
    HOST: process.env.HOST || "MISSING",
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "SET" : "MISSING",
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? 
      `${process.env.DATABASE_URL.substring(0, 50)}...` : "MISSING",
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ? 
      `${process.env.DIRECT_DATABASE_URL.substring(0, 50)}...` : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL || "MISSING",
  };

  // Also compute what shopify.server.js would compute
  const computedAppUrl = process.env.SHOPIFY_APP_URL || 
    (process.env.HOST ? `https://${process.env.HOST}` : "") ||
    "https://placeholder.com";

  return new Response(
    JSON.stringify({
      envDebug,
      computedAppUrl,
      timestamp: new Date().toISOString(),
    }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

