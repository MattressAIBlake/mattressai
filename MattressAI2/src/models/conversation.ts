import { z } from 'zod';
import { Timestamps } from './merchant';
import { LeadRequirements } from './lead';

/**
 * Conversation Models
 * These interfaces define the structure for chat conversations between users and the AI assistant.
 * The models handle message history, context tracking, and conversation state management.
 */

/**
 * Represents a single message in the conversation
 * @property role - Who sent the message (user or assistant)
 * @property content - The actual message content
 * @property timestamp - When the message was sent
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokens: number;
    processingTime?: number;
    confidence?: number;
    intent?: string;
    entities?: Record<string, string>;
  };
}

/**
 * Tracks the context and state of the conversation
 * @property requirements - Collected user requirements
 * @property stage - Current stage of the conversation
 * @property lastIntent - Last detected user intent
 */
export interface ConversationContext {
  requirements: Partial<LeadRequirements>;
  stage: 'greeting' | 'discovery' | 'recommendation' | 'refinement' | 'closing';
  lastIntent?: string;
  collectedInfo: {
    name?: string;
    email?: string;
    phone?: string;
    preferences?: string[];
    concerns?: string[];
  };
  recommendedProducts: Array<{
    id: string;
    confidence: number;
    reason: string;
  }>;
}

/**
 * Tracks user engagement and behavior
 * @property viewDuration - Total time user spent in conversation
 * @property messageCount - Number of messages exchanged
 * @property interactionPoints - Key interaction events
 */
export interface ConversationEngagement {
  viewDuration: number;
  messageCount: {
    user: number;
    assistant: number;
    total: number;
  };
  interactionPoints: Array<{
    type: 'link_click' | 'product_view' | 'form_submit' | 'scroll' | 'feedback';
    timestamp: string;
    data: Record<string, any>;
  }>;
  feedback?: {
    rating: number;
    comment?: string;
    helpful: boolean;
    timestamp: string;
  };
}

/**
 * Main conversation interface that combines all aspects of a chat session
 */
export interface Conversation extends Timestamps {
  id: string;
  merchantId: string;
  status: 'active' | 'completed' | 'abandoned';
  source: 'website' | 'mobile' | 'embed';
  
  // Participant information
  visitor: {
    id: string;
    sessionId: string;
    deviceInfo: {
      type: 'desktop' | 'mobile' | 'tablet';
      browser: string;
      os: string;
    };
    location?: {
      city?: string;
      region?: string;
      country: string;
      timezone: string;
    };
  };
  
  // Conversation content
  messages: Message[];
  context: ConversationContext;
  
  // Tracking and analytics
  engagement: ConversationEngagement;
  metrics: {
    startTime: string;
    endTime?: string;
    duration: number;
    responseTime: {
      average: number;
      max: number;
    };
    completionRate: number;
  };
  
  // Related records
  leadId?: string;
  previousConversations?: string[];
  
  // Configuration used
  config: {
    assistantVersion: string;
    promptVersion: string;
    modelSettings: {
      temperature: number;
      maxTokens: number;
      topP: number;
    };
  };
}

/**
 * Request interfaces for conversation operations
 */
export interface StartConversationRequest {
  source: Conversation['source'];
  visitorInfo: {
    deviceInfo: Conversation['visitor']['deviceInfo'];
    location?: Conversation['visitor']['location'];
  };
  context?: Partial<ConversationContext>;
}

export interface SendMessageRequest {
  conversationId: string;
  message: string;
  context?: Partial<ConversationContext>;
}

// Validation schemas
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    tokens: z.number(),
    processingTime: z.number().optional(),
    confidence: z.number().optional(),
    intent: z.string().optional(),
    entities: z.record(z.string()).optional()
  }).optional()
});

export const conversationContextSchema = z.object({
  requirements: z.record(z.any()).optional(),
  stage: z.enum(['greeting', 'discovery', 'recommendation', 'refinement', 'closing']),
  lastIntent: z.string().optional(),
  collectedInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    preferences: z.array(z.string()).optional(),
    concerns: z.array(z.string()).optional()
  }),
  recommendedProducts: z.array(z.object({
    id: z.string(),
    confidence: z.number(),
    reason: z.string()
  }))
});

export const startConversationSchema = z.object({
  source: z.enum(['website', 'mobile', 'embed']),
  visitorInfo: z.object({
    deviceInfo: z.object({
      type: z.enum(['desktop', 'mobile', 'tablet']),
      browser: z.string(),
      os: z.string()
    }),
    location: z.object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string(),
      timezone: z.string()
    }).optional()
  }),
  context: conversationContextSchema.partial().optional()
}); 