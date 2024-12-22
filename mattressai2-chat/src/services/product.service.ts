import { vectorDbApi } from '../config/api';
import { cacheService, CACHE_KEYS } from './cache.service';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  specifications: {
    [key: string]: string | number;
  };
  category: string;
  inStock: boolean;
}

export interface ProductSearchResult {
  product: Product;
  relevanceScore: number;
}

export interface VectorSearchParams {
  query: string;
  category?: string;
  limit?: number;
  minScore?: number;
}

const PRODUCT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_TIME = 300; // 300ms debounce for search

export const ProductService = {
  _debounceTimers: {} as { [key: string]: ReturnType<typeof setTimeout> },

  _getCacheKey(params: VectorSearchParams): string {
    return CACHE_KEYS.productSearch(
      `${params.query}:${params.category || ''}:${params.limit}:${params.minScore}`
    );
  },

  async searchProducts({
    query,
    category,
    limit = 3,
    minScore = 0.7,
  }: VectorSearchParams): Promise<ProductSearchResult[]> {
    const cacheKey = this._getCacheKey({ query, category, limit, minScore });
    
    try {
      // Check cache first
      const cachedResults = cacheService.get<ProductSearchResult[]>(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      // Clear any existing debounce timer for this query
      if (this._debounceTimers[query]) {
        clearTimeout(this._debounceTimers[query]);
      }

      // Create a promise that resolves after the debounce time
      const results = await new Promise<ProductSearchResult[]>((resolve, reject) => {
        this._debounceTimers[query] = setTimeout(async () => {
          try {
            const response = await vectorDbApi.post<ProductSearchResult[]>('/search', {
              query,
              filters: category ? { category } : undefined,
              limit,
              minScore,
            });

            // Cache the results
            cacheService.set(cacheKey, response.data, PRODUCT_CACHE_TTL);
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        }, DEBOUNCE_TIME);
      });

      return results;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  formatProductContext(products: ProductSearchResult[]): string {
    if (products.length === 0) return '';

    return `Available products that match the query:\n\n${products
      .map(
        ({ product }) => `
Product: ${product.name}
Price: $${product.price}
Key Features:
${product.features.map(feature => `- ${feature}`).join('\n')}
Specifications:
${Object.entries(product.specifications)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}
Availability: ${product.inStock ? 'In Stock' : 'Out of Stock'}
---`
      )
      .join('\n')}`;
  },

  async getRelevantProductContext(query: string): Promise<string> {
    try {
      const products = await this.searchProducts({ query });
      return this.formatProductContext(products);
    } catch (error) {
      console.error('Error getting product context:', error);
      return '';
    }
  },
}; 