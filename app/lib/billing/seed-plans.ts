/**
 * Seed Plans Script
 * Initialize default billing plans in database
 * Run this during app initialization
 */

import { initializePlans } from './billing.service.server';

export async function seedPlans() {
  try {
    console.log('🌱 Seeding billing plans...');
    await initializePlans();
    console.log('✅ Billing plans seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed billing plans:', error);
    throw error;
  }
}

// Run if executed directly (ES module compatible)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  seedPlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}


