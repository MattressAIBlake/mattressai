/**
 * Seed Plans Script
 * Initialize default billing plans in database
 * Run this during app initialization
 */

import { initializePlans } from './billing.service';

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

// Run if executed directly
if (require.main === module) {
  seedPlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}


