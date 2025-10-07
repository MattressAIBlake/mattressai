import { useState, useCallback } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import {
  Page,
  Card,
  DataTable,
  Button,
  Badge,
  TextField,
  Select,
  Layout,
  Text,
  ButtonGroup,
  Filters,
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function LeadsManagement() {
  const fetcher = useFetcher();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchValue) params.append('search', searchValue);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    
    // Calculate date range
    const to = new Date();
    let from = new Date();
    if (dateRange === '7d') from.setDate(from.getDate() - 7);
    else if (dateRange === '30d') from.setDate(from.getDate() - 30);
    else if (dateRange === '90d') from.setDate(from.getDate() - 90);
    
    params.append('from', from.toISOString());
    params.append('to', to.toISOString());

    fetcher.load(`/admin/leads?${params.toString()}`);
  }, [searchValue, statusFilter, dateRange, fetcher]);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    params.append('export', 'true');
    
    window.location.href = `/admin/leads?${params.toString()}`;
  }, [statusFilter]);

  const handleStatusChange = useCallback((leadId, newStatus) => {
    fetcher.submit(
      { leadId, status: newStatus },
      { method: 'post', action: '/admin/leads', encType: 'application/json' }
    );
  }, [fetcher]);

  const leads = fetcher.data?.leads || [];
  const total = fetcher.data?.total || 0;

  const rows = leads.map((lead) => {
    const statusBadge = {
      new: <Badge>New</Badge>,
      contacted: <Badge status="info">Contacted</Badge>,
      won: <Badge status="success">Won</Badge>,
      lost: <Badge status="attention">Lost</Badge>
    }[lead.status] || <Badge>{lead.status}</Badge>;

    const intentScore = lead.session?.intentScore || 0;
    const intentBadge = intentScore >= 70 
      ? <Badge status="success">{intentScore}</Badge>
      : intentScore >= 40
      ? <Badge status="warning">{intentScore}</Badge>
      : <Badge>{intentScore}</Badge>;

    return [
      new Date(lead.createdAt).toLocaleDateString(),
      lead.name || 'Anonymous',
      lead.consent ? (lead.email || '-') : '[No Consent]',
      lead.consent ? (lead.phone || '-') : '[No Consent]',
      statusBadge,
      intentBadge,
      lead.consent ? <Badge status="success">Yes</Badge> : <Badge>No</Badge>,
      <Select
        label=""
        labelHidden
        options={[
          { label: 'New', value: 'new' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' }
        ]}
        value={lead.status}
        onChange={(value) => handleStatusChange(lead.id, value)}
      />
    ];
  });

  return (
    <Page
      title="Leads"
      subtitle={`${total} total leads`}
      primaryAction={{
        content: 'Export CSV',
        onAction: handleExport
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Search"
                    labelHidden
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Search by name, email, or phone"
                    autoComplete="off"
                  />
                </div>
                <Select
                  label="Status"
                  labelHidden
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'New', value: 'new' },
                    { label: 'Contacted', value: 'contacted' },
                    { label: 'Won', value: 'won' },
                    { label: 'Lost', value: 'lost' }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <Select
                  label="Date Range"
                  labelHidden
                  options={[
                    { label: 'Last 7 days', value: '7d' },
                    { label: 'Last 30 days', value: '30d' },
                    { label: 'Last 90 days', value: '90d' }
                  ]}
                  value={dateRange}
                  onChange={setDateRange}
                />
                <Button primary onClick={handleSearch}>
                  Search
                </Button>
              </div>

              {fetcher.state === 'loading' ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Text variant="bodyMd" as="p">Loading leads...</Text>
                </div>
              ) : rows.length > 0 ? (
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text'
                  ]}
                  headings={[
                    'Date',
                    'Name',
                    'Email',
                    'Phone',
                    'Status',
                    'Intent',
                    'Consent',
                    'Actions'
                  ]}
                  rows={rows}
                />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Text variant="bodyMd" as="p">No leads found. Click Search to load leads.</Text>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2">About Leads</Text>
              <div style={{ marginTop: '12px' }}>
                <Text variant="bodyMd" as="p">
                  Leads are captured when customers submit their contact information through the chat widget.
                </Text>
                <br />
                <Text variant="bodyMd" as="p">
                  <strong>Consent:</strong> Only leads with consent can be contacted and synced to Shopify Customers.
                </Text>
                <br />
                <Text variant="bodyMd" as="p">
                  <strong>Intent Score:</strong> Measures engagement level (0-100). Higher scores indicate stronger purchase intent.
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

