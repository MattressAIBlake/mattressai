import { mainApi } from '../config/api';
import { cacheService, CACHE_KEYS } from './cache.service';
const MAX_RECENT_MESSAGES = 10;
const CONVERSATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const BATCH_SIZE = 50; // Number of messages to fetch per batch
export const ConversationService = {
    async saveMessage(message) {
        try {
            await mainApi.post('/api/messages', message);
            // Update cache
            const cachedMessages = await this._getCachedMessages(message.sessionId);
            if (cachedMessages) {
                cachedMessages.push(message);
                this._updateMessageCache(message.sessionId, cachedMessages);
            }
        }
        catch (error) {
            console.error('Error saving message:', error);
            throw error;
        }
    },
    _getCachedMessages(sessionId) {
        const cached = cacheService.get(CACHE_KEYS.conversationHistory(sessionId));
        return Promise.resolve(cached);
    },
    _updateMessageCache(sessionId, messages) {
        cacheService.set(CACHE_KEYS.conversationHistory(sessionId), messages, CONVERSATION_CACHE_TTL);
    },
    async getConversationHistory(sessionId) {
        try {
            // Check cache first
            const cachedMessages = await this._getCachedMessages(sessionId);
            if (cachedMessages) {
                return cachedMessages;
            }
            // If not in cache, fetch from API with pagination
            const allMessages = [];
            let lastMessageId;
            const seenIds = new Set();
            
            while (true) {
                const response = await mainApi.get(`/api/messages/${sessionId}`, {
                    params: {
                        limit: BATCH_SIZE,
                        lastMessageId,
                    },
                });
                // Ensure messages is an array and deduplicate
                const messages = Array.isArray(response.data) ? response.data : [];
                if (messages.length === 0) break;
                
                // Only add messages we haven't seen before
                for (const message of messages) {
                    if (!seenIds.has(message.id)) {
                        seenIds.add(message.id);
                        allMessages.push(message);
                    }
                }

                if (messages.length < BATCH_SIZE) {
                    break;
                }
                lastMessageId = messages[messages.length - 1].id;
            }

            // Sort messages by timestamp
            allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            // Store in cache
            this._updateMessageCache(sessionId, allMessages);
            return allMessages;
        }
        catch (error) {
            console.error('Error fetching conversation history:', error);
            return []; // Return empty array instead of throwing
        }
    },
    async summarizeConversation(messages) {
        try {
            const response = await mainApi.post('/api/summarize', { messages });
            return response.data;
        }
        catch (error) {
            console.error('Error summarizing conversation:', error);
            throw error;
        }
    },
    getRelevantHistory(messages, summaries) {
        // If we have less than MAX_RECENT_MESSAGES, return all messages
        if (messages.length <= MAX_RECENT_MESSAGES) {
            return messages;
        }
        // Get the most recent messages
        const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);
        // If we have summaries, add the most recent summary as context
        if (summaries.length > 0) {
            const latestSummary = summaries[summaries.length - 1];
            return [
                {
                    id: latestSummary.id,
                    content: `Previous conversation context: ${latestSummary.summary}`,
                    isUser: false,
                    timestamp: latestSummary.timestamp,
                    sessionId: recentMessages[0].sessionId,
                },
                ...recentMessages,
            ];
        }
        return recentMessages;
    },
};
