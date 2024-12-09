import { apiClient } from './client';
import { Session } from '../../components/sessions/SessionsTable';

export const sessionsApi = {
  getSessions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    verified?: boolean;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.request<{ data: Session[]; total: number }>({
      method: 'GET',
      url: '/sessions',
      params,
    });
  },

  getSession: async (id: string) => {
    return apiClient.request<Session>({
      method: 'GET',
      url: `/sessions/${id}`,
    });
  },

  updateSession: async (id: string, data: Partial<Session>) => {
    return apiClient.request<Session>({
      method: 'PATCH',
      url: `/sessions/${id}`,
      data,
    });
  },

  deleteSession: async (id: string) => {
    return apiClient.request<void>({
      method: 'DELETE',
      url: `/sessions/${id}`,
    });
  },
};