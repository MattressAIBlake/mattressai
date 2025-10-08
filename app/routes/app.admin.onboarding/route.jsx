import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { Card, Page, Layout, Button, Text, BlockStack, List, Divider } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function Onboarding() {
  const handleActivateEmbed = () => {
    // Deep link to Shopify Theme Editor for App Embed activation
    const deepLink = `https://admin.shopify.com/store/YOUR_STORE_DOMAIN/themes/editor?appEmbed=mattressai-widget`;
    window.open(deepLink, '_blank');
  };

  return (
    <Page>
      <TitleBar 
        title="Welcome to MattressAI"
        primaryAction={null}
        secondaryActions={[
          {
            content: 'Back to Dashboard',
            onAction: () => window.location.href = '/app'
          }
        ]}
      />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2" fontWeight="bold">
                Setup Complete
              </Text>
              <Text variant="bodyLg" as="p" tone="subdued">
                Your MattressAI app has been installed successfully. To start helping customers on your storefront,
                you need to activate the App Embed block in your theme.
              </Text>
              <Button
                variant="primary"
                size="large"
                onClick={handleActivateEmbed}
              >
                Activate Storefront App Embed
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Next Steps
              </Text>
              <Divider />
              <Text variant="bodyMd" as="p" tone="subdued">
                After activating the App Embed:
              </Text>
              <List>
                <List.Item>The MattressAI widget will appear on your storefront</List.Item>
                <List.Item>Customers can start conversations with your AI assistant</List.Item>
                <List.Item>Configure widget settings in Theme Customizer</List.Item>
                <List.Item>Monitor conversations in your admin dashboard</List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
