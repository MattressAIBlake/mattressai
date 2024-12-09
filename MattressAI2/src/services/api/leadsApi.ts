import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';

export interface Lead {
  id: string;
  merchantId: string;
  customerName?: string;
  email?: string;
  phone?: string;
  conversationId: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: 'chat' | 'website' | 'manual';
  notes?: string;
  recommendedProducts: string[];
  requirements?: {
    sleepingPosition?: string[];
    painPoints?: string[];
    preferences?: string[];
    budget?: {
      min: number;
      max: number;
    };
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

export interface CreateLeadRequest {
  customerName?: string;
  email?: string;
  phone?: string;
  conversationId: string;
  source: Lead['source'];
  notes?: string;
  recommendedProducts: string[];
  requirements?: Lead['requirements'];
  metadata?: Record<string, any>;
}

export interface UpdateLeadRequest {
  customerName?: string;
  email?: string;
  phone?: string;
  status?: Lead['status'];
  notes?: string;
  recommendedProducts?: string[];
  requirements?: Partial<Lead['requirements']>;
  metadata?: Record<string, any>;
}

export interface LeadFilters {
  status?: Lead['status'];
  source?: Lead['source'];
  startDate?: string;
  endDate?: string;
  search?: string;
}

class LeadsApi {
  private baseUrl = '/leads';

  // Get all leads with filtering and pagination
  async getLeads(filters?: LeadFilters, page = 1, perPage = 10): Promise<PaginatedResponse<Lead>> {
    return apiClient.get(this.baseUrl, { ...filters, page, perPage });
  }

  // Get a specific lead
  async getLead(leadId: string): Promise<ApiResponse<Lead>> {
    return apiClient.get(`${this.baseUrl}/${leadId}`);
  }

  // Create a new lead
  async createLead(lead: CreateLeadRequest): Promise<ApiResponse<Lead>> {
    return apiClient.post(this.baseUrl, lead);
  }

  // Update an existing lead
  async updateLead(leadId: string, updates: UpdateLeadRequest): Promise<ApiResponse<Lead>> {
    return apiClient.put(`${this.baseUrl}/${leadId}`, updates);
  }

  // Delete a lead
  async deleteLead(leadId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${leadId}`);
  }

  // Mark a lead as contacted
  async markContacted(leadId: string): Promise<ApiResponse<Lead>> {
    return apiClient.post(`${this.baseUrl}/${leadId}/contact`, {
      status: 'contacted',
      lastContactedAt: new Date().toISOString()
    });
  }

  // Add a note to a lead
  async addNote(leadId: string, note: string): Promise<ApiResponse<Lead>> {
    return apiClient.post(`${this.baseUrl}/${leadId}/notes`, { note });
  }

  // Get lead statistics
  async getStatistics(startDate?: string, endDate?: string): Promise<ApiResponse<{
    total: number;
    byStatus: Record<Lead['status'], number>;
    bySource: Record<Lead['source'], number>;
    conversionRate: number;
    averageResponseTime: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`, { startDate, endDate });
  }

  // Export leads
  async exportLeads(filters?: LeadFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      ...filters,
      format,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  // Get lead conversation history
  async getConversationHistory(leadId: string): Promise<ApiResponse<{
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }>> {
    return apiClient.get(`${this.baseUrl}/${leadId}/conversation`);
  }
}

export const leadsApi = new LeadsApi(); 