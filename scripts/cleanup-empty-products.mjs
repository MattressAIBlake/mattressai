/**
 * Cleanup Script: Remove Empty "Untitled" Products
 * 
 * This script removes ProductProfile records with null or empty titles
 * that may have been created during failed indexing runs.
 * 
 * Run with: node scripts/cleanup-empty-products.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupEmptyProducts() {
  console.log('🧹 Starting cleanup of empty products...\n');

  try {
    // Find products with empty titles
    const emptyProducts = await prisma.productProfile.findMany({
      where: {
        OR: [
          { title: null },
          { title: '' },
          { title: { equals: '' } }
        ]
      },
      select: {
        id: true,
        title: true,
        tenant: true,
        shopifyProductId: true
      }
    });

    if (emptyProducts.length === 0) {
      console.log('✅ No empty products found. Database is clean!');
      return;
    }

    console.log(`📊 Found ${emptyProducts.length} empty product(s):\n`);
    emptyProducts.forEach((product, idx) => {
      console.log(`  ${idx + 1}. ID: ${product.id}`);
      console.log(`     Title: ${product.title || '(empty)'}`);
      console.log(`     Tenant: ${product.tenant}`);
      console.log(`     Shopify ID: ${product.shopifyProductId || 'N/A'}`);
      console.log('');
    });

    // Delete empty products
    const result = await prisma.productProfile.deleteMany({
      where: {
        OR: [
          { title: null },
          { title: '' },
          { title: { equals: '' } }
        ]
      }
    });

    console.log(`✅ Successfully deleted ${result.count} empty product(s)!`);
    console.log('\n🎉 Cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupEmptyProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

