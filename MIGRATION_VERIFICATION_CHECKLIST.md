# ✅ Migration Verification Checklist

## Pre-Deployment Verification

Before running the migration, verify:

- [ ] You have the correct production `DATABASE_URL`
- [ ] The URL is for PostgreSQL/Supabase (not SQLite)
- [ ] You have database admin/owner permissions
- [ ] You've backed up your database (if it contains data)
- [ ] You're in the project root directory
- [ ] Node.js and npm are installed

## Run Migration

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

Expected output:
```
✓ Applying migration `20251024020000_postgresql_baseline_migration`
All migrations have been successfully applied.
```

## Post-Deployment Verification

### Step 1: Verify Database Schema

```bash
npx prisma db pull
```

**Expected Result**: "Schema synced" with no changes needed

### Step 2: Check Migration History

```bash
npx prisma migrate status
```

**Expected Result**: Should show the new migration as applied

### Step 3: Verify Critical Table Exists

Connect to your database and run:

```sql
SELECT COUNT(*) FROM "Session";
```

**Expected Result**: Returns 0 (table exists but empty) or a count of existing sessions

### Step 4: Verify All Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Tables** (should see all 18):
- Alert
- AlertSettings
- ChatSession
- CodeVerifier
- Conversation
- CustomerAccountUrl
- CustomerToken
- Event
- Experiment
- IndexJob
- Lead
- Message
- Plan
- ProductProfile
- PromptVersion
- Session ⭐ (CRITICAL!)
- Tenant
- Variant

### Step 5: Test Application

1. **Visit your production URL**
   - [ ] App loads without errors
   - [ ] No "MissingSessionTableError" in logs

2. **Check Vercel Logs**
   ```bash
   vercel logs --follow
   ```
   - [ ] No database errors
   - [ ] Authentication attempts work

3. **Test Shopify Integration**
   - [ ] Visit: `https://your-app.vercel.app/auth?shop=your-store.myshopify.com`
   - [ ] Should redirect to Shopify OAuth
   - [ ] Should successfully authenticate

4. **Access Admin Dashboard**
   - [ ] Dashboard loads
   - [ ] Can view catalog
   - [ ] Can start indexing (if needed)

### Step 6: Verify Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'Session';
```

**Expected Result**: Should show indexes on Session table

### Step 7: Verify Foreign Keys

```sql
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

**Expected Result**: Should show all foreign key relationships

## Success Indicators

### ✅ Everything is Working When:

1. **No errors in deployment**
   - Migration completed successfully
   - No PostgreSQL syntax errors
   - All tables created

2. **Schema is synced**
   - `prisma db pull` shows no changes
   - Schema matches `prisma/schema.prisma`

3. **App is functional**
   - No session table errors
   - Authentication works
   - Dashboard is accessible
   - Chat widget loads

4. **Database is healthy**
   - All 18 tables exist
   - All indexes created
   - All foreign keys in place
   - No constraint violations

## Troubleshooting Quick Reference

| Symptom | Check | Fix |
|---------|-------|-----|
| Still getting session error | Is migration applied? | Run `npx prisma migrate deploy` again |
| Tables don't exist | Wrong DATABASE_URL? | Verify you're using production URL |
| Permission denied | Database user rights? | Use admin credentials |
| SSL error | Connection security? | Add `?sslmode=require` to URL |
| Auth still fails | Stale sessions? | Reinstall app in Shopify admin |

## Rollback Checklist (Emergency Only)

If you need to rollback:

- [ ] Take a backup first: `pg_dump $DATABASE_URL > backup.sql`
- [ ] Document what went wrong
- [ ] Decide if you need to drop tables or just fix forward
- [ ] If dropping, ensure no production data is lost
- [ ] Use `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` (⚠️ DELETES EVERYTHING)
- [ ] Re-run migrations after fix

## Final Verification Script

Run this to get a complete status:

```bash
# Check migration status
echo "=== Migration Status ==="
npx prisma migrate status

# Verify schema sync
echo -e "\n=== Schema Sync ==="
npx prisma db pull

# List all tables
echo -e "\n=== Tables in Database ==="
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Check Session table specifically
echo -e "\n=== Session Table Verification ==="
psql $DATABASE_URL -c "SELECT COUNT(*) as session_count FROM \"Session\";"

echo -e "\n✅ Verification complete!"
```

## Sign-Off

Once all checks pass:

- [ ] Migration deployed successfully
- [ ] All tables exist in production
- [ ] App loads without errors
- [ ] Authentication works
- [ ] Tested end-to-end workflow
- [ ] Logged success in deployment notes
- [ ] Monitoring shows no errors

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Production Database**: _______________  
**Status**: ⬜ Success  ⬜ Partial  ⬜ Rollback Required  

---

**Next Steps After Success**:
1. Monitor production logs for 24 hours
2. Test all critical features
3. Verify chat widget on storefront
4. Check product indexing works
5. Confirm lead capture functions
6. Review analytics data flow

