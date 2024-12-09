import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebase';
import { MerchantConfig } from './merchantConfigApi';

const db = getFirestore(app);

class ShopperChatApi {
  private merchantId: string | null = null;
  private config: MerchantConfig | null = null;

  async initialize(merchantId: string): Promise<MerchantConfig> {
    try {
      const docRef = doc(db, 'merchantConfig', merchantId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Merchant configuration not found');
      }

      this.merchantId = merchantId;
      this.config = docSnap.data() as MerchantConfig;
      return this.config;
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      throw error;
    }
  }

  getConfig(): MerchantConfig | null {
    return this.config;
  }

  getMerchantId(): string | null {
    return this.merchantId;
  }

  // Apply branding to the chat interface
  applyBranding(): void {
    if (!this.config?.branding) return;

    const { colors, fonts } = this.config.branding;
    const root = document.documentElement;

    // Apply colors
    if (colors) {
      if (colors.primary) root.style.setProperty('--chat-primary-color', colors.primary);
      if (colors.secondary) root.style.setProperty('--chat-secondary-color', colors.secondary);
      if (colors.background) root.style.setProperty('--chat-background-color', colors.background);
      if (colors.text) root.style.setProperty('--chat-text-color', colors.text);
    }

    // Apply fonts
    if (fonts) {
      if (fonts.primary) root.style.setProperty('--chat-primary-font', fonts.primary);
      if (fonts.secondary) root.style.setProperty('--chat-secondary-font', fonts.secondary);
    }
  }

  // Get chat configuration for OpenAI
  getChatConfig() {
    if (!this.config?.chatConfig) {
      throw new Error('Chat configuration not initialized');
    }

    return {
      masterPrompt: this.config.chatConfig.masterPrompt,
      temperature: this.config.chatConfig.temperature,
      maxTokens: this.config.chatConfig.maxTokens || 2000,
      model: this.config.chatConfig.model || 'gpt-3.5-turbo'
    };
  }
}

export const shopperChatApi = new ShopperChatApi(); 