// Simple env check endpoint
export function loader() {
  const envVars = {
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "❌ MISSING",
    HOST: process.env.HOST || "❌ MISSING",
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "✅ SET" : "❌ MISSING",
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return new Response(JSON.stringify(envVars, null, 2), {
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}
