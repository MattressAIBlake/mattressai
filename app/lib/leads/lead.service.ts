/**
 * Lead Service
 * Handles lead capture, consent management, and Shopify Customer sync
 */

import prisma from '~/db.server';
import { authenticate } from '~/shopify.server';

interface CreateLeadOptions {
  tenantId: string;
  sessionId: string;
  email?: string;
  phone?: string;
  name?: string;
  zip?: string;
  consent: boolean;
  shopifyAccessToken?: string;
}

interface UpdateLeadStatusOptions {
  leadId: string;
  tenantId: string;
  status: 'new' | 'contacted' | 'won' | 'lost';
}

/**
 * Create or update a lead
 */
export const createLead = async (options: CreateLeadOptions): Promise<any> => {
  const { tenantId, sessionId, email, phone, name, zip, consent, shopifyAccessToken } = options;

  let shopifyCustomerId: string | null = null;

  // If consent is true and we have email, sync to Shopify Customer
  if (consent && email && shopifyAccessToken) {
    try {
      shopifyCustomerId = await syncToShopifyCustomer({
        tenantId,
        email,
        phone,
        name,
        zip,
        accessToken: shopifyAccessToken
      });
    } catch (error) {
      console.error('Error syncing to Shopify Customer:', error);
      // Continue even if Shopify sync fails
    }
  }

  // Create lead record
  const lead = await prisma.lead.create({
    data: {
      tenantId,
      sessionId,
      email,
      phone,
      name,
      zip,
      consent,
      shopifyCustomerId,
      status: 'new'
    }
  });

  return lead;
};

/**
 * Sync lead to Shopify Customer
 */
const syncToShopifyCustomer = async (options: {
  tenantId: string;
  email: string;
  phone?: string;
  name?: string;
  zip?: string;
  accessToken: string;
}): Promise<string | null> => {
  const { tenantId, email, phone, name, zip, accessToken } = options;

  try {
    // Parse name into first and last
    let firstName = '';
    let lastName = '';
    if (name) {
      const nameParts = name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // GraphQL mutation to create or update customer
    const mutation = `
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        email,
        firstName,
        lastName,
        phone,
        addresses: zip ? [{
          zip
        }] : [],
        emailMarketingConsent: {
          marketingState: 'SUBSCRIBED',
          marketingOptInLevel: 'SINGLE_OPT_IN'
        },
        tags: ['mattressai-lead']
      }
    };

    const response = await fetch(`https://${tenantId}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const data = await response.json();

    if (data.data?.customerCreate?.customer) {
      // Extract numeric ID from the GID
      const gid = data.data.customerCreate.customer.id;
      const numericId = gid.split('/').pop();
      return numericId;
    }

    if (data.data?.customerCreate?.userErrors?.length > 0) {
      // Customer might already exist, try to find them
      const customerId = await findShopifyCustomerByEmail(tenantId, email, accessToken);
      if (customerId) {
        return customerId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in syncToShopifyCustomer:', error);
    return null;
  }
};

/**
 * Find Shopify customer by email
 */
const findShopifyCustomerByEmail = async (
  tenantId: string,
  email: string,
  accessToken: string
): Promise<string | null> => {
  try {
    const query = `
      query findCustomer($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              email
            }
          }
        }
      }
    `;

    const variables = {
      query: `email:${email}`
    };

    const response = await fetch(`https://${tenantId}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query, variables })
    });

    const data = await response.json();

    if (data.data?.customers?.edges?.length > 0) {
      const gid = data.data.customers.edges[0].node.id;
      return gid.split('/').pop();
    }

    return null;
  } catch (error) {
    console.error('Error finding Shopify customer:', error);
    return null;
  }
};

/**
 * Get leads for a tenant with filters
 */
export const getLeads = async (
  tenantId: string,
  filters?: {
    status?: string;
    search?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<{ leads: any[]; total: number }> => {
  const where: any = { tenantId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } }
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        session: {
          select: {
            intentScore: true,
            endReason: true,
            summary: true,
            startedAt: true,
            endedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    }),
    prisma.lead.count({ where })
  ]);

  return { leads, total };
};

/**
 * Get a single lead by ID
 */
export const getLead = async (leadId: string, tenantId: string): Promise<any | null> => {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      tenantId
    },
    include: {
      session: {
        include: {
          events: {
            orderBy: { timestamp: 'asc' }
          }
        }
      }
    }
  });

  return lead;
};

/**
 * Update lead status
 */
export const updateLeadStatus = async (options: UpdateLeadStatusOptions): Promise<any> => {
  const { leadId, tenantId, status } = options;

  const lead = await prisma.lead.updateMany({
    where: {
      id: leadId,
      tenantId
    },
    data: {
      status,
      updatedAt: new Date()
    }
  });

  return lead;
};

/**
 * Export leads to CSV
 */
export const exportLeadsToCSV = async (
  tenantId: string,
  filters?: {
    status?: string;
    from?: Date;
    to?: Date;
  }
): Promise<string> => {
  const { leads } = await getLeads(tenantId, { ...filters, limit: 10000 });

  const headers = [
    'Date',
    'Name',
    'Email',
    'Phone',
    'Zip',
    'Status',
    'Consent',
    'Intent Score',
    'End Reason',
    'Shopify Customer ID'
  ];

  const rows = leads.map((lead: any) => [
    lead.createdAt.toISOString(),
    lead.name || '',
    lead.consent ? lead.email || '' : '[No Consent]',
    lead.consent ? lead.phone || '' : '[No Consent]',
    lead.zip || '',
    lead.status,
    lead.consent ? 'Yes' : 'No',
    lead.session?.intentScore || '',
    lead.session?.endReason || '',
    lead.shopifyCustomerId || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Delete lead data (GDPR)
 */
export const deleteLead = async (leadId: string, tenantId: string): Promise<void> => {
  await prisma.lead.deleteMany({
    where: {
      id: leadId,
      tenantId
    }
  });
};

