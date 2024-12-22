import { create } from 'zustand';
import { ConversationService } from '../services/conversation.service';

export const useChatStore = create((set, get) => ({
    merchantConfig: null,
    messages: [],
    summaries: [],
    isLoading: false,
    error: null,
    sessionId: null,
    
    setMerchantConfig: (config) => set({ merchantConfig: config }),
    
    setMessages: (messages) => set({ messages }),
    
    initializeWelcomeMessage: async (sessionId, welcomeMessage) => {
        console.log('Initializing welcome message');
        const message = {
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
        
        const message = {
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
        
        // If we've reached the message limit, trigger summarization
        const { messages } = get();
        if (messages.length % 20 === 0) { // Summarize every 20 messages
            await get().summarizeCurrentConversation();
        }
    },
    
    loadConversationHistory: async (sessionId) => {
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
    
    summarizeCurrentConversation: async () => {
        const { messages, summaries } = get();
        if (messages.length < 10) return; // Don't summarize if we have too few messages

        try {
            // Get messages that haven't been summarized yet
            const lastSummary = summaries[summaries.length - 1];
            const unsummarizedMessages = lastSummary
                ? messages.filter(m => m.timestamp > lastSummary.timestamp)
                : messages;

            if (unsummarizedMessages.length < 10) return; // Don't summarize if we have too few new messages

            const summary = await ConversationService.summarizeConversation(unsummarizedMessages);
            
            set((state) => ({
                summaries: [...state.summaries, summary],
            }));
        } catch (error) {
            console.error('Error summarizing conversation:', error);
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
