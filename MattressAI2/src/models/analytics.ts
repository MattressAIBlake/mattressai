import { z } from 'zod';
import { Timestamps } from './merchant';

/**
 * Analytics Models
 * These interfaces define the structure for analytics data in the MattressAI platform.
 * The models cover various metrics including conversions, engagement, product performance,
 * and system performance.
 */

/**
 * Represents a time period for analytics queries
 * @property startDate - Start date in ISO format
 * @property endDate - End date in ISO format
 */
export interface TimeRange {
  startDate: string;
  endDate: string;
}

/**
 * Metrics related to user engagement and conversion
 * @property totalVisitors - Total number of unique visitors
 * @property totalConversations - Total number of chat conversations
 * @property totalLeads - Total number of leads generated
 * @property conversionRate - Percentage of visitors that became leads
 * @property averageEngagementTime - Average time users spend interacting
 * @property bounceRate - Percentage of users who leave without interaction
 */
export interface ConversionMetrics {
  totalVisitors: number;
  totalConversations: number;
  totalLeads: number;
  conversionRate: number;
  averageEngagementTime: number;
  bounceRate: number;
  bySource: Record<string, number>;
  byPage: Record<string, number>;
  byHour: Record<number, number>;
  byDay: Record<string, number>;
}

/**
 * Metrics related to product performance and recommendations
 * @property recommendationCount - Number of times product was recommended
 * @property viewCount - Number of times product was viewed
 * @property clickCount - Number of times product was clicked
 * @property conversionRate - Percentage of recommendations that led to conversion
 */
export interface ProductPerformance {
  productId: string;
  name: string;
  brand: string;
  recommendationCount: number;
  viewCount: number;
  clickCount: number;
  conversionRate: number;
  averageRating?: number;
  priceRange: {
    min: number;
    max: number;
  };
}

/**
 * Metrics related to conversation quality and patterns
 * @property messageCount - Total number of messages exchanged
 * @property averageLength - Average conversation length in messages
 * @property averageDuration - Average conversation duration in seconds
 * @property completionRate - Percentage of conversations completed
 */
export interface ConversationMetrics {
  messageCount: {
    total: number;
    user: number;
    assistant: number;
  };
  averageLength: number;
  averageDuration: number;
  completionRate: number;
  dropoffPoints: Array<{
    step: string;
    count: number;
    percentage: number;
  }>;
  commonQuestions: Array<{
    question: string;
    frequency: number;
    averageResponseTime: number;
  }>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

/**
 * Metrics related to AI assistant performance
 * @property responseTime - Average time to generate responses
 * @property accuracy - Accuracy score based on user feedback
 * @property errorRate - Percentage of failed or incorrect responses
 */
export interface AIPerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  accuracy: {
    overall: number;
    byCategory: Record<string, number>;
  };
  errorRate: number;
  tokenUsage: {
    total: number;
    byDay: Array<{
      date: string;
      count: number;
    }>;
  };
  modelPerformance: {
    name: string;
    version: string;
    latency: number;
    costPerRequest: number;
  };
}

/**
 * Main analytics data interface that combines all metrics
 */
export interface Analytics extends Timestamps {
  id: string;
  merchantId: string;
  timeRange: TimeRange;
  
  // High-level metrics
  conversion: ConversionMetrics;
  products: {
    topPerformers: ProductPerformance[];
    categoryBreakdown: Record<string, number>;
    priceRangeDistribution: Record<string, number>;
  };
  conversations: ConversationMetrics;
  aiPerformance: AIPerformanceMetrics;
  
  // Business impact
  revenue: {
    total: number;
    byProduct: Record<string, number>;
    byDay: Array<{
      date: string;
      amount: number;
    }>;
  };
  
  // User behavior
  userSegments: Array<{
    name: string;
    size: number;
    conversionRate: number;
    averageOrderValue: number;
  }>;
  
  // System health
  systemMetrics: {
    uptime: number;
    errors: Array<{
      type: string;
      count: number;
      lastOccurred: string;
    }>;
    performance: {
      cpu: number;
      memory: number;
      latency: number;
    };
  };
}

/**
 * Request interface for fetching analytics
 */
export interface AnalyticsRequest {
  timeRange: TimeRange;
  metrics?: Array<keyof Analytics>;
  filters?: {
    products?: string[];
    categories?: string[];
    sources?: string[];
    segments?: string[];
  };
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

// Validation schemas
export const timeRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

export const analyticsRequestSchema = z.object({
  timeRange: timeRangeSchema,
  metrics: z.array(z.string()).optional(),
  filters: z.object({
    products: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional()
  }).optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).optional()
}); 