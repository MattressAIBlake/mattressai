import { apiClient } from './client';

export interface Brand {
  id: string;
  name: string;
  enabled: boolean;
}

export const brandsApi = {
  getBrands: async () => {
    return apiClient.request<Brand[]>({
      method: 'GET',
      url: '/brands',
    });
  },

  updateBrand: async (id: string, data: Partial<Brand>) => {
    return apiClient.request<Brand>({
      method: 'PATCH',
      url: `/brands/${id}`,
      data,
    });
  },

  syncBrands: async () => {
    return apiClient.request<Brand[]>({
      method: 'POST',
      url: '/brands/sync',
    });
  },
};