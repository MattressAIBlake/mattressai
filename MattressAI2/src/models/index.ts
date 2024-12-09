/**
 * MattressAI Data Models
 * 
 * This module exports all data models used throughout the MattressAI platform.
 * The models are organized into several categories:
 * 
 * - Merchant: Core business and account management
 * - Chatbot: AI assistant configuration and behavior
 * - Lead: Lead management and tracking
 * - Conversation: Chat interactions and context
 * - Analytics: Metrics and performance tracking
 * 
 * Each model includes TypeScript interfaces for type safety and Zod schemas
 * for runtime validation. The models are designed to be used both on the
 * frontend and backend to ensure data consistency throughout the platform.
 */

export * from './merchant';
export * from './chatbot';
export * from './lead';
export * from './conversation';
export * from './analytics'; 