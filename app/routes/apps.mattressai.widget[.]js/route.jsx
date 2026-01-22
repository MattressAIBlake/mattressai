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
    conversationId: null,
    variantId: null,
    compareList: [],
    savedRecommendations: [],
    pendingLeadForm: null,
    pendingProducts: null,
    unreadCount: 0,
    isOpen: false,
    stickToBottom: true,
    lastDayLabel: null,
    hasSeenFirstMessage: false,
    
    init: function() {
      if (this.initialized) return;
      
      const root = document.getElementById('mattressai-root');
      if (!root) {
        console.warn('MattressAI: Root element not found');
        return;
      }
      
      // Clear chat-specific storage items for a fresh conversation on each page load
      sessionStorage.removeItem('mattressai_lead_form_shown');
      sessionStorage.removeItem('mattressai_widget_open');
      sessionStorage.removeItem('mattressai_unread');
      
      // Extract configuration from data attributes
      this.config = {
        tenant: root.dataset.tenant,
        autoOpen: root.dataset.autoOpen === 'true',
        primaryColor: root.dataset.primaryColor || '#3B82F6',
        widgetTitle: root.dataset.widgetTitle || 'Chat with us',
        widgetSubtitle: root.dataset.widgetSubtitle || 'We\\'re here to help',
        welcomeMessage: root.dataset.welcomeMessage || 'Hi! How can we help you today?',
        avatarStyle: root.dataset.avatarStyle || 'text',
        avatarText: root.dataset.avatarText || 'AI',
        avatarImage: root.dataset.avatarImage || '',
        avatarBackground: root.dataset.avatarBackground || '#3B82F6',
        headerTextColor: root.dataset.headerTextColor || '#FFFFFF',
        bubbleStyle: root.dataset.bubbleStyle || 'text',
        bubbleText: root.dataset.bubbleText || 'Mattress Match',
        bubbleSize: parseInt(root.dataset.bubbleSize || '64', 10),
        positionHorizontal: root.dataset.positionHorizontal || 'right',
        positionBottom: parseInt(root.dataset.positionBottom || '20', 10),
        positionSide: parseInt(root.dataset.positionSide || '20', 10)
      };
      
      // Set CSS custom properties
      document.documentElement.style.setProperty('--mattress-primary', this.config.primaryColor);
      document.documentElement.style.setProperty('--mattress-avatar-bg', this.config.avatarBackground);
      document.documentElement.style.setProperty('--mattress-header-text', this.config.headerTextColor);
      document.documentElement.style.setProperty('--mattress-bubble-size', this.config.bubbleSize + 'px');
      document.documentElement.style.setProperty('--mattress-position-bottom', this.config.positionBottom + 'px');
      document.documentElement.style.setProperty('--mattress-position-side', this.config.positionSide + 'px');
      
      // Set position classes
      document.body.classList.add('mattressai-position-' + this.config.positionHorizontal);
      
      // Handle iOS keyboard - set viewport height CSS variable
      this.setupViewportHandler();
      
      // Restore widget state
      this.restoreState();
      
      // Initialize session
      this.startSession();
      
      // Load saved recommendations from localStorage
      this.loadSavedRecommendations();
      
      // Initialize tracking module
      if (window.MattressAITracking) {
        window.MattressAITracking.init(this.config.tenant, '/apps/mattressai');
        console.log('MattressAI Tracking initialized');
      } else {
        console.warn('MattressAI Tracking module not found');
      }
      
      // Create chat bubble
      this.createChatBubble();
      
      // Create saved recommendations panel (only once on init)
      this.createSavedPanel();
      
      this.initialized = true;
      console.log('MattressAI Widget initialized', this.config);
      
      // Update saved badge count
      this.updateSavedBadge();
    },
    
    restoreState: function() {
      const wasOpen = sessionStorage.getItem('mattressai_widget_open') === 'true';
      const unread = parseInt(sessionStorage.getItem('mattressai_unread') || '0', 10);
      this.unreadCount = unread;
      this.isOpen = wasOpen;
    },
    
    updateViewportHeight: function() {
      // Handle iOS keyboard by tracking visual viewport height
      // Sets height directly on widget element for reliable mobile behavior
      const vh = window.visualViewport 
        ? window.visualViewport.height 
        : window.innerHeight;
      const widget = document.getElementById('mattressai-chat-widget');
      
      // Only apply on mobile (under 768px)
      if (window.innerWidth <= 768 && widget) {
        // Use setProperty with 'important' to override CSS !important
        widget.style.setProperty('height', vh + 'px', 'important');
        widget.style.setProperty('max-height', vh + 'px', 'important');
      }
    },
    
    setupViewportHandler: function() {
      const self = this;
      
      const handleViewportScroll = () => {
        // Handle iOS scroll offset when keyboard opens
        const widget = document.getElementById('mattressai-chat-widget');
        if (window.innerWidth <= 768 && widget && window.visualViewport) {
          if (window.visualViewport.offsetTop > 0) {
            widget.style.setProperty('top', window.visualViewport.offsetTop + 'px', 'important');
          } else {
            widget.style.setProperty('top', '0', 'important');
          }
          // Also update height when scrolling (keyboard interaction)
          self.updateViewportHeight();
        }
      };
      
      // Listen for viewport changes (keyboard open/close)
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => self.updateViewportHeight());
        window.visualViewport.addEventListener('scroll', handleViewportScroll);
      }
      
      // Fallback for browsers without visualViewport
      window.addEventListener('resize', () => self.updateViewportHeight());
      window.addEventListener('orientationchange', () => self.updateViewportHeight());
    },
    
    saveState: function() {
      sessionStorage.setItem('mattressai_widget_open', String(this.isOpen));
      sessionStorage.setItem('mattressai_unread', String(this.unreadCount));
    },
    
    loadSavedRecommendations: function() {
      try {
        const saved = localStorage.getItem('mattressai_saved_recommendations');
        this.savedRecommendations = saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Failed to load saved recommendations:', e);
        this.savedRecommendations = [];
      }
    },
    
    saveSavedRecommendations: function() {
      try {
        localStorage.setItem('mattressai_saved_recommendations', JSON.stringify(this.savedRecommendations));
      } catch (e) {
        console.error('Failed to save recommendations:', e);
      }
    },
    
    addToSaved: function(product) {
      const exists = this.savedRecommendations.find(p => p.id === product.id);
      if (!exists) {
        this.savedRecommendations.push(product);
        this.saveSavedRecommendations();
        return true;
      }
      return false;
    },
    
    removeFromSaved: function(productId) {
      this.savedRecommendations = this.savedRecommendations.filter(p => p.id !== productId);
      this.saveSavedRecommendations();
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
          
          // Sync with tracking module
          if (window.MattressAITracking) {
            window.MattressAITracking.setSessionId(data.sessionId);
          }
          
          console.log('Session started:', data);
        }
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    },
    
    getConversationId: function() {
      // Generate a fresh conversation ID on each page load
      // Store in a property instead of sessionStorage so it resets on page reload
      if (!this.conversationId) {
        this.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      return this.conversationId;
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
      
      // Add body class to lock scroll and hide bubble on mobile
      document.body.classList.add('mattressai-chat-open');
      
      // Track event
      this.trackEvent('opened');
      
      // Create chat widget
      this.createChatWidget();
    },
    
    closeChat: function() {
      this.isOpen = false;
      this.saveState();
      
      // Remove body class to unlock scroll and show bubble
      document.body.classList.remove('mattressai-chat-open');
      
      const widget = document.getElementById('mattressai-chat-widget');
      if (widget) {
        widget.classList.remove('mattressai-widget--open');
      }
    },
    
    createChatWidget: function() {
      // Check if widget already exists
      if (document.getElementById('mattressai-chat-widget')) {
        document.getElementById('mattressai-chat-widget').classList.add('mattressai-widget--open');
        // Apply viewport height for mobile
        requestAnimationFrame(() => {
          this.updateViewportHeight();
        });
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
          <button class="mattressai-widget__saved-btn" id="mattressai-saved-btn" aria-label="My Recommendations" title="My Recommendations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="mattressai-saved-badge" id="mattressai-saved-badge" style="display: none;">0</span>
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
            <button class="mattressai-quick-reply" data-message="I'm looking for a soft mattress">Soft</button>
            <button class="mattressai-quick-reply" data-message="I'm looking for a medium mattress">Medium</button>
            <button class="mattressai-quick-reply" data-message="I'm looking for a firm mattress">Firm</button>
            <button class="mattressai-quick-reply" data-message="Help me get started">Help me get started</button>
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
      
      // CRITICAL: Apply viewport height immediately for mobile
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.updateViewportHeight();
      });
      
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
      
      // Saved recommendations button
      const savedBtn = document.getElementById('mattressai-saved-btn');
      if (savedBtn) {
        savedBtn.addEventListener('click', () => this.toggleSavedPanel());
      }
      
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
      
      // Handle keyboard open/close on mobile
      input.addEventListener('focus', () => {
        // Small delay to let keyboard animation start
        setTimeout(() => {
          this.updateViewportHeight();
          this.scrollToBottom();
        }, 100);
      });
      
      input.addEventListener('blur', () => {
        // Reset viewport height when keyboard closes
        setTimeout(() => {
          this.updateViewportHeight();
        }, 100);
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
      
      // Re-focus input to keep keyboard open on mobile
      if (input) {
        input.focus();
      }
      
      // Add user message to UI
      this.addMessage('user', message);
      
      // Track first message event
      if (!this.hasSeenFirstMessage) {
        this.hasSeenFirstMessage = true;
        document.dispatchEvent(new CustomEvent('mattressai:first_message'));
        // Also track data_point_captured for every user message after first
        document.dispatchEvent(new CustomEvent('mattressai:data_point_captured', {
          detail: { questionType: 'user_message' }
        }));
      } else {
        // Track data_point_captured for subsequent messages
        document.dispatchEvent(new CustomEvent('mattressai:data_point_captured', {
          detail: { questionType: 'user_message' }
        }));
      }
      
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
                  console.log('[Widget] Received products, checking for pending lead form');
                  
                  // If we have a pending lead form (end position), show it BEFORE products
                  if (this.pendingLeadForm) {
                    console.log('[Widget] Showing pending lead form before products');
                    this.displayLeadForm(
                      this.pendingLeadForm.prefill,
                      this.pendingLeadForm.fields,
                      this.pendingLeadForm.position,
                      false // Don't defer again
                    );
                    this.pendingLeadForm = null;
                    
                    // Store products to display after form submission
                    this.pendingProducts = data.products;
                  } else {
                    // No lead form pending, display products immediately
                    this.displayProducts(data.products);
                  }
                } else if (data.type === 'show_lead_form') {
                  // Display lead capture form
                  this.displayLeadForm(
                    data.prefill, 
                    data.fields, 
                    data.position || 'end',
                    data.hasProducts || false
                  );
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
      
      if (role === 'assistant') {
        messageDiv.innerHTML = \`
          <div class="mattressai-message__avatar">\${this.getAvatarHTML()}</div>
          <div class="mattressai-message__wrapper">
            <div class="mattressai-message__content">\${content}</div>
          </div>
        \`;
      } else {
        messageDiv.innerHTML = \`
          <div class="mattressai-message__wrapper">
            <div class="mattressai-message__content">
              <span class="mattressai-message__text">\${content}</span>
              <span class="mattressai-message__status">\${deliveryState === 'sending' ? '⏱' : deliveryState === 'sent' ? '✓' : deliveryState === 'failed' ? '✗' : ''}</span>
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
      if (messagesContainer) {
        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    },
    
    displayProducts: function(products) {
      if (!products || products.length === 0) return;
      
      const messagesContainer = document.querySelector('#mattressai-messages');
      const productsDiv = document.createElement('div');
      productsDiv.className = 'mattressai-products';
      productsDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 16px 0;';
      
      products.forEach((product, index) => {
        const productCard = this.createProductCard(product, index);
        productsDiv.appendChild(productCard);
      });
      
      messagesContainer.appendChild(productsDiv);
      this.scrollToBottom();
      
      // Track recommendation shown events
      products.forEach(product => {
        document.dispatchEvent(new CustomEvent('mattressai:recommendation_shown', {
          detail: { 
            products: [{
              id: product.id,
              title: product.title,
              price: product.price
            }]
          }
        }));
      });
    },
    
    createSavedPanel: function() {
      // Check if panel already exists to prevent duplicates
      if (document.getElementById('mattressai-saved-panel')) {
        return;
      }
      
      const panel = document.createElement('div');
      panel.id = 'mattressai-saved-panel';
      panel.className = 'mattressai-saved-panel';
      panel.style.display = 'none';
      
      panel.innerHTML = \`
        <div class="mattressai-saved-panel__header">
          <h3>My Saved Recommendations</h3>
          <button class="mattressai-saved-panel__close" aria-label="Close panel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4L4 12M4 4l8 8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="mattressai-saved-panel__content" id="mattressai-saved-panel-content">
          <p class="mattressai-saved-panel__empty">No saved recommendations yet. Click "Save for Later" on any recommendation to save it here!</p>
        </div>
      \`;
      
      document.body.appendChild(panel);
      
      // Setup event listeners
      const closeBtn = panel.querySelector('.mattressai-saved-panel__close');
      closeBtn.addEventListener('click', () => this.toggleSavedPanel(false));
      
      // Initial render
      this.renderSavedPanel();
    },
    
    toggleSavedPanel: function(show) {
      const panel = document.getElementById('mattressai-saved-panel');
      if (!panel) return;
      
      if (show === undefined) {
        show = panel.style.display === 'none';
      }
      
      panel.style.display = show ? 'flex' : 'none';
      if (show) {
        this.renderSavedPanel();
      }
    },
    
    renderSavedPanel: function() {
      const content = document.getElementById('mattressai-saved-panel-content');
      if (!content) return;
      
      if (this.savedRecommendations.length === 0) {
        content.innerHTML = '<p class="mattressai-saved-panel__empty">No saved recommendations yet. Click "Save for Later" on any recommendation to save it here!</p>';
        return;
      }
      
      content.innerHTML = '';
      
      this.savedRecommendations.forEach((product) => {
        const card = this.createSavedProductCard(product);
        content.appendChild(card);
      });
    },
    
    createSavedProductCard: function(product) {
      const card = document.createElement('div');
      card.className = 'mattressai-saved-card';
      
      // Build card HTML
      const imageHtml = product.imageUrl 
        ? \`<img src="\${product.imageUrl}" alt="\${product.title}" loading="lazy">\`
        : '<div class="mattressai-saved-card__placeholder">No image</div>';
      
      const fitScoreHtml = product.fitScore 
        ? \`<div class="mattressai-saved-card__badge">\${Math.round(product.fitScore)}% match</div>\`
        : '';
      
      card.innerHTML = \`
        <div class="mattressai-saved-card__image">
          \${imageHtml}
          \${fitScoreHtml}
        </div>
        <div class="mattressai-saved-card__content">
          <h4 class="mattressai-saved-card__title">\${product.title}</h4>
          \${product.vendor ? \`<p class="mattressai-saved-card__vendor">\${product.vendor}</p>\` : ''}
          <div class="mattressai-saved-card__actions">
            <a href="\${product.url || '#'}" class="mattressai-saved-card__btn mattressai-saved-card__btn--primary" target="_blank" rel="noopener noreferrer">
              View Product
            </a>
            <button class="mattressai-saved-card__btn mattressai-saved-card__btn--remove" data-product-id="\${product.id}">
              Remove
            </button>
          </div>
        </div>
      \`;
      
      // Add remove button handler
      const removeBtn = card.querySelector('.mattressai-saved-card__btn--remove');
      removeBtn.addEventListener('click', () => {
        this.removeFromSaved(product.id);
        this.renderSavedPanel();
        this.updateSavedBadge();
      });
      
      return card;
    },
    
    updateSavedBadge: function() {
      const badge = document.getElementById('mattressai-saved-badge');
      if (!badge) return;
      
      const count = this.savedRecommendations.length;
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    },
    
    createProductCard: function(product, index) {
      const card = document.createElement('div');
      card.className = 'rec-card';
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', \`Product recommendation: \${product.title}\`);
      
      // Image with fit score badge
      const imageDiv = document.createElement('div');
      imageDiv.className = 'rec-card__image';
      
      if (product.imageUrl) {
        const img = document.createElement('img');
        img.src = product.imageUrl;
        img.alt = product.title;
        img.loading = 'lazy';
        imageDiv.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'rec-card__placeholder';
        placeholder.textContent = 'No image';
        imageDiv.appendChild(placeholder);
      }
      
      // Fit score badge
      if (product.fitScore) {
        const badge = document.createElement('div');
        badge.className = 'rec-card__badge';
        badge.innerHTML = \`
          <span class="rec-card__badge-score">\${Math.round(product.fitScore)}%</span>
          <span class="rec-card__badge-label">match</span>
        \`;
        imageDiv.appendChild(badge);
      }
      
      card.appendChild(imageDiv);
      
      // Content section
      const content = document.createElement('div');
      content.className = 'rec-card__content';
      
      // Vendor
      if (product.vendor) {
        const vendor = document.createElement('div');
        vendor.className = 'rec-card__vendor';
        vendor.textContent = product.vendor;
        content.appendChild(vendor);
      }
      
      // Title
      const title = document.createElement('h3');
      title.className = 'rec-card__title';
      title.textContent = product.title;
      content.appendChild(title);
      
      // Price - REMOVED: Not showing price to customers
      // if (product.price) {
      //   const price = document.createElement('div');
      //   price.className = 'rec-card__price';
      //   price.textContent = \`$\${product.price.toFixed(2)}\`;
      //   content.appendChild(price);
      // }
      
      // Firmness indicator
      if (product.firmness) {
        const firmnessDiv = document.createElement('div');
        firmnessDiv.className = 'rec-card__firmness';
        
        const firmnessLabel = document.createElement('span');
        firmnessLabel.className = 'rec-card__firmness-label';
        firmnessLabel.textContent = 'Firmness:';
        firmnessDiv.appendChild(firmnessLabel);
        
        const firmnessScale = document.createElement('div');
        firmnessScale.className = 'rec-card__firmness-scale';
        
        const firmnessValue = this.getFirmnessValue(product.firmness);
        for (let i = 0; i < 10; i++) {
          const dot = document.createElement('div');
          dot.className = \`rec-card__firmness-dot\${i < firmnessValue ? ' active' : ''}\`;
          firmnessScale.appendChild(dot);
        }
        
        const firmnessText = document.createElement('span');
        firmnessText.className = 'rec-card__firmness-value';
        firmnessText.textContent = product.firmness;
        firmnessScale.appendChild(firmnessText);
        
        firmnessDiv.appendChild(firmnessScale);
        content.appendChild(firmnessDiv);
      }
      
      // Why it fits section
      if (product.whyItFits && product.whyItFits.length > 0) {
        const whyDiv = document.createElement('div');
        whyDiv.className = 'rec-card__why-it-fits';
        
        const whyTitle = document.createElement('h4');
        whyTitle.className = 'rec-card__why-title';
        whyTitle.textContent = 'Why it fits:';
        whyDiv.appendChild(whyTitle);
        
        const whyList = document.createElement('ul');
        whyList.className = 'rec-card__why-list';
        
        product.whyItFits.forEach(reason => {
          const li = document.createElement('li');
          li.className = 'rec-card__why-item';
          li.innerHTML = \`
            <svg class="rec-card__check-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 11L3 8l1-1 2 2 5-5 1 1z" fill="currentColor" />
            </svg>
            \${reason}
          \`;
          whyList.appendChild(li);
        });
        
        whyDiv.appendChild(whyList);
        content.appendChild(whyDiv);
      }
      
      // Actions
      const actions = document.createElement('div');
      actions.className = 'rec-card__actions';
      
      // Save button
      const saveBtn = document.createElement('button');
      saveBtn.className = 'rec-card__btn rec-card__btn--save';
      saveBtn.setAttribute('aria-label', \`Save \${product.title}\`);
      saveBtn.innerHTML = \`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 6px;">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Save for Later
      \`;
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const added = this.addToSaved(product);
        if (added) {
          saveBtn.textContent = '✓ Saved';
          saveBtn.disabled = true;
          this.updateSavedBadge();
          this.renderSavedPanel();
        }
      });
      
      // Check if already saved
      const isSaved = this.savedRecommendations.find(p => p.id === product.id);
      if (isSaved) {
        saveBtn.textContent = '✓ Saved';
        saveBtn.disabled = true;
      }
      
      actions.appendChild(saveBtn);
      
      // View Product button
      const viewBtn = document.createElement('a');
      viewBtn.className = 'rec-card__btn rec-card__btn--primary';
      
      // Convert Shopify myshopify.com URLs to relative URLs that work on custom domains
      let productUrl = product.url || '#';
      if (productUrl !== '#' && productUrl.includes('/products/')) {
        // Extract just the /products/handle part from the full URL
        const match = productUrl.match(/\\/products\\/[^?#]+/);
        if (match) {
          productUrl = match[0]; // Use relative URL like /products/product-handle
        }
      }
      
      viewBtn.href = productUrl;
      viewBtn.target = '_blank';
      viewBtn.rel = 'noopener noreferrer';
      viewBtn.setAttribute('aria-label', \`View \${product.title}\`);
      viewBtn.textContent = 'View Product';
      
      // Track recommendation clicked event
      viewBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('mattressai:recommendation_clicked', {
          detail: { 
            product: {
              id: product.id,
              title: product.title,
              price: product.price
            }
          }
        }));
      });
      
      actions.appendChild(viewBtn);
      
      content.appendChild(actions);
      card.appendChild(content);
      
      return card;
    },
    
    getFirmnessValue: function(firmness) {
      const mapping = {
        'soft': 2,
        'medium-soft': 4,
        'medium': 5,
        'medium-firm': 7,
        'firm': 9
      };
      return mapping[firmness?.toLowerCase()] || 5;
    },
    
    displayLeadForm: function(prefill = {}, fields = ['email', 'name', 'phone', 'zip'], position = 'end', hasProducts = false) {
      // Check if form already shown
      const formShown = sessionStorage.getItem('mattressai_lead_form_shown');
      if (formShown === 'true') {
        return;
      }
      
      console.log('[Widget] Displaying lead form at position:', position, 'hasProducts:', hasProducts);
      
      // If products are coming, store form data to show before products
      if (hasProducts && position === 'end') {
        console.log('[Widget] Deferring lead form display until products arrive');
        this.pendingLeadForm = { prefill, fields, position };
        return; // Don't show yet, will show when products arrive
      }
      
      // Mark as shown
      sessionStorage.setItem('mattressai_lead_form_shown', 'true');
      
      const messagesContainer = document.querySelector('#mattressai-messages');
      const formDiv = document.createElement('div');
      formDiv.className = 'mattressai-lead-form';
      formDiv.id = 'mattressai-lead-form-container';
      formDiv.dataset.position = position; // Store for later use
      
      // Build form fields HTML
      let fieldsHTML = '';
      
      if (fields.includes('name')) {
        fieldsHTML += \`
          <div class="mattressai-lead-form__field">
            <label for="mattressai-lead-name" class="mattressai-lead-form__label">Name</label>
            <input 
              type="text" 
              id="mattressai-lead-name" 
              name="name" 
              class="mattressai-lead-form__input"
              placeholder="Your name"
              value="\${prefill.name || ''}"
              required
            />
          </div>
        \`;
      }
      
      if (fields.includes('email')) {
        fieldsHTML += \`
          <div class="mattressai-lead-form__field">
            <label for="mattressai-lead-email" class="mattressai-lead-form__label">Email *</label>
            <input 
              type="email" 
              id="mattressai-lead-email" 
              name="email" 
              class="mattressai-lead-form__input"
              placeholder="your@email.com"
              value="\${prefill.email || ''}"
              required
            />
          </div>
        \`;
      }
      
      if (fields.includes('phone')) {
        fieldsHTML += \`
          <div class="mattressai-lead-form__field">
            <label for="mattressai-lead-phone" class="mattressai-lead-form__label">Phone</label>
            <input 
              type="tel" 
              id="mattressai-lead-phone" 
              name="phone" 
              class="mattressai-lead-form__input"
              placeholder="(123) 456-7890"
              value="\${prefill.phone || ''}"
            />
          </div>
        \`;
      }
      
      if (fields.includes('zip')) {
        fieldsHTML += \`
          <div class="mattressai-lead-form__field">
            <label for="mattressai-lead-zip" class="mattressai-lead-form__label">ZIP Code</label>
            <input 
              type="text" 
              id="mattressai-lead-zip" 
              name="zip" 
              class="mattressai-lead-form__input"
              placeholder="12345"
              value="\${prefill.zip || ''}"
              maxlength="5"
            />
          </div>
        \`;
      }
      
      formDiv.innerHTML = \`
        <div class="mattressai-lead-form__card">
          <h4 class="mattressai-lead-form__heading">Help us assist you better</h4>
          <p class="mattressai-lead-form__description">
            We'll use this information to follow up with personalized recommendations
          </p>
          
          <form id="mattressai-lead-form-element" class="mattressai-lead-form__form">
            \${fieldsHTML}
            
            <div class="mattressai-lead-form__consent">
              <label class="mattressai-lead-form__consent-label">
                <input 
                  type="checkbox" 
                  id="mattressai-lead-consent" 
                  name="consent" 
                  class="mattressai-lead-form__checkbox"
                  required
                />
                <span>I consent to being contacted about my mattress search</span>
              </label>
            </div>
            
            <div class="mattressai-lead-form__actions">
              <button 
                type="submit" 
                class="mattressai-lead-form__submit"
                disabled
              >
                Submit
              </button>
              <button 
                type="button" 
                class="mattressai-lead-form__skip"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      \`;
      
      messagesContainer.appendChild(formDiv);
      this.scrollToBottom();
      
      // Setup form listeners
      const form = formDiv.querySelector('#mattressai-lead-form-element');
      const submitBtn = formDiv.querySelector('.mattressai-lead-form__submit');
      const skipBtn = formDiv.querySelector('.mattressai-lead-form__skip');
      const consentCheckbox = formDiv.querySelector('#mattressai-lead-consent');
      
      // Enable submit only when consent is checked
      consentCheckbox.addEventListener('change', () => {
        submitBtn.disabled = !consentCheckbox.checked;
      });
      
      // Handle form submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        await this.submitLead({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          zip: formData.get('zip'),
          consent: true
        });
      });
      
      // Handle skip
      skipBtn.addEventListener('click', () => {
        formDiv.remove();
        this.addMessage('assistant', 'No problem! Feel free to reach out anytime.');
      });
    },
    
    submitLead: async function(data) {
      const form = document.querySelector('#mattressai-lead-form-element');
      const submitBtn = form?.querySelector('.mattressai-lead-form__submit');
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }
      
      try {
        const response = await fetch('/apps/mattressai/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: this.config.tenant,
            sessionId: this.sessionId,
            conversationId: this.getConversationId(),
            email: data.email,
            phone: data.phone,
            name: data.name,
            zip: data.zip,
            consent: data.consent
          })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          // Remove form
          const formContainer = document.querySelector('#mattressai-lead-form-container');
          const formPosition = formContainer?.dataset?.position || 'end';
          if (formContainer) formContainer.remove();
          
          // Track event
          this.trackEvent('lead_captured', { leadId: result.leadId });
          
          // Continue conversation based on position
          if (formPosition === 'start') {
            // For START: Send a trigger message to get AI to start asking questions
            console.log('[Widget] Lead captured at START, triggering AI questions');
            this.addMessage('assistant', 'Thank you! Let me help you find the perfect mattress.');
            // Send automated message to trigger AI response
            setTimeout(() => {
              this.sendMessage("I'm ready to answer your questions");
            }, 500);
          } else if (formPosition === 'end') {
            // For END: Products were already sent, display them now
            console.log('[Widget] Lead captured at END, displaying pending products');
            this.addMessage('assistant', 'Thank you! Here are my recommendations for you:');
            // Display pending products if available
            if (this.pendingProducts) {
              this.displayProducts(this.pendingProducts);
              this.pendingProducts = null;
            }
          }
        } else {
          throw new Error(result.error || 'Failed to submit');
        }
      } catch (error) {
        console.error('Failed to submit lead:', error);
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
        
        this.addMessage('assistant', 'Sorry, there was an error submitting your information. Please try again.');
      }
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
      this.trackEvent('comparison_added', { productId: product.id });
    },
    
    removeFromCompare: function(productId) {
      this.compareList = this.compareList.filter(p => p.id !== productId);
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
      --mattress-primary: #3B82F6;
      --mattress-primary-hover: #2563EB;
      --mattress-bg: #ffffff;
      --mattress-surface: #f9fafb;
      --mattress-text: #111827;
      --mattress-text-light: #64748b;
      --mattress-border: #e5e7eb;
      --mattress-radius: 12px;
      --mattress-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
    }
    
    /* Chat Bubble */
    .mattressai-chat-bubble {
      position: fixed;
      bottom: var(--mattress-position-bottom, 20px);
      height: var(--mattress-bubble-size, 64px);
      background: var(--mattress-primary, #3B82F6);
      color: white;
      border: none;
      box-shadow: 
        0 4px 14px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 9999;
      animation: slideUp 0.3s ease;
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
      height: var(--mattress-bubble-size, 64px);
      border-radius: 50% !important;
      padding: 0;
    }
    
    .mattressai-chat-bubble.mattressai-bubble-text {
      width: auto;
      min-width: 100px;
      padding: 0 14px;
      border-radius: calc(var(--mattress-bubble-size, 64px) / 2);
    }
    
    @media (prefers-reduced-motion: reduce) {
      .mattressai-chat-bubble {
        animation: none;
      }
    }
    
    .mattressai-chat-bubble:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 
        0 6px 20px rgba(0, 0, 0, 0.15),
        0 4px 10px rgba(0, 0, 0, 0.1);
    }
    
    /* Icon SVG sizing */
    .mattressai-icon-svg {
      width: calc(var(--mattress-bubble-size, 64px) * 0.42);
      height: calc(var(--mattress-bubble-size, 64px) * 0.42);
      flex-shrink: 0;
    }
    
    /* Text span sizing - responsive to bubble height */
    .mattressai-bubble-text-span {
      font-size: clamp(14px, calc(var(--mattress-bubble-size, 64px) * 0.24), 18px);
      font-weight: 600;
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
      background: rgba(255, 255, 255, 0.90);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: var(--mattress-radius, 12px);
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.08),
        0 0 1px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
      touch-action: manipulation;
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
      background: var(--mattress-primary, #3B82F6);
      color: var(--mattress-header-text, white);
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
      color: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .mattressai-widget__subtitle {
      margin: 2px 0 0;
      font-size: 12px;
      color: inherit;
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
      animation: messageSlideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .mattressai-message--user {
      flex-direction: row-reverse;
      align-self: flex-end;
    }
    
    .mattressai-message__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--mattress-avatar-bg, var(--mattress-primary, #3B82F6));
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
      max-width: 75%;
      min-width: 60px;
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
      background: var(--mattress-primary, #3B82F6);
      color: white;
      word-break: normal;
      display: inline-flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 6px;
    }
    
    .mattressai-message__text {
      flex: 0 1 auto;
    }
    
    .mattressai-message__status {
      font-size: 10px;
      opacity: 0.7;
      flex-shrink: 0;
      margin-left: auto;
      align-self: flex-end;
      line-height: 1;
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
      background: var(--mattress-primary, #3B82F6);
      color: white;
      border-color: var(--mattress-primary, #3B82F6);
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: flex;
      gap: 12px;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .mattressai-product-card:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 20px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
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
      color: var(--mattress-primary, #3B82F6);
      font-weight: 600;
    }
    
    .mattressai-product-card__button {
      display: inline-block;
      padding: 6px 12px;
      background: var(--mattress-primary, #3B82F6);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .mattressai-product-card__button:hover {
      background: var(--mattress-primary-hover, #2563EB);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
    
    /* Recommendation Cards */
    .rec-card {
      background: var(--mattress-bg, white);
      border: 1px solid var(--mattress-border, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      height: 100%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .rec-card:hover {
      transform: translateY(-6px);
      box-shadow: 
        0 12px 32px rgba(0, 0, 0, 0.08),
        0 2px 8px rgba(0, 0, 0, 0.06),
        0 0 0 1px rgba(0, 0, 0, 0.04);
    }
    
    .rec-card__image {
      position: relative;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background: #f5f5f5;
    }
    
    .rec-card__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }
    
    .rec-card:hover .rec-card__image img {
      transform: scale(1.05);
    }
    
    .rec-card__placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
    }
    
    .rec-card__badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 
        0 2px 8px rgba(16, 185, 129, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }
    
    .rec-card__badge-score {
      font-size: 16px;
    }
    
    .rec-card__badge-label {
      font-size: 11px;
      opacity: 0.9;
    }
    
    .rec-card__content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    
    .rec-card__vendor {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .rec-card__title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    
    /* REMOVED: Price display hidden from customers */
    /* .rec-card__price {
      font-size: 28px;
      font-weight: 700;
      color: var(--mattress-primary, #3B82F6);
      letter-spacing: -0.02em;
    } */
    
    .rec-card__firmness {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 6px;
    }
    
    .rec-card__firmness-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }
    
    .rec-card__firmness-scale {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .rec-card__firmness-dot {
      width: 8px;
      height: 24px;
      background: #e0e0e0;
      border-radius: 2px;
      transition: background 0.2s ease;
    }
    
    .rec-card__firmness-dot.active {
      background: var(--mattress-primary, #3B82F6);
    }
    
    .rec-card__firmness-value {
      font-size: 13px;
      color: #1a1a1a;
      margin-left: 8px;
      text-transform: capitalize;
    }
    
    .rec-card__why-it-fits {
      margin-top: 4px;
    }
    
    .rec-card__why-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 8px 0;
    }
    
    .rec-card__why-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .rec-card__why-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #1a1a1a;
      line-height: 1.4;
    }
    
    .rec-card__check-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      fill: #97c47e;
      margin-top: 2px;
    }
    
    .rec-card__actions {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .rec-card__btn {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-align: center;
      text-decoration: none;
      display: block;
    }
    
    .rec-card__btn--primary {
      background: var(--mattress-primary, #3B82F6);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .rec-card__btn--primary:hover:not(:disabled) {
      background: var(--mattress-primary-hover, #2563EB);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    
    .rec-card__btn--primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .rec-card__btn--secondary {
      background: transparent;
      color: var(--mattress-primary, #3B82F6);
      border: 1px solid var(--mattress-primary, #3B82F6);
    }
    
    .rec-card__btn--secondary:hover {
      background: var(--mattress-primary, #3B82F6);
      color: white;
    }
    
    /* Lead Form */
    .mattressai-lead-form {
      margin: 16px 0;
      animation: slideUp 0.3s ease;
    }
    
    .mattressai-lead-form__card {
      background: var(--mattress-bg, white);
      border: 2px solid var(--mattress-primary, #3B82F6);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .mattressai-lead-form__heading {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--mattress-text, #111827);
    }
    
    .mattressai-lead-form__description {
      margin: 0 0 16px;
      font-size: 14px;
      color: var(--mattress-text-light, #6b7280);
      line-height: 1.5;
    }
    
    .mattressai-lead-form__form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    
    .mattressai-lead-form__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .mattressai-lead-form__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--mattress-text, #374151);
    }
    
    .mattressai-lead-form__input {
      padding: 10px 12px;
      border: 1px solid var(--mattress-border, #d1d5db);
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      background: var(--mattress-surface, #f9fafb);
      color: var(--mattress-text, #374151);
      transition: all 0.2s ease;
      outline: none;
    }
    
    .mattressai-lead-form__input:focus {
      border-color: var(--mattress-primary, #3B82F6);
      background: var(--mattress-bg, white);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .mattressai-lead-form__input::placeholder {
      color: var(--mattress-text-light, #9ca3af);
    }
    
    .mattressai-lead-form__consent {
      margin-top: 4px;
    }
    
    .mattressai-lead-form__consent-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      color: var(--mattress-text, #374151);
      line-height: 1.5;
      cursor: pointer;
    }
    
    .mattressai-lead-form__checkbox {
      margin-top: 2px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      flex-shrink: 0;
      accent-color: var(--mattress-primary, #3B82F6);
    }
    
    .mattressai-lead-form__actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }
    
    .mattressai-lead-form__submit {
      flex: 1;
      padding: 12px 20px;
      background: var(--mattress-primary, #3B82F6);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .mattressai-lead-form__submit:hover:not(:disabled) {
      background: var(--mattress-primary-hover, #2563EB);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .mattressai-lead-form__submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .mattressai-lead-form__skip {
      padding: 12px 20px;
      background: transparent;
      color: var(--mattress-text-light, #6b7280);
      border: 1px solid var(--mattress-border, #d1d5db);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .mattressai-lead-form__skip:hover {
      background: var(--mattress-surface, #f9fafb);
      border-color: var(--mattress-text-light, #9ca3af);
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
      font-size: 16px;
      -webkit-text-size-adjust: 100%;
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
      border-color: var(--mattress-primary, #3B82F6);
      background: var(--mattress-bg, white);
    }
    
    .mattressai-widget__send-btn {
      background: var(--mattress-primary, #3B82F6);
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
      background: var(--mattress-primary-hover, #2563EB);
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
      /* Hide chat bubble when widget is open */
      body.mattressai-chat-open .mattressai-chat-bubble {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      
      /* Lock body scroll when chat is open */
      body.mattressai-chat-open {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
      }
      
      .mattressai-chat-bubble {
        bottom: calc(var(--mattress-position-bottom, 16px) + env(safe-area-inset-bottom));
      }
      
      .mattressai-position-left .mattressai-chat-bubble {
        left: var(--mattress-position-side, 16px);
      }
      
      .mattressai-position-right .mattressai-chat-bubble {
        right: var(--mattress-position-side, 16px);
      }
      
      .mattressai-bubble-icon {
        width: 22px;
        height: 22px;
      }
      
      /* CRITICAL: Full mobile widget fix */
      .mattressai-widget {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        /* Solid background - no transparency on mobile */
        background: #ffffff !important;
        border-radius: 0 !important;
        border: none !important;
        /* Explicit flex layout */
        display: flex !important;
        flex-direction: column !important;
        z-index: 2147483647;
        overflow: hidden !important;
        /* Remove any transforms that might interfere */
        transform: none;
      }
      
      .mattressai-widget--open {
        transform: none !important;
        opacity: 1 !important;
      }
      
      .mattressai-widget__header {
        flex-shrink: 0 !important;
        flex-grow: 0 !important;
        order: 1;
        border-radius: 0;
        padding: calc(14px + env(safe-area-inset-top)) 16px 14px;
        background: var(--mattress-primary, #3B82F6) !important;
      }
      
      .mattressai-widget__messages {
        flex: 1 1 auto !important;
        order: 2;
        min-height: 0 !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
        padding: 12px;
        background: var(--mattress-surface, #f9fafb) !important;
      }
      
      .mattressai-widget__input-container {
        flex-shrink: 0 !important;
        flex-grow: 0 !important;
        order: 3;
        padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
        background: #ffffff !important;
        border-top: 1px solid var(--mattress-border, #e5e7eb);
      }
      
      .mattressai-message__wrapper {
        max-width: 80%;
        min-width: 50px;
      }
      
      .mattressai-message__content {
        word-break: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        -webkit-hyphens: auto;
      }
      
      .mattressai-quick-reply {
        font-size: 13px;
        padding: 8px 14px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
      }
    }
    
    /* Saved Recommendations Button in Header */
    .mattressai-widget__saved-btn {
      position: relative;
      background: transparent;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--mattress-header-text, #FFFFFF);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
      margin-right: 8px;
    }
    
    .mattressai-widget__saved-btn:hover {
      opacity: 0.8;
    }
    
    .mattressai-widget__saved-btn svg {
      width: 20px;
      height: 20px;
    }
    
    .mattressai-saved-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Saved Recommendations Panel */
    .mattressai-saved-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      max-width: 90vw;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease-out;
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
    
    .mattressai-saved-panel__header {
      padding: 20px;
      background: var(--mattress-primary, #3B82F6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .mattressai-saved-panel__header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .mattressai-saved-panel__close {
      background: transparent;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
    }
    
    .mattressai-saved-panel__close:hover {
      opacity: 0.8;
    }
    
    .mattressai-saved-panel__close svg {
      width: 20px;
      height: 20px;
    }
    
    .mattressai-saved-panel__content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .mattressai-saved-panel__empty {
      text-align: center;
      color: #6B7280;
      padding: 40px 20px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    /* Saved Product Cards (Compact Style) */
    .mattressai-saved-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      gap: 12px;
      transition: box-shadow 0.2s ease;
    }
    
    .mattressai-saved-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .mattressai-saved-card__image {
      position: relative;
      width: 100px;
      height: 100px;
      flex-shrink: 0;
      background: #F3F4F6;
    }
    
    .mattressai-saved-card__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .mattressai-saved-card__placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #9CA3AF;
      font-size: 12px;
    }
    
    .mattressai-saved-card__badge {
      position: absolute;
      top: 6px;
      left: 6px;
      background: var(--mattress-primary, #3B82F6);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .mattressai-saved-card__content {
      flex: 1;
      padding: 12px 12px 12px 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    
    .mattressai-saved-card__title {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .mattressai-saved-card__vendor {
      margin: 0 0 8px;
      font-size: 12px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .mattressai-saved-card__actions {
      display: flex;
      gap: 8px;
    }
    
    .mattressai-saved-card__btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .mattressai-saved-card__btn--primary {
      background: var(--mattress-primary, #3B82F6);
      color: white;
      flex: 1;
    }
    
    .mattressai-saved-card__btn--primary:hover {
      background: var(--mattress-primary-hover, #2563EB);
    }
    
    .mattressai-saved-card__btn--remove {
      background: transparent;
      color: #EF4444;
      border: 1px solid #FEE2E2;
    }
    
    .mattressai-saved-card__btn--remove:hover {
      background: #FEF2F2;
    }
    
    /* Save Button in Rec Cards */
    .rec-card__btn--save {
      background: transparent;
      color: var(--mattress-primary, #3B82F6);
      border: 2px solid var(--mattress-primary, #3B82F6);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .rec-card__btn--save:hover:not(:disabled) {
      background: var(--mattress-primary, #3B82F6);
      color: white;
    }
    
    .rec-card__btn--save:disabled {
      opacity: 0.6;
      cursor: default;
      border-color: #10B981;
      color: #10B981;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .mattressai-saved-panel {
        width: 100vw;
      }
    }
  \`;
  document.head.appendChild(style);
})();
  `;

  return new Response(widgetScript, { headers });
};
