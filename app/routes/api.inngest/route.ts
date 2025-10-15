/**
 * Inngest Webhook Endpoint
 * Handles incoming webhook requests from Inngest for background job processing
 */

import { serve } from 'inngest/remix';
import { inngest } from '~/lib/inngest/client';
import { functions } from '~/lib/inngest/functions/indexing';

/**
 * Inngest serve handler
 * Handles both GET (registration) and POST (execution) requests
 */
const handler = serve({
  client: inngest,
  functions: functions,
});

/**
 * POST /api/inngest
 * Executes Inngest functions
 */
export const action = handler;

/**
 * GET /api/inngest
 * Inngest registration endpoint
 */
export const loader = handler;

