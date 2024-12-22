import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../../styles/theme';
import { useChatStore } from '../../store/chatStore';
import { ConversationService } from '../../services/conversation.service';
import { ErrorService } from '../../services/error.service';
import { LinkUtils } from '../../utils/linkUtils';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage.tsx';
import { LoadingIndicator } from '../LoadingIndicator/LoadingIndicator';
import './Chat.css';

interface ChatProps {
  theme: Theme;
}

export const Chat: React.FC<ChatProps> = ({ theme }) => {
  const { 
    messages, 
    addMessage, 
    merchantConfig, 
    isLoading, 
    setIsLoading, 
    setError, 
    sessionId, 
    reset 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [lastError, setLastError] = useState<Error | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const instance = new SpeechRecognitionAPI();
      instance.continuous = false;
      instance.interimResults = false;
      instance.lang = 'en-US';

      instance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsListening(false);
      };

      instance.onerror = () => {
        setIsListening(false);
      };

      instance.onend = () => {
        setIsListening(false);
      };

      setRecognition(instance);
    }
  }, []);

  // Initialize thread
  useEffect(() => {
    if (sessionId && !threadId) {
      const initThread = async () => {
        try {
          const newThreadId = await ConversationService.initializeThread(sessionId);
          setThreadId(newThreadId);
        } catch (error) {
          console.error('Error initializing thread:', error);
          setError('Failed to initialize chat thread');
        }
      };
      initThread();
    }
  }, [sessionId]);

  // Focus management
  const focusInput = () => {
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  };

  // Maintain focus
  useEffect(() => {
    let focusInterval: number;

    const startFocusInterval = () => {
      focusInterval = window.setInterval(focusInput, 200);
    };

    const stopFocusInterval = () => {
      if (focusInterval) {
        clearInterval(focusInterval);
      }
    };

    // Start the interval
    startFocusInterval();

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopFocusInterval();
      } else {
        startFocusInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopFocusInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Scroll to bottom when new messages arrive or during loading
  useEffect(() => {
    if (chatWindowRef.current) {
      const scrollToBottom = () => {
        chatWindowRef.current!.scrollTop = chatWindowRef.current!.scrollHeight;
      };
      scrollToBottom();
      // Add a slight delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading]);

  const toggleSpeechRecognition = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input;
    if (!messageToSend.trim() || !merchantConfig || !sessionId || !threadId) return;

    const userMessage = {
      id: Date.now().toString(),
      content: messageToSend,
      isUser: true,
      timestamp: new Date(),
      sessionId,
      threadId
    };

    try {
      setLastError(null);
      if (!retryMessage) {
        await addMessage(userMessage);
        setInput('');
        setLastUserMessage(messageToSend);
      }
      setIsLoading(true);
    } catch (error) {
      console.error('Error sending message:', error);
      const apiError = ErrorService.handleApiError(error);
      setLastError(apiError);
      setError(ErrorService.getUserFriendlyMessage(apiError));
    } finally {
      setIsLoading(false);
      // Refocus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSend(lastUserMessage);
    }
  };

  const handleReset = () => {
    reset();
    setLastError(null);
    setLastUserMessage('');
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = LinkUtils.processMessageWithLinks(content);
    
    return parts.map((part, index) => {
      if (part.type === 'link') {
        return (
          <a
            key={index}
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.content}
          </a>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };

  // Check if device is mobile or tablet
  const isMobileOrTablet = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!merchantConfig) return null;

  return (
    <div className="chat-container">
      <div className="chat-inner">
        <header className="chat-header" style={{ backgroundColor: theme.colors.primary }}>
          <div className="header-content">
            {merchantConfig.branding.logo && (
              <img 
                className="logo"
                src={merchantConfig.branding.logo} 
                alt={merchantConfig.name}
              />
            )}
            <h1 style={{ color: '#fff' }}>{merchantConfig.name}</h1>
          </div>
          <button className="reset-button" onClick={handleReset}>
            Start Over
          </button>
        </header>

        <div className="chat-window" ref={chatWindowRef}>
          {messages.map((message, index) => (
            <div 
              key={`${message.id}-${index}`}
              className={`message-container ${message.isUser ? 'user' : 'ai'}`}
            >
              <div className="avatar">
                {message.isUser ? (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: theme.colors.primary
                  }} />
                ) : merchantConfig.branding.logo ? (
                  <img 
                    src={merchantConfig.branding.logo} 
                    alt={merchantConfig.name}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: theme.colors.primary
                  }}>
                    {merchantConfig.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className={`message-bubble ${message.isUser ? 'user' : 'ai'}`}>
                {renderMessageContent(message.content)}
              </div>
            </div>
          ))}
          {isLoading && <LoadingIndicator theme={theme} />}
          {lastError && (
            <ErrorMessage
              error={lastError}
              theme={theme}
              onRetry={handleRetry}
            />
          )}
        </div>

        <div className="input-container">
          <input
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          {isMobileOrTablet && (
            <button
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={toggleSpeechRecognition}
              type="button"
              disabled={isLoading}
            >
              {isListening ? '🔴' : '🎤'}
            </button>
          )}
          <button
            className="send-button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}; 