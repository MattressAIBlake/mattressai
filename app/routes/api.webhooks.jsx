import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  switch (topic) {
    case 'APP_UNINSTALLED':
      if (session) {
        await db.session.deleteMany({where: {shop}});
      }
      
      // Send lifecycle email for app uninstallation
      try {
        const { sendLifecycleEmail } = await import('~/lib/lifecycle-emails/lifecycle-email.service.server');
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // Get tenant info before it's potentially deleted
        const tenant = await prisma.tenant.findUnique({
          where: { shop }
        });
        
        await sendLifecycleEmail('app_uninstalled', shop, {
          merchantName: session?.firstName || 'there',
          shopDomain: shop,
          planName: tenant?.planName || 'starter',
          reason: 'uninstalled',
          reinstallUrl: 'https://apps.shopify.com/mattressai'
        });
        
        await prisma.$disconnect();
        console.log(`Lifecycle email sent for app uninstallation: ${shop}`);
      } catch (error) {
        console.error('Error sending lifecycle email:', error);
        // Don't block webhook processing
      }
      break;
    case 'APP_SUBSCRIPTIONS_UPDATE':
      // App subscription updates are handled by dedicated route
      console.log('App subscription update - see webhooks.app_subscriptions.update');
      break;
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
      break;
  }

  return new Response();
};
