/**
 * Inngest Client
 * Handles background job processing for serverless environments
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'mattressai',
  name: 'MattressAI',
  // Event key and signing key are loaded from environment variables automatically
});

