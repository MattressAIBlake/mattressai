import { json } from '@remix-run/node';
import { useState, useMemo, useCallback } from 'react';
import { useLoaderData, useFetcher, useNavigate } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Badge,
  Box,
  Divider,
  Modal,
  Banner,
  InlineStack,
  BlockStack,
  InlineGrid
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';
import { 
  getPromptVersions, 
  getActivePromptVersion, 
  activatePromptVersion,
  deletePromptVersion 
} from '~/lib/domain/promptVersion.server';

const TONE_OPTIONS = [
  { label: 'Friendly', value: 'friendly' },
  { label: 'Professional', value: 'professional' },
  { label: 'Casual', value: 'casual' },
  { label: 'Formal', value: 'formal' },
  { label: 'Enthusiastic', value: 'enthusiastic' },
  { label: 'Empathetic', value: 'empathetic' }
];

/**
 * GET /admin/prompt/versions
 * Returns all prompt versions for the authenticated shop
 */
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      throw new Error('No shop found in session');
    }

    // Get all prompt versions for this shop
    const versions = await getPromptVersions(shop);

    // Get the currently active version
    const activeVersion = await getActivePromptVersion(shop);

    return json({
      success: true,
      versions: versions.map(version => ({
        id: version.id,
        compiledPrompt: version.compiledPrompt,
        runtimeRules: version.runtimeRules,
        isActive: version.isActive,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt
      })),
      activeVersionId: activeVersion?.id || null,
      totalVersions: versions.length,
      shop
    });

  } catch (error) {
    console.error('Error fetching prompt versions:', error);
    throw error;
  }
}

