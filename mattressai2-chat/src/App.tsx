import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Chat } from './components/Chat/Chat.jsx';
import ChatPage from './components/ChatPage/ChatPage';
import { ThemeProvider } from './components/ThemeProvider/ThemeProvider';
import { MerchantService } from './services/merchant.service';
import { ConversationService } from './services/conversation.service';
import { useChatStore } from './store/chatStore';
import { getSessionId } from './utils/session';
import { defaultTheme } from './styles/theme';
import styles from './App.module.css';
import './styles/global.css';

// TODO: This should come from environment variables or URL params
const MERCHANT_ID = 'demo-merchant';

function ChatWrapper() {
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
        const config = await MerchantService.getConfig(MERCHANT_ID);
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
      <div className={styles.app}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'var(--gray-500)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="loading-spinner" />
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <ThemeProvider 
        merchantBranding={{
          ...merchantConfig.branding,
          name: merchantConfig.name
        }}
      >
        <Chat theme={defaultTheme} />
      </ThemeProvider>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat" element={
          <ThemeProvider 
            merchantBranding={{
              colors: {
                primary: '#4169e1',
                secondary: '#3451b2',
                background: '#ffffff',
                text: '#000000'
              },
              fonts: {
                primary: 'Crimson Pro',
                secondary: 'system-ui'
              },
              name: 'MattressAI'
            }}
          >
            <ChatWrapper />
          </ThemeProvider>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
