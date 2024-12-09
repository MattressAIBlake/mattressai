import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shopperChatApi } from '../services/api/shopperChatApi';
import { MerchantConfig } from '../services/api/merchantConfigApi';

interface UseShopperChatReturn {
  isLoading: boolean;
  error: Error | null;
  config: MerchantConfig | null;
  merchantId: string | null;
  isInitialized: boolean;
}

export function useShopperChat(): UseShopperChatReturn {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const merchantId = searchParams.get('merchantId');
        if (!merchantId) {
          throw new Error('Merchant ID not provided in URL');
        }

        await shopperChatApi.initialize(merchantId);
        shopperChatApi.applyBranding();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setError(error instanceof Error ? error : new Error('Failed to initialize chat'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [searchParams]);

  return {
    isLoading,
    error,
    config: shopperChatApi.getConfig(),
    merchantId: shopperChatApi.getMerchantId(),
    isInitialized
  };
} 