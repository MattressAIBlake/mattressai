import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { prisma } from '~/db.server';

/**
 * POST /app/admin/prompt/deactivate-all
 * Deactivates all custom prompts for a shop, making it fall back to prompts.json
 */
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return json({ error: 'No shop found in session' }, { status: 401 });
    }

    // Deactivate all prompts for this shop
    const result = await prisma.promptVersion.updateMany({
      where: {
        tenant: shop,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    console.log(`Deactivated ${result.count} custom prompt(s) for shop: ${shop}`);

    return json({
      success: true,
      message: `Successfully deactivated ${result.count} custom prompt(s). System will now use default prompts.json`,
      count: result.count
    });

  } catch (error) {
    console.error('Error deactivating all prompts:', error);
    return json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Redirect GET requests to the versions page
export async function loader() {
  return json({ error: 'This endpoint only accepts POST requests' }, { status: 405 });
}

