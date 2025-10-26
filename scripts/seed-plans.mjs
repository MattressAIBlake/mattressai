#!/usr/bin/env node

/**
 * Seed Plans Script
 * Initializes billing plans in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLAN_CONFIGS = {
  starter: {
    name: 'starter',
    price: 29,
    features: {
      tokens: 100000,
      alertsPerDay: 2,
      smsEnabled: false,
      vectorQueries: 10000,
      indexJobs: 2,
      priorityIndexing: false
    },
    guidance: 'Best for stores with 0-75 unique visitors per day'
  },
  pro: {
    name: 'pro',
    price: 49,
    features: {
      tokens: 500000,
      alertsPerDay: 50,
      smsEnabled: true,
      vectorQueries: 50000,
      indexJobs: 5,
      priorityIndexing: false
    },
    guidance: 'Best for stores with 75-250 unique visitors per day'
  },
  enterprise: {
    name: 'enterprise',
    price: 199,
    features: {
      tokens: 2000000,
      alertsPerDay: -1,
      smsEnabled: true,
      vectorQueries: 200000,
      indexJobs: -1,
      priorityIndexing: true
    },
    guidance: 'Best for stores with 250+ unique visitors per day'
  }
};

async function seedPlans() {
  try {
    console.log('🌱 Seeding billing plans...');
    
    for (const config of Object.values(PLAN_CONFIGS)) {
      const result = await prisma.plan.upsert({
        where: { name: config.name },
        update: {
          price: config.price,
          features: JSON.stringify(config.features)
        },
        create: {
          name: config.name,
          price: config.price,
          features: JSON.stringify(config.features)
        }
      });
      
      console.log(`  ✅ ${config.name.toUpperCase()}: $${config.price}/mo`);
    }
    
    console.log('\n✅ Billing plans seeded successfully');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed billing plans:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedPlans();

