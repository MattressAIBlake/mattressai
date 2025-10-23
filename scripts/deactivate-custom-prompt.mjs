#!/usr/bin/env node

/**
 * Script to deactivate custom prompts for a shop
 * This will make the system fall back to using prompts.json
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SHOP = 'freedommattress.myshopify.com';

async function deactivateCustomPrompts() {
  try {
    console.log(`\nChecking for active custom prompts for shop: ${SHOP}...\n`);

    // Find active prompts
    const activePrompts = await prisma.promptVersion.findMany({
      where: {
        tenant: SHOP,
        isActive: true
      }
    });

    if (activePrompts.length === 0) {
      console.log('✓ No active custom prompts found. System is already using prompts.json');
      return;
    }

    console.log(`Found ${activePrompts.length} active custom prompt(s):`);
    activePrompts.forEach(prompt => {
      console.log(`  - ID: ${prompt.id}`);
      console.log(`    Created: ${prompt.createdAt}`);
      console.log(`    Preview: ${prompt.compiledPrompt.substring(0, 100)}...`);
    });

    // Deactivate all custom prompts
    const result = await prisma.promptVersion.updateMany({
      where: {
        tenant: SHOP,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    console.log(`\n✓ Successfully deactivated ${result.count} custom prompt(s)`);
    console.log('✓ System will now use the default prompts from prompts.json');

  } catch (error) {
    console.error('Error deactivating custom prompts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deactivateCustomPrompts();

