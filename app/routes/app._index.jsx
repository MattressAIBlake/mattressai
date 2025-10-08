import { useState } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  InlineStack,
  Divider,
  Modal,
  List,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const navigate = useNavigate();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

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
                  and <strong style={{ color: '#449de7' }}>generate very warm leads</strong> that boost conversions beyond price-driven decisions.
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
                    onClick={() => setInstructionsOpen(true)}
                    variant="primary"
                    fullWidth
                  >
                    View Instructions
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

      <Modal
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        title="Getting Started with MattressAI"
        primaryAction={{
          content: 'Close',
          onAction: () => setInstructionsOpen(false),
        }}
        large
      >
        <Modal.Section>
          <BlockStack gap="500">
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Welcome to MattressAI! 🎉
              </Text>
              <Text variant="bodyMd" as="p">
                MattressAI is your intelligent shopping assistant that helps customers find the perfect products through AI-powered conversations. Follow these steps to get your AI assistant up and running.
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Step 1: Index Your Product Catalog
              </Text>
              <Text variant="bodyMd" as="p">
                Before your AI can make recommendations, it needs to understand your products.
              </Text>
              <List type="number">
                <List.Item>Navigate to <strong>Catalog Management</strong> from the dashboard</List.Item>
                <List.Item>Click <strong>"Start Indexing"</strong> to begin the process</List.Item>
                <List.Item>Wait for indexing to complete (this may take a few minutes depending on catalog size)</List.Item>
                <List.Item>Your products will be enriched with AI-generated descriptions and embeddings</List.Item>
              </List>
              <Text variant="bodyMd" as="p" tone="subdued">
                💡 <strong>Tip:</strong> You only need to index once. The system will automatically update when products change via webhooks.
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Step 2: Customize Your AI Prompts
              </Text>
              <Text variant="bodyMd" as="p">
                Tailor how your AI assistant interacts with customers to match your brand voice.
              </Text>
              <List type="number">
                <List.Item>Go to <strong>Prompt Engineering</strong></List.Item>
                <List.Item>Choose a conversation tone (Friendly, Professional, Casual, etc.)</List.Item>
                <List.Item>Set the maximum number of questions the AI can ask</List.Item>
                <List.Item>Configure lead capture settings (when to ask for email, phone, etc.)</List.Item>
                <List.Item>Review your configuration and click <strong>"Activate Prompt"</strong></List.Item>
              </List>
              <Text variant="bodyMd" as="p" tone="subdued">
                💡 <strong>Tip:</strong> Start with default settings and refine based on customer interactions.
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Step 3: Enable the Theme Extension
              </Text>
              <Text variant="bodyMd" as="p">
                Add the MattressAI widget to your storefront.
              </Text>
              <List type="number">
                <List.Item>Go to your Shopify admin → <strong>Online Store → Themes</strong></List.Item>
                <List.Item>Click <strong>"Customize"</strong> on your active theme</List.Item>
                <List.Item>In the theme editor, click <strong>"Add section"</strong> or <strong>"Add block"</strong></List.Item>
                <List.Item>Look for <strong>"MattressAI Widget"</strong> in the Apps section</List.Item>
                <List.Item>Add it to your desired location (typically footer or as a floating widget)</List.Item>
                <List.Item>Customize the appearance (colors, position, etc.)</List.Item>
                <List.Item>Click <strong>"Save"</strong></List.Item>
              </List>
              <Text variant="bodyMd" as="p" tone="subdued">
                💡 <strong>Tip:</strong> The widget works best as a floating button in the bottom-right corner.
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Step 4: Test on Your Storefront
              </Text>
              <Text variant="bodyMd" as="p">
                Verify everything is working correctly before customers start using it.
              </Text>
              <List type="number">
                <List.Item>Visit your storefront in a new browser tab or incognito window</List.Item>
                <List.Item>Look for the MattressAI chat widget</List.Item>
                <List.Item>Click to open the chat and start a conversation</List.Item>
                <List.Item>Ask about products and verify recommendations appear</List.Item>
                <List.Item>Test the lead capture flow by providing contact information</List.Item>
                <List.Item>Return to the admin and check <strong>Analytics Dashboard</strong> for the session</List.Item>
              </List>
              <Text variant="bodyMd" as="p" tone="subdued">
                💡 <strong>Tip:</strong> Test various product queries to ensure the AI understands your catalog.
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Additional Features
              </Text>
              <BlockStack gap="300">
                <div>
                  <Text variant="bodyMd" as="p" fontWeight="semibold">
                    📊 Analytics Dashboard
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Track conversion funnels, session metrics, and product performance. Monitor how customers interact with your AI assistant.
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd" as="p" fontWeight="semibold">
                    👥 Lead Management
                  </Text>
                  <Text variant="bodyMd" as="p">
                    View and manage captured leads. Follow up with high-intent customers who engaged with your AI but didn't convert.
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd" as="p" fontWeight="semibold">
                    🔔 System Alerts
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Set up notifications for important events like high-intent sessions, lead captures, and abandoned conversations.
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd" as="p" fontWeight="semibold">
                    💳 Plans & Billing
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Monitor your usage and upgrade your plan as your business grows. View session limits and feature availability.
                  </Text>
                </div>
              </BlockStack>
            </BlockStack>

            <Divider />

            <BlockStack gap="300">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                Need Help?
              </Text>
              <Text variant="bodyMd" as="p">
                If you encounter any issues or have questions:
              </Text>
              <List>
                <List.Item>Check the <strong>System Alerts</strong> page for any error notifications</List.Item>
                <List.Item>Ensure your product catalog has been fully indexed</List.Item>
                <List.Item>Verify your prompt configuration is activated</List.Item>
                <List.Item>Make sure the theme extension is properly enabled</List.Item>
              </List>
              <Text variant="bodyMd" as="p">
                Contact support if you need additional assistance: <strong>system@themattressai.com</strong>
              </Text>
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
