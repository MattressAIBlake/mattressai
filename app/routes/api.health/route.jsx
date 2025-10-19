import { json } from "@remix-run/node";
import fs from "fs";
import path from "path";

export const loader = async () => {
  try {
    // Read build manifest to get current asset hashes
    const manifestPath = path.join(process.cwd(), "build/server/.vite/manifest.json");
    let buildInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      deploymentUrl: process.env.VERCEL_URL,
      manifestExists: false,
      sampleAssets: []
    };

    // Try to read manifest if it exists
    if (fs.existsSync(manifestPath)) {
      buildInfo.manifestExists = true;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      
      // Get sample asset filenames
      const assetFiles = Object.values(manifest)
        .filter(entry => entry.file && entry.file.includes("assets/"))
        .slice(0, 5)
        .map(entry => entry.file);
      
      buildInfo.sampleAssets = assetFiles;
    }

    return json({
      status: "ok",
      build: buildInfo,
      server: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime()
      }
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    return json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

