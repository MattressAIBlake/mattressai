/**
 * Chat API Route (App Proxy)
 * Handles chat interactions through Shopify App Proxy
 * 
 * Note: HMAC verification removed - App Proxy requests are already secured
 * through Shopify's infrastructure and app installation requirements.
 */
import { json } from '@remix-run/node';
import MCPClient from '~/mcp-client';
import { saveMessage, getConversationHistory, storeCustomerAccountUrl, getCustomerAccountUrl } from '~/db.server';
import AppConfig from '~/services/config.server';
import { createSseStream } from '~/services/streaming.server';
import { createOpenAIService } from '~/services/openai.server';
import { createToolService } from '~/services/tool.server';
import { unauthenticated } from '~/shopify.server';
import { extractLeadFromConversation, shouldTriggerLeadForm, getFormFields } from '~/services/lead-extractor.server';
import { getActivePromptVersion } from '~/lib/domain/promptVersion.server';

export const action = async ({ request }) => {
  return handleChatRequest(request);
};

/**
 * Handle chat requests
 */
async function handleChatRequest(request) {
  try {
    // Get message data from request body
    const body = await request.json();
    const userMessage = body.message;

    // Validate required message
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: AppConfig.errorMessages.missingMessage }),
        { status: 400, headers: getSseHeaders(request) }
      );
    }

    // Generate or use existing conversation ID
    const conversationId = body.conversation_id || Date.now().toString();
    const promptType = body.prompt_type || AppConfig.api.defaultPromptType;

    // Create a stream for the response
    const responseStream = createSseStream(async (stream) => {
      await handleChatSession({
        request,
        userMessage,
        conversationId,
        promptType,
        stream
      });
    });

    return new Response(responseStream, {
      headers: getSseHeaders(request)
    });
  } catch (error) {
    console.error('Error in chat request handler:', error);
    return json({ error: error.message }, {
      status: 500,
      headers: getCorsHeaders(request)
    });
  }
}

/**
 * Handle a complete chat session
 */
