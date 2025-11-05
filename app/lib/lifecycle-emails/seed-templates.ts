/**
 * Seed Default Lifecycle Email Templates
 * Run this script to populate the database with default email templates
 * Usage: node --loader ts-node/esm app/lib/lifecycle-emails/seed-templates.ts
 */

import { PrismaClient } from '@prisma/client';
import { DEFAULT_TEMPLATES } from './default-templates';

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('🌱 Seeding lifecycle email templates...');

  try {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const template of DEFAULT_TEMPLATES) {
      const existing = await prisma.lifecycleEmailTemplate.findUnique({
        where: { eventType: template.eventType }
      });

      if (existing) {
        // Update existing template (preserves any custom changes to enabled flags)
        await prisma.lifecycleEmailTemplate.update({
          where: { eventType: template.eventType },
          data: {
            merchantSubject: template.merchantSubject,
            merchantBody: template.merchantBody,
            teamSubject: template.teamSubject,
            teamBody: template.teamBody,
            // Keep existing enabled/sendTo flags unless template specifies false
            sendToMerchant: existing.sendToMerchant,
            sendToTeam: existing.sendToTeam
          }
        });
        updated++;
        console.log(`✓ Updated template: ${template.eventType}`);
      } else {
        // Create new template
        await prisma.lifecycleEmailTemplate.create({
          data: {
            eventType: template.eventType,
            merchantSubject: template.merchantSubject,
            merchantBody: template.merchantBody,
            teamSubject: template.teamSubject,
            teamBody: template.teamBody,
            enabled: template.enabled !== undefined ? template.enabled : true,
            sendToMerchant: template.sendToMerchant,
            sendToTeam: template.sendToTeam
          }
        });
        created++;
        console.log(`✓ Created template: ${template.eventType}`);
      }
    }

    console.log('\n✅ Seeding complete!');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total: ${DEFAULT_TEMPLATES.length}`);

    // Create default global settings if they don't exist
    const globalSettings = await prisma.lifecycleEmailSettings.findFirst({
      where: { tenantId: null }
    });

    if (!globalSettings) {
      await prisma.lifecycleEmailSettings.create({
        data: {
          tenantId: null,
          teamEmails: JSON.stringify(['team@mattressai.com']),
          replyToEmail: 'system@themattressai.com',
          enabled: true
        }
      });
      console.log('✓ Created default global settings');
    }

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed:', error);
      process.exit(1);
    });
}

export { seedTemplates };

