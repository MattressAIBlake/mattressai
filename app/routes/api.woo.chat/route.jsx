/**
 * WooCommerce Chat API
 * 
 * Handles chat interactions for WooCommerce stores.
 * Authenticates via X-API-Key header (widgetApiKey from WooStore).
 */
import { json } from '@remix-run/node';
import OpenAI from 'openai';
import prisma from '~/db.server.js';

export const action = async ({ request }) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(request)
    });
  }

  try {
    // Authenticate via API key
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return json({ error: 'API key required' }, { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    // Find the WooCommerce store
    const store = await prisma.wooStore.findUnique({
      where: { widgetApiKey: apiKey }
    });

    if (!store) {
      return json({ error: 'Invalid API key' }, { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    if (store.status !== 'active') {
      return json({ error: 'Store not active' }, { 
        status: 403, 
        headers: getCorsHeaders(request) 
      });
    }

    // Parse request body
    const body = await request.json();
    const { messages, message, conversation_id } = body;

    // Support both single message and full history
    const conversationMessages = messages || (message ? [{ role: 'user', content: message }] : null);

    if (!conversationMessages || conversationMessages.length === 0) {
      return json({ error: 'Message required' }, { 
        status: 400, 
        headers: getCorsHeaders(request) 
      });
    }

    const conversationId = conversation_id || `woo_${Date.now()}`;

    // Get products for context
    const products = await prisma.wooProduct.findMany({
      where: { storeId: store.id },
      take: 30,
      orderBy: { updatedAt: 'desc' }
    });

    // Build product context with images
    const productList = products.map(p => 
      `- ${p.title} | $${p.price} | URL: ${p.permalink} | Image: ${p.imageUrl || 'none'}`
    ).join('\n');

    // System prompt
    const systemPrompt = `You are a friendly mattress shopping assistant for ${store.name || store.domain}. 
Your goal is to have a helpful conversation and find the PERFECT mattress for each customer.

Available products:
${productList}

CONVERSATION STYLE:
- Be warm, friendly, and conversational - like a knowledgeable friend
- Ask ONE question at a time, then wait for their answer
- Build rapport - acknowledge their answers before asking the next question
- Take your time - don't rush to recommend products

QUESTIONS TO ASK (spread across multiple messages):
1. Sleep position (side, back, stomach, or combination?)
2. Any pain issues? (back pain, hip pain, shoulder pain, etc.)
3. Firmness preference (soft, medium, firm?) or let them describe what they like
4. Do they sleep hot or cold?
5. Budget range
6. Mattress size needed
7. Any other preferences? (memory foam vs hybrid, motion isolation, edge support)

DON'T recommend products until you understand their needs well (at least 3-4 questions answered).

WHEN RECOMMENDING (only after understanding their needs):
Format each product like this:

![Product](IMAGE_URL)
**Product Name** - $price
[View Product](PRODUCT_URL)

Brief explanation of why it fits THEIR specific needs.

Be open to follow-up questions, comparisons, and extended conversation. If they want to know more about a product or compare options, help them!`;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'id', conversation_id: conversationId })}\n\n`));

          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 512,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationMessages
            ]
          });

          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk: text })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end_turn' })}\n\n`));
        } catch (error) {
          console.error('Chat stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk: 'Sorry, I encountered an error. Please try again.' })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end_turn' })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: getSseHeaders(request)
    });

  } catch (error) {
    console.error('WooCommerce chat error:', error);
    return json({ error: error.message }, { 
      status: 500, 
      headers: getCorsHeaders(request) 
    });
  }
};

// Also handle GET for testing
export const loader = async ({ request }) => {
  return json({ status: 'WooCommerce Chat API', method: 'POST required' }, {
    headers: getCorsHeaders(request)
  });
};

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Credentials': 'true'
  };
}

function getSseHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true'
  };
}
