import { openAiApi } from '../config/api';
import { ProductService } from './product.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ThreadMessage {
  id: string;
  content: string[];
  role: string;
  thread_id: string;
  created_at: number;
}

export interface Thread {
  id: string;
  created_at: number;
  metadata?: Record<string, string>;
}

export interface Run {
  id: string;
  thread_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  created_at: number;
}

// Keywords that indicate product information might be needed
const PRODUCT_QUERY_KEYWORDS = [
  'mattress',
  'bed',
  'recommend',
  'suggestion',
  'compare',
  'difference',
  'price',
  'feature',
  'specification',
  'size',
  'type',
];

export const OpenAIService = {
  async createThread(metadata?: Record<string, string>): Promise<Thread> {
    try {
      const response = await openAiApi.post('/v1/threads', { metadata });
      return response.data;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  },

  async addMessage(threadId: string, content: string): Promise<ThreadMessage> {
    try {
      const response = await openAiApi.post(`/v1/threads/${threadId}/messages`, {
        role: 'user',
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  async createRun(threadId: string, assistantId: string): Promise<Run> {
    try {
      const response = await openAiApi.post(`/v1/threads/${threadId}/runs`, {
        assistant_id: assistantId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating run:', error);
      throw error;
    }
  },

  async getRun(threadId: string, runId: string): Promise<Run> {
    try {
      const response = await openAiApi.get(`/v1/threads/${threadId}/runs/${runId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting run:', error);
      throw error;
    }
  },

  async getMessages(threadId: string): Promise<ThreadMessage[]> {
    try {
      const response = await openAiApi.get(`/v1/threads/${threadId}/messages`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  async waitForRunCompletion(threadId: string, runId: string): Promise<Run> {
    const maxAttempts = 50;
    const delayMs = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const run = await this.getRun(threadId, runId);
      if (run.status === 'completed') {
        return run;
      }
      if (run.status === 'failed') {
        throw new Error('Run failed');
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }
    throw new Error('Run timed out');
  },

  shouldFetchProductInfo(message: string): boolean {
    return PRODUCT_QUERY_KEYWORDS.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  async formatConversationHistory(
    masterPrompt: string,
    conversationHistory: { content: string; isUser: boolean }[],
    currentMessage: string
  ): Promise<ChatMessage[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: masterPrompt,
      },
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Check if we need product information
    if (this.shouldFetchProductInfo(currentMessage)) {
      try {
        const productContext = await ProductService.getRelevantProductContext(currentMessage);
        if (productContext) {
          messages.push({
            role: 'system',
            content: `Current product information:\n${productContext}\n\nPlease use this product information to provide accurate recommendations and details.`,
          });
        }
      } catch (error) {
        console.error('Error fetching product context:', error);
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  },
}; 