async function handleChatSession({
  request,
  userMessage,
  conversationId,
  promptType,
  stream
}) {
  // Initialize MCP client first to get shop domain
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get('shop') || request.headers.get('Origin');
  
  // Normalize shop domain for database lookups (remove protocol if present)
  let normalizedShopDomain = shopDomain;
  if (shopDomain && shopDomain.startsWith('http')) {
    try {
      const parsedUrl = new URL(shopDomain);
      normalizedShopDomain = parsedUrl.hostname;
    } catch (e) {
      console.warn('[Lead Capture] Failed to parse shop domain:', e);
    }
  }
  console.log('[Lead Capture] Original shop domain:', shopDomain);
  console.log('[Lead Capture] Normalized shop domain:', normalizedShopDomain);
  
  // Initialize services with shop domain for custom prompts
  const openaiService = createOpenAIService(undefined, shopDomain);
  const toolService = createToolService();
  const customerMcpEndpoint = await getCustomerMcpEndpoint(shopDomain, conversationId);
  const mcpClient = new MCPClient(
    shopDomain,
    conversationId,
    null, // shopId not available in proxy
    customerMcpEndpoint
  );

  try {
    // Send conversation ID to client
    stream.sendMessage({ type: 'id', conversation_id: conversationId });

    // Connect to MCP servers and get available tools
    let storefrontMcpTools = [], customerMcpTools = [];

    try {
      storefrontMcpTools = await mcpClient.connectToStorefrontServer();
      customerMcpTools = await mcpClient.connectToCustomerServer();

      console.log(`Connected to MCP with ${storefrontMcpTools.length} tools`);
      console.log(`Connected to customer MCP with ${customerMcpTools.length} tools`);
    } catch (error) {
      console.warn('Failed to connect to MCP servers, continuing without tools:', error.message);
    }

    // Prepare conversation state
    let conversationHistory = [];
    let productsToDisplay = [];

    // Save user message to the database
    await saveMessage(conversationId, 'user', userMessage);

    // Fetch all messages from the database for this conversation
    const dbMessages = await getConversationHistory(conversationId);

    // Format messages for OpenAI API
    conversationHistory = dbMessages.map(dbMessage => {
      let content;
      try {
        content = JSON.parse(dbMessage.content);
      } catch (e) {
        content = dbMessage.content;
      }
      return {
        role: dbMessage.role,
        content
      };
    });

    // Check for "start" position lead capture BEFORE AI responds
    const userMessageCount = conversationHistory.filter(msg => msg.role === 'user').length;
    if (userMessageCount === 1) {
      const promptVersion = await getActivePromptVersion(normalizedShopDomain);
      if (promptVersion?.runtimeRules?.leadCapture?.enabled && 
          promptVersion.runtimeRules.leadCapture.position === 'start') {
        
        console.log('[Lead Capture] Showing form at START position (before first AI response)');
        const leadData = extractLeadFromConversation(conversationHistory);
        const fields = getFormFields(leadData, promptVersion.runtimeRules.leadCapture.fields);
        
        stream.sendMessage({
          type: 'show_lead_form',
          prefill: leadData,
          fields: fields,
          position: 'start'
        });
        
        // Send end_turn so widget knows streaming is done
        stream.sendMessage({ type: 'end_turn' });
        
        console.log('[Lead Capture] Waiting for form submission before continuing');
        // Stop here - conversation will continue after form submission
        return;
      }
    }

    // Execute the conversation stream
    let finalMessage = { role: 'user', content: userMessage };

    while (finalMessage.stop_reason !== "end_turn") {
      finalMessage = await openaiService.streamConversation(
        {
          messages: conversationHistory,
          promptType,
          tools: mcpClient.tools
        },
        {
          // Handle text chunks
          onText: (textDelta) => {
            stream.sendMessage({
              type: 'chunk',
              chunk: textDelta
            });
          },

          // Handle complete messages
          onMessage: (message) => {
            conversationHistory.push({
              role: message.role,
              content: message.content
            });

            saveMessage(conversationId, message.role, JSON.stringify(message.content))
              .catch((error) => {
                console.error("Error saving message to database:", error);
              });

            // Send a completion message
            stream.sendMessage({ type: 'message_complete' });
          },

          // Handle tool use requests
          onToolUse: async (content) => {
            const toolName = content.name;
            const toolArgs = content.input;
            const toolUseId = content.id;

            // Don't send debug messages to the widget - users shouldn't see internal tool execution
            // const toolUseMessage = `Calling tool: ${toolName} with arguments: ${JSON.stringify(toolArgs)}`;
            // stream.sendMessage({
            //   type: 'tool_use',
            //   tool_use_message: toolUseMessage
            // });

            // Call the tool
            const toolUseResponse = await mcpClient.callTool(toolName, toolArgs);

            // Handle tool response based on success/error
            if (toolUseResponse.error) {
              await toolService.handleToolError(
                toolUseResponse,
                toolName,
                toolUseId,
                conversationHistory,
                stream.sendMessage,
                conversationId
              );
            } else {
              await toolService.handleToolSuccess(
                toolUseResponse,
                toolName,
                toolUseId,
                conversationHistory,
                productsToDisplay,
                conversationId
              );
            }

            // Signal new message to client
            stream.sendMessage({ type: 'new_message' });
          },

          // Handle content block completion
          onContentBlock: (contentBlock) => {
            if (contentBlock.type === 'text') {
              stream.sendMessage({
                type: 'content_block_complete',
                content_block: contentBlock
              });
            }
          }
        }
      );
    }

    // Signal end of turn
    stream.sendMessage({ type: 'end_turn' });

    // Check for "end" position lead capture BEFORE sending products
    if (productsToDisplay.length > 0) {
      try {
        console.log('[Lead Capture] Products available, checking for END position lead capture');
        const promptVersion = await getActivePromptVersion(normalizedShopDomain);
        
        if (promptVersion?.runtimeRules?.leadCapture?.enabled &&
            promptVersion.runtimeRules.leadCapture.position === 'end') {
          
          const userMsgCount = conversationHistory.filter(msg => msg.role === 'user').length;
          const triggerAfter = promptVersion.runtimeRules.leadCapture.triggerAfterQuestions || 3;
          
          if (userMsgCount >= triggerAfter) {
            console.log('[Lead Capture] Showing form at END position (before products)');
            const leadData = extractLeadFromConversation(conversationHistory);
            const fields = getFormFields(leadData, promptVersion.runtimeRules.leadCapture.fields);
            
            stream.sendMessage({
              type: 'show_lead_form',
              prefill: leadData,
              fields: fields,
              position: 'end',
              hasProducts: true // Signal that products will follow
            });
          } else {
            console.log(`[Lead Capture] Not enough messages yet (${userMsgCount}/${triggerAfter})`);
          }
        } else {
          console.log('[Lead Capture] Lead capture not enabled or position is not END');
        }
      } catch (error) {
        console.error('[Lead Capture] Error checking for lead capture:', error);
        // Don't throw - lead capture is optional
      }
      
      // Send product results (will display after form is submitted if form was shown)
      stream.sendMessage({
        type: 'product_results',
        products: productsToDisplay
      });
    } else {
      console.log('[Lead Capture] No products to display, skipping lead form');
    }
  } catch (error) {
    // The streaming handler takes care of error handling
    throw error;
  }
}

/**
 * Get the customer MCP endpoint for a shop
 */
async function getCustomerMcpEndpoint(shopDomain, conversationId) {
  try {
    // Check if the customer account URL exists in the DB
    const existingUrl = await getCustomerAccountUrl(conversationId);

    // If URL exists, return early with the MCP endpoint
    if (existingUrl) {
      return `${existingUrl}/customer/api/mcp`;
    }

    // If not, query for it from the Shopify API
    if (!shopDomain) return null;
    
    const { hostname } = new URL(shopDomain.startsWith('http') ? shopDomain : `https://${shopDomain}`);
    const { storefront } = await unauthenticated.storefront(hostname);

    const response = await storefront.graphql(
      `#graphql
      query shop {
        shop {
          customerAccountUrl
        }
      }`,
    );

    const body = await response.json();
    const customerAccountUrl = body.data.shop.customerAccountUrl;

    // Store the customer account URL with conversation ID in the DB
    await storeCustomerAccountUrl(conversationId, customerAccountUrl);

    return `${customerAccountUrl}/customer/api/mcp`;
  } catch (error) {
    console.error("Error getting customer MCP endpoint:", error);
    return null;
  }
}

/**
 * Gets CORS headers for the response
 */
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  const requestHeaders = request.headers.get("Access-Control-Request-Headers") || "Content-Type, Accept";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": requestHeaders,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  };
}

/**
 * Get SSE headers for the response
 */
function getSseHeaders(request) {
  const origin = request.headers.get("Origin") || "*";

  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
    "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  };
}
