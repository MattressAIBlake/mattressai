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
