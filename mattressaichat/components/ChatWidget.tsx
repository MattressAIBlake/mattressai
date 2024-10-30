import { useState } from 'react';
import ChatContainer from './ChatContainer';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-[400px] h-[600px] overflow-hidden">
          <div className="flex justify-between items-center p-2 border-b">
            <span>Chat with us</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
          <div className="h-[calc(100%-48px)]">
            <ChatContainer />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
        >
          💬
        </button>
      )}
    </div>
  );
}
