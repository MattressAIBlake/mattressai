import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { getLeads, updateLeadStatus, exportLeadsToCSV } from '~/lib/leads/lead.service';

/**
 * GET /admin/leads
 * Returns leads with filters
 */
export const loader = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const export_csv = url.searchParams.get('export') === 'true';

    const filters = {
      status,
      search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit,
      offset
    };

    // Handle CSV export
    if (export_csv) {
      const csv = await exportLeadsToCSV(shop, filters);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-${Date.now()}.csv"`
        }
      });
    }

    // Regular JSON response
    const { leads, total } = await getLeads(shop, filters);

    return json({
      success: true,
      leads,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching leads:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

/**
 * POST /admin/leads
 * Update lead status
 */
export const action = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    if (request.method !== 'POST') {
      throw json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await request.json();
    const { leadId, status } = body;

    if (!leadId || !status) {
      return json(
        { error: 'leadId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'contacted', 'won', 'lost'];
    if (!validStatuses.includes(status)) {
      return json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await updateLeadStatus({
      leadId,
      tenantId: shop,
      status
    });

    return json({
      success: true,
      leadId,
      status
    });
  } catch (error) {
    console.error('Error updating lead:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

