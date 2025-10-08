#!/usr/bin/env node

/**
 * Seed Plans Script
 * Initializes billing plans in database
 */

import { initializePlans } from '../app/lib/billing/billing.service.ts';

async function seedPlans() {
  try {
    console.log('🌱 Seeding billing plans...');
    await initializePlans();
    console.log('✅ Billing plans seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed billing plans:', error);
    process.exit(1);
  }
}

seedPlans();

