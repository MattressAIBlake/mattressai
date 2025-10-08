/**
 * OpenAI Service
 * Manages interactions with the OpenAI API
 */
import OpenAI from "openai";
import AppConfig from "./config.server";
import systemPrompts from "../prompts/prompts.json";
import { getActivePromptVersion } from "~/lib/domain/promptVersion.server";

/**
 * Creates an OpenAI service instance
 * @param {string} apiKey - OpenAI API key
 * @param {string} shop - Shop domain (tenant) for loading custom prompts
 * @returns {Object} OpenAI service with methods for interacting with OpenAI API
 */
export function createOpenAIService(apiKey = process.env.OPENAI_API_KEY, shop = null) {
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });

  /**
   * Streams a conversation with OpenAI
   * @param {Object} params - Stream parameters
   * @param {Array} params.messages - Conversation history
   * @param {string} params.promptType - The type of system prompt to use
   * @param {Array} params.tools - Available tools for OpenAI
   * @param {Object} streamHandlers - Stream event handlers
   * @param {Function} streamHandlers.onText - Handles text chunks
   * @param {Function} streamHandlers.onMessage - Handles complete messages
   * @param {Function} streamHandlers.onToolUse - Handles tool use requests
   * @returns {Promise<Object>} The final message
   */
  const streamConversation = async ({
    messages,
    promptType = AppConfig.api.defaultPromptType,
    tools
  }, streamHandlers) => {
    // Get system prompt from configuration or use default
    const systemInstruction = await getSystemPrompt(promptType);

    // Convert messages to OpenAI format with system message
    const openAIMessages = [
      { role: 'system', content: systemInstruction },
      ...convertMessagesToOpenAIFormat(messages)
    ];

    // Convert tools to OpenAI format if provided
    const openAITools = tools && tools.length > 0 ? convertToolsToOpenAIFormat(tools) : undefined;

    // Create streaming request
    const streamParams = {
      model: AppConfig.api.defaultModel,
      max_tokens: AppConfig.api.maxTokens,
      messages: openAIMessages,
      stream: true
    };

    if (openAITools) {
      streamParams.tools = openAITools;
      streamParams.tool_choice = 'auto';
    }

    const stream = await openai.chat.completions.create(streamParams);

    // Process the stream
    let fullContent = '';
    let toolCalls = [];
    let currentToolCall = null;
    let role = 'assistant';
    let finishReason = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      finishReason = chunk.choices[0]?.finish_reason;

      if (delta?.role) {
        role = delta.role;
      }

      // Handle text content
      if (delta?.content) {
        fullContent += delta.content;
        if (streamHandlers.onText) {
          streamHandlers.onText(delta.content);
        }
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCallDelta of delta.tool_calls) {
          const index = toolCallDelta.index;
          
          if (!toolCalls[index]) {
            toolCalls[index] = {
              id: toolCallDelta.id || '',
              type: 'function',
              function: {
                name: toolCallDelta.function?.name || '',
                arguments: ''
              }
            };
          }

          if (toolCallDelta.function?.name) {
            toolCalls[index].function.name = toolCallDelta.function.name;
          }

          if (toolCallDelta.function?.arguments) {
            toolCalls[index].function.arguments += toolCallDelta.function.arguments;
          }

          if (toolCallDelta.id) {
            toolCalls[index].id = toolCallDelta.id;
          }
        }
      }
    }

    // Construct final message
    const messageContent = [];
    
    if (fullContent) {
      messageContent.push({
        type: 'text',
        text: fullContent
      });
    }

    // Convert tool calls to Claude-like format for compatibility
    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        messageContent.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input: args
        });
      } catch (error) {
        console.error('Error parsing tool call arguments:', error);
      }
    }

    const finalMessage = {
      role,
      content: messageContent,
      stop_reason: finishReason === 'tool_calls' ? 'tool_use' : 
                   finishReason === 'stop' ? 'end_turn' : 
                   finishReason
    };

    // Call onMessage handler
    if (streamHandlers.onMessage) {
      streamHandlers.onMessage(finalMessage);
    }

    // Call onContentBlock handler for text content
    if (streamHandlers.onContentBlock && fullContent) {
      streamHandlers.onContentBlock({
        type: 'text',
        text: fullContent
      });
    }

    // Process tool use requests
    if (streamHandlers.onToolUse && messageContent.length > 0) {
      for (const content of messageContent) {
        if (content.type === "tool_use") {
          await streamHandlers.onToolUse(content);
        }
      }
    }

    return finalMessage;
  };

  /**
   * Gets the system prompt content for a given prompt type
   * @param {string} promptType - The prompt type to retrieve
   * @returns {Promise<string>} The system prompt content
   */
  const getSystemPrompt = async (promptType) => {
    // If shop is provided, try to load active prompt version from database
    if (shop) {
      try {
        const activePrompt = await getActivePromptVersion(shop);
        if (activePrompt && activePrompt.compiledPrompt) {
          console.log(`Using custom prompt version for shop: ${shop}`);
          return activePrompt.compiledPrompt;
        }
      } catch (error) {
        console.error('Error loading active prompt version:', error);
        // Fall through to use default prompt
      }
    }

    // Fall back to static prompts from JSON file
    return systemPrompts.systemPrompts[promptType]?.content ||
      systemPrompts.systemPrompts[AppConfig.api.defaultPromptType].content;
  };

  /**
   * Converts Claude-format messages to OpenAI format
   * @param {Array} messages - Messages in Claude format
   * @returns {Array} Messages in OpenAI format
   */
  const convertMessagesToOpenAIFormat = (messages) => {
    return messages.map(message => {
      // Handle string content
      if (typeof message.content === 'string') {
        return {
          role: message.role,
          content: message.content
        };
      }

      // Handle array content (Claude format)
      if (Array.isArray(message.content)) {
        const textContent = [];
        const toolCalls = [];
        const toolResults = [];

        for (const block of message.content) {
          if (block.type === 'text') {
            textContent.push(block.text);
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              type: 'function',
              function: {
                name: block.name,
                arguments: JSON.stringify(block.input)
              }
            });
          } else if (block.type === 'tool_result') {
            toolResults.push({
              tool_call_id: block.tool_use_id,
              content: block.content
            });
          }
        }

        // Return assistant message with tool calls
        if (toolCalls.length > 0) {
          return {
            role: 'assistant',
            content: textContent.join('\n') || null,
            tool_calls: toolCalls
          };
        }

        // Return tool results as separate messages
        if (toolResults.length > 0) {
          return toolResults.map(result => ({
            role: 'tool',
            tool_call_id: result.tool_call_id,
            content: result.content
          }));
        }

        // Return text content
        return {
          role: message.role,
          content: textContent.join('\n')
        };
      }

      return message;
    }).flat(); // Flatten in case tool results created multiple messages
  };

  /**
   * Converts Claude-format tools to OpenAI format
   * @param {Array} tools - Tools in Claude format
   * @returns {Array} Tools in OpenAI format
   */
  const convertToolsToOpenAIFormat = (tools) => {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema || {}
      }
    }));
  };

  return {
    streamConversation,
    getSystemPrompt
  };
}

export default {
  createOpenAIService
};

