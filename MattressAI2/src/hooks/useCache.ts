import { useState, useEffect } from 'react';

interface CacheOptions {
  key: string;
  ttl?: number; // Time to live in milliseconds
}

export const useCache = <T>({ key, ttl = 5 * 60 * 1000 }: CacheOptions) => {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < ttl) {
            setData(value);
            return true;
          }
          localStorage.removeItem(key);
        }
        return false;
      } catch (error) {
        console.error('Cache error:', error);
        return false;
      }
    };

    loadFromCache();
  }, [key, ttl]);

  const updateCache = (newData: T) => {
    try {
      const cacheData = {
        value: newData,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      setData(newData);
    } catch (error) {
      console.error('Cache update error:', error);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(key);
      setData(null);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  };

  return { data, updateCache, clearCache };
};