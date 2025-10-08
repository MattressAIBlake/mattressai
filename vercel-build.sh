#!/bin/bash
# Vercel build script for Remix

echo "🔨 Starting Vercel build..."

# Generate Prisma client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push database schema (creates tables if they don't exist)
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss || echo "⚠️  Database push skipped (may not be configured yet)"

# Build Remix app
echo "🎨 Building Remix app..."
npx remix vite:build

echo "✅ Build complete!"

