// Base interfaces for reusability
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string;
  close: string;
  closed: boolean;
}

// Merchant related interfaces
export interface MerchantBranding {
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
  chatBubbleIcon?: string;
  customCss?: string;
}

export interface MerchantPreferences {
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  measurementUnit: 'imperial' | 'metric';
}

export interface MerchantSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  subscriptionId: string;
  currentPeriod: {
    start: string;
    end: string;
  };
  features: string[];
  limits: {
    conversations: number;
    leads: number;
    teamMembers: number;
    storage: number;
  };
}

export interface MerchantContact {
  name: string;
  email: string;
  phone?: string;
  role: 'primary' | 'billing' | 'technical';
}

// Main Merchant interface
export interface Merchant extends Timestamps {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'deactivated';
  verified: boolean;
  website?: string;
  
  // Contact & Location
  contacts: MerchantContact[];
  address?: Address;
  businessHours?: BusinessHours[];
  
  // Customization & Preferences
  branding: MerchantBranding;
  preferences: MerchantPreferences;
  
  // Business Details
  type: 'retail' | 'online' | 'hybrid';
  storeCount: number;
  employeeCount: number;
  yearEstablished?: number;
  taxId?: string;
  
  // Subscription & Billing
  subscription: MerchantSubscription;
  billingAddress?: Address;
  
  // Integration Settings
  integrations: {
    crm?: {
      provider: string;
      connected: boolean;
      settings: Record<string, any>;
    };
    analytics?: {
      provider: string;
      connected: boolean;
      settings: Record<string, any>;
    };
    calendar?: {
      provider: string;
      connected: boolean;
      settings: Record<string, any>;
    };
  };
  
  // Metrics & Stats
  metrics: {
    totalLeads: number;
    totalConversations: number;
    conversionRate: number;
    averageResponseTime: number;
    lastActivityAt: string;
  };
}

// Request/Response interfaces for API calls
export interface CreateMerchantRequest {
  name: string;
  email: string;
  website?: string;
  type: Merchant['type'];
  address?: Address;
  preferences?: Partial<MerchantPreferences>;
}

export interface UpdateMerchantRequest {
  name?: string;
  website?: string;
  address?: Address;
  businessHours?: BusinessHours[];
  branding?: Partial<MerchantBranding>;
  preferences?: Partial<MerchantPreferences>;
  contacts?: MerchantContact[];
}

// Validation schemas (using Zod for runtime validation)
import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string()
});

export const businessHoursSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closed: z.boolean()
});

export const merchantBrandingSchema = z.object({
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
  logo: z.string().url().optional(),
  chatBubbleIcon: z.string().url().optional(),
  customCss: z.string().optional()
});

export const merchantPreferencesSchema = z.object({
  timezone: z.string(),
  language: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  measurementUnit: z.enum(['imperial', 'metric'])
});

export const createMerchantSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  website: z.string().url().optional(),
  type: z.enum(['retail', 'online', 'hybrid']),
  address: addressSchema.optional(),
  preferences: merchantPreferencesSchema.partial().optional()
}); 