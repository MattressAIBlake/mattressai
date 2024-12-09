import { apiClient } from './client';

export interface AssistantSettings {
  name: string;
  companyDescription: string;
  persona: string;
  greeting: string;
}

export interface ContactDetails {
  adminMobile: string;
  adminEmail: string;
  chatRedirectLinks: string[];
}

export const settingsApi = {
  getAssistantSettings: async () => {
    return apiClient.request<AssistantSettings>({
      method: 'GET',
      url: '/settings/assistant',
    });
  },

  updateAssistantSettings: async (data: Partial<AssistantSettings>) => {
    return apiClient.request<AssistantSettings>({
      method: 'PATCH',
      url: '/settings/assistant',
      data,
    });
  },

  getContactDetails: async () => {
    return apiClient.request<ContactDetails>({
      method: 'GET',
      url: '/settings/contact',
    });
  },

  updateContactDetails: async (data: Partial<ContactDetails>) => {
    return apiClient.request<ContactDetails>({
      method: 'PATCH',
      url: '/settings/contact',
      data,
    });
  },

  getAssistantQuestions: async () => {
    return apiClient.request<{ lite: string[]; plus: string[] }>({
      method: 'GET',
      url: '/settings/questions',
    });
  },

  updateAssistantQuestions: async (data: {
    lite: string[];
    plus: string[];
  }) => {
    return apiClient.request<{ lite: string[]; plus: string[] }>({
      method: 'PATCH',
      url: '/settings/questions',
      data,
    });
  },
};