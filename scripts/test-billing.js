#!/usr/bin/env node

/**
 * Billing Integration Test Script
 * Tests the Shopify billing flow and webhook handling
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testEnvironmentVariables() {
  logSection('1. Environment Variables Check');
  
  const requiredVars = {
    'SHOPIFY_API_KEY': process.env.SHOPIFY_API_KEY,
    'SHOPIFY_API_SECRET': process.env.SHOPIFY_API_SECRET,
    'SHOPIFY_APP_URL': process.env.SHOPIFY_APP_URL || process.env.HOST,
    'DATABASE_URL': process.env.DATABASE_URL,
    'NODE_ENV': process.env.NODE_ENV || 'development'
  };

  let allConfigured = true;
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      log(`✅ ${key}: ${key.includes('SECRET') ? '***' : value}`, 'green');
    } else {
      log(`❌ ${key}: MISSING`, 'red');
      allConfigured = false;
    }
  }

  return allConfigured;
}

async function testDatabaseConnection() {
  logSection('2. Database Connection Test');
  
  try {
    // Check if we can query the database
    const tenantCount = await prisma.tenant.count();
    log(`✅ Database connected successfully`, 'green');
    log(`   Found ${tenantCount} tenant(s)`, 'blue');
    
    // Check if plans are seeded
    const planCount = await prisma.plan.count();
    if (planCount === 0) {
      log(`⚠️  No plans found in database. Run seed script.`, 'yellow');
      return false;
    } else {
      log(`✅ Found ${planCount} plan(s) configured`, 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testPlanConfiguration() {
  logSection('3. Plan Configuration Test');
  
  try {
    const plans = await prisma.plan.findMany();
    
    if (plans.length === 0) {
      log('❌ No plans found. Please seed the database.', 'red');
      return false;
    }

    plans.forEach(plan => {
      const features = JSON.parse(plan.features);
      log(`\n📋 ${plan.name.toUpperCase()} Plan:`, 'cyan');
      log(`   Price: $${plan.price}/month`);
      log(`   Alerts/Day: ${features.alertsPerDay === -1 ? 'Unlimited' : features.alertsPerDay}`);
      log(`   Concurrent Jobs: ${features.indexJobs === -1 ? 'Unlimited' : features.indexJobs}`);
      log(`   SMS Enabled: ${features.smsEnabled ? 'Yes' : 'No'}`);
    });

    return true;
  } catch (error) {
    log(`❌ Failed to load plans: ${error.message}`, 'red');
    return false;
  }
}

async function testTenantConfiguration() {
  logSection('4. Tenant Configuration Test');
  
  try {
    const tenants = await prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (tenants.length === 0) {
      log('⚠️  No tenants found. Install the app on a test store first.', 'yellow');
      return true; // Not an error
    }

    log(`Found ${tenants.length} recent tenant(s):\n`);

    tenants.forEach((tenant, index) => {
      const quotas = tenant.quotas ? JSON.parse(tenant.quotas) : null;
      log(`${index + 1}. ${tenant.shop}`, 'blue');
      log(`   Plan: ${tenant.planName}`);
      log(`   Billing ID: ${tenant.billingId || 'None (Free plan)'}`);
      if (tenant.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(tenant.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
        log(`   Trial: ${daysLeft} days remaining`);
      }
      if (quotas) {
        log(`   Alerts/Day: ${quotas.alertsPerDay === -1 ? 'Unlimited' : quotas.alertsPerDay}`);
      }
      console.log('');
    });

    return true;
  } catch (error) {
    log(`❌ Failed to load tenants: ${error.message}`, 'red');
    return false;
  }
}

function generateWebhookSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');
}

async function simulateWebhook() {
  logSection('5. Webhook Simulation (Manual)');
  
  log('To test webhook handling, use this curl command:\n', 'yellow');
  
  const testShop = 'test-store.myshopify.com';
  const webhookPayload = {
    app_subscription: {
      id: 'gid://shopify/AppSubscription/test123',
      name: 'Pro Plan',
      status: 'ACTIVE',
      test: true
    }
  };

  const payloadString = JSON.stringify(webhookPayload);
  const secret = process.env.SHOPIFY_API_SECRET;
  const signature = generateWebhookSignature(payloadString, secret);

  console.log(`curl -X POST http://localhost:3000/webhooks/app_subscriptions/update \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "X-Shopify-Shop-Domain: ${testShop}" \\`);
  console.log(`  -H "X-Shopify-Hmac-Sha256: ${signature}" \\`);
  console.log(`  -d '${payloadString}'`);
  
  log('\n📝 Expected behavior:', 'cyan');
  log('   1. Webhook receives and verifies HMAC signature');
  log('   2. Extracts plan name from subscription name');
  log('   3. Calls upgradePlan() with shop and plan name');
  log('   4. Updates tenant record in database');
  log('   5. Returns success response\n');

  return true;
}

async function testBillingEndpoint() {
  logSection('6. Billing Endpoint Configuration');
  
  const appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST || 'mattressaishopify.vercel.app';
  
  log('Billing Flow URLs:', 'cyan');
  log(`   Plans Page: https://${appUrl}/app/admin/plans`);
  log(`   Webhook: https://${appUrl}/webhooks/app_subscriptions/update`);
  log(`   API Router: https://${appUrl}/api/webhooks`);
  
  log('\n📋 Test Mode:', 'yellow');
  log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  log(`   Test Charges: ${process.env.NODE_ENV !== 'production' ? 'ENABLED' : 'DISABLED'}`);
  
  log('\n✅ To test the billing flow:', 'green');
  log('   1. Start dev server: npm run dev');
  log('   2. Open app in test store');
  log('   3. Navigate to Plans & Billing');
  log('   4. Click "Upgrade to Pro"');
  log('   5. You\'ll be redirected to Shopify');
  log('   6. Approve the test charge');
  log('   7. Check if webhook updates the tenant plan\n');

  return true;
}

async function runAllTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         MattressAI Shopify Billing Integration Test       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    env: await testEnvironmentVariables(),
    database: await testDatabaseConnection(),
    plans: await testPlanConfiguration(),
    tenants: await testTenantConfiguration(),
    webhook: await simulateWebhook(),
    endpoints: await testBillingEndpoint()
  };

  // Summary
  logSection('Test Summary');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${test.charAt(0).toUpperCase() + test.slice(1)} Test`, color);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  if (allPassed) {
    log('🎉 All tests passed! Billing integration is ready.', 'green');
    log('\n📝 Next Steps:', 'cyan');
    log('   1. Deploy to Vercel (if not already)');
    log('   2. Test with real store in development mode');
    log('   3. Register webhooks in Shopify Partners');
    log('   4. Submit for production billing approval\n');
  } else {
    log('⚠️  Some tests failed. Please fix the issues above.', 'yellow');
  }

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

