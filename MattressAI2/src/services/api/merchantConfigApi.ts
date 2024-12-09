import { apiClient, ApiResponse } from './apiClient';
import { BrandingConfig, ChatConfig } from '../../models/chatbot';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { z } from 'zod';

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

const brandingConfigSchema = z.object({
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string().optional(),
    text: z.string().optional()
  }).optional(),
  fonts: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional()
  }).optional(),
  logo: z.string().optional()
});

const chatConfigSchema = z.object({
  masterPrompt: z.string(),
  temperature: z.number(),
  welcomeMessage: z.string().optional(),
  maxTokens: z.number().optional(),
  model: z.string().optional()
});

const merchantConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  branding: brandingConfigSchema,
  chatConfig: chatConfigSchema
});

const db = getFirestore(app);
const merchantConfigCollection = collection(db, 'merchantConfig');

class MerchantConfigApi {
  private baseUrl = '/merchant-config';

  async getConfig(): Promise<ApiResponse<MerchantConfig>> {
    return apiClient.get(`${this.baseUrl}`);
  }

  async updateConfig(merchantId: string, config: Partial<MerchantConfig>): Promise<void> {
    try {
      const validatedData = merchantConfigSchema.partial().parse(config);
      await setDoc(doc(merchantConfigCollection, merchantId), {
        ...validatedData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async updateBranding(merchantId: string, branding: Partial<MerchantConfig['branding']>): Promise<void> {
    try {
      const validatedBranding = brandingConfigSchema.partial().parse(branding);
      await setDoc(doc(merchantConfigCollection, merchantId), {
        branding: validatedBranding,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async updateChatConfig(merchantId: string, chatConfig: Partial<MerchantConfig['chatConfig']>): Promise<void> {
    try {
      const validatedChatConfig = chatConfigSchema.partial().parse(chatConfig);
      await setDoc(doc(merchantConfigCollection, merchantId), {
        chatConfig: validatedChatConfig,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async initializeDefaultConfig(merchantId: string, name: string): Promise<void> {
    const defaultConfig: MerchantConfig = {
      id: merchantId,
      name,
      branding: {
        colors: {
          primary: '#2563eb',
          secondary: '#1e40af',
          background: '#ffffff',
          text: '#000000'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'system-ui'
        }
      },
      chatConfig: {
        masterPrompt: 'I am a helpful AI assistant for mattress recommendations.',
        temperature: 0.7,
        welcomeMessage: 'Welcome! How can I help you find the perfect mattress today?',
        maxTokens: 2000,
        model: 'gpt-3.5-turbo'
      }
    };

    await this.updateConfig(merchantId, defaultConfig);
  }
}

export const merchantConfigApi = new MerchantConfigApi(); 