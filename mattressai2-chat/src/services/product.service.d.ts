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
type DebounceTimers = {
    [key: string]: NodeJS.Timeout;
};
export declare const ProductService: {
    _debounceTimers: DebounceTimers;
    _getCacheKey(params: VectorSearchParams): string;
    searchProducts({ query, category, limit, minScore, }: VectorSearchParams): Promise<ProductSearchResult[]>;
    formatProductContext(products: ProductSearchResult[]): string;
    getRelevantProductContext(query: string): Promise<string>;
};
export {};
