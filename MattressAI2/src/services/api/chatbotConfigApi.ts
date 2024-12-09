import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { AssistantConfig, Mattress } from '../../stores/assistantPromptStore';

// Types for the API
export interface ChatbotConfig {
  id: string;
  merchantId: string;
  assistantConfig: AssistantConfig;
  inventory: Mattress[];
  masterPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConfigRequest {
  assistantConfig: AssistantConfig;
  inventory: Mattress[];
  masterPrompt: string;
}

export interface UpdateConfigRequest {
  assistantConfig?: Partial<AssistantConfig>;
  inventory?: Mattress[];
  masterPrompt?: string;
}

class ChatbotConfigApi {
  private baseUrl = '/chatbot-config';

  // Get all configurations for the merchant
  async getConfigs(page = 1, perPage = 10): Promise<PaginatedResponse<ChatbotConfig>> {
    return apiClient.get(`${this.baseUrl}`, { page, perPage });
  }

  // Get a specific configuration
  async getConfig(configId: string): Promise<ApiResponse<ChatbotConfig>> {
    return apiClient.get(`${this.baseUrl}/${configId}`);
  }

  // Create a new configuration
  async createConfig(config: CreateConfigRequest): Promise<ApiResponse<ChatbotConfig>> {
    return apiClient.post(this.baseUrl, config);
  }

  // Update an existing configuration
  async updateConfig(configId: string, updates: UpdateConfigRequest): Promise<ApiResponse<ChatbotConfig>> {
    return apiClient.put(`${this.baseUrl}/${configId}`, updates);
  }

  // Delete a configuration
  async deleteConfig(configId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${configId}`);
  }

  // Get the active configuration
  async getActiveConfig(): Promise<ApiResponse<ChatbotConfig>> {
    return apiClient.get(`${this.baseUrl}/active`);
  }

  // Set a configuration as active
  async setActiveConfig(configId: string): Promise<ApiResponse<ChatbotConfig>> {
    return apiClient.post(`${this.baseUrl}/${configId}/activate`);
  }

  // Test a configuration
  async testConfig(configId: string, testMessage: string): Promise<ApiResponse<{
    response: string;
    performance: {
      responseTime: number;
      tokenCount: number;
    };
  }>> {
    return apiClient.post(`${this.baseUrl}/${configId}/test`, { message: testMessage });
  }

  // Export configuration
  async exportConfig(configId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${configId}/export`, {
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  // Import configuration
  async importConfig(file: File): Promise<ApiResponse<ChatbotConfig>> {
    const formData = new FormData();
    formData.append('config', file);
    return apiClient.post(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

export const chatbotConfigApi = new ChatbotConfigApi(); 