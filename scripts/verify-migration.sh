#!/bin/bash

# Migration Verification Script
# Quickly verify that the PostgreSQL migration was successful

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 Migration Verification Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set it first:"
    echo "  export DATABASE_URL='your-production-database-url'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"
echo ""

# Step 1: Check Prisma Migration Status
echo -e "${BLUE}Step 1: Checking Migration Status...${NC}"
if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓${NC} All migrations have been applied"
else
    echo -e "${YELLOW}⚠${NC}  Migration status check returned warnings"
    echo "Run: npx prisma migrate deploy"
fi
echo ""

# Step 2: Verify Schema Sync
echo -e "${BLUE}Step 2: Verifying Schema Sync...${NC}"
if npx prisma db pull 2>&1 | grep -q "Your database is now in sync with your Prisma schema"; then
    echo -e "${GREEN}✓${NC} Schema is in sync"
else
    echo -e "${YELLOW}⚠${NC}  Schema may need attention"
fi
echo ""

# Step 3: Check if Session table exists
echo -e "${BLUE}Step 3: Checking Session Table...${NC}"
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Session\";" > /dev/null 2>&1; then
    SESSION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Session\";")
    echo -e "${GREEN}✓${NC} Session table exists (${SESSION_COUNT} rows)"
else
    echo -e "${RED}❌ Session table does not exist!${NC}"
    echo "   Run: DATABASE_URL='your-url' npx prisma migrate deploy"
    exit 1
fi
echo ""

# Step 4: Count all tables
echo -e "${BLUE}Step 4: Counting Tables...${NC}"
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo -e "${GREEN}✓${NC} Found ${TABLE_COUNT} tables (expected: 18+)"

if [ "$TABLE_COUNT" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} All expected tables present"
else
    echo -e "${YELLOW}⚠${NC}  Expected 18 tables, found ${TABLE_COUNT}"
fi
echo ""

# Step 5: List all tables
echo -e "${BLUE}Step 5: Listing All Tables...${NC}"
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null
echo ""

# Step 6: Verify critical tables
echo -e "${BLUE}Step 6: Verifying Critical Tables...${NC}"
CRITICAL_TABLES=("Session" "Tenant" "ProductProfile" "IndexJob" "ChatSession")

for table in "${CRITICAL_TABLES[@]}"; do
    if psql "$DATABASE_URL" -c "SELECT 1 FROM \"$table\" LIMIT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $table exists"
    else
        echo -e "${RED}❌ $table does not exist!${NC}"
    fi
done
echo ""

# Step 7: Check indexes on Session table
echo -e "${BLUE}Step 7: Checking Indexes...${NC}"
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('Session', 'Tenant', 'ProductProfile');")
echo -e "${GREEN}✓${NC} Found ${INDEX_COUNT} indexes on critical tables"
echo ""

# Step 8: Verify foreign keys
echo -e "${BLUE}Step 8: Checking Foreign Keys...${NC}"
FK_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';")
echo -e "${GREEN}✓${NC} Found ${FK_COUNT} foreign key constraints"
echo ""

# Final Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$TABLE_COUNT" -ge 18 ]; then
    echo -e "${GREEN}✅ Migration appears successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy your app: vercel --prod"
    echo "  2. Test authentication with Shopify"
    echo "  3. Verify app loads without errors"
    echo "  4. Check logs: vercel logs --follow"
    echo ""
else
    echo -e "${YELLOW}⚠️  Migration may be incomplete${NC}"
    echo ""
    echo "Recommended actions:"
    echo "  1. Run: npx prisma migrate deploy"
    echo "  2. Check for error messages above"
    echo "  3. Verify DATABASE_URL is correct"
    echo "  4. Check database permissions"
    echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo ""

