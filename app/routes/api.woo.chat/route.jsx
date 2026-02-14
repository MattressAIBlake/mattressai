/**
 * WooCommerce Chat API
 * 
 * Handles chat interactions for WooCommerce stores.
 * Authenticates via X-API-Key header (widgetApiKey from WooStore).
 */
import { json } from '@remix-run/node';
import prisma from '~/db.server.js';
import { createSseStream } from '~/services/streaming.server';
import { createOpenAIService } from '~/services/openai.server';

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
    const { message, conversation_id } = body;

    if (!message) {
      return json({ error: 'Message required' }, { 
        status: 400, 
        headers: getCorsHeaders(request) 
      });
    }

    const conversationId = conversation_id || `woo_${Date.now()}`;

    // Create SSE stream for response
    const responseStream = createSseStream(async (stream) => {
      await handleWooChat({
        store,
        message,
        conversationId,
        stream
      });
    });

    return new Response(responseStream, {
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

/**
 * Handle WooCommerce chat session
 */
async function handleWooChat({ store, message, conversationId, stream }) {
  // Initialize OpenAI service
  const openaiService = createOpenAIService();

  // Get conversation history from session storage (simplified for now)
  let conversationHistory = [];

  // Get products from the WooCommerce store for context
  const products = await prisma.wooProduct.findMany({
    where: { storeId: store.id },
    take: 50, // Limit for context window
    orderBy: { updatedAt: 'desc' }
  });

  // Build product context
  const productContext = products.map(p => ({
    id: p.id,
    title: p.title,
    description: p.shortDescription || p.description,
    price: p.price,
    firmness: p.firmness,
    material: p.material,
    features: p.features,
    url: p.permalink,
    imageUrl: p.imageUrl
  }));

  // Create system prompt with product knowledge
  const systemPrompt = `You are a helpful mattress shopping assistant for ${store.name || store.domain}. 
You help customers find the perfect mattress based on their sleep preferences, body type, and budget.

Available products:
${JSON.stringify(productContext, null, 2)}

Guidelines:
- Be friendly and conversational
- Ask clarifying questions about sleep preferences (position, firmness preference, any pain issues)
- When you have enough info, recommend 1-3 specific products from the available inventory
- Always explain WHY a product is a good fit
- If asked about a product not in inventory, politely say it's not currently available

When recommending products, use this exact JSON format in your response:
[PRODUCTS]
{"products": [{"id": "...", "title": "...", "fitScore": 85, "url": "...", "imageUrl": "...", "firmness": "...", "whyItFits": ["reason1", "reason2"]}]}
[/PRODUCTS]`;

  // Add user message
  conversationHistory.push({
    role: 'user',
    content: message
  });

  // Send conversation ID
  stream.sendMessage({ type: 'id', conversation_id: conversationId });

  try {
    let fullResponse = '';

    await openaiService.streamConversation(
      {
        messages: conversationHistory,
        systemPrompt,
        tools: [] // No MCP tools for WooCommerce yet
      },
      {
        onText: (textDelta) => {
          fullResponse += textDelta;
          
          // Don't stream the [PRODUCTS] block - extract it after
          if (!fullResponse.includes('[PRODUCTS]')) {
            stream.sendMessage({
              type: 'chunk',
              chunk: textDelta
            });
          }
        },

        onMessage: (msg) => {
          // Check for product recommendations in the response
          const productMatch = fullResponse.match(/\[PRODUCTS\]([\s\S]*?)\[\/PRODUCTS\]/);
          if (productMatch) {
            try {
              const productData = JSON.parse(productMatch[1].trim());
              if (productData.products && productData.products.length > 0) {
                stream.sendMessage({
                  type: 'product_results',
                  products: productData.products
                });
              }
            } catch (e) {
              console.error('Failed to parse product recommendations:', e);
            }
          }
        },

        onToolUse: async () => {
          // No tools for WooCommerce yet
        },

        onContentBlock: () => {}
      }
    );

    stream.sendMessage({ type: 'end_turn' });

  } catch (error) {
    console.error('Chat stream error:', error);
    stream.sendMessage({
      type: 'chunk',
      chunk: 'Sorry, I encountered an error. Please try again.'
    });
    stream.sendMessage({ type: 'end_turn' });
  }
}

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
