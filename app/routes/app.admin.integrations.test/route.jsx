import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useMemo } from 'react';
import {
  Page,
  Layout,
  Card,
  Button,
  TextField,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Divider
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';
import { sendTestAlert } from '~/lib/alerts/alert.service.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export const action = async ({ request }) => {
  try {
    const auth = await authenticate.admin(request);
    const { shop } = auth;

    const body = await request.json();
    const { channel, config } = body;

    if (!channel) {
      return json(
        { success: false, error: 'Channel is required' },
        { status: 400 }
      );
    }

    // Send test alert
    await sendTestAlert(shop, channel, config || {});

    return json({
      success: true,
      message: `Test ${channel} notification sent successfully!`
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
};

export default function IntegrationsTest() {
  const fetcher = useFetcher();
  const [testResults, setTestResults] = useState(null);

  // Twilio SMS Test
  const [smsPhone, setSmsPhone] = useState('');

  // Podium Test
  const [podiumLocationId, setPodiumLocationId] = useState('');
  const [podiumApiKey, setPodiumApiKey] = useState('');

  // Birdeye Test
  const [birdeyeBusinessId, setBirdeyeBusinessId] = useState('');
  const [birdeyeApiKey, setBirdeyeApiKey] = useState('');

  const handleTestSMS = () => {
    if (!smsPhone) {
      setTestResults({ success: false, error: 'Phone number is required' });
      return;
    }

    fetcher.submit(
      {
        channel: 'sms',
        config: { to: smsPhone }
      },
      { method: 'post', encType: 'application/json' }
    );
  };

  const handleTestPodium = () => {
    if (!podiumLocationId || !podiumApiKey) {
      setTestResults({ success: false, error: 'Podium Location ID and API Key are required' });
      return;
    }

    fetcher.submit(
      {
        channel: 'podium',
        config: {
          locationId: podiumLocationId,
          apiKey: podiumApiKey
        }
      },
      { method: 'post', encType: 'application/json' }
    );
  };

  const handleTestBirdeye = () => {
    if (!birdeyeBusinessId || !birdeyeApiKey) {
      setTestResults({ success: false, error: 'Birdeye Business ID and API Key are required' });
      return;
    }

    fetcher.submit(
      {
        channel: 'birdeye',
        config: {
          businessId: birdeyeBusinessId,
          apiKey: birdeyeApiKey
        }
      },
      { method: 'post', encType: 'application/json' }
    );
  };

  // Update test results when fetcher data changes
  if (fetcher.data && fetcher.data !== testResults) {
    setTestResults(fetcher.data);
  }

  // Memoize primaryAction to prevent infinite re-renders
  const titleBarPrimaryAction = useMemo(() => ({
    content: 'Back to Settings',
    onAction: () => window.location.href = '/app/admin/alerts/settings'
  }), []);

  return (
    <Page>
      <TitleBar
        title="Test Integrations"
        primaryAction={titleBarPrimaryAction}
      />
      <Layout>
        <Layout.Section>
          {testResults && (
            <Card>
              <BlockStack gap="400">
                {testResults.success ? (
                  <Banner status="success" onDismiss={() => setTestResults(null)}>
                    <p>{testResults.message}</p>
                  </Banner>
                ) : (
                  <Banner status="critical" onDismiss={() => setTestResults(null)}>
                    <p>{testResults.error}</p>
                  </Banner>
                )}
              </BlockStack>
            </Card>
          )}

          {/* Twilio SMS Test */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Test Twilio SMS
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Send a test SMS to verify your Twilio configuration.
              </Text>
              <TextField
                label="Phone Number"
                value={smsPhone}
                onChange={setSmsPhone}
                placeholder="+15551234567"
                helpText="Include country code (e.g., +1 for US)"
                autoComplete="tel"
              />
              <InlineStack align="start">
                <Button
                  primary
                  onClick={handleTestSMS}
                  loading={fetcher.state === 'submitting'}
                >
                  Send Test SMS
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          <Divider />

          {/* Podium Test */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Test Podium Integration
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Send a test lead to Podium to verify your integration.
              </Text>
              <TextField
                label="Podium Location ID"
                value={podiumLocationId}
                onChange={setPodiumLocationId}
                placeholder="your-location-id"
                autoComplete="off"
              />
              <TextField
                label="Podium API Key"
                value={podiumApiKey}
                onChange={setPodiumApiKey}
                type="password"
                placeholder="your-api-key"
                autoComplete="off"
              />
              <InlineStack align="start">
                <Button
                  primary
                  onClick={handleTestPodium}
                  loading={fetcher.state === 'submitting'}
                >
                  Send Test Lead to Podium
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          <Divider />

          {/* Birdeye Test */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Test Birdeye Integration
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Send a test lead to Birdeye to verify your integration.
              </Text>
              <TextField
                label="Birdeye Business ID"
                value={birdeyeBusinessId}
                onChange={setBirdeyeBusinessId}
                placeholder="your-business-id"
                autoComplete="off"
              />
              <TextField
                label="Birdeye API Key"
                value={birdeyeApiKey}
                onChange={setBirdeyeApiKey}
                type="password"
                placeholder="your-api-key"
                autoComplete="off"
              />
              <InlineStack align="start">
                <Button
                  primary
                  onClick={handleTestBirdeye}
                  loading={fetcher.state === 'submitting'}
                >
                  Send Test Lead to Birdeye
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                About Testing
              </Text>
              <Text variant="bodyMd" as="p">
                Use this page to test your integrations before enabling them for live alerts.
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Twilio:</strong> Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER environment variables.
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Podium:</strong> Requires a Podium account with API access. Get your Location ID and API Key from Podium dashboard.
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Birdeye:</strong> Requires a Birdeye account with API access. Get your Business ID and API Key from Birdeye dashboard.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

