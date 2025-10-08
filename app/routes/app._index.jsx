import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="MattressAI Dashboard" />
      <BlockStack gap="600">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h1" variant="headingXl" fontWeight="bold">
                  Welcome to MattressAI
                </Text>
                <Text variant="bodyLg" as="p" tone="subdued">
                  Deploy AI assistants across sales channels to engage shoppers, match their needs, 
                  and boost conversions beyond price-driven decisions.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <BlockStack gap="500">
              <Text as="h2" variant="headingLg" fontWeight="semibold">
                Quick Actions
              </Text>
              
              <Layout>
                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        Catalog Management
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Index your products for AI recommendations
                      </Text>
                      <Button 
                        onClick={() => navigate("/app/admin/catalog-indexing")} 
                        variant="primary"
                        fullWidth
                      >
                        Manage Catalog
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        Prompt Engineering
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Customize AI behavior and responses
                      </Text>
                      <Button 
                        onClick={() => navigate("/app/admin/prompt-builder")} 
                        fullWidth
                      >
                        Build Prompts
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        Analytics Dashboard
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Track conversations and conversions
                      </Text>
                      <Button 
                        onClick={() => navigate("/app/admin/analytics-dashboard")} 
                        fullWidth
                      >
                        View Analytics
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>
              </Layout>

              <Layout>
                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        Lead Management
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Manage customer inquiries and contacts
                      </Text>
                      <Button 
                        onClick={() => navigate("/app/admin/leads-management")} 
                        fullWidth
                      >
                        View Leads
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        A/B Testing
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Experiment with prompts and recommendations
                      </Text>
                      <Button 
                        onClick={() => navigate("/app/admin/experiments")} 
                        fullWidth
                      >
                        Run Experiments
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        Plans & Billing
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        View usage and upgrade options
                      </Text>
                      <Button 
                        onClick={() => navigate("/app/admin/plans")} 
                        fullWidth
                      >
                        Manage Plan
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>
              </Layout>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd" fontWeight="semibold">
                    Getting Started
                  </Text>
                  <Divider />
                  <BlockStack gap="200">
                    <Text variant="bodyMd">1. Index your product catalog</Text>
                    <Text variant="bodyMd">2. Customize your AI prompts</Text>
                    <Text variant="bodyMd">3. Enable the theme extension</Text>
                    <Text variant="bodyMd">4. Test on your storefront</Text>
                  </BlockStack>
                  <Button 
                    url="https://docs.mattressai.com" 
                    external
                    variant="primary"
                    fullWidth
                  >
                    View Documentation
                  </Button>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd" fontWeight="semibold">
                    System Alerts
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    Monitor system health and notifications
                  </Text>
                  <Button 
                    onClick={() => navigate("/app/admin/alerts-management")} 
                    fullWidth
                  >
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
