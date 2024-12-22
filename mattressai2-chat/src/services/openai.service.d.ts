export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatCompletionResponse {
    id: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface ChatCompletionParams {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    model?: string;
}
export declare const OpenAIService: {
    createChatCompletion({ messages, temperature, max_tokens, model, }: ChatCompletionParams): Promise<ChatCompletionResponse>;
    shouldFetchProductInfo(message: string): boolean;
    formatConversationHistory(masterPrompt: string, conversationHistory: {
        content: string;
        isUser: boolean;
    }[], currentMessage: string): Promise<ChatMessage[]>;
};
