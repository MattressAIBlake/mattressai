import { openAiApi } from '../config/api';
import { ProductService } from './product.service';
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
    async createChatCompletion({ messages, temperature = 0.7, max_tokens = 1000, model = 'gpt-4', }) {
        try {
            const response = await openAiApi.post('/v1/chat/completions', {
                model,
                messages,
                temperature,
                max_tokens,
            });
            return response.data;
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    },
    shouldFetchProductInfo(message) {
        return PRODUCT_QUERY_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
    },
    async formatConversationHistory(masterPrompt, conversationHistory, currentMessage) {
        const messages = [
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
            }
            catch (error) {
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
