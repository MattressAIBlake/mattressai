interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiresIn: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
    // Clean up expired items every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.timestamp + item.expiresIn;
  }

  private cleanup(): void {
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
  conversationHistory: (sessionId: string) => `conversation:${sessionId}`,
  productSearch: (query: string) => `product:${query}`,
  merchantConfig: (merchantId: string) => `merchant:${merchantId}`,
}; 