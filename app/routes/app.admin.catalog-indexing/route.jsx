import { json } from '@remix-run/node';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLoaderData, useFetcher, useNavigate, useSearchParams, useRevalidator } from '@remix-run/react';
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
  Frame,
  Thumbnail,
  Checkbox,
  DropZone
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import {
  DatabaseIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';

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
 * Helper function to determine indexing stage and message based on progress
 */
function getIndexingStage(processedProducts, totalProducts) {
  if (!totalProducts || totalProducts === 0) {
    return { stage: 'starting', message: 'Starting indexing job...', icon: 'pending' };
  }
  
  const percentage = (processedProducts / totalProducts) * 100;
  
  if (percentage < 10) {
    return { stage: 'connecting', message: 'Connecting to Shopify...', icon: 'pending' };
  } else if (percentage < 30) {
    return { stage: 'fetching', message: 'Fetching products from Shopify...', icon: 'active' };
  } else if (percentage < 50) {
    return { stage: 'filtering', message: 'Filtering mattress products...', icon: 'active' };
  } else if (percentage < 90) {
    return { stage: 'enriching', message: 'Running AI enrichment...', icon: 'active' };
  } else {
    return { stage: 'saving', message: 'Saving to database...', icon: 'active' };
  }
}

/**
 * Helper function to estimate time remaining
 */
function estimateTimeRemaining(processedProducts, totalProducts, startedAt) {
  if (!processedProducts || !totalProducts || processedProducts === 0) {
    return null;
  }
  
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const rate = processedProducts / elapsed; // products per millisecond
  const remaining = totalProducts - processedProducts;
  const estimatedMs = remaining / rate;
  const estimatedMinutes = Math.ceil(estimatedMs / 60000);
  
  return estimatedMinutes;
}

/**
 * Loader function - get indexed products and indexing status
 */
export async function loader({ request }) {
  try {
    const { prisma } = await import('~/db.server');
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);

    // Pagination and filters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = 20;
    const search = url.searchParams.get('search') || '';

    // Build where clause
    const where = {
      tenant: session.shop,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { shopifyProductId: { contains: search } }
        ]
      })
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
        search
      },
      currentJob,
      recentJobs,
      isIndexing: !!currentJob,
      isIndexed,
      productCount
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error loading catalog indexing page:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Return error response with code for frontend detection
    return json(
      {
        error: 'Failed to load catalog data',
        message: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

/**
 * Action function - handle edit/delete products and indexing operations
 */
export async function action({ request }) {
  const { prisma } = await import('~/db.server');
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get('actionType');

  // Edit Product Action
  if (actionType === 'editProduct') {
    const productId = formData.get('productId');
    const criticalFieldChanged = formData.get('criticalFieldChanged') === 'true';
    
    const updates = {
      title: formData.get('title'),
      imageUrl: formData.get('imageUrl') || null,
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

  // Bulk Delete Products Action
  if (actionType === 'bulkDeleteProducts') {
    const productsData = formData.get('productsData');
    
    try {
      const products = JSON.parse(productsData);
      const { getVectorStoreProvider } = await import('~/lib/ports/provider-registry');
      const vectorStoreProvider = getVectorStoreProvider(session.shop);
      
      // Delete from PostgreSQL in a transaction
      await prisma.$transaction(
        products.map(product => 
          prisma.productProfile.delete({
            where: { id: product.id }
          })
        )
      );
      
      // Delete from Pinecone
      const pineconeIds = products.map(p => `product-${p.shopifyProductId}`);
      await vectorStoreProvider.delete(pineconeIds);
      
      console.log(`Bulk deleted ${products.length} products from both databases`);
      
      return json({ 
        success: true, 
        message: `Successfully deleted ${products.length} product${products.length > 1 ? 's' : ''}` 
      });
    } catch (error) {
      console.error('Failed to bulk delete products:', error);
      return json(
        { error: 'Failed to delete products', details: error.message },
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
    imageUrl: '',
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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form when product changes - only when modal is active to prevent hydration issues
  useEffect(() => {
    if (product && active) {
      const initialData = {
        title: product.title || '',
        imageUrl: product.imageUrl || '',
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
  
  // Handle file drop/upload
  const handleDropZoneDrop = useCallback(async (_dropFiles, acceptedFiles, _rejectedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadedFile(file);
    
    try {
      // Convert file to base64 for upload to imgbb
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        
        // Upload to imgbb (free tier, no API key needed for anonymous uploads)
        const formData = new FormData();
        formData.append('image', base64data);
        
        const response = await fetch('https://api.imgbb.com/1/upload?key=d0b4362f64e736da3cf4e76c2a0d5e2e', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Set the image URL from imgbb
          handleChange('imageUrl')(data.data.url);
        } else {
          console.error('Image upload failed:', data);
          alert('Image upload failed. Please try again or paste a URL directly.');
        }
        
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Image upload failed. Please try again or paste a URL directly.');
      setIsUploading(false);
    }
  }, []);
  
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
          
          <BlockStack gap="300">
            <Text variant="headingSm" as="h3">Product Image</Text>
            
            {formData.imageUrl ? (
              <BlockStack gap="200">
                <Box>
                  <Thumbnail 
                    source={formData.imageUrl} 
                    alt="Product preview" 
                    size="large" 
                  />
                </Box>
                <InlineStack gap="200">
                  <Button size="slim" onClick={() => handleChange('imageUrl')('')}>
                    Remove Image
                  </Button>
                  <Text variant="bodySm" tone="subdued">or upload a new one below</Text>
                </InlineStack>
              </BlockStack>
            ) : null}
            
            <DropZone
              accept="image/*"
              type="image"
              onDrop={handleDropZoneDrop}
              disabled={isUploading}
              allowMultiple={false}
            >
              <DropZone.FileUpload actionTitle="Upload from computer" actionHint="or drag and drop" />
            </DropZone>
            
            {isUploading && (
              <InlineStack gap="200" blockAlign="center">
                <Spinner size="small" />
                <Text variant="bodySm">Uploading image...</Text>
              </InlineStack>
            )}
          </BlockStack>
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
  const revalidator = useRevalidator();
  
  // Temporarily disabled error handling - run SQL directly instead
  // See FIX_DATABASE.md for instructions
  
  // State management - initialize with loader data to prevent hydration errors
  const [searchQuery, setSearchQuery] = useState(data.currentFilters.search || '');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastDuration, setToastDuration] = useState(4000);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [indexingCompleteCount, setIndexingCompleteCount] = useState(0);
  const [showHelpCard, setShowHelpCard] = useState(false);
  const [showIndexingWarning, setShowIndexingWarning] = useState(false);
  const [estimatedProgress, setEstimatedProgress] = useState(0);
  
  // Track previous job status to detect completion
  const previousJobRef = useRef(null);

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
    setSelectedProducts([]); // Clear selections on search
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
    
    setSearchParams(params);
    setSelectedProducts([]); // Clear selections on filter change
  }, [searchParams, setSearchParams]);

  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    setSelectedProducts([]); // Clear selections on page change
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

  // Handle start indexing - show warning modal
  const handleStartIndexing = () => {
    setShowIndexingWarning(true);
  };

  // Actually start indexing after user confirms
  const confirmAndStartIndexing = () => {
    setShowIndexingWarning(false);
    
    // Submit the indexing job
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
      setToastDuration(4000);
      setShowToast(true);
      // Clear selections after successful bulk delete
      setSelectedProducts([]);
    } else if (fetcher.data?.error) {
      setToastMessage(fetcher.data.error);
      setToastDuration(4000);
      setShowToast(true);
    }
  }, [fetcher.data]);

  // Polling mechanism - refresh data every 3 seconds when indexing is active
  useEffect(() => {
    const currentJob = data.currentJob;
    
    // Only poll if there's an active job
    if (!currentJob || (currentJob.status !== 'pending' && currentJob.status !== 'running')) {
      setEstimatedProgress(0);
      return;
    }
    
    // Calculate time-based progress for smooth UI updates
    const startTime = new Date(currentJob.startedAt).getTime();
    const estimatedDuration = 120000; // 120 seconds
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
      setEstimatedProgress(calculatedProgress);
    };
    
    // Initial progress calculation
    updateProgress();
    
    const interval = setInterval(() => {
      revalidator.revalidate();
      updateProgress();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [data.currentJob, revalidator]);

  // Detect indexing completion and show success notification
  useEffect(() => {
    const currentJob = data.currentJob;
    const previousJob = previousJobRef.current;
    
    // Check if job just completed
    if (previousJob && 
        (previousJob.status === 'pending' || previousJob.status === 'running') &&
        (!currentJob || currentJob.status === 'completed')) {
      
      // Job completed successfully
      setIndexingCompleteCount(data.productCount);
      setShowSuccessBanner(true);
      setToastMessage(`Indexing complete! ${data.productCount} products in catalog.`);
      setToastDuration(5000);
      setShowToast(true);
      
      // Revalidate one final time to get latest data
      setTimeout(() => {
        revalidator.revalidate();
      }, 500);
    } else if (previousJob &&
               (previousJob.status === 'pending' || previousJob.status === 'running') &&
               currentJob && currentJob.status === 'failed') {
      
      // Job failed
      setToastMessage(`Indexing failed: ${currentJob.errorMessage || 'Unknown error'}`);
      setToastDuration(5000);
      setShowToast(true);
    }
    
    // Update previous job ref
    previousJobRef.current = currentJob;
  }, [data.currentJob, data.productCount, revalidator]);

  // Handle product selection
  const handleSelectProduct = useCallback((productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  // Handle select all products on current page
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedProducts(data.products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [data.products]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    setShowBulkDeleteConfirm(true);
  }, []);

  // Handle confirm bulk delete
  const handleConfirmBulkDelete = useCallback(() => {
    const productsToDelete = data.products.filter(p => selectedProducts.includes(p.id));
    
    const formData = new FormData();
    formData.append('actionType', 'bulkDeleteProducts');
    formData.append('productsData', JSON.stringify(productsToDelete.map(p => ({
      id: p.id,
      shopifyProductId: p.shopifyProductId
    }))));
    
    fetcher.submit(formData, { method: 'POST' });
    setShowBulkDeleteConfirm(false);
  }, [selectedProducts, data.products, fetcher]);

  // Build product rows for table
  const productRows = data.products.map(product => [
    // Checkbox column
    <Checkbox
      checked={selectedProducts.includes(product.id)}
      onChange={() => handleSelectProduct(product.id)}
      ariaLabel={`Select ${product.title || 'product'}`}
    />,
    // Image column
    product.imageUrl ? (
      <Thumbnail source={product.imageUrl} alt={product.title || 'Product'} size="small" />
    ) : (
      <Text tone="subdued">-</Text>
    ),
    product.title || 'Untitled',
    product.firmness || '-',
    product.material || '-',
    <Badge tone={product.confidence > 0.8 ? 'success' : product.confidence > 0.5 ? 'info' : 'warning'}>
      {Math.round(product.confidence * 100)}%
    </Badge>,
    <InlineStack gap="200">
      <Button size="slim" onClick={() => handleEdit(product)}>Edit</Button>
      <Button size="slim" tone="critical" onClick={() => handleDelete(product)}>Delete</Button>
    </InlineStack>
  ]);

  const currentJob = data.currentJob;
  const totalPages = Math.ceil(data.totalCount / data.pageSize);
  
  // Calculate stage and progress information using time-based estimation
  const isIndexing = currentJob && (currentJob.status === 'pending' || currentJob.status === 'running');
  
  // Use time-based progress for smooth UI updates (doesn't rely on database updates during processing)
  const progressPercentage = isIndexing ? estimatedProgress : 0;
  
  // Estimate products processed based on time-based progress
  const estimatedProcessed = isIndexing && currentJob.totalProducts > 0
    ? Math.floor((estimatedProgress / 100) * currentJob.totalProducts)
    : 0;
  
  const stageInfo = isIndexing 
    ? getIndexingStage(estimatedProcessed, currentJob.totalProducts || 0)
    : null;
  
  // Calculate estimated time remaining based on progress
  const estimatedTime = isIndexing && estimatedProgress > 0 && estimatedProgress < 95
    ? Math.ceil((120 * (100 - estimatedProgress)) / 100)
    : null;

  return (
    <Page>
      <TitleBar title="Product Inventory" />
      <Layout>
        {/* Success Banner - shown after indexing completes */}
        {showSuccessBanner && !isIndexing && (
          <Layout.Section>
            <Banner
              tone="success"
              onDismiss={() => setShowSuccessBanner(false)}
            >
              <p>
                <strong>Indexing complete!</strong> {indexingCompleteCount} products added to your catalog.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {/* Enhanced Indexing Status Section */}
        <Layout.Section>
          <Card>
            {!isIndexing ? (
              // Condensed view when not indexing
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h2">Catalog Status</Text>
                  <Text variant="bodyMd" tone="subdued">
                    {data.isIndexed 
                      ? `${data.productCount} products indexed`
                      : 'No products indexed yet'}
                  </Text>
                </BlockStack>
                <Button 
                  primary 
                  onClick={handleStartIndexing}
                  loading={fetcher.state === 'submitting'}
                  disabled={fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? 'Starting...' : 'Re-Index Catalog'}
                </Button>
              </InlineStack>
            ) : (
              // Enhanced view when indexing is active
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="start">
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingMd" as="h2">Indexing in Progress</Text>
                      <Badge tone="info">
                        {currentJob.status === 'running' ? 'Running' : 'Starting'}
                      </Badge>
                    </InlineStack>
                    {stageInfo && (
                      <InlineStack gap="200" blockAlign="center">
                        <Spinner size="small" />
                        <Text variant="bodyMd">{stageInfo.message}</Text>
                      </InlineStack>
                    )}
                  </BlockStack>
                  <Button 
                    tone="critical" 
                    onClick={() => {
                      const formData = new FormData();
                      formData.append('actionType', 'stop');
                      fetcher.submit(formData, { method: 'POST' });
                    }}
                  >
                    Stop Indexing
                  </Button>
                </InlineStack>
                
                {/* Progress Details */}
                {currentJob.totalProducts > 0 && (
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text variant="bodyMd">
                        Processing: {estimatedProcessed} / {currentJob.totalProducts} products
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        {progressPercentage}%
                      </Text>
                    </InlineStack>
                    <ProgressBar
                      progress={progressPercentage}
                      size="medium"
                      tone="primary"
                    />
                    {estimatedTime && estimatedTime > 0 && (
                      <Text variant="bodySm" tone="subdued">
                        Estimated time remaining: ~{estimatedTime} {estimatedTime === 1 ? 'second' : 'seconds'}
                      </Text>
                    )}
                  </BlockStack>
                )}
              </BlockStack>
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
              
              {/* AI Help Card - Collapsible */}
              <Card>
                <BlockStack gap="300">
                  <button
                    onClick={() => setShowHelpCard(!showHelpCard)}
                    className="polaris-button-plain"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingSm" as="h3">💡 Tips for Best Results</Text>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        {showHelpCard ? '▲' : '▼'}
                      </Text>
                    </InlineStack>
                  </button>
                  
                  {showHelpCard && (
                    <BlockStack gap="300">
                      <Divider />
                      <BlockStack gap="200">
                        <Text variant="bodyMd" as="p">Our AI has done its best to:</Text>
                        <List type="bullet">
                          <List.Item>Extract accurate product attributes</List.Item>
                          <List.Item>Classify firmness and materials</List.Item>
                          <List.Item>Generate matchable descriptions</List.Item>
                        </List>
                      </BlockStack>
                      
                      <BlockStack gap="200">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          For optimal customer matching, please:
                        </Text>
                        <List>
                          <List.Item>✓ Review each product's AI-generated attributes</List.Item>
                          <List.Item>✓ Verify product photos are clear and accurate</List.Item>
                          <List.Item>✓ Update descriptions where needed</List.Item>
                        </List>
                      </BlockStack>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
              
              {/* Search and Filters */}
              <TextField
                placeholder="Search for specific mattress"
                value={searchQuery}
                onChange={handleSearch}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => handleSearch('')}
              />
              
              {/* Bulk Action Banner */}
              {selectedProducts.length > 0 && (
                <Banner
                  tone="info"
                  onDismiss={() => setSelectedProducts([])}
                >
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" as="p">
                      {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                    </Text>
                    <Button
                      tone="critical"
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                  </InlineStack>
                </Banner>
              )}

              {/* Data Table */}
              {data.products.length > 0 ? (
                <>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                    headings={[
                      <Checkbox
                        checked={selectedProducts.length === data.products.length && data.products.length > 0}
                        onChange={(checked) => handleSelectAll(checked)}
                        ariaLabel="Select all products on this page"
                      />,
                      'Image',
                      'Name',
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
                      {searchQuery
                        ? 'No products match your search'
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
                          {new Date(job.startedAt).toLocaleString()}
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Delete Multiple Products"
        primaryAction={{
          content: `Delete ${selectedProducts.length} Product${selectedProducts.length > 1 ? 's' : ''}`,
          destructive: true,
          onAction: handleConfirmBulkDelete
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => setShowBulkDeleteConfirm(false)
        }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text>
              Are you sure you want to delete {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}? 
              This will remove them from your searchable catalog and cannot be undone.
            </Text>
            {selectedProducts.length > 0 && (
              <Box>
                <Text variant="bodyMd" as="p" fontWeight="semibold">
                  Products to be deleted:
                </Text>
                <List type="bullet">
                  {data.products
                    .filter(p => selectedProducts.includes(p.id))
                    .slice(0, 10)
                    .map(product => (
                      <List.Item key={product.id}>
                        {product.title || 'Untitled'}
                      </List.Item>
                    ))}
                  {selectedProducts.length > 10 && (
                    <List.Item>
                      <Text tone="subdued">
                        ...and {selectedProducts.length - 10} more
                      </Text>
                    </List.Item>
                  )}
                </List>
              </Box>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Indexing Warning Modal */}
      <Modal
        open={showIndexingWarning}
        onClose={() => setShowIndexingWarning(false)}
        title="⚠️ AI Indexing Limitations"
        primaryAction={{
          content: 'Accept and Run',
          onAction: confirmAndStartIndexing
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => setShowIndexingWarning(false)
        }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd">
              Our AI indexing uses significant compute resources. Due to this:
            </Text>
            <List type="bullet">
              <List.Item>
                <Text fontWeight="semibold">You can run 1 indexing job per week</Text>
              </List.Item>
              <List.Item>
                Please add all new products to your Shopify store before running indexing
              </List.Item>
              <List.Item>
                You can manually edit your inventory anytime after indexing completes
              </List.Item>
            </List>
            <Box paddingBlockStart="200">
              <Text variant="bodyMd" tone="subdued">
                Click "Accept and Run" to start the AI indexing process.
              </Text>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Toast notification */}
      {showToast && (
        <Frame>
          <Toast
            content={toastMessage}
            onDismiss={() => setShowToast(false)}
            duration={toastDuration}
          />
        </Frame>
      )}
    </Page>
  );
}
