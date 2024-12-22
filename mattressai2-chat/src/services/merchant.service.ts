import { mainApi } from '../config/api';
import { cacheService, CACHE_KEYS } from './cache.service';

export interface MerchantConfig {
  id: string;
  name: string;
  branding: {
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
    };
    fonts?: {
      primary?: string;
      secondary?: string;
    };
    logo?: string;
  };
  chatConfig: {
    masterPrompt: string;
    temperature: number;
    welcomeMessage?: string;
    maxTokens?: number;
    model?: string;
  };
}

const MERCHANT_CONFIG_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const MerchantService = {
  async getConfig(merchantId: string): Promise<MerchantConfig> {
    try {
      // Check cache first
      const cachedConfig = cacheService.get<MerchantConfig>(
        CACHE_KEYS.merchantConfig(merchantId)
      );
      
      if (cachedConfig) {
        return cachedConfig;
      }

      const response = await mainApi.get<MerchantConfig>(`/api/config/${merchantId}`);
      const config = response.data;

      // Cache the config
      cacheService.set(
        CACHE_KEYS.merchantConfig(merchantId),
        config,
        MERCHANT_CONFIG_CACHE_TTL
      );

      return config;
    } catch (error) {
      console.error('Error fetching merchant config:', error);
      throw error;
    }
  },

  async refreshConfig(merchantId: string): Promise<MerchantConfig> {
    try {
      const response = await mainApi.get<MerchantConfig>(`/api/config/${merchantId}`);
      const config = response.data;

      // Update cache with fresh data
      cacheService.set(
        CACHE_KEYS.merchantConfig(merchantId),
        config,
        MERCHANT_CONFIG_CACHE_TTL
      );

      return config;
    } catch (error) {
      console.error('Error refreshing merchant config:', error);
      throw error;
    }
  },
}; 