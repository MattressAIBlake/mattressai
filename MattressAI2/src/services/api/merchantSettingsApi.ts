import { apiClient, ApiResponse } from './apiClient';

export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  timezone: string;
  language: string;
  currency: string;
  logo?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  businessHours?: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string;
    close: string;
    closed: boolean;
  }>;
}

export interface NotificationSettings {
  email: {
    newLeads: boolean;
    leadUpdates: boolean;
    dailyReport: boolean;
    weeklyReport: boolean;
    systemAlerts: boolean;
  };
  slack?: {
    enabled: boolean;
    webhook: string;
    channels: {
      newLeads: string;
      leadUpdates: string;
      systemAlerts: string;
    };
  };
  sms?: {
    enabled: boolean;
    phoneNumber: string;
    notifications: {
      newLeads: boolean;
      urgentAlerts: boolean;
    };
  };
}

export interface IntegrationSettings {
  crm?: {
    provider: 'salesforce' | 'hubspot' | 'zoho' | 'other';
    apiKey?: string;
    webhook?: string;
    syncEnabled: boolean;
    lastSync?: string;
    mappings: Record<string, string>;
  };
  analytics?: {
    googleAnalytics?: {
      enabled: boolean;
      trackingId: string;
      goals: Record<string, string>;
    };
    facebookPixel?: {
      enabled: boolean;
      pixelId: string;
    };
  };
  calendar?: {
    provider: 'google' | 'outlook' | 'other';
    connected: boolean;
    syncEnabled: boolean;
    settings: Record<string, any>;
  };
}

export interface BillingSettings {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  subscriptionId: string;
  currentPeriod: {
    start: string;
    end: string;
  };
  paymentMethod?: {
    type: 'card' | 'bank_account';
    last4: string;
    expiryDate?: string;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl: string;
  }>;
  usage: {
    conversations: number;
    leads: number;
    storage: number;
  };
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'agent';
  status: 'active' | 'invited' | 'disabled';
  lastLogin?: string;
  permissions: string[];
}

class MerchantSettingsApi {
  private baseUrl = '/merchant-settings';

  // Profile Management
  async getProfile(): Promise<ApiResponse<MerchantProfile>> {
    return apiClient.get(`${this.baseUrl}/profile`);
  }

  async updateProfile(profile: Partial<MerchantProfile>): Promise<ApiResponse<MerchantProfile>> {
    return apiClient.put(`${this.baseUrl}/profile`, profile);
  }

  async uploadLogo(file: File): Promise<ApiResponse<{ logoUrl: string }>> {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post(`${this.baseUrl}/profile/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Notification Settings
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.get(`${this.baseUrl}/notifications`);
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.put(`${this.baseUrl}/notifications`, settings);
  }

  async testNotification(channel: 'email' | 'slack' | 'sms'): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/notifications/test`, { channel });
  }

  // Integration Settings
  async getIntegrations(): Promise<ApiResponse<IntegrationSettings>> {
    return apiClient.get(`${this.baseUrl}/integrations`);
  }

  async updateIntegration(
    type: keyof IntegrationSettings,
    settings: any
  ): Promise<ApiResponse<IntegrationSettings>> {
    return apiClient.put(`${this.baseUrl}/integrations/${type}`, settings);
  }

  async testIntegration(
    type: keyof IntegrationSettings
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/integrations/${type}/test`);
  }

  // Billing Settings
  async getBillingSettings(): Promise<ApiResponse<BillingSettings>> {
    return apiClient.get(`${this.baseUrl}/billing`);
  }

  async updatePaymentMethod(paymentMethodId: string): Promise<ApiResponse<BillingSettings>> {
    return apiClient.put(`${this.baseUrl}/billing/payment-method`, { paymentMethodId });
  }

  async changePlan(planId: string): Promise<ApiResponse<BillingSettings>> {
    return apiClient.post(`${this.baseUrl}/billing/change-plan`, { planId });
  }

  async getInvoices(page = 1, perPage = 10): Promise<ApiResponse<BillingSettings['invoices']>> {
    return apiClient.get(`${this.baseUrl}/billing/invoices`, { page, perPage });
  }

  // Team Management
  async getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
    return apiClient.get(`${this.baseUrl}/team`);
  }

  async inviteTeamMember(email: string, role: TeamMember['role']): Promise<ApiResponse<TeamMember>> {
    return apiClient.post(`${this.baseUrl}/team/invite`, { email, role });
  }

  async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<ApiResponse<TeamMember>> {
    return apiClient.put(`${this.baseUrl}/team/${memberId}`, updates);
  }

  async removeTeamMember(memberId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/team/${memberId}`);
  }

  async resendInvite(memberId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post(`${this.baseUrl}/team/${memberId}/resend-invite`);
  }
}

export const merchantSettingsApi = new MerchantSettingsApi(); 