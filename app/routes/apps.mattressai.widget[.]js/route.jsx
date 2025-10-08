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
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Temporarily disable caching for testing
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
    unreadCount: 0,
    isOpen: false,
    stickToBottom: true,
    lastDayLabel: null,
    
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
        primaryColor: root.dataset.primaryColor || '#0F172A',
        widgetTitle: root.dataset.widgetTitle || 'Chat with us',
        widgetSubtitle: root.dataset.widgetSubtitle || 'We\\'re here to help',
        welcomeMessage: root.dataset.welcomeMessage || 'Hi! How can we help you today?',
        avatarStyle: root.dataset.avatarStyle || 'text',
        avatarText: root.dataset.avatarText || 'AI',
        avatarImage: root.dataset.avatarImage || '',
        avatarBackground: root.dataset.avatarBackground || '#0F172A',
        bubbleStyle: root.dataset.bubbleStyle || 'text',
        bubbleText: root.dataset.bubbleText || 'MattressAI',
        bubbleSize: parseInt(root.dataset.bubbleSize || '64', 10),
        positionHorizontal: root.dataset.positionHorizontal || 'right',
        positionBottom: parseInt(root.dataset.positionBottom || '20', 10),
        positionSide: parseInt(root.dataset.positionSide || '20', 10)
      };
      
      // Set CSS custom properties
      document.documentElement.style.setProperty('--mattress-primary', this.config.primaryColor);
      document.documentElement.style.setProperty('--mattress-avatar-bg', this.config.avatarBackground);
      document.documentElement.style.setProperty('--mattress-bubble-size', this.config.bubbleSize + 'px');
      document.documentElement.style.setProperty('--mattress-position-bottom', this.config.positionBottom + 'px');
      document.documentElement.style.setProperty('--mattress-position-side', this.config.positionSide + 'px');
      
      // Set position classes
      document.body.classList.add('mattressai-position-' + this.config.positionHorizontal);
      
      // Restore widget state
      this.restoreState();
      
      // Initialize session
      this.startSession();
      
      // Create chat bubble
      this.createChatBubble();
      
      this.initialized = true;
      console.log('MattressAI Widget initialized', this.config);
    },
    
    restoreState: function() {
      const wasOpen = sessionStorage.getItem('mattressai_widget_open') === 'true';
      const unread = parseInt(sessionStorage.getItem('mattressai_unread') || '0', 10);
      this.unreadCount = unread;
      this.isOpen = wasOpen;
    },
    
    saveState: function() {
      sessionStorage.setItem('mattressai_widget_open', String(this.isOpen));
      sessionStorage.setItem('mattressai_unread', String(this.unreadCount));
    },
    
    formatTime: function(date = new Date()) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    },
    
    formatDay: function(date = new Date()) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
    },
    
    ensureDayDivider: function(date = new Date()) {
      const label = this.formatDay(date);
      if (label !== this.lastDayLabel) {
        this.lastDayLabel = label;
        const messagesContainer = document.querySelector('#mattressai-messages');
        if (messagesContainer) {
          const div = document.createElement('div');
          div.className = 'mattressai-daydivider';
          div.textContent = label;
          messagesContainer.appendChild(div);
        }
      }
    },
    
    setTyping: function(isTyping) {
      const typing = document.querySelector('.mattressai-typing');
      if (typing) {
        typing.style.opacity = isTyping ? '1' : '0';
      }
    },
    
    bumpUnread: function() {
      if (!this.isOpen) {
        this.unreadCount++;
        const bubble = document.getElementById('mattressai-chat-bubble');
        if (bubble) {
          bubble.setAttribute('data-badge', String(this.unreadCount));
        }
        this.saveState();
      }
    },
    
    clearUnread: function() {
      this.unreadCount = 0;
      const bubble = document.getElementById('mattressai-chat-bubble');
      if (bubble) {
        bubble.removeAttribute('data-badge');
      }
      this.saveState();
    },
    
    getAvatarHTML: function() {
      if (this.config.avatarStyle === 'image' && this.config.avatarImage) {
        return \`<img src="\${this.config.avatarImage}" alt="Assistant" class="mattressai-message__avatar-image" />\`;
      } else {
        return \`<span class="mattressai-message__avatar-text">\${this.config.avatarText}</span>\`;
      }
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
      bubble.className = 'mattressai-chat-bubble mattressai-bubble-' + this.config.bubbleStyle;
      
      // Build bubble content based on style
      let bubbleContent = '';
      const icon = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mattressai-icon-svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>\`;
      
      if (this.config.bubbleStyle === 'icon') {
        bubbleContent = icon;
      } else if (this.config.bubbleStyle === 'text') {
        bubbleContent = \`<span class="mattressai-bubble-text-span">\${this.config.bubbleText}</span>\`;
      }
      
      bubble.innerHTML = bubbleContent;
      bubble.setAttribute('aria-label', 'Open chat assistant');
      bubble.addEventListener('click', () => this.openChat());
      
      // Restore unread badge if needed
      if (this.unreadCount > 0) {
        bubble.setAttribute('data-badge', String(this.unreadCount));
      }
      
      document.body.appendChild(bubble);
      
      // Auto-open if configured and state indicates it should be open
      if (this.isOpen) {
        setTimeout(() => this.openChat(), 100);
      } else if (this.config.autoOpen && !sessionStorage.getItem('mattressai_visited')) {
        setTimeout(() => this.openChat(), 2000);
        sessionStorage.setItem('mattressai_visited', 'true');
      }
    },
    
    openChat: function() {
      this.isOpen = true;
      this.clearUnread();
      this.saveState();
      
      // Track event
      this.trackEvent('opened');
      
      // Create chat widget
      this.createChatWidget();
    },
    
    closeChat: function() {
      this.isOpen = false;
      this.saveState();
      const widget = document.getElementById('mattressai-chat-widget');
      if (widget) {
        widget.classList.remove('mattressai-widget--open');
      }
    },
    
    createChatWidget: function() {
      // Check if widget already exists
      if (document.getElementById('mattressai-chat-widget')) {
        document.getElementById('mattressai-chat-widget').classList.add('mattressai-widget--open');
        const input = document.querySelector('#mattressai-input');
        if (input) input.focus();
        return;
      }
      
      // Create widget container
      const widget = document.createElement('div');
      widget.id = 'mattressai-chat-widget';
      widget.className = 'mattressai-widget mattressai-widget--open';
      widget.setAttribute('role', 'dialog');
      widget.setAttribute('aria-modal', 'true');
      widget.setAttribute('aria-labelledby', 'mattressai-title');
      
      widget.innerHTML = \`
        <div class="mattressai-widget__header">
          <div class="mattressai-widget__header-content">
            <h3 id="mattressai-title" class="mattressai-widget__title">\${this.config.widgetTitle}</h3>
            <p class="mattressai-widget__subtitle">\${this.config.widgetSubtitle}</p>
          </div>
          <div class="mattressai-typing" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <button class="mattressai-newchip" id="mattressai-newchip" style="display: none;">
            New messages ↓
          </button>
          <button class="mattressai-widget__close" aria-label="Close chat">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4L4 12M4 4l8 8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="mattressai-widget__messages" id="mattressai-messages" aria-live="polite" aria-relevant="additions">
          <div class="mattressai-message mattressai-message--assistant">
            <div class="mattressai-message__avatar">\${this.getAvatarHTML()}</div>
            <div class="mattressai-message__content">\${this.config.welcomeMessage}</div>
          </div>
          <div class="mattressai-quick-replies" id="mattressai-quick-replies">
            <button class="mattressai-quick-reply" data-message="I need help choosing a product">Product help</button>
            <button class="mattressai-quick-reply" data-message="What are your best sellers?">Best sellers</button>
            <button class="mattressai-quick-reply" data-message="Do you have any sales or promotions?">Sales</button>
            <button class="mattressai-quick-reply" data-message="I have a question">Ask a question</button>
          </div>
        </div>
        
        <div class="mattressai-widget__input-container">
          <textarea
            id="mattressai-input"
            class="mattressai-widget__input"
            placeholder="Type your message..."
            rows="1"
            aria-label="Message input"
          ></textarea>
          <button 
            id="mattressai-send"
            class="mattressai-widget__send-btn"
            aria-label="Send message"
            disabled
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      \`;
      
      document.body.appendChild(widget);
      
      // Setup event listeners
      this.setupWidgetListeners(widget);
      
      // Focus input
      const input = widget.querySelector('#mattressai-input');
      if (input) input.focus();
    },
    
    setupWidgetListeners: function(widget) {
      const input = widget.querySelector('#mattressai-input');
      const sendBtn = widget.querySelector('#mattressai-send');
      const closeBtn = widget.querySelector('.mattressai-widget__close');
      const messagesContainer = widget.querySelector('#mattressai-messages');
      const newChip = widget.querySelector('#mattressai-newchip');
      
      // Close button
      closeBtn.addEventListener('click', () => this.closeChat());
      
      // Quick replies
      const quickReplies = widget.querySelectorAll('.mattressai-quick-reply');
      quickReplies.forEach(btn => {
        btn.addEventListener('click', () => {
          const message = btn.getAttribute('data-message');
          if (message) {
            input.value = message;
            this.sendMessage(message);
            // Hide quick replies after first use
            const container = document.getElementById('mattressai-quick-replies');
            if (container) container.style.display = 'none';
          }
        });
      });
      
      // Send message function
      const sendMessage = () => {
        const message = input.value.trim();
        if (message) {
          this.sendMessage(message);
        }
      };
      
      // Send button
      sendBtn.addEventListener('click', sendMessage);
      
      // Input handling
      input.addEventListener('input', () => {
        // Auto-resize
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        
        // Enable/disable send button
        sendBtn.disabled = !input.value.trim();
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Autoscroll guard
      messagesContainer.addEventListener('scroll', () => {
        const nearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 40;
        this.stickToBottom = nearBottom;
        if (newChip) {
          newChip.style.display = nearBottom ? 'none' : 'inline-flex';
        }
      });
      
      // New messages chip
      if (newChip) {
        newChip.addEventListener('click', () => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          newChip.style.display = 'none';
        });
      }
      
      // Focus trap
      this.setupFocusTrap(widget);
      
      // Keyboard shortcuts
      widget.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeChat();
        }
      });
    },
    
    setupFocusTrap: function(widget) {
      const focusableElements = () => widget.querySelectorAll(
        'button:not([disabled]), [href], textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      
      widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        
        const nodes = Array.from(focusableElements());
        if (!nodes.length) return;
        
        const firstNode = nodes[0];
        const lastNode = nodes[nodes.length - 1];
        
        if (e.shiftKey && document.activeElement === firstNode) {
          e.preventDefault();
          lastNode.focus();
        } else if (!e.shiftKey && document.activeElement === lastNode) {
          e.preventDefault();
          firstNode.focus();
        }
      });
    },
    
    sendMessage: async function(message) {
      if (!message) return;
      
      const input = document.querySelector('#mattressai-input');
      const sendBtn = document.querySelector('#mattressai-send');
      
      // Clear input and disable send
      input.value = '';
      input.style.height = 'auto';
      if (sendBtn) sendBtn.disabled = true;
      
      // Add user message to UI
      this.addMessage('user', message);
      
      // Show typing indicator
      this.setTyping(true);
      
      // Add loading indicator
      const loadingId = this.addLoadingMessage();
      
      try {
        // Send to chat API through app proxy
        const response = await fetch('/apps/mattressai/chat', {
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
        this.setTyping(false);
        this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.', 'failed');
      }
    },
    
    handleStreamResponse: async function(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessage = '';
      let currentMessageElement = null;
      
      try {
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
                    currentMessageElement = this.addMessage('assistant', data.chunk, 'sent', true);
                    currentMessage = data.chunk;
                  } else {
                    currentMessage += data.chunk;
                    const contentEl = currentMessageElement.querySelector('.mattressai-message__content');
                    if (contentEl) contentEl.textContent = currentMessage;
                    this.scrollToBottom();
                  }
                } else if (data.type === 'product_results') {
                  // Display product recommendations
                  this.displayProducts(data.products);
                } else if (data.type === 'end_turn') {
                  this.setTyping(false);
                  currentMessage = '';
                  currentMessageElement = null;
                  
                  // Bump unread if not open
                  if (!this.isOpen) {
                    this.bumpUnread();
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        this.setTyping(false);
      }
    },
    
    addMessage: function(role, content, deliveryState = 'sent', isStreaming = false) {
      const messagesContainer = document.querySelector('#mattressai-messages');
      
      // Ensure day divider
      this.ensureDayDivider();
      
      const messageDiv = document.createElement('div');
      messageDiv.className = \`mattressai-message mattressai-message--\${role}\`;
      messageDiv.setAttribute('data-delivery', deliveryState);
      
      const timestamp = this.formatTime();
      
      if (role === 'assistant') {
        messageDiv.innerHTML = \`
          <div class="mattressai-message__avatar">\${this.getAvatarHTML()}</div>
          <div class="mattressai-message__wrapper">
            <div class="mattressai-message__content">\${content}</div>
            <div class="mattressai-message__meta">\${timestamp}</div>
          </div>
        \`;
      } else {
        messageDiv.innerHTML = \`
          <div class="mattressai-message__wrapper">
            <div class="mattressai-message__content">\${content}</div>
            <div class="mattressai-message__meta">
              \${timestamp}
              <span class="mattressai-message__status">
                \${deliveryState === 'sending' ? '⏱' : deliveryState === 'sent' ? '✓' : deliveryState === 'failed' ? '✗' : ''}
              </span>
            </div>
          </div>
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
        <div class="mattressai-message__avatar">\${this.getAvatarHTML()}</div>
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
      if (messagesContainer && this.stickToBottom) {
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
    /* CSS Variables / Theming */
    :root {
      --mattress-primary: #0F172A;
      --mattress-bg: #ffffff;
      --mattress-surface: #f9fafb;
      --mattress-text: #111827;
      --mattress-text-light: #6b7280;
      --mattress-border: #e5e7eb;
      --mattress-radius: 12px;
      --mattress-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --mattress-bg: #1f2937;
        --mattress-surface: #111827;
        --mattress-text: #f9fafb;
        --mattress-text-light: #9ca3af;
        --mattress-border: #374151;
        --mattress-shadow: 0 5px 40px rgba(0, 0, 0, 0.4);
      }
    }
    
    /* Chat Bubble */
    .mattressai-chat-bubble {
      position: fixed;
      bottom: var(--mattress-position-bottom, 20px);
      height: var(--mattress-bubble-size, 64px);
      border-radius: calc(var(--mattress-bubble-size, 64px) / 2);
      background: var(--mattress-primary, #0F172A);
      color: white;
      border: none;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      padding: 0;
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }
    
    /* Position left */
    .mattressai-position-left .mattressai-chat-bubble {
      left: var(--mattress-position-side, 20px);
      right: auto;
    }
    
    /* Position right */
    .mattressai-position-right .mattressai-chat-bubble {
      right: var(--mattress-position-side, 20px);
      left: auto;
    }
    
    /* Bubble style variations */
    .mattressai-chat-bubble.mattressai-bubble-icon {
      width: var(--mattress-bubble-size, 64px);
      min-width: var(--mattress-bubble-size, 64px);
      border-radius: 50% !important;
    }
    
    .mattressai-chat-bubble.mattressai-bubble-text {
      padding: 0 14px;
      min-width: auto;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .mattressai-chat-bubble {
        animation: none;
      }
    }
    
    .mattressai-chat-bubble:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    
    /* Icon sizing */
    .mattressai-bubble-icon {
      width: calc(var(--mattress-bubble-size, 64px) * 0.42);
      height: calc(var(--mattress-bubble-size, 64px) * 0.42);
      flex-shrink: 0;
    }
    
    /* Text sizing - responsive to bubble height */
    .mattressai-bubble-text {
      font-size: clamp(14px, calc(var(--mattress-bubble-size, 64px) * 0.24), 18px);
      line-height: 1.2;
    }
    
    /* Unread Badge */
    .mattressai-chat-bubble[data-badge]::after {
      content: attr(data-badge);
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #ef4444;
      color: #fff;
      border-radius: 999px;
      font-size: 11px;
      line-height: 18px;
      text-align: center;
      box-shadow: 0 0 0 2px var(--mattress-bg, #fff);
      font-weight: 600;
    }
    
    /* Chat Widget */
    .mattressai-widget {
      position: fixed;
      bottom: var(--mattress-position-bottom, 20px);
      width: 360px;
      max-width: calc(100vw - 40px);
      height: 550px;
      max-height: calc(100vh - 100px);
      background: var(--mattress-bg, white);
      border-radius: var(--mattress-radius, 12px);
      box-shadow: var(--mattress-shadow, 0 5px 40px rgba(0, 0, 0, 0.16));
      display: flex;
      flex-direction: column;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transform: translateY(calc(100% + 40px));
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    
    /* Position left */
    .mattressai-position-left .mattressai-widget {
      left: var(--mattress-position-side, 20px);
      right: auto;
    }
    
    /* Position right */
    .mattressai-position-right .mattressai-widget {
      right: var(--mattress-position-side, 20px);
      left: auto;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .mattressai-widget {
        transition: none;
      }
    }
    
    .mattressai-widget--open {
      transform: translateY(0);
      opacity: 1;
    }
    
    /* Widget Header */
    .mattressai-widget__header {
      padding: 16px 20px;
      background: var(--mattress-primary, #2c5f2d);
      color: white;
      border-radius: var(--mattress-radius, 12px) var(--mattress-radius, 12px) 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .mattressai-widget__header-content {
      flex: 1;
      min-width: 0;
    }
    
    .mattressai-widget__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .mattressai-widget__subtitle {
      margin: 2px 0 0;
      font-size: 12px;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Typing Indicator */
    .mattressai-typing {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .mattressai-typing span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      animation: typingBounce 1.2s infinite;
    }
    
    .mattressai-typing span:nth-child(2) {
      animation-delay: 0.15s;
    }
    
    .mattressai-typing span:nth-child(3) {
      animation-delay: 0.3s;
    }
    
    @keyframes typingBounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }
    
    /* New Messages Chip */
    .mattressai-newchip {
      margin-left: auto;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }
    
    .mattressai-newchip:hover {
      background: rgba(255, 255, 255, 0.2);
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
      flex-shrink: 0;
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
      padding: 16px;
      background: var(--mattress-surface, #f9fafb);
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    
    .mattressai-widget__messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .mattressai-widget__messages::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .mattressai-widget__messages::-webkit-scrollbar-thumb {
      background: var(--mattress-border, #d1d5db);
      border-radius: 3px;
    }
    
    /* Day Divider */
    .mattressai-daydivider {
      align-self: center;
      font-size: 12px;
      color: var(--mattress-text-light, #6b7280);
      margin: 8px 0;
      padding: 4px 12px;
      background: var(--mattress-bg, white);
      border-radius: 12px;
      font-weight: 500;
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
      background: var(--mattress-avatar-bg, var(--mattress-primary, #0F172A));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      overflow: hidden;
    }
    
    .mattressai-message__avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .mattressai-message__avatar-text {
      text-transform: uppercase;
    }
    
    .mattressai-message__wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 240px;
    }
    
    .mattressai-message__content {
      background: var(--mattress-bg, white);
      padding: 10px 14px;
      border-radius: 12px;
      word-wrap: break-word;
      word-break: normal;
      overflow-wrap: break-word;
      hyphens: none;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      line-height: 1.6;
      font-size: 15px;
      color: var(--mattress-text, #374151);
      white-space: normal;
      font-weight: 400;
      letter-spacing: 0.01em;
    }
    
    .mattressai-message--user .mattressai-message__content {
      background: var(--mattress-primary, #2c5f2d);
      color: white;
      word-break: normal;
    }
    
    .mattressai-message__meta {
      font-size: 11px;
      color: var(--mattress-text-light, #9ca3af);
      padding: 0 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .mattressai-message--user .mattressai-message__meta {
      align-self: flex-end;
    }
    
    .mattressai-message__status {
      font-size: 10px;
      opacity: 0.8;
    }
    
    /* Quick Replies */
    .mattressai-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .mattressai-quick-reply {
      padding: 8px 14px;
      background: var(--mattress-bg, white);
      border: 1px solid var(--mattress-border, #e5e7eb);
      border-radius: 999px;
      font-size: 13px;
      color: var(--mattress-text, #374151);
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }
    
    .mattressai-quick-reply:hover {
      background: var(--mattress-primary, #0F172A);
      color: white;
      border-color: var(--mattress-primary, #0F172A);
      transform: translateY(-1px);
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
      background: #1e293b;
    }
    
    /* Input Container */
    .mattressai-widget__input-container {
      padding: 16px;
      background: var(--mattress-bg, white);
      border-top: 1px solid var(--mattress-border, #e5e7eb);
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    
    .mattressai-widget__input {
      flex: 1;
      border: 1px solid var(--mattress-border, #d1d5db);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      max-height: 120px;
      min-height: 42px;
      outline: none;
      transition: border-color 0.2s ease;
      background: var(--mattress-surface, #f9fafb);
      color: var(--mattress-text, #374151);
    }
    
    .mattressai-widget__input::placeholder {
      color: var(--mattress-text-light, #9ca3af);
    }
    
    .mattressai-widget__input:focus {
      border-color: var(--mattress-primary, #2c5f2d);
      background: var(--mattress-bg, white);
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
      transition: all 0.2s ease;
    }
    
    .mattressai-widget__send-btn:hover:not(:disabled) {
      background: #1e293b;
      transform: scale(1.05);
    }
    
    .mattressai-widget__send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
        bottom: calc(16px + env(safe-area-inset-bottom));
      }
      
      .mattressai-position-left .mattressai-chat-bubble {
        left: 16px;
      }
      
      .mattressai-position-right .mattressai-chat-bubble {
        right: 16px;
      }
      
      .mattressai-bubble-icon {
        width: 22px;
        height: 22px;
      }
      
      .mattressai-widget {
        bottom: 0 !important;
        right: 0 !important;
        left: 0 !important;
        top: 0;
        width: 100%;
        max-width: 100%;
        height: 100dvh;
        max-height: 100dvh;
        border-radius: 0;
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      .mattressai-widget__header {
        border-radius: 0;
        padding: calc(14px + env(safe-area-inset-top)) 16px 14px;
      }
      
      .mattressai-widget__messages {
        padding: 12px;
      }
      
      .mattressai-widget__input-container {
        padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
      }
      
      .mattressai-message__wrapper {
        max-width: 80%;
      }
      
      .mattressai-message__content {
        word-break: normal;
        overflow-wrap: break-word;
      }
      
      .mattressai-quick-reply {
        font-size: 12px;
        padding: 6px 12px;
      }
    }
  \`;
  document.head.appendChild(style);
})();
  `;

  return new Response(widgetScript, { headers });
};
