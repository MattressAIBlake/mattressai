import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useSubmit, useSearchParams } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  Filters,
  ChoiceList,
  Banner,
  Layout
} from '@shopify/polaris';
import { useState, useCallback } from 'react';
import { getEmailLogs, resendEmail } from '~/lib/lifecycle-emails/lifecycle-email.service.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    const url = new URL(request.url);
    const eventType = url.searchParams.get('eventType');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;
    
    const filters = {
      eventType: eventType || undefined,
      status: status || undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit,
      offset
    };
    
    const { logs, total } = await getEmailLogs(filters);
    
    return json({
      logs: logs.map(log => ({
        id: log.id,
        tenantId: log.tenantId,
        eventType: log.eventType,
        recipient: log.recipient,
        recipientType: log.recipientType,
        subject: log.subject,
        status: log.status,
        error: log.error,
        sentAt: log.sentAt.toISOString()
      })),
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      success: true
    });
  } catch (error) {
    console.error('[LifecycleEmailLogs] Loader error:', error);
    return json({ logs: [], total: 0, error: error.message }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get('_action');
    
    if (action === 'resend') {
      const logId = formData.get('logId');
      const success = await resendEmail(logId);
      
      if (success) {
        return json({ success: true, message: 'Email resent successfully' });
      } else {
        return json({ error: 'Failed to resend email' }, { status: 500 });
      }
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[LifecycleEmailLogs] Action error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function LifecycleEmailLogsPage() {
  const { logs, total, currentPage, totalPages, error } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [eventTypeFilter, setEventTypeFilter] = useState(searchParams.get('eventType') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  
  const handleResend = (logId) => {
    if (confirm('Are you sure you want to resend this email?')) {
      const data = new FormData();
      data.append('_action', 'resend');
      data.append('logId', logId);
      submit(data, { method: 'post' });
    }
  };
  
  const handleFilterChange = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 when filtering
    setSearchParams(params);
  }, [searchParams, setSearchParams]);
  
  const handleClearAll = useCallback(() => {
    setEventTypeFilter('');
    setStatusFilter('');
    setSearchParams({});
  }, [setSearchParams]);
  
  const handlePagination = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };
  
  const eventTypeLabels = {
    app_installed: 'App Installed',
    app_uninstalled: 'App Uninstalled',
    trial_started: 'Trial Started',
    trial_ending_soon: 'Trial Ending Soon',
    trial_ended: 'Trial Ended',
    plan_upgraded: 'Plan Upgraded',
    plan_downgraded: 'Plan Downgraded',
    subscription_cancelled: 'Subscription Cancelled',
    subscription_expired: 'Subscription Expired',
    payment_failed: 'Payment Failed'
  };
  
  const rows = logs.map((log) => [
    new Date(log.sentAt).toLocaleString(),
    eventTypeLabels[log.eventType] || log.eventType,
    log.recipient,
    log.recipientType === 'merchant' ? 'Merchant' : 'Team',
    log.status === 'sent' ? (
      <Badge status="success">Sent</Badge>
    ) : log.status === 'failed' ? (
      <Badge status="critical">Failed</Badge>
    ) : (
      <Badge>Skipped</Badge>
    ),
    log.error || '-',
    log.status === 'failed' ? (
      <Button size="slim" onClick={() => handleResend(log.id)}>
        Resend
      </Button>
    ) : null
  ]);
  
  const filters = [
    {
      key: 'eventType',
      label: 'Event Type',
      filter: (
        <ChoiceList
          title="Event Type"
          titleHidden
          choices={[
            { label: 'All', value: '' },
            { label: 'App Installed', value: 'app_installed' },
            { label: 'App Uninstalled', value: 'app_uninstalled' },
            { label: 'Trial Started', value: 'trial_started' },
            { label: 'Trial Ending Soon', value: 'trial_ending_soon' },
            { label: 'Trial Ended', value: 'trial_ended' },
            { label: 'Plan Upgraded', value: 'plan_upgraded' },
            { label: 'Plan Downgraded', value: 'plan_downgraded' },
            { label: 'Subscription Cancelled', value: 'subscription_cancelled' },
            { label: 'Subscription Expired', value: 'subscription_expired' },
            { label: 'Payment Failed', value: 'payment_failed' }
          ]}
          selected={[eventTypeFilter]}
          onChange={(value) => {
            setEventTypeFilter(value[0]);
            handleFilterChange('eventType', value[0]);
          }}
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: 'All', value: '' },
            { label: 'Sent', value: 'sent' },
            { label: 'Failed', value: 'failed' },
            { label: 'Skipped', value: 'skipped' }
          ]}
          selected={[statusFilter]}
          onChange={(value) => {
            setStatusFilter(value[0]);
            handleFilterChange('status', value[0]);
          }}
        />
      )
    }
  ];
  
  const appliedFilters = [];
  if (eventTypeFilter) {
    appliedFilters.push({
      key: 'eventType',
      label: `Event: ${eventTypeLabels[eventTypeFilter] || eventTypeFilter}`,
      onRemove: () => {
        setEventTypeFilter('');
        handleFilterChange('eventType', '');
      }
    });
  }
  if (statusFilter) {
    appliedFilters.push({
      key: 'status',
      label: `Status: ${statusFilter}`,
      onRemove: () => {
        setStatusFilter('');
        handleFilterChange('status', '');
      }
    });
  }
  
  return (
    <Page
      title="Lifecycle Email Logs"
      subtitle={`${total} total emails sent`}
      backAction={{ onAction: () => navigate('/app/admin/lifecycle-emails') }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical" title="Error loading logs">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}
        
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Filters
                filters={filters}
                appliedFilters={appliedFilters}
                onClearAll={handleClearAll}
              />
            </div>
            
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Date/Time', 'Event', 'Recipient', 'Type', 'Status', 'Error', 'Actions']}
              rows={rows}
            />
            
            {totalPages > 1 && (
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => handlePagination(currentPage - 1)}
                >
                  Previous
                </Button>
                <span style={{ alignSelf: 'center' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePagination(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

