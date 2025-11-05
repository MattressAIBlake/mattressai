/**
 * Trial Lifecycle Worker
 * Runs daily to check for trials starting, ending soon, or expired
 * Usage: Run as cron job: 0 9 * * * node app/workers/trial-worker.ts
 */

import { PrismaClient } from '@prisma/client';
import { sendLifecycleEmail } from '../lib/lifecycle-emails/lifecycle-email.service.server';

const prisma = new PrismaClient();

interface TenantWithSession {
  id: string;
  shop: string;
  planName: string;
  trialEndsAt: Date | null;
  createdAt: Date;
  session?: {
    email: string | null;
    firstName: string | null;
  } | null;
}

async function processTrialLifecycles() {
  console.log('[TrialWorker] Starting trial lifecycle check...');
  
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Find all tenants with active trials
    const tenants = await prisma.tenant.findMany({
      where: {
        trialEndsAt: {
          not: null
        }
      },
      include: {
        // We don't have a relation, so we'll fetch sessions separately
      }
    });
    
    console.log(`[TrialWorker] Found ${tenants.length} tenants with trial info`);
    
    let trialsStarted = 0;
    let trialsEndingSoon = 0;
    let trialsExpired = 0;
    
    for (const tenant of tenants) {
      if (!tenant.trialEndsAt) continue;
      
      const trialEnd = new Date(tenant.trialEndsAt);
      
      // Get session info for merchant name
      const session = await prisma.session.findFirst({
        where: { shop: tenant.shop },
        select: { email: true, firstName: true },
        orderBy: { id: 'desc' }
      });
      
      // Check if trial just started (within last 24 hours)
      // Trial starts 14 days before it ends
      const trialStart = new Date(trialEnd);
      trialStart.setDate(trialStart.getDate() - 14);
      
      const isNewTrial = trialStart > oneDayAgo && trialStart <= now;
      
      // Check if we've already sent trial_started email
      const alreadySentTrialStarted = await prisma.lifecycleEmailLog.findFirst({
        where: {
          tenantId: tenant.shop,
          eventType: 'trial_started',
          status: 'sent'
        }
      });
      
      // Send trial started email if it's a new trial and we haven't sent it yet
      if (isNewTrial && !alreadySentTrialStarted) {
        try {
          await sendLifecycleEmail('trial_started', tenant.shop, {
            merchantName: session?.firstName || 'there',
            shopDomain: tenant.shop,
            planName: tenant.planName,
            trialEndsAt: trialEnd.toLocaleDateString()
          });
          
          trialsStarted++;
          console.log(`[TrialWorker] Sent trial_started for ${tenant.shop}`);
        } catch (error) {
          console.error(`[TrialWorker] Failed to send trial_started for ${tenant.shop}:`, error);
        }
      }
      
      // Check if trial is ending in ~3 days
      const daysUntilEnd = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEnd === 3) {
        // Check if we've already sent trial_ending_soon email
        const alreadySentEndingSoon = await prisma.lifecycleEmailLog.findFirst({
          where: {
            tenantId: tenant.shop,
            eventType: 'trial_ending_soon',
            status: 'sent'
          }
        });
        
        if (!alreadySentEndingSoon) {
          try {
            // Get some stats for the email
            const sessionCount = await prisma.chatSession.count({
              where: { tenantId: tenant.shop }
            });
            
            const leadCount = await prisma.lead.count({
              where: { tenantId: tenant.shop }
            });
            
            const ordersCount = await prisma.event.count({
              where: {
                tenantId: tenant.shop,
                type: 'order_placed'
              }
            });
            
            const conversionRate = sessionCount > 0 ? Math.round((ordersCount / sessionCount) * 100) : 0;
            
            await sendLifecycleEmail('trial_ending_soon', tenant.shop, {
              merchantName: session?.firstName || 'there',
              shopDomain: tenant.shop,
              planName: tenant.planName,
              trialEndsAt: trialEnd.toLocaleDateString(),
              sessionCount,
              leadCount,
              conversionRate,
              upgradeUrl: `https://${tenant.shop}/admin/apps/mattressai/plans`
            });
            
            trialsEndingSoon++;
            console.log(`[TrialWorker] Sent trial_ending_soon for ${tenant.shop}`);
          } catch (error) {
            console.error(`[TrialWorker] Failed to send trial_ending_soon for ${tenant.shop}:`, error);
          }
        }
      }
      
      // Check if trial has expired (ended within last 24 hours)
      const hasExpired = trialEnd <= now && trialEnd > oneDayAgo;
      
      if (hasExpired) {
        // Check if we've already sent trial_ended email
        const alreadySentExpired = await prisma.lifecycleEmailLog.findFirst({
          where: {
            tenantId: tenant.shop,
            eventType: 'trial_ended',
            status: 'sent'
          }
        });
        
        if (!alreadySentExpired) {
          try {
            await sendLifecycleEmail('trial_ended', tenant.shop, {
              merchantName: session?.firstName || 'there',
              shopDomain: tenant.shop,
              planName: tenant.planName,
              trialEndsAt: trialEnd.toLocaleDateString(),
              upgradeUrl: `https://${tenant.shop}/admin/apps/mattressai/plans`
            });
            
            trialsExpired++;
            console.log(`[TrialWorker] Sent trial_ended for ${tenant.shop}`);
          } catch (error) {
            console.error(`[TrialWorker] Failed to send trial_ended for ${tenant.shop}:`, error);
          }
        }
      }
    }
    
    console.log('[TrialWorker] Trial lifecycle check complete');
    console.log(`  Trial started emails: ${trialsStarted}`);
    console.log(`  Trial ending soon emails: ${trialsEndingSoon}`);
    console.log(`  Trial expired emails: ${trialsExpired}`);
    
  } catch (error) {
    console.error('[TrialWorker] Error processing trial lifecycles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processTrialLifecycles()
    .then(() => {
      console.log('[TrialWorker] ✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[TrialWorker] ❌ Failed:', error);
      process.exit(1);
    });
}

export { processTrialLifecycles };

