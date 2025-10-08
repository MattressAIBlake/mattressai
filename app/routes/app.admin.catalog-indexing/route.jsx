import { json } from '@remix-run/node';
import { useState, useEffect } from 'react';
import { useLoaderData, useFetcher } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  ProgressBar,
  Banner,
  Box,
  Badge,
  List,
  Divider,
  Spinner,
  Icon,
  BlockStack,
  InlineStack,
  Modal,
  TextField,
  RadioButton,
  Toast,
  Frame
} from '@shopify/polaris';
import {
  DatabaseIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Loader function - get current indexing status
 */
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  // In a real implementation, this would call the status endpoint
  // For now, return mock data
  return json({
    shop: session.shop,
    currentJob: null, // Will be populated by the status endpoint
    recentJobs: [],
    isIndexing: false,
    configuration: {
      useAIEnrichment: true,
      confidenceThreshold: 0.7
    }
  });
}

/**
 * Action function - handle start/stop indexing and save fallback preferences
 */
export async function action({ request }) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const actionType = formData.get('action');

  if (actionType === 'saveFallback') {
    // Save fallback message preferences
    const fallbackMessageType = formData.get('fallbackMessageType');
    const fallbackContactInfo = formData.get('fallbackContactInfo');

    try {
      // Ensure tenant exists or update it
      await prisma.tenant.upsert({
        where: { shop: session.shop },
        update: {
          fallbackMessageType,
          fallbackContactInfo
        },
        create: {
          id: session.shop,
          shop: session.shop,
          fallbackMessageType,
          fallbackContactInfo
        }
      });

      return json({
        success: true,
        message: 'Fallback preferences saved successfully'
      });
    } catch (error) {
      console.error('Failed to save fallback preferences:', error);
      return json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }
  }

  if (actionType === 'start') {
    // Start indexing job with hardcoded optimal settings
    const useAIEnrichment = true; // Always enabled for best results
    const confidenceThreshold = 0.7; // 70% - optimal balance

    // Forward the request to the actual indexing endpoint
    const startIndexForm = new FormData();
    startIndexForm.append('useAIEnrichment', useAIEnrichment.toString());
    startIndexForm.append('confidenceThreshold', confidenceThreshold.toString());

    try {
      // In production, this would call the actual /admin/index/start endpoint
      // For now, return a success response
      return json({
        success: true,
        message: 'Indexing job started',
        jobId: `job-${Date.now()}`,
        shop: session.shop,
        configuration: { useAIEnrichment, confidenceThreshold }
      });
    } catch (error) {
      console.error('Failed to start indexing:', error);
      return json(
        { error: 'Failed to start indexing job' },
        { status: 500 }
      );
    }
  }

  if (actionType === 'stop') {
    // Stop indexing job
    return json({
      success: true,
      message: 'Indexing job stopped'
    });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}

/**
 * Main component
 */
