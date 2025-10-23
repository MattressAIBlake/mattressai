import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { prisma } from '~/db.server';
import { createCompiledPrompt } from '~/lib/domain/runtimeRules';

/**
 * POST /app/admin/prompt/regenerate
 * Regenerates the active custom prompt with the updated template
 */
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return json({ error: 'No shop found in session' }, { status: 401 });
    }

    // Find the active prompt for this shop
    const activePrompt = await prisma.promptVersion.findFirst({
      where: {
        tenant: shop,
        isActive: true
      }
    });

    if (!activePrompt) {
      return json({ 
        error: 'No active custom prompt found. You are already using default prompts.' 
      }, { status: 404 });
    }

    // Parse runtime rules and regenerate the compiled prompt
    const runtimeRules = JSON.parse(activePrompt.runtimeRules);
    const newCompiledPrompt = createCompiledPrompt(runtimeRules);

    // Update the prompt with the new compiled version
    await prisma.promptVersion.update({
      where: { id: activePrompt.id },
      data: {
        compiledPrompt: newCompiledPrompt,
        updatedAt: new Date()
      }
    });

    console.log(`Regenerated custom prompt ${activePrompt.id} for shop: ${shop}`);

    return json({
      success: true,
      message: 'Successfully regenerated your custom prompt with the updated template. The brief product recommendation instructions are now active.',
      promptId: activePrompt.id
    });

  } catch (error) {
    console.error('Error regenerating prompt:', error);
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

