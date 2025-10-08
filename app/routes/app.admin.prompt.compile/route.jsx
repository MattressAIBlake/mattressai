import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { validateRuntimeRules, createCompiledPrompt } from '~/lib/domain/runtimeRules';

/**
 * POST /admin/prompt/compile
 * Compiles a prompt from form data and returns compiled prompt + runtime rules
 */
export async function action({ request }) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    if (request.method !== 'POST') {
      throw json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse form data
    const formData = await request.formData();

    // Extract and validate runtime rules from form data
    const runtimeRulesData = {
      tone: formData.get('tone'),
      questionLimit: parseInt(formData.get('questionLimit')),
      earlyExit: formData.get('earlyExit') === 'true',
      leadCapture: {
        enabled: formData.get('leadCaptureEnabled') === 'true',
        position: formData.get('leadCapturePosition'),
        fields: formData.getAll('leadCaptureFields')
      },
      maxRecommendations: parseInt(formData.get('maxRecommendations'))
    };

    // Validate the runtime rules
    const runtimeRules = validateRuntimeRules(runtimeRulesData);

    // Create compiled prompt
    const compiledPrompt = createCompiledPrompt(runtimeRules);

    return json({
      success: true,
      compiledPrompt,
      runtimeRules,
      shop
    });

  } catch (error) {
    console.error('Error compiling prompt:', error);

    if (error.issues) {
      // Zod validation error
      return json(
        {
          error: 'Validation failed',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 422 }
      );
    }

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
 * GET /admin/prompt/compile
 * Returns API documentation
 */
export async function loader({ request }) {
  // Authenticate the request
  await authenticateAdmin(request);

  return json({
    endpoint: 'POST /admin/prompt/compile',
    description: 'Compiles a prompt from form data and returns compiled prompt + runtime rules',
    parameters: {
      tone: 'string (friendly, professional, casual, formal, enthusiastic, empathetic)',
      questionLimit: 'number (1-6)',
      earlyExit: 'boolean',
      leadCaptureEnabled: 'boolean',
      leadCapturePosition: 'string (start|end)',
      leadCaptureFields: 'array (name, email, phone, zip)',
      maxRecommendations: 'number (1-5)'
    },
    response: {
      success: 'boolean',
      compiledPrompt: 'string',
      runtimeRules: 'object',
      shop: 'string'
    }
  });
}
