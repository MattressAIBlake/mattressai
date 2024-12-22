import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../ThemeProvider/ThemeProvider';
import ChatWrapper from './ChatWrapper';
import '../Chat/Chat.css';

const ChatPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      console.log('Window width:', window.innerWidth, 'Is mobile:', mobile);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  console.log('Rendering ChatPage, isMobile:', isMobile);

  if (isMobile) {
    return (
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
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">MattressAI Demo</h1>
      <p className="page-subtitle">
        Experience our AI-powered mattress recommendation system. Get personalized advice based on your sleep preferences and needs.
      </p>
      <div className="chat-frame-container">
        <iframe
          src="/chat"
          className="chat-frame"
          title="MattressAI Chat Interface"
        />
      </div>
    </div>
  );
};

export default ChatPage; 