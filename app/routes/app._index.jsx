import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="MattressAI Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">
                  Welcome to MattressAI 🎉
                </Text>
                <Text variant="bodyMd" as="p">
                  Your AI-powered shopping assistant is ready to help customers find the perfect mattress. 
                  Get started by configuring your product catalog and customizing your chat experience.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Quick Actions</Text>
              
              <Layout>
                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">📦 Catalog</Text>
                      <Text variant="bodyMd">Index your products for AI recommendations</Text>
                              <Button onClick={() => navigate("/app/admin/catalog-indexing")} fullWidth>
                                Manage Catalog
                              </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">✍️ Prompts</Text>
                      <Text variant="bodyMd">Customize AI behavior and responses</Text>
                              <Button onClick={() => navigate("/app/admin/prompt-builder")} fullWidth>
                                Build Prompts
                              </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">📊 Analytics</Text>
                      <Text variant="bodyMd">Track conversations and conversions</Text>
                              <Button onClick={() => navigate("/app/admin/analytics-dashboard")} fullWidth>
                                View Analytics
                              </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>
              </Layout>

              <Layout>
                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">👥 Leads</Text>
                      <Text variant="bodyMd">Manage customer inquiries</Text>
                              <Button onClick={() => navigate("/app/admin/leads-management")} fullWidth>
                                View Leads
                              </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">🧪 Experiments</Text>
                      <Text variant="bodyMd">A/B test prompts and recommendations</Text>
                              <Button onClick={() => navigate("/app/admin/experiments")} fullWidth>
                                Run Experiments
                              </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">💳 Plans</Text>
                      <Text variant="bodyMd">View usage and upgrade options</Text>
                              <Button onClick={() => navigate("/app/admin/plans")} fullWidth>
                                Manage Plan
                              </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>
              </Layout>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">🚀 Getting Started</Text>
                  <BlockStack gap="100">
                    <Text variant="bodyMd">1. Index your product catalog</Text>
                    <Text variant="bodyMd">2. Customize your AI prompts</Text>
                    <Text variant="bodyMd">3. Enable the theme extension</Text>
                    <Text variant="bodyMd">4. Test on your storefront</Text>
                  </BlockStack>
                  <Button 
                    url="https://docs.mattressai.com" 
                    external
                    fullWidth
                  >
                    View Documentation
                  </Button>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">🔔 Alerts</Text>
                  <Text variant="bodyMd">Monitor system health and notifications</Text>
                              <Button onClick={() => navigate("/app/admin/alerts-management")} fullWidth>
                                View Alerts
                              </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
