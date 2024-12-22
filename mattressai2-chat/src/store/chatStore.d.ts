import { MerchantConfig } from '../services/merchant.service';
import { Message, ConversationSummary } from '../services/conversation.service';
interface ChatState {
    merchantConfig: MerchantConfig | null;
    messages: Message[];
    summaries: ConversationSummary[];
    isLoading: boolean;
    error: string | null;
    sessionId: string | null;
    setMerchantConfig: (config: MerchantConfig) => void;
    addMessage: (message: Omit<Message, 'sessionId'>) => Promise<void>;
    loadConversationHistory: (sessionId: string) => Promise<void>;
    summarizeCurrentConversation: () => Promise<void>;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSessionId: (sessionId: string) => void;
    reset: () => void;
}
export declare const useChatStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ChatState>>;
export {};
