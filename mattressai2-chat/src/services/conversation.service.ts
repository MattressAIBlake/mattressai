import { mainApi } from '../config/api';
import { cacheService, CACHE_KEYS } from './cache.service';
import { OpenAIService } from './openai.service';

// Get environment variables using Vite's import.meta.env
const OPENAI_ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID;

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sessionId: string;
  threadId?: string;
}

export interface ConversationSummary {
  id: string;
  summary: string;
  messageIds: string[];
  timestamp: Date;
}

const MAX_RECENT_MESSAGES = 10;
const CONVERSATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const ConversationService = {
  async initializeThread(sessionId: string, metadata?: Record<string, string>): Promise<string> {
    try {
      const thread = await OpenAIService.createThread({
        ...metadata,
        sessionId
      });
      return thread.id;
    } catch (error) {
      console.error('Error initializing thread:', error);
      throw error;
    }
  },

  async saveMessage(message: Message): Promise<void> {
    try {
      console.log('Saving message:', message);
      await mainApi.post('/api/messages', message);
      
      // If it's a user message, send it to OpenAI thread
      if (message.isUser && message.threadId) {
        await OpenAIService.addMessage(message.threadId, message.content);
        
        // Create and wait for run completion
        const run = await OpenAIService.createRun(
          message.threadId,
          OPENAI_ASSISTANT_ID
        );
        await OpenAIService.waitForRunCompletion(message.threadId, run.id);
        
        // Get the assistant's response
        const messages = await OpenAIService.getMessages(message.threadId);
        const assistantMessage = messages[0]; // Latest message
        
        // Save assistant's response
        const aiMessage: Message = {
          id: assistantMessage.id,
          content: assistantMessage.content[0],
          isUser: false,
          timestamp: new Date(assistantMessage.created_at * 1000),
          sessionId: message.sessionId,
          threadId: message.threadId
        };
        await this.saveMessage(aiMessage);
      }
      
      // Update cache
      const cachedMessages = await this._getCachedMessages(message.sessionId);
      if (cachedMessages) {
        cachedMessages.push(message);
        this._updateMessageCache(message.sessionId, cachedMessages);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  async getConversationHistory(sessionId: string): Promise<Message[]> {
    try {
      // Check cache first
      const cachedMessages = await this._getCachedMessages(sessionId);
      if (cachedMessages) {
        return cachedMessages;
      }

      const response = await mainApi.get<Message[]>(`/api/messages/${sessionId}`);
      const messages = Array.isArray(response.data) ? response.data : [];
      
      // Store in cache
      this._updateMessageCache(sessionId, messages);
      return messages;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  },

  _getCachedMessages(sessionId: string): Promise<Message[] | null> {
    const cached = cacheService.get<Message[]>(CACHE_KEYS.conversationHistory(sessionId));
    return Promise.resolve(cached);
  },

  _updateMessageCache(sessionId: string, messages: Message[]): void {
    cacheService.set(
      CACHE_KEYS.conversationHistory(sessionId),
      messages,
      CONVERSATION_CACHE_TTL
    );
  },

  getRelevantHistory(messages: Message[], summaries: ConversationSummary[]): Message[] {
    if (messages.length <= MAX_RECENT_MESSAGES) {
      return messages;
    }

    const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);

    if (summaries.length > 0) {
      const latestSummary = summaries[summaries.length - 1];
      return [
        {
          id: latestSummary.id,
          content: `Previous conversation context: ${latestSummary.summary}`,
          isUser: false,
          timestamp: latestSummary.timestamp,
          sessionId: recentMessages[0].sessionId,
          threadId: recentMessages[0].threadId
        },
        ...recentMessages,
      ];
    }

    return recentMessages;
  }
}; 