import { z } from 'zod';
import { Timestamps } from './merchant';

// Core lead requirements interface - used in conversation model
export interface LeadRequirements {
  sleepingPosition?: string[];
  painPoints?: string[];
  preferences?: string[];
  budget?: {
    min: number;
    max: number;
  };
  size?: string;
  firmness?: string;
  temperature?: 'hot' | 'cold' | 'neutral';
  partnerPreferences?: {
    differentPreferences: boolean;
    description?: string;
  };
}

// Essential contact information
export interface LeadContact {
  name?: string;
  email?: string;
  phone?: string;
  preferredContact?: 'email' | 'phone' | 'any';
  bestTimeToContact?: string[];
}

// Lead scoring interface
export interface LeadScore {
  total: number;
  factors: {
    engagement: number;
    budget: number;
    requirements: number;
    contact: number;
  };
  lastUpdated: string;
} 