export default function CatalogIndexing() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const fallbackFetcher = useFetcher();

  const [isStarting, setIsStarting] = useState(false);
  const [showNoMattressesModal, setShowNoMattressesModal] = useState(false);
  const [fallbackMessageType, setFallbackMessageType] = useState('call_store');
  const [fallbackContactInfo, setFallbackContactInfo] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Poll for status updates when indexing is active
  useEffect(() => {
    if (data.isIndexing) {
      const interval = setInterval(() => {
        fetcher.load('/app/admin/index/status');
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [data.isIndexing, fetcher]);

  // Reset isStarting when fetcher completes
  useEffect(() => {
    if (fetcher.state === 'idle' && isStarting) {
      setIsStarting(false);
    }
  }, [fetcher.state, isStarting]);

  // Check if indexing completed with 0 mattresses
  useEffect(() => {
    if (fetcher.data?.currentJob?.status === 'completed' && 
        fetcher.data?.currentJob?.errorMessage === 'NO_MATTRESSES_FOUND') {
      setToastMessage('Our AI found 0 mattresses in your catalog');
      setShowToast(true);
      setShowNoMattressesModal(true);
    }
  }, [fetcher.data]);

  // Handle fallback preferences save success
  useEffect(() => {
    if (fallbackFetcher.data?.success) {
      setToastMessage('Fallback message preferences saved successfully!');
      setShowToast(true);
      setShowNoMattressesModal(false);
    }
  }, [fallbackFetcher.data]);

  // Check for conflict error (job already running)
  const hasConflictError = fetcher.data?.error?.includes('already running') || 
                           fetcher.data?.error === 'An indexing job is already running for this shop';

  // Handle start indexing
  const handleStartIndexing = () => {
    setIsStarting(true);

    const formData = new FormData();
    formData.append('useAIEnrichment', 'true');
    formData.append('confidenceThreshold', '0.7');

    // Submit to the actual indexing endpoint
    fetcher.submit(formData, { 
      method: 'POST',
      action: '/app/admin/index/start'
    });
  };

  // Handle stop indexing
  const handleStopIndexing = async () => {
    const formData = new FormData();
    formData.append('action', 'stop');

    await fetcher.submit(formData, { method: 'POST' });
  };

  // Handle save fallback preferences
  const handleSaveFallbackPreferences = () => {
    const formData = new FormData();
    formData.append('action', 'saveFallback');
    formData.append('fallbackMessageType', fallbackMessageType);
    formData.append('fallbackContactInfo', fallbackContactInfo);

    fallbackFetcher.submit(formData, { method: 'POST' });
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format cost
  const formatCost = (cost) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cost || 0);
  };

  const currentJob = data.currentJob;
  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting';

  return (
    <Page
      title="Catalog Indexing"
      subtitle="Index your mattress catalog for AI-powered recommendations and search"
      breadcrumbs={[
        { content: 'Home', url: '/app' }
      ]}
    >
      <Layout>
        {/* Error Banner for Job Already Running */}
        {hasConflictError && (
          <Layout.Section>
            <Banner
              title="Indexing Job Already Running"
              tone="warning"
              onDismiss={() => fetcher.load('/app/admin/index/status')}
            >
              <p>
                There's already an indexing job in progress. Please wait for it to complete before starting a new one. 
                If the job appears stuck, it will automatically timeout after 30 minutes, or you can refresh this page and try again.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {/* Current Job Status */}
        <Layout.Section>
          <Card>
            <div>
              <div className="flex justify-between items-center mb-4">
                <Text variant="headingMd" as="h2" fontWeight="semibold">
                  Current Status
                </Text>
                <div className="flex gap-2">
                  {!currentJob && !isStarting && (
                    <Button
                      primary
                      onClick={handleStartIndexing}
                      loading={isLoading}
                    >
                      Start Indexing
                    </Button>
                  )}
                  {currentJob && currentJob.status === 'running' && (
                    <Button
                      destructive
                      onClick={handleStopIndexing}
                      loading={isLoading}
                    >
                      Stop Indexing
                    </Button>
                  )}
                </div>
              </div>

              {!currentJob && !isStarting ? (
                <div className="py-12 px-6">
                  <BlockStack gap="600" align="center">
                    <div className="flex justify-center items-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Icon
                        source={DatabaseIcon}
                        tone="info"
                      />
                    </div>
                    
                    <BlockStack gap="200" align="center">
                      <Text variant="headingLg" as="h3" alignment="center">
                        Ready to Index Your Mattress Catalog
                      </Text>
                      <div className="max-w-lg">
                        <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
                          Your mattress catalog hasn't been indexed yet. Start indexing to enable AI-powered mattress recommendations for your customers.
                        </Text>
                      </div>
                    </BlockStack>

                    <div className="w-full max-w-2xl">
                      <Card background="bg-surface-secondary">
                        <BlockStack gap="400">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Icon source={CheckCircleIcon} tone="success" />
                            </div>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4">
                                Step 1: Ensure you have mattresses in your Shopify store
                              </Text>
                              <Text variant="bodyMd" as="p" tone="subdued">
                                Make sure your mattresses are properly configured with titles, descriptions, specifications, and relevant details like firmness, size, and materials.
                              </Text>
                            </BlockStack>
                          </div>

                          <Divider />

                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Icon source={CheckCircleIcon} tone="success" />
                            </div>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4">
                                Step 2: Click "Start Indexing" above
                              </Text>
                              <Text variant="bodyMd" as="p" tone="subdued">
                                Our AI will automatically analyze your entire mattress catalog, extracting key attributes like firmness, materials, support type, and sleep position compatibility using optimal settings.
                              </Text>
                            </BlockStack>
                          </div>

                          <Divider />

                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Icon source={CheckCircleIcon} tone="success" />
                            </div>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4">
                                Step 3: Monitor progress
                              </Text>
                              <Text variant="bodyMd" as="p" tone="subdued">
                                The indexing typically processes 50-100 mattresses per minute. You can leave this page and come back to check progress anytime.
                              </Text>
                            </BlockStack>
                          </div>
                        </BlockStack>
                      </Card>
                    </div>

                    <Banner tone="info">
                      <p>
                        <strong>First time indexing?</strong> Depending on your catalog size, this may take several minutes. You'll see detailed progress updates once indexing begins.
                      </p>
                    </Banner>
                  </BlockStack>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <Badge
                      status={
                        currentJob?.status === 'completed' ? 'success' :
                        currentJob?.status === 'running' ? 'info' :
                        currentJob?.status === 'failed' ? 'critical' :
                        'attention'
                      }
                    >
                      {currentJob?.status || 'starting'}
                    </Badge>
                    {currentJob?.startedAt && (
                      <Text variant="bodySm" color="subdued">
                        Started {new Date(currentJob.startedAt).toLocaleString()}
                      </Text>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {currentJob && currentJob.totalProducts > 0 && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <Text variant="bodyMd" as="p">
                          Progress: {currentJob.processedProducts || 0} / {currentJob.totalProducts} mattresses
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {((currentJob.progress || 0) * 100).toFixed(1)}%
                        </Text>
                      </div>
                      <ProgressBar
                        progress={currentJob.progress || 0}
                        size="medium"
                      />
                    </div>
                  )}

                  {/* ETA */}
                  {currentJob?.eta && (
                    <div className="flex items-center gap-2">
                      <Text variant="bodySm" color="subdued">
                        Estimated completion:
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {new Date(currentJob.eta).toLocaleString()}
                      </Text>
                    </div>
                  )}

                  {/* Metrics */}
                  {currentJob && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <Text variant="headingSm" as="h3">
                          {currentJob.metrics?.tokensUsed || 0}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          Tokens Used
                        </Text>
                      </div>
                      <div className="text-center">
                        <Text variant="headingSm" as="h3">
                          {formatCost(currentJob.metrics?.actualCost || currentJob.metrics?.costEstimate)}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          Cost
                        </Text>
                      </div>
                      <div className="text-center">
                        <Text variant="headingSm" as="h3">
                          {currentJob.metrics?.failedProducts || 0}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          Failed
                        </Text>
                      </div>
                      <div className="text-center">
                        <Text variant="headingSm" as="h3">
                          {currentJob.metrics?.processedProducts || 0}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          Processed
                        </Text>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {currentJob?.errorMessage && (
                    <Banner status="critical">
                      <p>{currentJob.errorMessage}</p>
                    </Banner>
                  )}
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Recent Jobs */}
        <Layout.Section>
          <Card>
            <div>
              <Text variant="headingMd" as="h2" fontWeight="semibold">
                Recent Jobs
              </Text>

              {data.recentJobs.length === 0 ? (
                <div className="mt-4">
                  <Text variant="bodyMd" color="subdued">
                    No indexing jobs yet. Start your first indexing job above to analyze your mattress catalog.
                  </Text>
                </div>
              ) : (
                <div className="mt-4">
                  <List>
                    {data.recentJobs.map((job) => (
                      <List.Item key={job.id}>
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-3">
                            <Badge
                              status={
                                job.status === 'completed' ? 'success' :
                                job.status === 'failed' ? 'critical' :
                                job.status === 'running' ? 'info' :
                                'attention'
                              }
                            >
                              {job.status}
                            </Badge>
                            <div>
                              <Text variant="bodyMd" as="p">
                                {job.totalProducts} mattresses • {formatCost(job.actualCost || job.costEstimate)}
                              </Text>
                              <Text variant="bodySm" color="subdued">
                                {job.startedAt && new Date(job.startedAt).toLocaleString()}
                                {job.finishedAt && ` • ${formatDuration(job.duration)}`}
                              </Text>
                            </div>
                          </div>
                          <div className="text-right">
                            <Text variant="bodySm" color="subdued">
                              {job.tokensUsed} tokens
                            </Text>
                          </div>
                        </div>
                      </List.Item>
                    ))}
                  </List>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Information Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2" fontWeight="semibold">
                About Catalog Indexing
              </Text>
              
              <Text variant="bodyMd" as="p">
                Catalog indexing analyzes your mattress catalog and creates intelligent embeddings for AI-powered recommendations. Our system automatically extracts key mattress attributes and uses optimal settings to ensure the best customer experience.
              </Text>

              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  What happens during indexing:
                </Text>
                <List>
                  <List.Item>Extract mattress information from your Shopify catalog</List.Item>
                  <List.Item>AI analyzes descriptions to identify firmness, materials, support type, and sleep position compatibility</List.Item>
                  <List.Item>Generate vector embeddings for intelligent mattress matching</List.Item>
                  <List.Item>Store embeddings for instant recommendation delivery</List.Item>
                </List>
              </BlockStack>

              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  Optimized for mattress retail:
                </Text>
                <List>
                  <List.Item>
                    <strong>AI Enrichment:</strong> Automatically extracts firmness levels, materials, support types, cooling features, and sleep position compatibility
                  </List.Item>
                  <List.Item>
                    <strong>Confidence Threshold:</strong> Set to 70% for optimal balance between coverage and accuracy
                  </List.Item>
                  <List.Item>
                    <strong>Processing Speed:</strong> Typically 50-100 mattresses per minute
                  </List.Item>
                </List>
              </BlockStack>

              <Banner tone="info">
                <p>
                  <strong>Pro Tip:</strong> Re-index your catalog periodically (e.g., monthly) to keep your AI recommendations up-to-date with new mattresses, pricing changes, and updated descriptions.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* No Mattresses Modal */}
      <Modal
        open={showNoMattressesModal}
        onClose={() => setShowNoMattressesModal(false)}
        title="No Mattresses Found"
        primaryAction={{
          content: 'Save Preferences',
          onAction: handleSaveFallbackPreferences,
          loading: fallbackFetcher.state === 'submitting'
        }}
        secondaryActions={[
          {
            content: 'Close',
            onAction: () => setShowNoMattressesModal(false)
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="warning">
              <p>
                Our AI didn't find any mattresses in your Shopify catalog. Please add mattresses to your store to enable AI-powered recommendations.
              </p>
            </Banner>

            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">
                In the meantime, what would you like to tell shoppers?
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Choose what message the AI widget should show at the end of conversations when no mattresses are indexed:
              </Text>
            </BlockStack>

            <BlockStack gap="300">
              <RadioButton
                label="Call your store"
                helpText="The AI will suggest customers call your store for assistance"
                checked={fallbackMessageType === 'call_store'}
                id="call_store"
                name="fallbackMessageType"
                onChange={() => setFallbackMessageType('call_store')}
              />
              
              {fallbackMessageType === 'call_store' && (
                <div className="ml-8">
                  <TextField
                    label="Store phone number"
                    value={fallbackContactInfo}
                    onChange={setFallbackContactInfo}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </div>
              )}

              <RadioButton
                label="Generic mattress shopping guidance"
                helpText="The AI will provide general advice about mattress shopping"
                checked={fallbackMessageType === 'generic_guidance'}
                id="generic_guidance"
                name="fallbackMessageType"
                onChange={() => setFallbackMessageType('generic_guidance')}
              />
            </BlockStack>

            <Banner tone="info">
              <p>
                <strong>Next steps:</strong> Add mattresses to your Shopify store and run the indexing again to enable personalized recommendations.
              </p>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Toast notification */}
      {showToast && (
        <Frame>
          <Toast
            content={toastMessage}
            onDismiss={() => setShowToast(false)}
            duration={4000}
          />
        </Frame>
      )}
    </Page>
  );
}