/**
 * POST /admin/prompt/versions
 * Handles activate and delete actions
 */
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return json({ error: 'No shop found in session' }, { status: 401 });
    }

    const formData = await request.formData();
    const actionType = formData.get('actionType');
    const versionId = formData.get('versionId');

    if (!versionId) {
      return json({ error: 'Version ID is required' }, { status: 400 });
    }

    if (actionType === 'activate') {
      const activatedVersion = await activatePromptVersion(shop, versionId);
      
      if (!activatedVersion) {
        return json({ error: 'Version not found' }, { status: 404 });
      }

      return json({
        success: true,
        message: 'Version activated successfully',
        versionId: activatedVersion.id
      });
    }

    if (actionType === 'delete') {
      try {
        await deletePromptVersion(shop, versionId);
        
        return json({
          success: true,
          message: 'Version deleted successfully',
          versionId
        });
      } catch (error) {
        return json(
          { error: error.message || 'Failed to delete version' },
          { status: 400 }
        );
      }
    }

    return json({ error: 'Invalid action type' }, { status: 400 });

  } catch (error) {
    console.error('Error in prompt versions action:', error);
    return json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Main component
 */
export default function PromptVersionsPage() {
  const { versions, activeVersionId, totalVersions } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [activateConfirmation, setActivateConfirmation] = useState(null);

  const handleToggleExpand = (versionId) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleSelectForComparison = (versionId) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const handleStartComparison = () => {
    if (selectedVersions.length === 2) {
      setShowComparison(true);
    }
  };

  const handleActivate = (versionId) => {
    setActivateConfirmation(versionId);
  };

  const handleConfirmActivate = () => {
    if (activateConfirmation) {
      const formData = new FormData();
      formData.append('actionType', 'activate');
      formData.append('versionId', activateConfirmation);
      fetcher.submit(formData, { method: 'POST' });
      setActivateConfirmation(null);
    }
  };

  const handleDelete = (versionId) => {
    setDeleteConfirmation(versionId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation) {
      const formData = new FormData();
      formData.append('actionType', 'delete');
      formData.append('versionId', deleteConfirmation);
      fetcher.submit(formData, { method: 'POST' });
      setDeleteConfirmation(null);
    }
  };

  const getToneLabel = (toneValue) => {
    return TONE_OPTIONS.find(t => t.value === toneValue)?.label || toneValue;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const comparisonVersions = selectedVersions.map(id => 
    versions.find(v => v.id === id)
  ).filter(Boolean);

  // Memoize primaryAction objects to prevent infinite re-renders
  const titleBarPrimaryAction = useMemo(() => ({
    content: 'Back to Builder',
    onAction: () => navigate('/app/admin/prompt-builder')
  }), [navigate]);

  const comparisonModalPrimaryAction = useMemo(() => ({
    content: 'Close',
    onAction: () => {
      setShowComparison(false);
      setCompareMode(false);
      setSelectedVersions([]);
    }
  }), []);

  const deleteModalPrimaryAction = useMemo(() => ({
    content: 'Delete',
    destructive: true,
    onAction: handleConfirmDelete,
  }), [handleConfirmDelete, deleteConfirmation]);

  const activateModalPrimaryAction = useMemo(() => ({
    content: 'Activate',
    onAction: handleConfirmActivate,
    loading: fetcher.state === 'submitting'
  }), [handleConfirmActivate, fetcher.state]);

  return (
    <Page>
      <TitleBar 
        title="Prompt Versions"
        primaryAction={titleBarPrimaryAction}
      />
      
      <Layout>
        <Layout.Section>
          {fetcher.data?.success && (
            <Banner
              tone="success"
              onDismiss={() => {}}
            >
              <p>{fetcher.data.message}</p>
            </Banner>
          )}

          {fetcher.data?.error && (
            <Banner
              tone="critical"
              onDismiss={() => {}}
            >
              <p>{fetcher.data.error}</p>
            </Banner>
          )}

          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2">
                    Prompt Version History
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {totalVersions} version{totalVersions !== 1 ? 's' : ''} total
                    {activeVersionId ? ' • 1 active' : ' • Using default prompts'}
                  </Text>
                </BlockStack>
                
                {!compareMode ? (
                  <InlineStack gap="200">
                    {activeVersionId && (
                      <>
                        <Button
                          onClick={() => {
                            const formData = new FormData();
                            formData.append('_action', 'regenerate');
                            fetcher.submit(formData, { 
                              method: 'POST',
                              action: '/app/admin/prompt/regenerate'
                            });
                          }}
                          loading={fetcher.state === 'submitting'}
                        >
                          Regenerate with Latest Template
                        </Button>
                        <Button
                          tone="critical"
                          onClick={() => {
                            const formData = new FormData();
                            formData.append('_action', 'deactivate-all');
                            fetcher.submit(formData, { 
                              method: 'POST',
                              action: '/app/admin/prompt/deactivate-all'
                            });
                          }}
                          loading={fetcher.state === 'submitting'}
                        >
                          Use Default Prompts
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => {
                        setCompareMode(true);
                        setSelectedVersions([]);
                      }}
                    >
                      Compare Versions
                    </Button>
                  </InlineStack>
                ) : (
                  <InlineStack gap="200">
                    <Button
                      onClick={() => {
                        setCompareMode(false);
                        setSelectedVersions([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      primary
                      disabled={selectedVersions.length !== 2}
                      onClick={handleStartComparison}
                    >
                      Compare Selected ({selectedVersions.length}/2)
                    </Button>
                  </InlineStack>
                )}
              </InlineStack>
            </Box>
          </Card>

          {versions.length === 0 ? (
            <Card>
              <Box padding="800">
                <BlockStack gap="400" align="center">
                  <Text variant="headingMd" as="h3">
                    No Versions Yet
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Create your first prompt version in the Prompt Builder
                  </Text>
                  <Button
                    primary
                    onClick={() => navigate('/app/admin/prompt-builder')}
                  >
                    Go to Prompt Builder
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          ) : (
            <BlockStack gap="400">
              {versions.map((version) => {
                const isActive = version.id === activeVersionId;
                const isExpanded = expandedVersions.has(version.id);
                const isSelected = selectedVersions.includes(version.id);

                return (
                  <Card key={version.id}>
                    <Box padding="400">
                      <BlockStack gap="400">
                        <InlineStack align="space-between" blockAlign="start">
                          <BlockStack gap="200">
                            <InlineStack gap="200" blockAlign="center">
                              <Text variant="headingMd" as="h3">
                                Version {version.id.substring(0, 8)}
                              </Text>
                              {isActive && (
                                <Badge tone="success">Active</Badge>
                              )}
                              {isSelected && (
                                <Badge tone="info">Selected for comparison</Badge>
                              )}
                            </InlineStack>
                            <Text variant="bodyMd" as="p" tone="subdued">
                              Created {formatDate(version.createdAt)}
                            </Text>
                          </BlockStack>

                          {compareMode ? (
                            <Button
                              onClick={() => handleSelectForComparison(version.id)}
                              pressed={isSelected}
                              disabled={!isSelected && selectedVersions.length >= 2}
                            >
                              {isSelected ? 'Deselect' : 'Select'}
                            </Button>
                          ) : (
                            <InlineStack gap="200">
                              <Button
                                primary={!isActive}
                                disabled={isActive}
                                onClick={() => handleActivate(version.id)}
                                loading={fetcher.state === 'submitting' && activateConfirmation === version.id}
                              >
                                {isActive ? 'Currently Active' : 'Activate'}
                              </Button>
                              <Button
                                tone="critical"
                                disabled={isActive}
                                onClick={() => handleDelete(version.id)}
                                loading={fetcher.state === 'submitting' && deleteConfirmation === version.id}
                              >
                                Delete
                              </Button>
                            </InlineStack>
                          )}
                        </InlineStack>

                        <Divider />

                        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                          <Box>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4" tone="subdued">
                                Tone
                              </Text>
                              <Text variant="bodyMd" as="p">
                                {getToneLabel(version.runtimeRules.tone)}
                              </Text>
                            </BlockStack>
                          </Box>
                          
                          <Box>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4" tone="subdued">
                                Question Limit
                              </Text>
                              <Text variant="bodyMd" as="p">
                                {version.runtimeRules.questionLimit} questions
                              </Text>
                            </BlockStack>
                          </Box>
                          
                          <Box>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4" tone="subdued">
                                Early Exit
                              </Text>
                              <Text variant="bodyMd" as="p">
                                {version.runtimeRules.earlyExit ? 'Enabled' : 'Disabled'}
                              </Text>
                            </BlockStack>
                          </Box>
                          
                          <Box>
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h4" tone="subdued">
                                Lead Capture
                              </Text>
                              <Text variant="bodyMd" as="p">
                                {version.runtimeRules.leadCapture?.enabled ? 'Enabled' : 'Disabled'}
                              </Text>
                            </BlockStack>
                          </Box>
                        </InlineGrid>

                        {version.runtimeRules.leadCapture?.enabled && (
                          <>
                            <Divider />
                            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                              <Box>
                                <BlockStack gap="100">
                                  <Text variant="headingSm" as="h4" tone="subdued">
                                    Capture Position
                                  </Text>
                                  <Text variant="bodyMd" as="p">
                                    {version.runtimeRules.leadCapture.position === 'start' ? 'At the start' : 'At the end'}
                                  </Text>
                                </BlockStack>
                              </Box>
                              
                              <Box>
                                <BlockStack gap="100">
                                  <Text variant="headingSm" as="h4" tone="subdued">
                                    Fields
                                  </Text>
                                  <Text variant="bodyMd" as="p">
                                    {version.runtimeRules.leadCapture.fields?.join(', ') || 'None'}
                                  </Text>
                                </BlockStack>
                              </Box>
                            </InlineGrid>
                          </>
                        )}

                        {version.runtimeRules.customQuestions && version.runtimeRules.customQuestions.length > 0 && (
                          <>
                            <Divider />
                            <Box>
                              <BlockStack gap="200">
                                <Text variant="headingSm" as="h4" tone="subdued">
                                  Custom Questions ({version.runtimeRules.customQuestions.length})
                                </Text>
                                <BlockStack gap="100">
                                  {version.runtimeRules.customQuestions.map((question, idx) => (
                                    <Text key={idx} variant="bodyMd" as="p">
                                      {idx + 1}. {question}
                                    </Text>
                                  ))}
                                </BlockStack>
                              </BlockStack>
                            </Box>
                          </>
                        )}

                        <Divider />

                        <Button
                          onClick={() => handleToggleExpand(version.id)}
                          disclosure={isExpanded ? 'up' : 'down'}
                          fullWidth
                        >
                          {isExpanded ? 'Hide' : 'Show'} Full Compiled Prompt
                        </Button>

                        {isExpanded && (
                          <Box
                            padding="400"
                            background="bg-surface-secondary"
                            borderRadius="200"
                          >
                            <Text variant="bodyMd" as="pre" breakWord>
                              {version.compiledPrompt}
                            </Text>
                          </Box>
                        )}
                      </BlockStack>
                    </Box>
                  </Card>
                );
              })}
            </BlockStack>
          )}
        </Layout.Section>
      </Layout>

      {/* Comparison Modal */}
      <Modal
        open={showComparison}
        onClose={() => {
          setShowComparison(false);
          setCompareMode(false);
          setSelectedVersions([]);
        }}
        title="Compare Versions"
        large
        primaryAction={comparisonModalPrimaryAction}
      >
        <Modal.Section>
          {comparisonVersions.length === 2 && (
            <InlineGrid columns={2} gap="400">
              {comparisonVersions.map((version, idx) => (
                <Box key={version.id} padding="400" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <InlineStack gap="200">
                        <Text variant="headingMd" as="h3">
                          Version {version.id.substring(0, 8)}
                        </Text>
                        {version.id === activeVersionId && (
                          <Badge tone="success">Active</Badge>
                        )}
                      </InlineStack>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        {formatDate(version.createdAt)}
                      </Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="300">
                      <Box>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          Tone
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {getToneLabel(version.runtimeRules.tone)}
                        </Text>
                      </Box>

                      <Box>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          Question Limit
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {version.runtimeRules.questionLimit}
                        </Text>
                      </Box>

                      <Box>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          Early Exit
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {version.runtimeRules.earlyExit ? 'Enabled' : 'Disabled'}
                        </Text>
                      </Box>

                      <Box>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          Lead Capture
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {version.runtimeRules.leadCapture?.enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                      </Box>

                      {version.runtimeRules.customQuestions?.length > 0 && (
                        <Box>
                          <Text variant="headingSm" as="h4" fontWeight="semibold">
                            Custom Questions
                          </Text>
                          <Text variant="bodyMd" as="p">
                            {version.runtimeRules.customQuestions.length} question(s)
                          </Text>
                        </Box>
                      )}
                    </BlockStack>

                    <Divider />

                    <Box>
                      <BlockStack gap="200">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          Compiled Prompt
                        </Text>
                        <Box
                          padding="300"
                          background="bg-surface"
                          borderRadius="100"
                        >
                          <Text variant="bodySm" as="pre" breakWord>
                            {version.compiledPrompt}
                          </Text>
                        </Box>
                      </BlockStack>
                    </Box>
                  </BlockStack>
                </Box>
              ))}
            </InlineGrid>
          )}
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        title="Delete Version"
        primaryAction={deleteModalPrimaryAction}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setDeleteConfirmation(null)
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Are you sure you want to delete this version? This action cannot be undone.
            </Text>
            <Banner tone="warning">
              <p>You cannot delete the currently active version. Switch to another version first if you need to delete it.</p>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Activate Confirmation Modal */}
      <Modal
        open={!!activateConfirmation}
        onClose={() => setActivateConfirmation(null)}
        title="Activate Version"
        primaryAction={activateModalPrimaryAction}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setActivateConfirmation(null)
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Switching to this version will immediately affect all customer conversations. Are you sure you want to continue?
            </Text>
            <Banner tone="info">
              <p>The current active version will be deactivated, but it will remain in your version history.</p>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
