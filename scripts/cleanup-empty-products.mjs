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
  console.log('🧹 Starting cleanup of empty/invalid products...\n');

  try {
    // Find products with empty titles OR empty shopifyProductId
    // These are the "Untitled" products created by the enrichment cache bug
    const emptyProducts = await prisma.productProfile.findMany({
      where: {
        OR: [
          { title: null },
          { title: '' },
          { shopifyProductId: null },
          { shopifyProductId: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        tenant: true,
        shopifyProductId: true,
        contentHash: true
      }
    });

    if (emptyProducts.length === 0) {
      console.log('✅ No empty/invalid products found. Database is clean!');
      return;
    }

    console.log(`📊 Found ${emptyProducts.length} invalid product(s):\n`);
    emptyProducts.forEach((product, idx) => {
      console.log(`  ${idx + 1}. ID: ${product.id}`);
      console.log(`     Title: ${product.title || '(empty)'}`);
      console.log(`     Tenant: ${product.tenant}`);
      console.log(`     Shopify ID: ${product.shopifyProductId || '(empty)'}`);
      console.log(`     ContentHash: ${product.contentHash.substring(0, 16)}...`);
      console.log('');
    });

    // Delete invalid products
    const result = await prisma.productProfile.deleteMany({
      where: {
        OR: [
          { title: null },
          { title: '' },
          { shopifyProductId: null },
          { shopifyProductId: '' }
        ]
      }
    });

    console.log(`✅ Successfully deleted ${result.count} invalid product(s)!`);
    console.log('\n🎉 Cleanup complete!');
    console.log('\n💡 Tip: The enrichment cache has been disabled to prevent these from being created again.');

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

