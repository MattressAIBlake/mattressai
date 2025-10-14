import { json } from '@remix-run/node';
import { useState, useEffect, useCallback } from 'react';
import { useLoaderData, useFetcher, useNavigate, useSearchParams } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  DataTable,
  Pagination,
  Select,
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
import { TitleBar } from '@shopify/app-bridge-react';
import {
  DatabaseIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper function to create embedding content from product profile
 */
function createEmbeddingContent(profile) {
  const parts = [
    profile.title,
    profile.body,
    profile.vendor,
    profile.productType,
    profile.firmness && `Firmness: ${profile.firmness}`,
    profile.height && `Height: ${profile.height}`,
    profile.material && `Material: ${profile.material}`,
    profile.certifications && `Certifications: ${profile.certifications}`,
    profile.features && `Features: ${profile.features}`,
    profile.supportFeatures && `Support: ${profile.supportFeatures}`
  ].filter(Boolean);
  
  return parts.join(' | ');
}

/**
 * Loader function - get indexed products and indexing status
 */
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);

  // Pagination and filters
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = 20;
  const search = url.searchParams.get('search') || '';
  const filterFirmness = url.searchParams.get('firmness') || '';
  const filterVendor = url.searchParams.get('vendor') || '';

  // Build where clause
  const where = {
    tenant: session.shop,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { shopifyProductId: { contains: search } }
      ]
    }),
    ...(filterFirmness && { firmness: filterFirmness }),
    ...(filterVendor && { vendor: filterVendor })
  };

  // Fetch products and count in parallel
  const [products, totalCount] = await Promise.all([
    prisma.productProfile.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.productProfile.count({ where })
  ]);

  // Get unique filter values
  const [vendors, firmnessValues] = await Promise.all([
    prisma.productProfile.findMany({
      where: { tenant: session.shop },
      select: { vendor: true },
      distinct: ['vendor'],
      orderBy: { vendor: 'asc' }
    }),
    prisma.productProfile.findMany({
      where: { tenant: session.shop, firmness: { not: null } },
      select: { firmness: true },
      distinct: ['firmness'],
      orderBy: { firmness: 'asc' }
    })
  ]);

  // Check for active indexing job
  const currentJob = await prisma.indexJob.findFirst({
    where: {
      tenant: session.shop,
      status: { in: ['pending', 'running'] }
    },
    orderBy: { startedAt: 'desc' }
  });

  // Get recent completed jobs
  const recentJobs = await prisma.indexJob.findMany({
    where: {
      tenant: session.shop,
      status: { in: ['completed', 'failed'] }
    },
    orderBy: { startedAt: 'desc' },
    take: 3
  });

  // Check indexed product count from database
  const productCount = await prisma.productProfile.count({
    where: { tenant: session.shop }
  });
  
  const isIndexed = productCount > 0;

  return json({
    shop: session.shop,
    products,
    totalCount,
    page,
    pageSize,
    currentFilters: {
      search,
      firmness: filterFirmness,
      vendor: filterVendor
    },
    vendors: vendors.map(v => v.vendor).filter(Boolean),
    firmnessOptions: firmnessValues.map(f => f.firmness).filter(Boolean),
    currentJob,
    recentJobs,
    isIndexing: !!currentJob,
    isIndexed,
    productCount
  });
}

