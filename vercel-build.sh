#!/bin/bash
# Vercel build script for Remix

echo "🔨 Starting Vercel build..."

# Generate Prisma client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Skip db push in build - use migrations instead
# Database schema is managed separately

# Build Remix app
echo "🎨 Building Remix app..."
npx remix vite:build

echo "✅ Build complete!"

