import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { getLead } from '~/lib/leads/lead.service.server';

/**
 * GET /admin/leads/:id
 * Returns a single lead with full details
 */
export const loader = async ({ request, params }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;
    const { id } = params;

    if (!id) {
      return json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const lead = await getLead(id, shop);

    if (!lead) {
      return json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