/**
 * Action function - handle edit/delete products and indexing operations
 */
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get('actionType');

  // Edit Product Action
  if (actionType === 'editProduct') {
    const productId = formData.get('productId');
    const criticalFieldChanged = formData.get('criticalFieldChanged') === 'true';
    
    const updates = {
      title: formData.get('title'),
      vendor: formData.get('vendor'),
      productType: formData.get('productType'),
      body: formData.get('body'),
      tags: formData.get('tags'),
      firmness: formData.get('firmness') || null,
      height: formData.get('height') || null,
      material: formData.get('material') || null,
      certifications: formData.get('certifications') || null,
      features: formData.get('features') || null,
      supportFeatures: formData.get('supportFeatures') || null
    };
    
    try {
      // Update PostgreSQL
      const updatedProduct = await prisma.productProfile.update({
        where: { id: productId },
        data: updates
      });
      
      // Always update Pinecone to ensure consistency
      // Only regenerate embedding if critical fields changed (for cost optimization)
      const { getEmbeddingProvider, getVectorStoreProvider } = await import('~/lib/ports/provider-registry');
      const vectorStoreProvider = getVectorStoreProvider(session.shop);
      
      if (criticalFieldChanged) {
        // Regenerate embedding for better search accuracy
        const embeddingProvider = getEmbeddingProvider(session.shop);
        const contentForEmbedding = createEmbeddingContent(updatedProduct);
        const embeddings = await embeddingProvider.generateEmbeddings([contentForEmbedding]);
        
        await vectorStoreProvider.upsert([{
          id: `product-${updatedProduct.shopifyProductId}`,
          vector: embeddings[0],
          metadata: {
            tenant_id: session.shop,
            shopify_product_id: updatedProduct.shopifyProductId,
            title: updatedProduct.title,
            product_type: updatedProduct.productType,
            vendor: updatedProduct.vendor,
            enriched_profile: JSON.stringify(updatedProduct),
            updated_at: new Date().toISOString()
          }
        }]);
        
        console.log(`Product ${productId} updated with new embedding (critical fields changed)`);
      } else {
        // For non-critical changes, regenerate embedding to ensure metadata sync
        // This is more reliable than trying to preserve the old vector
        const embeddingProvider = getEmbeddingProvider(session.shop);
        const contentForEmbedding = createEmbeddingContent(updatedProduct);
        const embeddings = await embeddingProvider.generateEmbeddings([contentForEmbedding]);
        
        await vectorStoreProvider.upsert([{
          id: `product-${updatedProduct.shopifyProductId}`,
          vector: embeddings[0],
          metadata: {
            tenant_id: session.shop,
            shopify_product_id: updatedProduct.shopifyProductId,
            title: updatedProduct.title,
            product_type: updatedProduct.productType,
            vendor: updatedProduct.vendor,
            enriched_profile: JSON.stringify(updatedProduct),
            updated_at: new Date().toISOString()
          }
        }]);
        
        console.log(`Product ${productId} updated with refreshed embedding`);
      }
      
      return json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
      console.error('Failed to update product:', error);
      return json(
        { error: 'Failed to update product', details: error.message },
        { status: 500 }
      );
    }
  }

  // Delete Product Action
  if (actionType === 'deleteProduct') {
    const productId = formData.get('productId');
    const shopifyProductId = formData.get('shopifyProductId');
    
    try {
      // Delete from PostgreSQL
      await prisma.productProfile.delete({
        where: { id: productId }
      });
      
      // Delete from Pinecone
      const { getVectorStoreProvider } = await import('~/lib/ports/provider-registry');
      const vectorStoreProvider = getVectorStoreProvider(session.shop);
      await vectorStoreProvider.delete([`product-${shopifyProductId}`]);
      
      console.log(`Product ${productId} deleted from both databases`);
      
      return json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Failed to delete product:', error);
      return json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      );
    }
  }

  // Start Indexing Action
  if (actionType === 'start') {
    const useAIEnrichment = true;
    const confidenceThreshold = 0.7;
    
    const startIndexForm = new FormData();
    startIndexForm.append('useAIEnrichment', useAIEnrichment.toString());
    startIndexForm.append('confidenceThreshold', confidenceThreshold.toString());
    
    try {
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

  // Stop Indexing Action
  if (actionType === 'stop') {
    try {
      const currentJob = await prisma.indexJob.findFirst({
        where: {
          tenant: session.shop,
          status: { in: ['pending', 'running'] }
        },
        orderBy: { startedAt: 'desc' }
      });
      
      if (!currentJob) {
        return json({ error: 'No active indexing job found' }, { status: 404 });
      }
      
      await prisma.indexJob.update({
        where: { id: currentJob.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: 'Indexing job cancelled by user'
        }
      });
      
      return json({ success: true, message: 'Indexing job stopped successfully' });
    } catch (error) {
      console.error('Failed to stop indexing job:', error);
      return json({ error: 'Failed to stop indexing job' }, { status: 500 });
    }
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}

/**
 * Edit Product Modal Component
 */
function EditProductModal({ product, active, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    vendor: '',
    productType: '',
    body: '',
    tags: '',
    firmness: '',
    height: '',
    material: '',
    certifications: '',
    features: '',
    supportFeatures: ''
  });
  
  const [originalData, setOriginalData] = useState({});

  // Initialize form when product changes - only when modal is active to prevent hydration issues
  useEffect(() => {
    if (product && active) {
      const initialData = {
        title: product.title || '',
        vendor: product.vendor || '',
        productType: product.productType || '',
        body: product.body || '',
        tags: product.tags || '',
        firmness: product.firmness || '',
        height: product.height || '',
        material: product.material || '',
        certifications: product.certifications || '',
        features: product.features || '',
        supportFeatures: product.supportFeatures || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [product, active]);

  const handleChange = (field) => (value) => {
    setFormData({ ...formData, [field]: value });
  };
  
  const handleSave = () => {
    // Check if critical fields changed
    const criticalFields = ['firmness', 'material', 'features', 'supportFeatures', 'height'];
    const criticalFieldChanged = criticalFields.some(field => 
      formData[field] !== originalData[field]
    );
    
    onSave({
      ...formData,
      productId: product.id,
      shopifyProductId: product.shopifyProductId,
      criticalFieldChanged
    });
  };
  
  if (!product) return null;

  return (
    <Modal
      open={active}
      onClose={onClose}
      title="Edit Product"
      primaryAction={{
        content: 'Save Changes',
        onAction: handleSave
      }}
      secondaryActions={[{
        content: 'Cancel',
        onAction: onClose
      }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Title"
            value={formData.title}
            onChange={handleChange('title')}
            autoComplete="off"
          />
          <TextField
            label="Vendor"
            value={formData.vendor}
            onChange={handleChange('vendor')}
            autoComplete="off"
          />
          <TextField
            label="Product Type"
            value={formData.productType}
            onChange={handleChange('productType')}
            autoComplete="off"
          />
          <TextField
            label="Description"
            value={formData.body}
            onChange={handleChange('body')}
            multiline={4}
            autoComplete="off"
          />
          <TextField
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={handleChange('tags')}
            autoComplete="off"
          />
          
          <Divider />
          <Text variant="headingSm" as="h3">Mattress Attributes</Text>
          <Text variant="bodySm" as="p" tone="subdued">
            Changes to these fields will regenerate AI embeddings
          </Text>
          
          <TextField
            label="Firmness"
            value={formData.firmness}
            onChange={handleChange('firmness')}
            helpText="e.g., soft, medium, firm"
            autoComplete="off"
          />
          <TextField
            label="Height"
            value={formData.height}
            onChange={handleChange('height')}
            helpText="e.g., 10 inches, 12 inches"
            autoComplete="off"
          />
          <TextField
            label="Material"
            value={formData.material}
            onChange={handleChange('material')}
            helpText="e.g., memory foam, latex, hybrid"
            autoComplete="off"
          />
          <TextField
            label="Certifications (comma-separated)"
            value={formData.certifications}
            onChange={handleChange('certifications')}
            helpText="e.g., CertiPUR-US, OEKO-TEX"
            autoComplete="off"
          />
          <TextField
            label="Features (comma-separated)"
            value={formData.features}
            onChange={handleChange('features')}
            helpText="e.g., cooling-gel, pressure-relief"
            autoComplete="off"
          />
          <TextField
            label="Support Features (comma-separated)"
            value={formData.supportFeatures}
            onChange={handleChange('supportFeatures')}
            helpText="e.g., edge-support, pocketed-coils"
            autoComplete="off"
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

/**
 * Main component
 */
export default function ProductInventory() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management - initialize with empty strings to prevent hydration errors
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFirmness, setSelectedFirmness] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Track when component is mounted on client to prevent hydration errors with interactive elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync state with loader data to prevent hydration mismatches
  useEffect(() => {
    setSearchQuery(data.currentFilters.search || '');
    setSelectedFirmness(data.currentFilters.firmness || '');
    setSelectedVendor(data.currentFilters.vendor || '');
  }, [data.currentFilters]);

  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to page 1 on search
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Handle filter changes
  const handleFilterChange = useCallback((type, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    
    if (type === 'firmness') setSelectedFirmness(value);
    if (type === 'vendor') setSelectedVendor(value);
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Handle edit product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Handle save product
  const handleSaveProduct = (productData) => {
    const formData = new FormData();
    formData.append('actionType', 'editProduct');
    formData.append('productId', productData.productId);
    formData.append('criticalFieldChanged', productData.criticalFieldChanged.toString());
    
    Object.keys(productData).forEach(key => {
      if (key !== 'productId' && key !== 'criticalFieldChanged' && key !== 'shopifyProductId') {
        formData.append(key, productData[key] || '');
      }
    });
    
    fetcher.submit(formData, { method: 'POST' });
    setShowEditModal(false);
  };

  // Handle delete product
  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    
    const formData = new FormData();
    formData.append('actionType', 'deleteProduct');
    formData.append('productId', productToDelete.id);
    formData.append('shopifyProductId', productToDelete.shopifyProductId);
    
    fetcher.submit(formData, { method: 'POST' });
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  // Handle start indexing
  const handleStartIndexing = () => {
    const formData = new FormData();
    formData.append('useAIEnrichment', 'true');
    formData.append('confidenceThreshold', '0.7');
    
    fetcher.submit(formData, { 
      method: 'POST',
      action: '/app/admin/index/start'
    });
  };

  // Show toast on action completion
  useEffect(() => {
    if (fetcher.data?.success) {
      setToastMessage(fetcher.data.message);
      setShowToast(true);
    } else if (fetcher.data?.error) {
      setToastMessage(fetcher.data.error);
      setShowToast(true);
    }
  }, [fetcher.data]);

  // Build product rows for table - only add interactive elements after client mount
  const productRows = data.products.map(product => [
    product.title || 'Untitled',
    product.vendor || '-',
    product.productType || '-',
    product.firmness || '-',
    product.material || '-',
    isMounted ? (
      <Badge tone={product.confidence > 0.8 ? 'success' : product.confidence > 0.5 ? 'info' : 'warning'}>
        {Math.round(product.confidence * 100)}%
      </Badge>
    ) : (
      `${Math.round(product.confidence * 100)}%`
    ),
    isMounted ? (
      <InlineStack gap="200">
        <Button size="slim" onClick={() => handleEdit(product)}>Edit</Button>
        <Button size="slim" tone="critical" onClick={() => handleDelete(product)}>Delete</Button>
      </InlineStack>
    ) : (
      'Loading...'
    )
  ]);

  const currentJob = data.currentJob;
  const totalPages = Math.ceil(data.totalCount / data.pageSize);

  return (
    <Page>
      <TitleBar title="Product Inventory" />
      <Layout>
        {/* Condensed Indexing Status Section */}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Catalog Status</Text>
                <InlineStack gap="400">
                  <Text variant="bodyMd" tone="subdued">
                    {data.isIndexed 
                      ? `${data.productCount} products indexed`
                      : 'No products indexed yet'}
                  </Text>
                  {currentJob && (
                    <Badge tone={currentJob.status === 'running' ? 'info' : 'attention'}>
                      {currentJob.status}
                    </Badge>
                  )}
                </InlineStack>
              </BlockStack>
              {!currentJob && (
                <Button primary onClick={handleStartIndexing}>
                  Re-Index Catalog
                </Button>
              )}
              {currentJob && currentJob.status === 'running' && (
                <Button tone="critical" onClick={() => {
                  const formData = new FormData();
                  formData.append('actionType', 'stop');
                  fetcher.submit(formData, { method: 'POST' });
                }}>
                  Stop Indexing
                </Button>
              )}
            </InlineStack>
            
            {/* Show progress if indexing */}
            {currentJob && currentJob.totalProducts > 0 && (
              <Box paddingBlockStart="400">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued">
                    Progress: {currentJob.processedProducts || 0} / {currentJob.totalProducts} products
                  </Text>
                  <ProgressBar
                    progress={(currentJob.processedProducts || 0) / currentJob.totalProducts * 100}
                    size="small"
                  />
                </BlockStack>
              </Box>
            )}
          </Card>
        </Layout.Section>
        
        {/* Warning if not indexed */}
        {!data.isIndexed && !currentJob && (
          <Layout.Section>
            <Banner tone="warning">
              <p>
                <strong>No products indexed yet.</strong> Click "Re-Index Catalog" above to start indexing your mattress products.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {/* Current Inventory Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Current Inventory</Text>
                <Text variant="bodyMd" tone="subdued">
                  {data.totalCount} total products
                </Text>
              </InlineStack>
              
              {/* Search and Filters */}
              <InlineStack gap="400" wrap={false}>
                <div style={{ flex: 2 }}>
                  <TextField
                    placeholder="Search by title, vendor, or ID..."
                    value={searchQuery}
                    onChange={handleSearch}
                    autoComplete="off"
                    clearButton
                    onClearButtonClick={() => handleSearch('')}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Select
                    label="Firmness"
                    labelInline
                    options={[
                      { label: 'All', value: '' },
                      ...data.firmnessOptions.map(f => ({ label: f, value: f }))
                    ]}
                    value={selectedFirmness}
                    onChange={(value) => handleFilterChange('firmness', value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Select
                    label="Vendor"
                    labelInline
                    options={[
                      { label: 'All', value: '' },
                      ...data.vendors.map(v => ({ label: v, value: v }))
                    ]}
                    value={selectedVendor}
                    onChange={(value) => handleFilterChange('vendor', value)}
                  />
                </div>
              </InlineStack>
              
              {/* Data Table */}
              {data.products.length > 0 ? (
                <>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                    headings={[
                      'Title',
                      'Vendor',
                      'Type',
                      'Firmness',
                      'Material',
                      'Confidence',
                      'Actions'
                    ]}
                    rows={productRows}
                  />
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <InlineStack align="center" blockAlign="center">
                      <Pagination
                        hasPrevious={data.page > 1}
                        onPrevious={() => handlePageChange(data.page - 1)}
                        hasNext={data.page < totalPages}
                        onNext={() => handlePageChange(data.page + 1)}
                        label={`Page ${data.page} of ${totalPages}`}
                      />
                    </InlineStack>
                  )}
                </>
              ) : (
                <Box padding="600">
                  <InlineStack align="center">
                    <Text variant="bodyMd" tone="subdued">
                      {searchQuery || selectedFirmness || selectedVendor
                        ? 'No products match your filters'
                        : 'No products indexed yet. Start indexing to see your inventory.'}
                    </Text>
                  </InlineStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Recent Indexing Jobs (condensed) */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Recent Indexing Jobs</Text>
              
              {data.recentJobs.length === 0 ? (
                <Text variant="bodyMd" tone="subdued">
                  No indexing jobs yet.
                </Text>
              ) : (
                <List>
                  {data.recentJobs.map((job) => (
                    <List.Item key={job.id}>
                      <InlineStack gap="300" align="space-between">
                        <InlineStack gap="200">
                          <Badge tone={job.status === 'completed' ? 'success' : 'critical'}>
                            {job.status}
                          </Badge>
                          <Text variant="bodyMd">
                            {job.totalProducts} products
                          </Text>
                        </InlineStack>
                        <Text variant="bodySm" tone="subdued">
                          {isMounted ? new Date(job.startedAt).toLocaleString() : 'Loading...'}
                        </Text>
                      </InlineStack>
                    </List.Item>
                  ))}
                </List>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      
      {/* Edit Modal */}
      <EditProductModal
        product={editingProduct}
        active={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProduct}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Product"
        primaryAction={{
          content: 'Delete',
          destructive: true,
          onAction: handleConfirmDelete
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => setShowDeleteConfirm(false)
        }]}
      >
        <Modal.Section>
          <Text>
            Are you sure you want to delete "{productToDelete?.title}"? 
            This will remove it from your searchable catalog and cannot be undone.
          </Text>
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
