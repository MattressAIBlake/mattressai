import { redirect } from "@remix-run/node";
import { login, authenticate } from "../shopify.server";
import { prisma } from "~/db.server";

export const loader = async ({ request }) => {
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
      
      // Check if this is a reinstall with a previous paid plan
      if (tenant.planName !== 'starter' && !tenant.billingId) {
        console.log(`Reinstall detected for ${session.shop} with previous plan: ${tenant.planName}`);
        
        // Import billing service
        const { requestBillingApproval } = await import('~/lib/billing/billing.service');
        
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
    } catch (error) {
      console.error('Error checking/triggering automatic indexing:', error);
      // Don't block auth flow on indexing errors
    } finally {
      await prisma.$disconnect();
    }
  }
  
  // If authentication succeeds without redirecting, go to app
  return redirect('/app');
};
