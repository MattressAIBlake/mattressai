#!/usr/bin/env node

/**
 * Script to add imageUrl column to ProductProfile table
 * Run this once after deployment to fix the missing column error
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addImageUrlColumn() {
  console.log('🔧 Adding imageUrl column to ProductProfile table...\n');

  try {
    // Check if column already exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ProductProfile' 
      AND column_name = 'imageUrl'
    `;

    if (result.length > 0) {
      console.log('✅ Column imageUrl already exists! No action needed.');
      return;
    }

    // Add the column
    console.log('📝 Adding imageUrl column...');
    await prisma.$executeRaw`
      ALTER TABLE "ProductProfile" 
      ADD COLUMN "imageUrl" TEXT
    `;

    console.log('✅ Successfully added imageUrl column!');
    console.log('\n💡 Next steps:');
    console.log('   1. Go to Admin → Catalog Indexing');
    console.log('   2. Click "Re-Index Catalog"');
    console.log('   3. Product images will be fetched and stored');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P2010') {
      console.log('\n💡 The migration might already be applied. Try refreshing your app.');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addImageUrlColumn()
  .then(() => {
    console.log('\n🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

