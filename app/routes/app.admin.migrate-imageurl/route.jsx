import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { Page, Card, Button, Banner, Text, BlockStack } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';

/**
 * Admin route to run the imageUrl column migration
 * Visit this once after deployment to add the missing column
 */

export async function loader({ request }) {
  await authenticate.admin(request);
  
  return json({ 
    needsMigration: true,
    message: 'Click the button below to add the imageUrl column to your database.'
  });
}

export async function action({ request }) {
  await authenticate.admin(request);
  
  try {
    const { prisma } = await import('~/db.server');
    
    // Check if column already exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ProductProfile' 
      AND column_name = 'imageUrl'
    `;

    if (result.length > 0) {
      return json({ 
        success: true, 
        message: '✅ Column already exists! No action needed.',
        alreadyExists: true
      });
    }

    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE "ProductProfile" 
      ADD COLUMN "imageUrl" TEXT
    `;

    await prisma.$disconnect();

    return json({ 
      success: true, 
      message: '✅ Successfully added imageUrl column! You can now use the catalog indexing page.',
      alreadyExists: false
    });

  } catch (error) {
    console.error('Migration error:', error);
    
    return json({ 
      success: false, 
      message: `❌ Error: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}

export default function MigrateImageUrl() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  
  const isRunning = fetcher.state === 'submitting';
  const result = fetcher.data;

  return (
    <Page 
      title="Database Migration"
      subtitle="Add imageUrl column to ProductProfile table"
      backAction={{ url: '/app/admin/catalog-indexing' }}
    >
      <BlockStack gap="400">
        {!result && (
          <Banner tone="info">
            <Text>
              This migration adds the imageUrl column needed for product images in the catalog.
              This is safe to run and will only make changes if needed.
            </Text>
          </Banner>
        )}

        {result?.success && (
          <Banner tone="success">
            <Text fontWeight="bold">{result.message}</Text>
            {!result.alreadyExists && (
              <Text>
                Next steps:
                <br />
                1. Go to Catalog Indexing
                <br />
                2. Click "Re-Index Catalog"
                <br />
                3. Product images will be fetched and displayed
              </Text>
            )}
          </Banner>
        )}

        {result && !result.success && (
          <Banner tone="critical">
            <Text fontWeight="bold">{result.message}</Text>
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Run Migration</Text>
            <Text>
              Click the button below to add the imageUrl column to your database.
              This will take about 1 second.
            </Text>
            
            <fetcher.Form method="post">
              <Button 
                submit 
                variant="primary" 
                loading={isRunning}
                disabled={result?.success}
              >
                {isRunning ? 'Running Migration...' : result?.success ? 'Migration Complete' : 'Run Migration'}
              </Button>
            </fetcher.Form>
          </BlockStack>
        </Card>

        {result?.success && (
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">✅ What Was Done</Text>
              <Text>
                Executed SQL: <code>ALTER TABLE "ProductProfile" ADD COLUMN "imageUrl" TEXT</code>
              </Text>
              <Text tone="subdued">
                This column stores the Shopify CDN URL for each product's featured image.
              </Text>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}

