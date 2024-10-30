import type { Message } from '@/types/chat';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'User';

  return (
    <div className={`mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-lg p-2 max-w-xs ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
        }`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
}
