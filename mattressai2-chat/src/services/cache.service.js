class MemoryCache {
    constructor() {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "DEFAULT_TTL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5 * 60 * 1000
        }); // 5 minutes
        this.cache = new Map();
        // Clean up expired items every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }
    set(key, value, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            expiresIn: ttl,
        });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (this.isExpired(item)) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    isExpired(item) {
        return Date.now() > item.timestamp + item.expiresIn;
    }
    cleanup() {
        for (const [key, item] of this.cache.entries()) {
            if (this.isExpired(item)) {
                this.cache.delete(key);
            }
        }
    }
}
// Create singleton instance
export const cacheService = new MemoryCache();
// Cache keys
export const CACHE_KEYS = {
    conversationHistory: (sessionId) => `conversation:${sessionId}`,
    productSearch: (query) => `product:${query}`,
    merchantConfig: (merchantId) => `merchant:${merchantId}`,
};
