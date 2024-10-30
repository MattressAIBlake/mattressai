'use client';

import { useState } from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import Avatar from './Avatar';
import LoadingIndicator from './LoadingIndicator';
import axios from 'axios';
import type { Message, ChatState } from '@/types/chat';

interface Props {
  className?: string;
}

export default function ChatContainer({ className = "flex flex-col h-screen" }: Props) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    threadId: null
  });
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partialResponse, setPartialResponse] = useState('');

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: 'User',
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await axios.post('/api/chat', { 
        message: messageText,
        threadId: chatState.threadId,
        sessionId // Include sessionId in requests
      });
      
      if (response.data.status === 'streaming') {
        setPartialResponse(response.data.reply);
      } else {
        const aiMessage: Message = {
          id: Date.now() + 1,
          text: response.data.reply,
          sender: 'AI',
        };

        setChatState(prev => ({
          threadId: response.data.threadId,
          messages: [...prev.messages, aiMessage]
        }));
        setPartialResponse('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className={className}>
      <Avatar
        imageSrc="/assets/avatars/assistant.png"
        name="MattressAI Assistant"
      />
      <ChatWindow 
        messages={chatState.messages} 
        isTyping={isTyping}
        partialResponse={partialResponse}
      />
      {isLoading && <LoadingIndicator message="AI is thinking..." />}
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
}
