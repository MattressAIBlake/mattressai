export interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    sessionId: string;
}
export interface ConversationSummary {
    id: string;
    summary: string;
    messageIds: string[];
    timestamp: Date;
}
export declare const ConversationService: {
    saveMessage(message: Message): Promise<void>;
    _getCachedMessages(sessionId: string): Promise<Message[] | null>;
    _updateMessageCache(sessionId: string, messages: Message[]): void;
    getConversationHistory(sessionId: string): Promise<Message[]>;
    summarizeConversation(messages: Message[]): Promise<ConversationSummary>;
    getRelevantHistory(messages: Message[], summaries: ConversationSummary[]): Message[];
};
