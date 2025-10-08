import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { Card, Page, Layout, Button, Text } from '@shopify/polaris';

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
    <Page title="Welcome to MattressAI">
      <Layout>
        <Layout.Section>
          <Card>
            <div>
              <Text variant="headingMd" as="h2">
                Setup Complete!
              </Text>
              <br />
              <Text variant="bodyMd" as="p">
                Your MattressAI app has been installed successfully. To start helping customers on your storefront,
                you need to activate the App Embed block.
              </Text>
            </div>
            <div>
              <Button
                primary
                size="large"
                onClick={handleActivateEmbed}
              >
                Activate Storefront App Embed
              </Button>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div>
              <Text variant="headingMd" as="h3">
                Next Steps
              </Text>
              <br />
              <Text variant="bodyMd" as="p">
                After activating the App Embed:
              </Text>
              <ul style={{ marginLeft: '20px' }}>
                <li>• The MattressAI widget will appear on your storefront</li>
                <li>• Customers can start conversations with your AI assistant</li>
                <li>• Configure widget settings in Theme Customizer</li>
                <li>• Monitor conversations in your admin dashboard</li>
              </ul>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
