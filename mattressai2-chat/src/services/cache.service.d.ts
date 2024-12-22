declare class MemoryCache {
    private cache;
    private readonly DEFAULT_TTL;
    constructor();
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    private isExpired;
    private cleanup;
}
export declare const cacheService: MemoryCache;
export declare const CACHE_KEYS: {
    conversationHistory: (sessionId: string) => string;
    productSearch: (query: string) => string;
    merchantConfig: (merchantId: string) => string;
};
export {};
