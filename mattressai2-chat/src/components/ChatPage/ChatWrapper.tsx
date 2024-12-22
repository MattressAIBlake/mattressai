import React, { useEffect, useRef } from 'react';
import { Chat } from '../Chat/Chat';
import { defaultTheme } from '../../styles/theme';
import { useChatStore } from '../../store/chatStore';
import { MerchantService } from '../../services/merchant.service';
import { ConversationService } from '../../services/conversation.service';
import { getSessionId } from '../../utils/session';

const ChatWrapper: React.FC = () => {
  const { 
    setMerchantConfig, 
    setSessionId,
    setMessages,
    merchantConfig,
    initializeWelcomeMessage,
    setError
  } = useChatStore();

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeApp = async () => {
      try {
        // Set session ID
        const sessionId = getSessionId();
        setSessionId(sessionId);

        // Fetch merchant config first
        const config = await MerchantService.getConfig('demo-merchant');
        setMerchantConfig(config);

        // Then load conversation history
        const messages = await ConversationService.getConversationHistory(sessionId);
        
        // Only add welcome message if there are no messages
        if (messages.length === 0 && config.chatConfig.welcomeMessage) {
          await initializeWelcomeMessage(sessionId, config.chatConfig.welcomeMessage);
        } else {
          setMessages(messages);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to initialize chat. Please refresh the page.');
      }
    };

    initializeApp();
  }, [setMerchantConfig, setSessionId, setMessages, initializeWelcomeMessage, setError]);

  if (!merchantConfig) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading chat...</p>
      </div>
    );
  }

  return <Chat theme={defaultTheme} />;
};

export default ChatWrapper; 