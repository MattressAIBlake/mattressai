import { apiClient, ApiResponse } from './apiClient';

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface ConversionMetrics {
  totalVisitors: number;
  totalConversations: number;
  totalLeads: number;
  conversionRate: number;
  averageEngagementTime: number;
  bounceRate: number;
}

export interface ProductMetrics {
  mostRecommendedProducts: Array<{
    productId: string;
    name: string;
    recommendationCount: number;
    conversionRate: number;
  }>;
  productCategoryBreakdown: Record<string, number>;
  averagePricePoint: number;
}

export interface ConversationMetrics {
  totalConversations: number;
  averageConversationLength: number;
  averageResponseTime: number;
  commonQuestions: Array<{
    question: string;
    frequency: number;
  }>;
  topIntents: Array<{
    intent: string;
    count: number;
  }>;
}

export interface LeadMetrics {
  totalLeads: number;
  leadsBySource: Record<string, number>;
  leadsByStatus: Record<string, number>;
  averageLeadQualityScore: number;
  conversionTimeline: Array<{
    date: string;
    count: number;
  }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
  tokenUsage: {
    total: number;
    byDay: Array<{
      date: string;
      count: number;
    }>;
  };
}

class AnalyticsApi {
  private baseUrl = '/analytics';

  // Get overview metrics
  async getOverview(timeRange: TimeRange): Promise<ApiResponse<{
    conversion: ConversionMetrics;
    products: ProductMetrics;
    conversations: ConversationMetrics;
    leads: LeadMetrics;
    performance: PerformanceMetrics;
  }>> {
    return apiClient.get(`${this.baseUrl}/overview`, timeRange);
  }

  // Get detailed conversion analytics
  async getConversionAnalytics(timeRange: TimeRange): Promise<ApiResponse<ConversionMetrics & {
    conversionByHour: Record<number, number>;
    conversionByDay: Record<string, number>;
    conversionBySource: Record<string, number>;
  }>> {
    return apiClient.get(`${this.baseUrl}/conversions`, timeRange);
  }

  // Get product performance analytics
  async getProductAnalytics(timeRange: TimeRange): Promise<ApiResponse<ProductMetrics & {
    priceRangeDistribution: Record<string, number>;
    featurePreferences: Record<string, number>;
    seasonalTrends: Array<{
      month: string;
      products: Array<{
        productId: string;
        name: string;
        sales: number;
      }>;
    }>;
  }>> {
    return apiClient.get(`${this.baseUrl}/products`, timeRange);
  }

  // Get conversation analytics
  async getConversationAnalytics(timeRange: TimeRange): Promise<ApiResponse<ConversationMetrics & {
    sentimentAnalysis: {
      positive: number;
      neutral: number;
      negative: number;
    };
    conversationFlowAnalysis: Array<{
      step: string;
      dropoffRate: number;
      averageTimeSpent: number;
    }>;
  }>> {
    return apiClient.get(`${this.baseUrl}/conversations`, timeRange);
  }

  // Get lead analytics
  async getLeadAnalytics(timeRange: TimeRange): Promise<ApiResponse<LeadMetrics & {
    leadQualityDistribution: Record<string, number>;
    leadValuePredictions: Array<{
      leadId: string;
      predictedValue: number;
      confidence: number;
    }>;
  }>> {
    return apiClient.get(`${this.baseUrl}/leads`, timeRange);
  }

  // Get performance metrics
  async getPerformanceMetrics(timeRange: TimeRange): Promise<ApiResponse<PerformanceMetrics & {
    loadTesting: {
      averageLatency: number;
      p95Latency: number;
      p99Latency: number;
      maxConcurrentUsers: number;
    };
    resourceUtilization: {
      cpu: number;
      memory: number;
      storage: number;
    };
  }>> {
    return apiClient.get(`${this.baseUrl}/performance`, timeRange);
  }

  // Export analytics report
  async exportReport(
    timeRange: TimeRange,
    metrics: ('conversion' | 'products' | 'conversations' | 'leads' | 'performance')[],
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      ...timeRange,
      metrics,
      format,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<ApiResponse<{
    activeUsers: number;
    activeConversations: number;
    queuedRequests: number;
    systemLoad: number;
    recentErrors: Array<{
      timestamp: string;
      error: string;
      count: number;
    }>;
  }>> {
    return apiClient.get(`${this.baseUrl}/realtime`);
  }
}

export const analyticsApi = new AnalyticsApi(); 