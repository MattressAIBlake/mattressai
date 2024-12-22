import { create } from 'zustand';
import { MerchantConfig } from '../services/merchant.service';
import { Message, ConversationSummary, ConversationService } from '../services/conversation.service';

interface ChatState {
  merchantConfig: MerchantConfig | null;
  messages: Message[];
  summaries: ConversationSummary[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  setMerchantConfig: (config: MerchantConfig) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Omit<Message, 'sessionId'>) => Promise<void>;
  loadConversationHistory: (sessionId: string) => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string) => void;
  reset: () => void;
  initializeWelcomeMessage: (sessionId: string, welcomeMessage: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  merchantConfig: null,
  messages: [],
  summaries: [],
  isLoading: false,
  error: null,
  sessionId: null,

  setMerchantConfig: (config) => {
    console.log('Setting merchant config:', config);
    set({ merchantConfig: config });
  },
  
  setMessages: (messages) => {
    console.log('Setting messages:', messages);
    set({ messages });
  },
  
  initializeWelcomeMessage: async (sessionId: string, welcomeMessage: string) => {
    console.log('Initializing welcome message');
    const message: Message = {
      id: `welcome-${sessionId}`,
      content: welcomeMessage,
      isUser: false,
      timestamp: new Date(),
      sessionId
    };

    // Save message to backend
    await ConversationService.saveMessage(message);

    // Set as the only message
    set({ messages: [message] });
  },
  
  addMessage: async (messageData) => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No session ID available');

    const message: Message = {
      ...messageData,
      id: messageData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
    };

    // Save message to backend
    await ConversationService.saveMessage(message);

    // Update local state
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  loadConversationHistory: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      const messages = await ConversationService.getConversationHistory(sessionId);
      set({ messages });
    } catch (error) {
      console.error('Error loading conversation history:', error);
      set({ error: 'Failed to load conversation history' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setSessionId: (sessionId) => set({ sessionId }),
  
  reset: () => set({
    messages: [],
    summaries: [],
    error: null,
    isLoading: false,
  }),
})); 