import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { getPromptVersions, getActivePromptVersion } from '~/lib/domain/promptVersion.server';

/**
 * GET /admin/prompt/versions
 * Returns all prompt versions for the authenticated shop
 */
export async function loader({ request }) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    // Get all prompt versions for this shop
    const versions = await getPromptVersions(shop);

    // Get the currently active version
    const activeVersion = await getActivePromptVersion(shop);

    return json({
      success: true,
      versions: versions.map(version => ({
        id: version.id,
        compiledPrompt: version.compiledPrompt,
        runtimeRules: version.runtimeRules,
        isActive: version.isActive,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt
      })),
      activeVersionId: activeVersion?.id || null,
      totalVersions: versions.length
    });

  } catch (error) {
    console.error('Error fetching prompt versions:', error);

    if (error.status) {
      // Remix response error (authentication, etc.)
      return error;
    }

    // Unexpected error
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /admin/prompt/versions
 * Not allowed - use /admin/prompt/activate to create new versions
 */
export async function action({ request }) {
  throw json(
    { error: 'Method not allowed. Use POST /admin/prompt/activate to create new versions.' },
    { status: 405 }
  );
}
