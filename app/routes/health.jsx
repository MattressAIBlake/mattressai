import { json } from "@remix-run/node";
import fs from "fs";
import path from "path";

export const loader = async () => {
  // Try to read build info
  let buildInfo = {
    timestamp: new Date().toISOString(),
    buildExists: false,
    sampleAssets: []
  };

  try {
    const clientAssetsPath = path.join(process.cwd(), "build/client/assets");
    if (fs.existsSync(clientAssetsPath)) {
      buildInfo.buildExists = true;
      const files = fs.readdirSync(clientAssetsPath);
      // Get sample asset filenames
      buildInfo.sampleAssets = files
        .filter(f => f.includes("Divider") || f.includes("root-") || f.includes("app-"))
        .slice(0, 5);
    }
  } catch (error) {
    buildInfo.error = error.message;
  }

  return json({
    status: "ok",
    timestamp: new Date().toISOString(),
    build: buildInfo,
    env: {
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "❌ MISSING",
      HOST: process.env.HOST || "❌ MISSING",
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "✅ SET" : "❌ MISSING",
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "✅ SET" : "❌ MISSING",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING",
      SCOPES: process.env.SCOPES || "❌ MISSING",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || "not-vercel",
      VERCEL_URL: process.env.VERCEL_URL || "n/a",
    }
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
};

