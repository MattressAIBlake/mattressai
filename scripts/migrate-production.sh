#!/bin/bash
# Migrate production database and seed plans

echo "🗄️  Migrating production database..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable not set"
  echo ""
  echo "Please set it to your Supabase connection string:"
  echo "export DATABASE_URL='your-supabase-connection-string'"
  exit 1
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🔄 Pushing schema to database..."
npx prisma db push

echo ""
echo "🌱 Seeding billing plans..."
node scripts/seed-plans.mjs

echo ""
echo "✅ Production database migration complete!"
echo ""
echo "Next steps:"
echo "1. Verify in Vercel that DATABASE_URL is set"
echo "2. Redeploy your app"
echo "3. Test billing upgrades"

