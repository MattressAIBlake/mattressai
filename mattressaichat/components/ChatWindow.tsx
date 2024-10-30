import MessageBubble from './MessageBubble';
import type { Message } from '@/types/chat';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  partialResponse: string;
}

export default function ChatWindow({ messages, isTyping, partialResponse }: ChatWindowProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <div key={message.id} className={`mb-4 ${message.sender === 'AI' ? 'text-blue-600' : 'text-gray-800'}`}>
          <strong>{message.sender}:</strong> {message.text}
        </div>
      ))}
      {isTyping && partialResponse && (
        <div className="text-gray-500">
          <strong>AI:</strong> {partialResponse}
        </div>
      )}
    </div>
  );
}
