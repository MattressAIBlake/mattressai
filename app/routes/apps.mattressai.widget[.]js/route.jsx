/**
 * Widget.js Route
 * Serves the storefront widget JavaScript bundle
 * 
 * In production, this would be a pre-built bundle from Vite/Rollup.
 * For development, this is a placeholder that serves a basic initialization script.
 * 
 * NOTE: This route is public and does NOT require HMAC verification
 * because it serves a public JavaScript file that needs to be accessible
 * from the storefront without authentication.
 */

export const loader = async ({ request }) => {
  // Allow CORS for storefront access
  const headers = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }
  // Widget initialization script
  const widgetScript = `
(function() {
  'use strict';
  
  // MattressAI Widget
  const MattressAI = {
    initialized: false,
    config: {},
    sessionId: null,
    variantId: null,
    compareList: [],
    
    init: function() {
      if (this.initialized) return;
      
      const root = document.getElementById('mattressai-root');
      if (!root) {
        console.warn('MattressAI: Root element not found');
        return;
      }
      
      // Extract configuration from data attributes
      this.config = {
        tenant: root.dataset.tenant,
        autoOpen: root.dataset.autoOpen === 'true',
        showCompare: root.dataset.showCompare === 'true',
        guidedMode: root.dataset.guidedMode === 'true',
        primaryColor: root.dataset.primaryColor || '#2c5f2d'
      };
      
      // Set CSS custom properties
      document.documentElement.style.setProperty('--mattress-primary', this.config.primaryColor);
      
      // Initialize session
      this.startSession();
      
      // Create chat bubble
      this.createChatBubble();
      
      this.initialized = true;
      console.log('MattressAI Widget initialized', this.config);
    },
    
    startSession: async function() {
      try {
        const response = await fetch('/apps/mattressai/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: this.config.tenant,
            conversationId: this.getConversationId()
          })
        });
        
        const data = await response.json();
        
        if (data.ok) {
          this.sessionId = data.sessionId;
          this.variantId = data.variantId;
          
          // Store in sessionStorage for persistence
          sessionStorage.setItem('mattressai_session_id', data.sessionId);
          if (data.variantId) {
            sessionStorage.setItem('mattressai_variant_id', data.variantId);
          }
          
          console.log('Session started:', data);
        }
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    },
    
    getConversationId: function() {
      let conversationId = sessionStorage.getItem('mattressai_conversation_id');
      if (!conversationId) {
        conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('mattressai_conversation_id', conversationId);
      }
      return conversationId;
    },
    
    createChatBubble: function() {
      const bubble = document.createElement('button');
      bubble.id = 'mattressai-chat-bubble';
      bubble.className = 'mattressai-chat-bubble';
      bubble.innerHTML = \`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      \`;
      bubble.setAttribute('aria-label', 'Open chat assistant');
      bubble.addEventListener('click', () => this.openChat());
      
      document.body.appendChild(bubble);
      
      // Auto-open if configured
      if (this.config.autoOpen && !sessionStorage.getItem('mattressai_visited')) {
        setTimeout(() => this.openChat(), 2000);
        sessionStorage.setItem('mattressai_visited', 'true');
      }
    },
    
    openChat: function() {
      // Track event
      this.trackEvent('opened');
      
      // Create chat widget
      this.createChatWidget();
    },
    
    createChatWidget: function() {
      // Check if widget already exists
      if (document.getElementById('mattressai-chat-widget')) {
        document.getElementById('mattressai-chat-widget').classList.add('mattressai-widget--open');
        return;
      }
      
      // Create widget container
      const widget = document.createElement('div');
      widget.id = 'mattressai-chat-widget';
      widget.className = 'mattressai-widget mattressai-widget--open';
      widget.innerHTML = \`
        <div class="mattressai-widget__header">
          <div class="mattressai-widget__header-content">
            <h3 class="mattressai-widget__title">MattressAI Assistant</h3>
            <p class="mattressai-widget__subtitle">Find your perfect mattress</p>
          </div>
          <button class="mattressai-widget__close" aria-label="Close chat">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4L4 12M4 4l8 8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="mattressai-widget__messages" id="mattressai-messages">
          <div class="mattressai-message mattressai-message--assistant">
            <div class="mattressai-message__avatar">AI</div>
            <div class="mattressai-message__content">
              <p>Hi! I'm here to help you find the perfect mattress. What type of sleeper are you?</p>
            </div>
          </div>
        </div>
        
        <div class="mattressai-widget__input-container">
          <textarea
            id="mattressai-input"
            class="mattressai-widget__input"
            placeholder="Type your message..."
            rows="1"
          ></textarea>
          <button 
            id="mattressai-send"
            class="mattressai-widget__send-btn"
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      \`;
      
      document.body.appendChild(widget);
      
      // Add event listeners
      widget.querySelector('.mattressai-widget__close').addEventListener('click', () => {
        widget.classList.remove('mattressai-widget--open');
      });
      
      const input = widget.querySelector('#mattressai-input');
      const sendBtn = widget.querySelector('#mattressai-send');
      
      const sendMessage = () => this.sendMessage(input.value.trim());
      
      sendBtn.addEventListener('click', () => {
        if (input.value.trim()) {
          sendMessage();
        }
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (input.value.trim()) {
            sendMessage();
          }
        }
      });
      
      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
      
      // Focus input
      input.focus();
    },
    
    sendMessage: async function(message) {
      if (!message) return;
      
      const input = document.querySelector('#mattressai-input');
      const messagesContainer = document.querySelector('#mattressai-messages');
      
      // Clear input
      input.value = '';
      input.style.height = 'auto';
      
      // Add user message to UI
      this.addMessage('user', message);
      
      // Add loading indicator
      const loadingId = this.addLoadingMessage();
      
      try {
        // Send to chat API
        const response = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            message: message,
            conversation_id: this.getConversationId()
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        // Remove loading indicator
        this.removeLoadingMessage(loadingId);
        
        // Handle SSE stream
        await this.handleStreamResponse(response);
        
      } catch (error) {
        console.error('Error sending message:', error);
        this.removeLoadingMessage(loadingId);
        this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      }
    },
    
    handleStreamResponse: async function(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessage = '';
      let currentMessageElement = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                // Add/update assistant message
                if (!currentMessageElement) {
                  currentMessageElement = this.addMessage('assistant', data.chunk, true);
                } else {
                  currentMessage += data.chunk;
                  currentMessageElement.querySelector('.mattressai-message__content').textContent = currentMessage;
                  this.scrollToBottom();
                }
              } else if (data.type === 'product_results') {
                // Display product recommendations
                this.displayProducts(data.products);
              } else if (data.type === 'end_turn') {
                currentMessage = '';
                currentMessageElement = null;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    },
    
    addMessage: function(role, content, isStreaming = false) {
      const messagesContainer = document.querySelector('#mattressai-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = \`mattressai-message mattressai-message--\${role}\`;
      
      if (role === 'assistant') {
        messageDiv.innerHTML = \`
          <div class="mattressai-message__avatar">AI</div>
          <div class="mattressai-message__content">\${content}</div>
        \`;
      } else {
        messageDiv.innerHTML = \`
          <div class="mattressai-message__content">\${content}</div>
        \`;
      }
      
      messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
      
      return messageDiv;
    },
    
    addLoadingMessage: function() {
      const messagesContainer = document.querySelector('#mattressai-messages');
      const loadingDiv = document.createElement('div');
      const loadingId = 'loading-' + Date.now();
      loadingDiv.id = loadingId;
      loadingDiv.className = 'mattressai-message mattressai-message--assistant';
      loadingDiv.innerHTML = \`
        <div class="mattressai-message__avatar">AI</div>
        <div class="mattressai-message__content">
          <div class="mattressai-loading">
            <span></span><span></span><span></span>
          </div>
        </div>
      \`;
      messagesContainer.appendChild(loadingDiv);
      this.scrollToBottom();
      return loadingId;
    },
    
    removeLoadingMessage: function(loadingId) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.remove();
      }
    },
    
    scrollToBottom: function() {
      const messagesContainer = document.querySelector('#mattressai-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    },
    
    displayProducts: function(products) {
      if (!products || products.length === 0) return;
      
      const messagesContainer = document.querySelector('#mattressai-messages');
      const productsDiv = document.createElement('div');
      productsDiv.className = 'mattressai-products';
      
      products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'mattressai-product-card';
        productCard.innerHTML = \`
          <img src="\${product.image || ''}" alt="\${product.title}" class="mattressai-product-card__image"/>
          <div class="mattressai-product-card__content">
            <h4 class="mattressai-product-card__title">\${product.title}</h4>
            <p class="mattressai-product-card__price">\${product.price ? '$' + product.price : 'Price varies'}</p>
            <a 
              href="\${product.url || '#'}" 
              class="mattressai-product-card__button"
              target="_blank"
            >
              View Product
            </a>
          </div>
        \`;
        productsDiv.appendChild(productCard);
      });
      
      messagesContainer.appendChild(productsDiv);
      this.scrollToBottom();
    },
    
    trackEvent: async function(type, metadata = {}) {
      if (!this.sessionId) return;
      
      try {
        await fetch('/apps/mattressai/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: this.config.tenant,
            sessionId: this.sessionId,
            type: type,
            metadata: JSON.stringify(metadata),
            variantId: this.variantId
          })
        });
      } catch (error) {
        console.error('Failed to track event:', error);
      }
    },
    
    addToCompare: function(product) {
      if (this.compareList.length >= 3) {
        console.warn('Maximum 3 products in comparison');
        return;
      }
      
      this.compareList.push(product);
      this.trackEvent('comparison_added', { productId: product.productId });
    },
    
    removeFromCompare: function(productId) {
      this.compareList = this.compareList.filter(p => p.productId !== productId);
      this.trackEvent('comparison_removed', { productId });
    },
    
    openCompareDrawer: function() {
      if (this.compareList.length === 0) return;
      
      this.trackEvent('comparison_opened');
      console.log('Opening compare drawer with:', this.compareList);
      // Full implementation would render CompareDrawer React component
    }
  };
  
  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MattressAI.init());
  } else {
    MattressAI.init();
  }
  
  // Expose to window
  window.MattressAI = MattressAI;
  
  // Add comprehensive CSS
  const style = document.createElement('style');
  style.textContent = \`
    /* Chat Bubble */
    .mattressai-chat-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--mattress-primary, #2c5f2d);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      z-index: 9999;
      animation: slideUp 0.3s ease;
    }
    
    .mattressai-chat-bubble:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
    
    .mattressai-chat-bubble svg {
      width: 28px;
      height: 28px;
    }
    
    /* Chat Widget */
    .mattressai-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 420px;
      max-width: calc(100vw - 48px);
      height: 650px;
      max-height: calc(100vh - 48px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      transform: translateY(calc(100% + 48px));
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    .mattressai-widget--open {
      transform: translateY(0);
      opacity: 1;
    }
    
    /* Widget Header */
    .mattressai-widget__header {
      padding: 20px;
      background: var(--mattress-primary, #2c5f2d);
      color: white;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .mattressai-widget__title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .mattressai-widget__subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    
    .mattressai-widget__close {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: background 0.2s ease;
    }
    
    .mattressai-widget__close:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .mattressai-widget__close svg {
      width: 20px;
      height: 20px;
    }
    
    /* Messages Container */
    .mattressai-widget__messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .mattressai-widget__messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .mattressai-widget__messages::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .mattressai-widget__messages::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
    
    /* Messages */
    .mattressai-message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    
    .mattressai-message--user {
      flex-direction: row-reverse;
      align-self: flex-end;
    }
    
    .mattressai-message__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--mattress-primary, #2c5f2d);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .mattressai-message__content {
      background: white;
      padding: 12px 16px;
      border-radius: 12px;
      max-width: 280px;
      word-wrap: break-word;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      line-height: 1.5;
      font-size: 14px;
      color: #374151;
    }
    
    .mattressai-message--user .mattressai-message__content {
      background: var(--mattress-primary, #2c5f2d);
      color: white;
    }
    
    /* Loading Animation */
    .mattressai-loading {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 4px 0;
    }
    
    .mattressai-loading span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
      animation: loadingBounce 1.4s infinite ease-in-out both;
    }
    
    .mattressai-loading span:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    .mattressai-loading span:nth-child(2) {
      animation-delay: -0.16s;
    }
    
    @keyframes loadingBounce {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    /* Product Cards */
    .mattressai-products {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    
    .mattressai-product-card {
      background: white;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      gap: 12px;
      align-items: center;
      transition: box-shadow 0.2s ease;
    }
    
    .mattressai-product-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
    
    .mattressai-product-card__image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
    }
    
    .mattressai-product-card__content {
      flex: 1;
      min-width: 0;
    }
    
    .mattressai-product-card__title {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .mattressai-product-card__price {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--mattress-primary, #2c5f2d);
      font-weight: 600;
    }
    
    .mattressai-product-card__button {
      display: inline-block;
      padding: 6px 12px;
      background: var(--mattress-primary, #2c5f2d);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.2s ease;
    }
    
    .mattressai-product-card__button:hover {
      background: #1e4620;
    }
    
    /* Input Container */
    .mattressai-widget__input-container {
      padding: 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    
    .mattressai-widget__input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      max-height: 120px;
      min-height: 42px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    
    .mattressai-widget__input:focus {
      border-color: var(--mattress-primary, #2c5f2d);
    }
    
    .mattressai-widget__send-btn {
      background: var(--mattress-primary, #2c5f2d);
      border: none;
      border-radius: 12px;
      color: white;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.2s ease;
    }
    
    .mattressai-widget__send-btn:hover {
      background: #1e4620;
    }
    
    .mattressai-widget__send-btn svg {
      width: 20px;
      height: 20px;
    }
    
    /* Animations */
    @keyframes slideUp {
      from {
        transform: translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .mattressai-chat-bubble {
        bottom: 16px;
        right: 16px;
        width: 56px;
        height: 56px;
      }
      
      .mattressai-widget {
        bottom: 0;
        right: 0;
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
      
      .mattressai-widget__header {
        border-radius: 0;
      }
      
      .mattressai-message__content {
        max-width: 240px;
      }
    }
  \`;
  document.head.appendChild(style);
})();
  `;

  return new Response(widgetScript, { headers });
};
