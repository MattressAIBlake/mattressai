import { z } from 'zod';
import { Timestamps } from './merchant';

// Base interfaces for mattress specifications
export interface MattressSpecs {
  firmness?: string;
  type?: string;
  height?: string;
  materials?: string[];
  sleepingPositions?: string[];
  coolingSystems?: string[];
  edgeSupport?: string;
  motionTransfer?: string;
  warranty?: string;
  trialPeriod?: string;
}

export interface Mattress {
  id: string;
  brand: string;
  name: string;
  description?: string;
  specs?: MattressSpecs;
  priceRange?: {
    min: number;
    max: number;
  };
  productUrl?: string;
  inStock: boolean;
  images?: string[];
  categories?: string[];
  tags?: string[];
}

// Assistant configuration interfaces
export interface StoreInfo {
  name?: string;
  hours?: string;
  locations?: string;
  contactInfo?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating';
  required: boolean;
  options?: string[];
  defaultValue?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface AssistantConfig {
  storeInfo: StoreInfo;
  initialGreeting: string;
  toneDirective: string;
  conversationStyle: 'professional' | 'friendly' | 'casual' | 'luxury';
  leadCaptureTiming: 'immediate' | 'after-engagement' | 'before-recommendation' | 'end';
  productKnowledgeBase: 'all' | 'in-stock' | 'featured';
  primaryGoal: 'lead' | 'product';
  educationTopics: string[];
  responseCreativity: number;
  productRecommendationLimit: number;
  questions: Question[];
}

export interface BrandingConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    primary?: string;
    secondary?: string;
  };
  logo?: string;
}

export interface ChatConfig {
  masterPrompt: string;
  temperature: number;
  welcomeMessage?: string;
  maxTokens?: number;
  model?: string;
}

// Main chatbot configuration interface
export interface ChatbotConfig extends Timestamps {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  
  // Core configuration
  branding: BrandingConfig;
  chatConfig: ChatConfig;
  inventory: Mattress[];
  masterPrompt: string;
  
  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    position: 'left' | 'right';
    offset: {
      bottom: number;
      side: number;
    };
    customCss?: string;
  };
  
  // Behavior
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    autoOpenTrigger: 'time' | 'scroll' | 'exit-intent';
    persistConversation: boolean;
    conversationTimeout: number;
    workingHours: {
      enabled: boolean;
      unavailableMessage: string;
    };
  };
  
  // Performance metrics
  metrics: {
    averageResponseTime: number;
    successRate: number;
    userSatisfaction: number;
    lastTestedAt?: string;
  };
}

// Request/Response interfaces
export interface CreateConfigRequest {
  name: string;
  description?: string;
  branding: BrandingConfig;
  chatConfig: ChatConfig;
  inventory: Mattress[];
  appearance?: Partial<ChatbotConfig['appearance']>;
  behavior?: Partial<ChatbotConfig['behavior']>;
}

export interface UpdateConfigRequest {
  name?: string;
  description?: string;
  status?: ChatbotConfig['status'];
  branding?: Partial<BrandingConfig>;
  chatConfig?: Partial<ChatConfig>;
  inventory?: Mattress[];
  appearance?: Partial<ChatbotConfig['appearance']>;
  behavior?: Partial<ChatbotConfig['behavior']>;
}

// Validation schemas
export const mattressSpecsSchema = z.object({
  firmness: z.string().optional(),
  type: z.string().optional(),
  height: z.string().optional(),
  materials: z.array(z.string()).optional(),
  sleepingPositions: z.array(z.string()).optional(),
  coolingSystems: z.array(z.string()).optional(),
  edgeSupport: z.string().optional(),
  motionTransfer: z.string().optional(),
  warranty: z.string().optional(),
  trialPeriod: z.string().optional()
});

export const mattressSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  description: z.string().optional(),
  specs: mattressSpecsSchema.optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  productUrl: z.string().url().optional(),
  inStock: z.boolean(),
  images: z.array(z.string().url()).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['multiple_choice', 'text', 'rating']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  helpText: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
});

export const assistantConfigSchema = z.object({
  storeInfo: z.object({
    name: z.string().optional(),
    hours: z.string().optional(),
    locations: z.string().optional(),
    contactInfo: z.string().optional()
  }),
  initialGreeting: z.string(),
  toneDirective: z.string(),
  conversationStyle: z.enum(['professional', 'friendly', 'casual', 'luxury']),
  leadCaptureTiming: z.enum(['immediate', 'after-engagement', 'before-recommendation', 'end']),
  productKnowledgeBase: z.enum(['all', 'in-stock', 'featured']),
  primaryGoal: z.enum(['lead', 'product']),
  educationTopics: z.array(z.string()),
  responseCreativity: z.number().min(0).max(100),
  productRecommendationLimit: z.number().min(1),
  questions: z.array(questionSchema)
});

export const brandingConfigSchema = z.object({
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string().optional(),
    text: z.string().optional()
  }).optional(),
  fonts: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional()
  }).optional(),
  logo: z.string().url().optional()
});

export const chatConfigSchema = z.object({
  masterPrompt: z.string(),
  temperature: z.number().min(0).max(1),
  welcomeMessage: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  model: z.string().optional()
});

export const createConfigSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  branding: brandingConfigSchema,
  chatConfig: chatConfigSchema,
  inventory: z.array(mattressSchema),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    position: z.enum(['left', 'right']),
    offset: z.object({
      bottom: z.number(),
      side: z.number()
    }),
    customCss: z.string().optional()
  }).optional(),
  behavior: z.object({
    autoOpen: z.boolean(),
    autoOpenDelay: z.number(),
    autoOpenTrigger: z.enum(['time', 'scroll', 'exit-intent']),
    persistConversation: z.boolean(),
    conversationTimeout: z.number(),
    workingHours: z.object({
      enabled: z.boolean(),
      unavailableMessage: z.string()
    })
  }).optional()
}); 