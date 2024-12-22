import { mainApi, openAiApi, vectorDbApi } from '../config/api';

export const ApiService = {
  // Merchant configuration
  getMerchantConfig: async () => {
    const response = await mainApi.get('/merchant/config');
    return response.data;
  },

  // OpenAI chat completion
  getChatCompletion: async (messages: any[]) => {
    const response = await openAiApi.post('/v1/chat/completions', {
      model: 'gpt-4',
      messages,
    });
    return response.data;
  },

  // Vector database operations
  searchVectorDb: async (query: string) => {
    const response = await vectorDbApi.post('/search', { query });
    return response.data;
  },
}; 