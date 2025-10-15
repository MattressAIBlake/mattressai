import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate, Form } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Banner
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { useState } from 'react';
import { authenticate } from '~/shopify.server';
import { createExperiment } from '~/lib/experiments/ab-testing.service';

export const loader = async ({ request }) => {
  const { prisma } = await import('~/db.server');
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get available prompt versions
  const promptVersions = await prisma.promptVersion.findMany({
    where: { tenant: shop },
    orderBy: { createdAt: 'desc' }
  });

  return json({
    promptVersions: promptVersions.map(pv => ({
      id: pv.id,
      label: pv.isActive ? `${pv.compiledPrompt.substring(0, 50)}... (Active)` : pv.compiledPrompt.substring(0, 50) + '...',
      value: pv.id
    }))
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const experimentData = JSON.parse(formData.get('experimentData'));

  try {
    const experiment = await createExperiment({
      tenantId: shop,
      name: experimentData.name,
      status: experimentData.status,
      variants: experimentData.variants
    });

    return redirect(`/app/admin/experiments/${experiment.id}`);
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function NewExperimentPage() {
  const { promptVersions } = useLoaderData();
  const navigate = useNavigate();

  const [experimentName, setExperimentName] = useState('');
  const [status, setStatus] = useState('paused');
  const [variants, setVariants] = useState([
    { name: 'Control', splitPercent: 50, promptVersionId: '' },
    { name: 'Variant A', splitPercent: 50, promptVersionId: '' }
  ]);
  const [error, setError] = useState('');

  const handleAddVariant = () => {
    if (variants.length >= 3) {
      setError('Maximum 3 variants allowed');
      return;
    }

    // Redistribute split percentages
    const newSplit = Math.floor(100 / (variants.length + 1));
    const updatedVariants = variants.map(v => ({ ...v, splitPercent: newSplit }));
    
    setVariants([
      ...updatedVariants,
      { name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`, splitPercent: newSplit, promptVersionId: '' }
    ]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 2) {
      setError('Minimum 2 variants required');
      return;
    }

    const newVariants = variants.filter((_, i) => i !== index);
    // Redistribute splits
    const newSplit = Math.floor(100 / newVariants.length);
    setVariants(newVariants.map(v => ({ ...v, splitPercent: newSplit })));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSplitChange = (index, value) => {
    const newVariants = [...variants];
    newVariants[index].splitPercent = parseInt(value) || 0;
    setVariants(newVariants);
  };

  const handleSubmit = () => {
    // Validate
    const totalSplit = variants.reduce((sum, v) => sum + v.splitPercent, 0);
    if (totalSplit !== 100) {
      setError(`Split percentages must sum to 100, current total is ${totalSplit}`);
      return;
    }

    if (!experimentName) {
      setError('Experiment name is required');
      return;
    }

    if (variants.some(v => !v.name)) {
      setError('All variants must have a name');
      return;
    }

    // Submit
    const form = document.getElementById('experiment-form');
    const experimentData = {
      name: experimentName,
      status,
      variants: variants.map(v => ({
        name: v.name,
        splitPercent: v.splitPercent,
        promptVersionId: v.promptVersionId || undefined
      }))
    };

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'experimentData';
    input.value = JSON.stringify(experimentData);
    form.appendChild(input);
    form.submit();
  };

  const totalSplit = variants.reduce((sum, v) => sum + v.splitPercent, 0);

  return (
    <Page>
      <TitleBar 
        title="Create A/B Test"
        primaryAction={{
          content: 'Create Experiment',
          onAction: handleSubmit
        }}
      />
      <Layout>
        <Layout.Section>
          {error && (
            <Banner tone="critical" onDismiss={() => setError('')}>
              {error}
            </Banner>
          )}

          <Form id="experiment-form" method="post">
            <BlockStack gap="400">
              {/* Experiment Details */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Experiment Details
                  </Text>
                  <FormLayout>
                    <TextField
                      label="Experiment Name"
                      value={experimentName}
                      onChange={setExperimentName}
                      placeholder="e.g., Test new recommendation strategy"
                      autoComplete="off"
                    />
                    <Select
                      label="Initial Status"
                      options={[
                        { label: 'Paused (review before starting)', value: 'paused' },
                        { label: 'Active (start immediately)', value: 'active' }
                      ]}
                      value={status}
                      onChange={setStatus}
                    />
                  </FormLayout>
                </BlockStack>
              </Card>

              {/* Variants */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Test Variants
                    </Text>
                    <Button
                      onClick={handleAddVariant}
                      disabled={variants.length >= 3}
                    >
                      Add Variant
                    </Button>
                  </InlineStack>

                  {variants.map((variant, index) => (
                    <Card key={index}>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text as="h3" variant="headingSm">
                            Variant {index + 1}
                          </Text>
                          {variants.length > 2 && (
                            <Button
                              onClick={() => handleRemoveVariant(index)}
                              plain
                              destructive
                            >
                              Remove
                            </Button>
                          )}
                        </InlineStack>
                        <FormLayout>
                          <TextField
                            label="Variant Name"
                            value={variant.name}
                            onChange={(value) => handleVariantChange(index, 'name', value)}
                            autoComplete="off"
                          />
                          <TextField
                            label="Traffic Split (%)"
                            type="number"
                            value={String(variant.splitPercent)}
                            onChange={(value) => handleSplitChange(index, value)}
                            min={0}
                            max={100}
                            autoComplete="off"
                          />
                          <Select
                            label="Prompt Version (optional)"
                            options={[
                              { label: 'Use default', value: '' },
                              ...promptVersions
                            ]}
                            value={variant.promptVersionId}
                            onChange={(value) => handleVariantChange(index, 'promptVersionId', value)}
                          />
                        </FormLayout>
                      </BlockStack>
                    </Card>
                  ))}

                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" tone={totalSplit !== 100 ? "critical" : "subdued"}>
                        Total Traffic Split: {totalSplit}% {totalSplit !== 100 && '(Must equal 100%)'}
                      </Text>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </Card>
            </BlockStack>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


