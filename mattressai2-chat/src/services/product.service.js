import { vectorDbApi } from '../config/api';
import { cacheService, CACHE_KEYS } from './cache.service';
const PRODUCT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_TIME = 300; // 300ms debounce for search
export const ProductService = {
    // Store debounce timers
    _debounceTimers: {},
    _getCacheKey(params) {
        return CACHE_KEYS.productSearch(`${params.query}:${params.category || ''}:${params.limit}:${params.minScore}`);
    },
    async searchProducts({ query, category, limit = 3, minScore = 0.7, }) {
        const cacheKey = this._getCacheKey({ query, category, limit, minScore });
        try {
            // Check cache first
            const cachedResults = cacheService.get(cacheKey);
            if (cachedResults) {
                return cachedResults;
            }
            // Clear any existing debounce timer for this query
            if (this._debounceTimers[query]) {
                clearTimeout(this._debounceTimers[query]);
            }
            // Create a promise that resolves after the debounce time
            const results = await new Promise((resolve, reject) => {
                this._debounceTimers[query] = setTimeout(async () => {
                    try {
                        const response = await vectorDbApi.post('/search', {
                            query,
                            filters: category ? { category } : undefined,
                            limit,
                            minScore,
                        });
                        // Cache the results
                        cacheService.set(cacheKey, response.data, PRODUCT_CACHE_TTL);
                        resolve(response.data);
                    }
                    catch (error) {
                        reject(error);
                    }
                }, DEBOUNCE_TIME);
            });
            return results;
        }
        catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    },
    formatProductContext(products) {
        if (products.length === 0)
            return '';
        return `Available products that match the query:\n\n${products
            .map(({ product, relevanceScore }) => `
Product: ${product.name}
Price: $${product.price}
Key Features:
${product.features.map(feature => `- ${feature}`).join('\n')}
Specifications:
${Object.entries(product.specifications)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n')}
Availability: ${product.inStock ? 'In Stock' : 'Out of Stock'}
---`)
            .join('\n')}`;
    },
    async getRelevantProductContext(query) {
        try {
            const products = await this.searchProducts({ query });
            return this.formatProductContext(products);
        }
        catch (error) {
            console.error('Error getting product context:', error);
            return '';
        }
    },
};
