import { mainApi } from '../config/api';
import { cacheService, CACHE_KEYS } from './cache.service';
const MERCHANT_CONFIG_CACHE_TTL = 60 * 60 * 1000; // 1 hour
export const MerchantService = {
    async getConfig(merchantId) {
        try {
            // Check cache first
            const cachedConfig = cacheService.get(CACHE_KEYS.merchantConfig(merchantId));
            if (cachedConfig) {
                return cachedConfig;
            }
            const response = await mainApi.get(`/api/config/${merchantId}`);
            const config = response.data;
            // Cache the config
            cacheService.set(CACHE_KEYS.merchantConfig(merchantId), config, MERCHANT_CONFIG_CACHE_TTL);
            return config;
        }
        catch (error) {
            console.error('Error fetching merchant config:', error);
            throw error;
        }
    },
    async refreshConfig(merchantId) {
        try {
            const response = await mainApi.get(`/api/config/${merchantId}`);
            const config = response.data;
            // Update cache with fresh data
            cacheService.set(CACHE_KEYS.merchantConfig(merchantId), config, MERCHANT_CONFIG_CACHE_TTL);
            return config;
        }
        catch (error) {
            console.error('Error refreshing merchant config:', error);
            throw error;
        }
    },
};
