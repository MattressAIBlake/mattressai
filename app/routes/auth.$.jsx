import { redirect } from "@remix-run/node";
import { login, authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { prisma } = await import("~/db.server");
  const { pathname } = new URL(request.url);
  
  // If this is the login path, use login() 
  // login() will throw a redirect Response to start OAuth flow
  if (pathname === '/auth/login') {
    await login(request);
    // If login doesn't redirect, go to app
    return redirect('/app');
  }
  
  // For other auth paths, use authenticate.admin()
  // This handles OAuth callbacks and other auth flows
  const { session, admin } = await authenticate.admin(request);
  
  // Check if this is a billing return by looking for charge_id in URL
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('charge_id');
  const isBillingReturn = chargeId !== null;
  
  // Check if this is a first-time install and trigger automatic indexing
  if (session?.shop) {
    try {
      // Ensure tenant exists
      const tenant = await prisma.tenant.upsert({
        where: { shop: session.shop },
        update: {},
        create: {
          id: session.shop,
          shop: session.shop,
          planName: 'starter',
          firstIndexCompleted: false
        }
      });
      
      // Create default AlertSettings if they don't exist
      const existingAlertSettings = await prisma.alertSettings.findUnique({
        where: { tenantId: session.shop }
      });
      
      if (!existingAlertSettings) {
        await prisma.alertSettings.create({
          data: {
            tenantId: session.shop,
            triggers: JSON.stringify({
              all: false,
              lead_captured: true,
              high_intent: false,
              abandoned: false,
              post_conversion: false,
              chat_end: false
            }),
            channels: JSON.stringify({
              email: {},
              sms: {},
              slack: {},
              webhook: {},
              podium: {},
              birdeye: {}
            }),
            throttles: JSON.stringify({
              high_intent: { maxPerHour: 10 },
              abandoned: { maxPerHour: 5 }
            })
          }
        });
        console.log(`Default alert settings created for ${session.shop}`);
      }
      
      // Check if this is a reinstall with a previous paid plan
      if (tenant.planName !== 'starter' && !tenant.billingId) {
        console.log(`Reinstall detected for ${session.shop} with previous plan: ${tenant.planName}`);
        
        // Import billing service
        const { requestBillingApproval } = await import('~/lib/billing/billing.service.server');
        
        try {
          let appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST || 'mattressaishopify.vercel.app';
          // Remove https:// or http:// if present to avoid double protocol
          appUrl = appUrl.replace(/^https?:\/\//, '');
          const returnUrl = `https://${appUrl}/app/admin/billing/callback?plan=${tenant.planName}&reinstall=true`;
          
          const { confirmationUrl } = await requestBillingApproval(
            session.shop,
            admin,
            tenant.planName,
            returnUrl
          );
          
          if (confirmationUrl) {
            console.log(`Redirecting ${session.shop} to billing approval for ${tenant.planName} plan`);
            // Redirect to billing approval
            return redirect(confirmationUrl);
          }
        } catch (error) {
          console.error('Failed to request billing approval on reinstall:', error);
          // Continue to app even if billing fails
        }
      }
      
      // If first-time install, trigger automatic indexing
      if (!tenant.firstIndexCompleted) {
        console.log(`First-time install detected for ${session.shop}, triggering automatic indexing...`);
        
        // Trigger indexing job in the background (fire and forget)
        const appUrl = new URL(request.url).origin;
        fetch(`${appUrl}/app/admin/index/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            useAIEnrichment: 'true',
            confidenceThreshold: '0.7'
          })
        }).catch(error => {
          console.error('Failed to trigger automatic indexing:', error);
        });
        
        // Mark as initiated (don't wait for completion)
        await prisma.tenant.update({
          where: { shop: session.shop },
          data: { firstIndexCompleted: true }
        });
        
        console.log(`Automatic indexing initiated for ${session.shop}`);
      }
      
      // Send lifecycle email for app installation
      try {
        const { sendLifecycleEmail } = await import('~/lib/lifecycle-emails/lifecycle-email.service.server');
        
        // Calculate trial end date (14 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        
        await sendLifecycleEmail('app_installed', session.shop, {
          merchantName: session.firstName || 'there',
          shopDomain: session.shop,
          planName: tenant.planName || 'starter',
          trialEndsAt: trialEndsAt.toLocaleDateString(),
          loginUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_APP_KEY || 'mattressai'}`,
          supportEmail: process.env.LIFECYCLE_EMAILS_REPLY_TO || 'support@mattressai.com'
        });
        
        console.log(`Lifecycle email sent for app installation: ${session.shop}`);
      } catch (error) {
        console.error('Error sending lifecycle email:', error);
        // Don't block auth flow on email errors
      }
    } catch (error) {
      console.error('Error checking/triggering automatic indexing:', error);
      // Don't block auth flow on indexing errors
    } finally {
      await prisma.$disconnect();
    }
  }
  
  // If this is a billing return (from Shopify billing approval),
  // redirect to plans page where the subscription will be auto-synced
  if (isBillingReturn) {
    return redirect('/app/admin/plans');
  }
  
  // Otherwise, go to app home
  return redirect('/app');
};
