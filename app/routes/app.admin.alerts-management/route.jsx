import { useState, useCallback, useEffect } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import {
  Page,
  Card,
  Layout,
  Text,
  TextField,
  Checkbox,
  Button,
  DataTable,
  Badge,
  Select,
  BlockStack,
  InlineStack,
  Banner
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function AlertsManagement() {
  const settingsFetcher = useFetcher();
  const historyFetcher = useFetcher();
  const testFetcher = useFetcher();

  const [triggers, setTriggers] = useState({
    all: false,
    lead_captured: true,
    high_intent: false,
    abandoned: false,
    post_conversion: false,
    chat_end: false
  });

  const [channels, setChannels] = useState({
    email: { to: '' },
    sms: { to: '' },
    slack: { url: '' },
    webhook: { url: '' }
  });

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '07:00',
    tz: 'America/Chicago'
  });

  // Load settings on mount
  useEffect(() => {
    settingsFetcher.load('/app/admin/alerts/settings');
  }, []);

  // Update state when settings load (only after successful save)
  useEffect(() => {
    if (settingsFetcher.data?.settings && settingsFetcher.state === 'idle') {
      const s = settingsFetcher.data.settings;
      if (s.triggers) setTriggers(s.triggers);
      if (s.channels) setChannels(s.channels);
      if (s.quietHours) setQuietHours(s.quietHours);
    }
  }, [settingsFetcher.data, settingsFetcher.state]);

  const handleSaveSettings = useCallback(() => {
    settingsFetcher.submit(
      { 
        triggers, 
        channels, 
        quietHours: quietHours.enabled ? quietHours : null
      },
      { 
        method: 'post', 
        action: '/app/admin/alerts/settings', 
        encType: 'application/json' 
      }
    );
  }, [triggers, channels, quietHours, settingsFetcher]);

  const handleSendTest = useCallback(async (channel) => {
    // First, save the current settings to ensure they're persisted
    settingsFetcher.submit(
      { 
        triggers, 
        channels, 
        quietHours: quietHours.enabled ? quietHours : null
      },
      { 
        method: 'post', 
        action: '/app/admin/alerts/settings', 
        encType: 'application/json' 
      }
    );
    
    // Wait a moment for the save to complete, then send the test
    setTimeout(() => {
      const config = channels[channel];
      testFetcher.submit(
        { action: 'test', channel, config },
        { method: 'post', action: '/app/admin/alerts/settings', encType: 'application/json' }
      );
    }, 500);
  }, [triggers, channels, quietHours, testFetcher, settingsFetcher]);

  const handleLoadHistory = useCallback(() => {
    historyFetcher.load('/app/admin/alerts/history');
  }, [historyFetcher]);

  const alerts = historyFetcher.data?.alerts || [];

  const historyRows = alerts.map((alert) => {
    const statusBadge = {
      queued: <Badge>Queued</Badge>,
      sent: <Badge status="success">Sent</Badge>,
      failed: <Badge status="critical">Failed</Badge>,
      skipped: <Badge status="warning">Skipped</Badge>
    }[alert.status] || <Badge>{alert.status}</Badge>;

    return [
      new Date(alert.createdAt).toLocaleString(),
      alert.type,
      alert.channel,
      statusBadge,
      alert.attempts,
      alert.error || '-'
    ];
  });

  return (
    <Page>
      <TitleBar title="Alert Settings" />
      <Layout>
        {settingsFetcher.data?.success && settingsFetcher.state === 'idle' && (
          <Layout.Section>
            <Banner 
              status="success" 
              onDismiss={() => {
                // Clear the success message by resetting fetcher
                settingsFetcher.data = null;
              }}
            >
              {settingsFetcher.data.message || 'Settings saved successfully'}
            </Banner>
          </Layout.Section>
        )}

        {testFetcher.data?.success && testFetcher.state === 'idle' && (
          <Layout.Section>
            <Banner 
              status="success" 
              onDismiss={() => {
                // Clear the success message by resetting fetcher
                testFetcher.data = null;
              }}
            >
              {testFetcher.data.message || 'Test alert sent successfully'}
            </Banner>
          </Layout.Section>
        )}

        {testFetcher.data?.error && testFetcher.state === 'idle' && (
          <Layout.Section>
            <Banner 
              status="critical" 
              onDismiss={() => {
                testFetcher.data = null;
              }}
            >
              {testFetcher.data.error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2">Triggers</Text>
              <div style={{ marginTop: '16px' }}>
                <BlockStack gap="300">
                  <Checkbox
                    label="All events (override specific triggers)"
                    checked={triggers.all}
                    onChange={(value) => setTriggers({ ...triggers, all: value })}
                  />
                  <Checkbox
                    label="Lead captured"
                    checked={triggers.lead_captured}
                    onChange={(value) => setTriggers({ ...triggers, lead_captured: value })}
                  />
                  <Checkbox
                    label="High intent (score ≥ 70)"
                    checked={triggers.high_intent}
                    onChange={(value) => setTriggers({ ...triggers, high_intent: value })}
                  />
                  <Checkbox
                    label="Abandoned (idle timeout with moderate intent)"
                    checked={triggers.abandoned}
                    onChange={(value) => setTriggers({ ...triggers, abandoned: value })}
                  />
                  <Checkbox
                    label="Post conversion"
                    checked={triggers.post_conversion}
                    onChange={(value) => setTriggers({ ...triggers, post_conversion: value })}
                  />
                  <Checkbox
                    label="Chat end (all other closures)"
                    checked={triggers.chat_end}
                    onChange={(value) => setTriggers({ ...triggers, chat_end: value })}
                  />
                </BlockStack>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2">Channels</Text>
              <div style={{ marginTop: '16px' }}>
                <BlockStack gap="400">
                  <div>
                    <Text variant="headingSm" as="h3">Email</Text>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Email address"
                          labelHidden
                          value={channels.email.to || ''}
                          onChange={(value) => setChannels({ ...channels, email: { to: value } })}
                          placeholder="alerts@example.com"
                          autoComplete="off"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSendTest('email')} 
                        disabled={!channels.email.to}
                        loading={settingsFetcher.state === 'submitting' || testFetcher.state === 'submitting'}
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Text variant="headingSm" as="h3">SMS</Text>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Phone number"
                          labelHidden
                          value={channels.sms.to || ''}
                          onChange={(value) => setChannels({ ...channels, sms: { to: value } })}
                          placeholder="+1234567890"
                          autoComplete="off"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSendTest('sms')} 
                        disabled={!channels.sms.to}
                        loading={settingsFetcher.state === 'submitting' || testFetcher.state === 'submitting'}
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Text variant="headingSm" as="h3">Slack</Text>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Webhook URL"
                          labelHidden
                          value={channels.slack.url || ''}
                          onChange={(value) => setChannels({ ...channels, slack: { url: value } })}
                          placeholder="https://hooks.slack.com/services/..."
                          autoComplete="off"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSendTest('slack')} 
                        disabled={!channels.slack.url}
                        loading={settingsFetcher.state === 'submitting' || testFetcher.state === 'submitting'}
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Text variant="headingSm" as="h3">Custom Webhook</Text>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Webhook URL"
                          labelHidden
                          value={channels.webhook.url || ''}
                          onChange={(value) => setChannels({ ...channels, webhook: { url: value } })}
                          placeholder="https://your-server.com/webhook"
                          autoComplete="off"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSendTest('webhook')} 
                        disabled={!channels.webhook.url}
                        loading={settingsFetcher.state === 'submitting' || testFetcher.state === 'submitting'}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2">Quiet Hours</Text>
              <div style={{ marginTop: '16px' }}>
                <BlockStack gap="300">
                  <Checkbox
                    label="Enable quiet hours"
                    checked={quietHours.enabled}
                    onChange={(value) => setQuietHours({ ...quietHours, enabled: value })}
                  />
                  {quietHours.enabled && (
                    <>
                      <TextField
                        label="Start time"
                        value={quietHours.start}
                        onChange={(value) => setQuietHours({ ...quietHours, start: value })}
                        type="time"
                        autoComplete="off"
                      />
                      <TextField
                        label="End time"
                        value={quietHours.end}
                        onChange={(value) => setQuietHours({ ...quietHours, end: value })}
                        type="time"
                        autoComplete="off"
                      />
                      <TextField
                        label="Timezone"
                        value={quietHours.tz}
                        onChange={(value) => setQuietHours({ ...quietHours, tz: value })}
                        placeholder="America/Chicago"
                        autoComplete="off"
                      />
                    </>
                  )}
                </BlockStack>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="end">
            <Button primary onClick={handleSaveSettings} loading={settingsFetcher.state === 'submitting'}>
              Save Settings
            </Button>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Text variant="headingMd" as="h2">Alert History</Text>
                <Button onClick={handleLoadHistory}>Load History</Button>
              </div>

              {historyRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'text']}
                  headings={['Time', 'Type', 'Channel', 'Status', 'Attempts', 'Error']}
                  rows={historyRows}
                />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Text variant="bodyMd" as="p">No alert history yet. Click Load History to view.</Text>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

