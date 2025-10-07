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
  RangeSlider,
  Checkbox,
  Divider,
  Spinner,
  EmptyState
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';

/**
 * Loader function - get current indexing status
 */
export async function loader({ request }) {
  await authenticate.admin(request);

  // In a real implementation, this would call the status endpoint
  // For now, return mock data
  return json({
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
 * Action function - handle start/stop indexing
 */
export async function action({ request }) {
  await authenticate.admin(request);

  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'start') {
    // Start indexing job
    const useAIEnrichment = formData.get('useAIEnrichment') === 'true';
    const confidenceThreshold = parseFloat(formData.get('confidenceThreshold') || '0.7');

    // In a real implementation, this would call the start endpoint
    return json({
      success: true,
      message: 'Indexing job started',
      jobId: `job-${Date.now()}`,
      configuration: { useAIEnrichment, confidenceThreshold }
    });
  }

  if (action === 'stop') {
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

  const [useAIEnrichment, setUseAIEnrichment] = useState(data.configuration.useAIEnrichment);
  const [confidenceThreshold, setConfidenceThreshold] = useState(data.configuration.confidenceThreshold);
  const [isStarting, setIsStarting] = useState(false);

  // Poll for status updates when indexing is active
  useEffect(() => {
    if (data.isIndexing) {
      const interval = setInterval(() => {
        fetcher.load('/admin/index/status');
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [data.isIndexing, fetcher]);

  // Handle start indexing
  const handleStartIndexing = async () => {
    setIsStarting(true);

    const formData = new FormData();
    formData.append('action', 'start');
    formData.append('useAIEnrichment', useAIEnrichment.toString());
    formData.append('confidenceThreshold', confidenceThreshold.toString());

    try {
      await fetcher.submit(formData, { method: 'POST' });
      // Refresh the page to show new job status
      window.location.reload();
    } catch (error) {
      console.error('Failed to start indexing:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle stop indexing
  const handleStopIndexing = async () => {
    const formData = new FormData();
    formData.append('action', 'stop');

    await fetcher.submit(formData, { method: 'POST' });
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
      subtitle="Index your product catalog for AI-powered recommendations"
      breadcrumbs={[
        { content: 'Home', url: '/app' }
      ]}
    >
      <Layout>
        {/* Configuration Section */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                Indexing Configuration
              </Text>
              <div className="mt-4 space-y-4">
                <Checkbox
                  label="Use AI Enrichment"
                  checked={useAIEnrichment}
                  onChange={setUseAIEnrichment}
                  helpText="Enable AI-powered attribute extraction for better recommendations"
                />

                {useAIEnrichment && (
                  <div className="mt-4">
                    <Text variant="bodyMd" as="p">
                      Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
                    </Text>
                    <div className="mt-2">
                      <RangeSlider
                        label="Minimum confidence for AI extractions"
                        labelHidden
                        value={confidenceThreshold * 100}
                        onChange={(value) => setConfidenceThreshold(value / 100)}
                        min={30}
                        max={90}
                        step={5}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Higher thresholds mean fewer but more confident extractions
                    </div>
                  </div>
                )}
              </div>
            </Card.Section>
          </Card>
        </Layout.Section>

        {/* Current Job Status */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <div className="flex justify-between items-center mb-4">
                <Text variant="headingMd" as="h2">
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
                <EmptyState
                  heading="Ready to index"
                  content="Click 'Start Indexing' to begin processing your product catalog"
                  image="/empty-state-indexing.svg"
                />
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
                          Progress: {currentJob.processedProducts || 0} / {currentJob.totalProducts} products
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
            </Card.Section>
          </Card>
        </Layout.Section>

        {/* Recent Jobs */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                Recent Jobs
              </Text>

              {data.recentJobs.length === 0 ? (
                <div className="mt-4">
                  <Text variant="bodyMd" color="subdued">
                    No indexing jobs yet. Start your first indexing job above.
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
                                {job.totalProducts} products • {formatCost(job.actualCost || job.costEstimate)}
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
            </Card.Section>
          </Card>
        </Layout.Section>

        {/* Information Section */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                About Catalog Indexing
              </Text>
              <div className="mt-4 space-y-3">
                <Text variant="bodyMd" as="p">
                  Catalog indexing processes your Shopify products and creates vector embeddings for AI-powered recommendations.
                </Text>

                <div className="space-y-2">
                  <Text variant="headingSm" as="h3">
                    What happens during indexing:
                  </Text>
                  <List>
                    <List.Item>Extract product information from Shopify</List.Item>
                    <List.Item>Enrich products with mattress-specific attributes</List.Item>
                    <List.Item>Generate vector embeddings for semantic search</List.Item>
                    <List.Item>Store embeddings in your vector database</List.Item>
                  </List>
                </div>

                <div className="space-y-2">
                  <Text variant="headingSm" as="h3">
                    Configuration options:
                  </Text>
                  <List>
                    <List.Item>
                      <strong>AI Enrichment:</strong> Uses AI to extract detailed mattress attributes from product descriptions
                    </List.Item>
                    <List.Item>
                      <strong>Confidence Threshold:</strong> Controls how confident the AI must be before extracting attributes
                    </List.Item>
                  </List>
                </div>

                <Banner status="info">
                  <p>
                    Indexing typically processes 50-100 products per minute depending on your catalog size and AI enrichment settings.
                  </p>
                </Banner>
              </div>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


