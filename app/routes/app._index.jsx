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

// Modern gradient button style
const gradientButtonStyle = {
  background: 'linear-gradient(135deg, #5B8DEE 0%, #0BC5EA 50%, #48BB78 100%)',
  border: 'none',
  color: 'white',
  fontWeight: '600',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
};

// Gradient text style for headings
const gradientTextStyle = {
  background: 'linear-gradient(135deg, #5B8DEE 0%, #0BC5EA 50%, #48BB78 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

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
                <div style={gradientTextStyle}>
                  <Text as="h1" variant="headingXl" fontWeight="bold">
                    Welcome to MattressAI
                  </Text>
                </div>
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
                      <div style={gradientButtonStyle} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}>
                        <Button 
                          onClick={() => navigate("/app/admin/catalog-indexing")} 
                          fullWidth
                        >
                          Manage Catalog
                        </Button>
                      </div>
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
                      <div style={gradientButtonStyle} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}>
                        <Button 
                          onClick={() => navigate("/app/admin/prompt-builder")} 
                          fullWidth
                        >
                          Build Prompts
                        </Button>
                      </div>
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
                      <div style={gradientButtonStyle} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}>
                        <Button 
                          onClick={() => navigate("/app/admin/analytics-dashboard")} 
                          fullWidth
                        >
                          View Analytics
                        </Button>
                      </div>
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
                      <div style={gradientButtonStyle} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}>
                        <Button 
                          onClick={() => navigate("/app/admin/leads-management")} 
                          fullWidth
                        >
                          View Leads
                        </Button>
                      </div>
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
                      <div style={gradientButtonStyle} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}>
                        <Button 
                          onClick={() => navigate("/app/admin/experiments")} 
                          fullWidth
                        >
                          Run Experiments
                        </Button>
                      </div>
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
                      <div style={gradientButtonStyle} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}>
                        <Button 
                          onClick={() => navigate("/app/admin/plans")} 
                          fullWidth
                        >
                          Manage Plan
                        </Button>
                      </div>
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
                  <div style={gradientButtonStyle} onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }} onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }}>
                    <Button 
                      url="https://docs.mattressai.com" 
                      external
                      fullWidth
                    >
                      View Documentation
                    </Button>
                  </div>
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
