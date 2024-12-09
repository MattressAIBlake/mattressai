import { useState } from 'react';
import { useAuth } from './useAuth';
import { merchantConfigApi, MerchantConfig } from '../services/api/merchantConfigApi';

interface UseMerchantConfigReturn {
  isLoading: boolean;
  error: Error | null;
  config: MerchantConfig | null;
  updateConfig: (config: Partial<MerchantConfig>) => Promise<void>;
  updateBranding: (branding: Partial<MerchantConfig['branding']>) => Promise<void>;
  updateChatConfig: (chatConfig: Partial<MerchantConfig['chatConfig']>) => Promise<void>;
}

export function useMerchantConfig(): UseMerchantConfigReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<MerchantConfig | null>(null);

  const handleError = (error: unknown) => {
    console.error('Merchant config error:', error);
    setError(error instanceof Error ? error : new Error('An unknown error occurred'));
    setIsLoading(false);
  };

  const updateConfig = async (configData: Partial<MerchantConfig>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await merchantConfigApi.updateConfig(user.uid, configData);
      const updatedConfig = await merchantConfigApi.getConfig();
      setConfig(updatedConfig.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBranding = async (branding: Partial<MerchantConfig['branding']>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await merchantConfigApi.updateBranding(user.uid, branding);
      const updatedConfig = await merchantConfigApi.getConfig();
      setConfig(updatedConfig.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatConfig = async (chatConfig: Partial<MerchantConfig['chatConfig']>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await merchantConfigApi.updateChatConfig(user.uid, chatConfig);
      const updatedConfig = await merchantConfigApi.getConfig();
      setConfig(updatedConfig.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    config,
    updateConfig,
    updateBranding,
    updateChatConfig
  };
} 