import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function LeadsManagement() {
  const loadFetcher = useFetcher(); // For loading leads
  const updateFetcher = useFetcher(); // For updating status
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

    loadFetcher.load(`/app/admin/leads?${params.toString()}`);
  }, [searchValue, statusFilter, dateRange, loadFetcher]);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    params.append('export', 'true');
    
    window.location.href = `/app/admin/leads?${params.toString()}`;
  }, [statusFilter]);

  const handleStatusChange = useCallback((leadId, newStatus) => {
    updateFetcher.submit(
      { leadId, status: newStatus },
      { method: 'post', action: '/app/admin/leads', encType: 'application/json' }
    );
  }, [updateFetcher]);

  // Reload leads after successful status update
  useEffect(() => {
    if (updateFetcher.state === 'idle' && updateFetcher.data?.success) {
      handleSearch();
    }
  }, [updateFetcher.state, updateFetcher.data, handleSearch]);

  // Auto-load leads on mount
  useEffect(() => {
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const leads = loadFetcher.data?.leads || [];
  const total = loadFetcher.data?.total || 0;

  // Memoize primaryAction to prevent infinite re-renders
  const titleBarPrimaryAction = useMemo(() => ({
    content: 'Export CSV',
    onAction: handleExport
  }), [handleExport]);

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
    <Page>
      <TitleBar 
        title="Lead Management"
        primaryAction={titleBarPrimaryAction}
      />
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

              {loadFetcher.state === 'loading' ? (
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
                  <Text variant="bodyMd" as="p">No leads found for the selected filters.</Text>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

