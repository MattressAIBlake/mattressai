import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
  EmptyState,
  Text,
  BlockStack
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { listExperiments } from '~/lib/experiments/ab-testing.service';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const experiments = await listExperiments(shop, false);

  return json({
    experiments: experiments.map(exp => ({
      id: exp.id,
      name: exp.name,
      status: exp.status,
      startAt: exp.startAt.toISOString(),
      endAt: exp.endAt?.toISOString(),
      variants: exp.variants.map(v => ({
        id: v.id,
        name: v.name,
        splitPercent: v.splitPercent
      }))
    }))
  });
};

export default function ExperimentsPage() {
  const { experiments } = useLoaderData();
  const navigate = useNavigate();

  const handleCreateExperiment = () => {
    navigate('/app/admin/experiments/new');
  };

  const handleViewExperiment = (experimentId) => {
    navigate(`/app/admin/experiments/${experimentId}`);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: 'success',
      paused: 'warning',
      completed: 'info'
    };

    return (
      <Badge tone={statusMap[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const rows = experiments.map((exp) => [
    exp.name,
    getStatusBadge(exp.status),
    `${exp.variants.length} variants`,
    new Date(exp.startAt).toLocaleDateString(),
    exp.endAt ? new Date(exp.endAt).toLocaleDateString() : 'Ongoing',
    <Button
      key={exp.id}
      onClick={() => handleViewExperiment(exp.id)}
      size="slim"
    >
      View Details
    </Button>
  ]);

  return (
    <Page
      title="A/B Testing"
      primaryAction={{
        content: 'Create Experiment',
        onAction: handleCreateExperiment
      }}
      subtitle="Test different prompts and recommendation strategies to optimize conversions"
    >
      <Layout>
        <Layout.Section>
          {experiments.length === 0 ? (
            <Card>
              <EmptyState
                heading="No experiments yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    Create your first A/B test to optimize your chat experience and recommendations.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Compare different prompt versions, recommendation strategies, and measure their impact on conversions.
                  </Text>
                </BlockStack>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Name', 'Status', 'Variants', 'Started', 'Ended', 'Actions']}
                rows={rows}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}


