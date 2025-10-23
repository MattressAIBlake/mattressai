#!/usr/bin/env node

/**
 * Script to regenerate custom prompts with the updated template
 * This updates all active custom prompts to use the new product card display instructions
 */

import { PrismaClient } from '@prisma/client';
import { createCompiledPrompt } from '../app/lib/domain/runtimeRules.ts';

const prisma = new PrismaClient();

async function regenerateCustomPrompts() {
  try {
    console.log('\nRegenerating custom prompts with updated template...\n');

    // Find all prompt versions
    const prompts = await prisma.promptVersion.findMany();

    if (prompts.length === 0) {
      console.log('✓ No custom prompts found. Nothing to update.');
      return;
    }

    console.log(`Found ${prompts.length} custom prompt(s) to regenerate:\n`);

    let updated = 0;
    for (const prompt of prompts) {
      try {
        const runtimeRules = JSON.parse(prompt.runtimeRules);
        const newCompiledPrompt = createCompiledPrompt(runtimeRules);

        await prisma.promptVersion.update({
          where: { id: prompt.id },
          data: {
            compiledPrompt: newCompiledPrompt,
            updatedAt: new Date()
          }
        });

        console.log(`✓ Updated prompt ${prompt.id.substring(0, 8)} for ${prompt.tenant}`);
        console.log(`  Status: ${prompt.isActive ? 'Active' : 'Inactive'}`);
        updated++;
      } catch (error) {
        console.error(`✗ Failed to update prompt ${prompt.id}:`, error.message);
      }
    }

    console.log(`\n✓ Successfully regenerated ${updated} out of ${prompts.length} custom prompt(s)`);
    console.log('✓ All custom prompts now include the brief product recommendation instructions\n');

  } catch (error) {
    console.error('Error regenerating custom prompts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateCustomPrompts();

