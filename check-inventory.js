import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInventory() {
  try {
    const tenant = 'qa-store-mai.myshopify.com';
    
    console.log('🔍 Checking inventory for:', tenant);
    console.log('');
    
    // Check ProductProfiles
    const profiles = await prisma.productProfile.findMany({
      where: { tenant },
      select: {
        id: true,
        title: true,
        shopifyProductId: true,
        firmness: true,
        height: true,
        material: true,
        createdAt: true
      }
    });
    
    console.log(`📦 ProductProfiles: ${profiles.length} found`);
    if (profiles.length > 0) {
      profiles.forEach((p, idx) => {
        console.log(`  ${idx + 1}. "${p.title}" (ID: ${p.id})`);
        console.log(`     Shopify ID: ${p.shopifyProductId}`);
        console.log(`     Firmness: ${p.firmness || 'N/A'}`);
        console.log(`     Height: ${p.height || 'N/A'}`);
        console.log(`     Material: ${p.material || 'N/A'}`);
        console.log(`     Created: ${p.createdAt}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No products found in database');
    }
    console.log('');
    
    // Check latest IndexJobs
    const jobs = await prisma.indexJob.findMany({
      where: { tenant },
      orderBy: { startedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        status: true,
        totalProducts: true,
        processedProducts: true,
        failedProducts: true,
        startedAt: true,
        finishedAt: true,
        errorMessage: true
      }
    });
    
    console.log(`📋 Recent IndexJobs: ${jobs.length} found`);
    jobs.forEach((job, idx) => {
      console.log(`  ${idx + 1}. ${job.status.toUpperCase()} (${job.id})`);
      console.log(`     Total: ${job.totalProducts}, Processed: ${job.processedProducts}, Failed: ${job.failedProducts}`);
      console.log(`     Started: ${job.startedAt}`);
      console.log(`     Finished: ${job.finishedAt || 'N/A'}`);
      if (job.errorMessage) {
        console.log(`     Error: ${job.errorMessage}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInventory();

