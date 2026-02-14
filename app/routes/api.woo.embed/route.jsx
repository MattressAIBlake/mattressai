/**
 * WooCommerce Embed Script
 * 
 * Serves a standalone JavaScript file that WooCommerce (or any) sites
 * can include to load the MattressAI widget.
 * 
 * Usage on WooCommerce site:
 * <script src="https://themattressai.com/api/woo/embed?key=YOUR_WIDGET_API_KEY" async></script>
 */

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('key');
  const position = url.searchParams.get('position') || 'left'; // left or right - default left
  
  // The API base URL for the widget to communicate with
  const apiBase = `${url.protocol}//${url.host}`;
  
  const headers = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching during dev
    'Access-Control-Allow-Origin': '*',
  };

  // Handle OPTIONS for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const embedScript = `
(function() {
  'use strict';
  
  // Configuration
  const MATTRESSAI_CONFIG = {
    apiKey: '${apiKey || ''}',
    apiBase: '${apiBase}',
    position: '${position}',
    version: '1.0.0'
  };

  // MattressAI Widget for WooCommerce
  const MattressAI = {
    initialized: false,
    config: {},
    sessionId: null,
    conversationId: null,
    savedRecommendations: [],
    unreadCount: 0,
    isOpen: false,
    
    init: function(userConfig) {
      if (this.initialized) return;
      
      // Merge user config with defaults
      this.config = Object.assign({
        apiKey: MATTRESSAI_CONFIG.apiKey,
        apiBase: MATTRESSAI_CONFIG.apiBase,
        primaryColor: '#3B82F6',
        widgetTitle: 'Mattress Quiz',
        widgetSubtitle: "We're here to help",
        welcomeMessage: 'Hi! Looking for the perfect mattress? Tell me about your sleep preferences.',
        bubbleText: 'Mattress Quiz',
        bubbleStyle: 'text',
        position: MATTRESSAI_CONFIG.position || 'right',
        positionBottom: 20,
        positionSide: 20,
        autoOpen: false
      }, userConfig || {});
      
      // Validate API key
      if (!this.config.apiKey) {
        console.error('MattressAI: API key required. Get one at themattressai.com');
        return;
      }
      
      // Load CSS
      this.loadStyles();
      
      // Create chat bubble
      this.createChatBubble();
      
      // Load saved recommendations
      this.loadSavedRecommendations();
      
      // Hijack existing quiz buttons on the page
      this.hijackQuizButtons();
      
      this.initialized = true;
      console.log('MattressAI Widget initialized (WooCommerce mode)');
    },
    
    hijackQuizButtons: function() {
      // Find all links/buttons that should open the quiz
      const selectors = [
        'a[href*="mattressai"]',
        'a[href*="quiz"]',
        'a[href*="match"]'
      ];
      const keywords = ['quiz', 'match', 'find your'];
      
      document.querySelectorAll('a, button').forEach(el => {
        if (el.id === 'mattressai-chat-bubble') return; // Skip our own button
        
        const text = (el.textContent || '').toLowerCase();
        const href = (el.href || '').toLowerCase();
        
        // Check if element matches our criteria
        const matchesKeyword = keywords.some(kw => text.includes(kw));
        const matchesHref = href.includes('mattressai') || href.includes('quiz');
        
        if (matchesKeyword || matchesHref) {
          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.MattressAI.openChat();
          });
          el.style.cursor = 'pointer';
          console.log('MattressAI: Hijacked button -', el.textContent.trim());
        }
      });
    },
    
    loadStyles: function() {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this.config.apiBase + '/api/woo/widget/css';
      document.head.appendChild(link);
      
      // Set CSS custom properties
      document.documentElement.style.setProperty('--mattress-primary', this.config.primaryColor);
    },
    
    getConversationId: function() {
      if (!this.conversationId) {
        this.conversationId = 'woo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      return this.conversationId;
    },
    
    parseMarkdown: function(text) {
      if (!text) return '';
      let html = text;
      // Convert markdown images ![alt](url) to HTML - must come before links
      html = html.replace(/!\\[([^\\]]*)\\]\\(([^\\)]+)\\)/g, function(match, alt, url) {
        return '<img src="' + url + '" alt="' + alt + '" style="max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;">';
      });
      // Convert markdown links [text](url) to HTML
      html = html.replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, function(match, linkText, url) {
        return '<a href="' + url + '" target="_blank" style="color: #3B82F6; text-decoration: underline;">' + linkText + '</a>';
      });
      // Convert **bold** to <strong>
      html = html.replace(/\\*\\*([^\\*]+)\\*\\*/g, function(match, boldText) {
        return '<strong>' + boldText + '</strong>';
      });
      // Convert newlines to <br>
      html = html.replace(/\\n/g, '<br>');
      return html;
    },
    
    loadSavedRecommendations: function() {
      try {
        const saved = localStorage.getItem('mattressai_saved_recommendations');
        this.savedRecommendations = saved ? JSON.parse(saved) : [];
      } catch (e) {
        this.savedRecommendations = [];
      }
    },
    
    createChatBubble: function() {
      const bubble = document.createElement('button');
      bubble.id = 'mattressai-chat-bubble';
      bubble.className = 'mattressai-chat-bubble mattressai-bubble-' + this.config.bubbleStyle;
      bubble.style.cssText = \`
        position: fixed !important;
        bottom: 24px !important;
        \${this.config.position}: 24px !important;
        \${this.config.position === 'left' ? 'right: auto !important;' : 'left: auto !important;'}
        z-index: 999999 !important;
        padding: 16px 32px !important;
        font-size: 16px !important;
      \`;
      
      if (this.config.bubbleStyle === 'text') {
        bubble.innerHTML = '<span>' + this.config.bubbleText + '</span>';
      } else {
        bubble.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>\`;
      }
      
      bubble.addEventListener('click', () => this.openChat());
      document.body.appendChild(bubble);
      
      if (this.config.autoOpen) {
        setTimeout(() => this.openChat(), 2000);
      }
    },
    
    openChat: function() {
      this.isOpen = true;
      this.clearUnread();
      document.body.classList.add('mattressai-chat-open');
      this.createChatWidget();
      // Focus input after widget opens
      setTimeout(() => {
        const input = document.querySelector('#mattressai-input');
        if (input) input.focus();
      }, 100);
    },
    
    closeChat: function() {
      this.isOpen = false;
      document.body.classList.remove('mattressai-chat-open');
      const widget = document.getElementById('mattressai-chat-widget');
      if (widget) widget.classList.remove('mattressai-widget--open');
    },
    
    clearUnread: function() {
      this.unreadCount = 0;
      const bubble = document.getElementById('mattressai-chat-bubble');
      if (bubble) bubble.removeAttribute('data-badge');
    },
    
    createChatWidget: function() {
      if (document.getElementById('mattressai-chat-widget')) {
        document.getElementById('mattressai-chat-widget').classList.add('mattressai-widget--open');
        return;
      }
      
      const widget = document.createElement('div');
      widget.id = 'mattressai-chat-widget';
      widget.className = 'mattressai-widget mattressai-widget--open';
      
      widget.innerHTML = \`
        <div class="mattressai-widget__header">
          <div class="mattressai-widget__header-content">
            <h3 class="mattressai-widget__title">\${this.config.widgetTitle}</h3>
            <p class="mattressai-widget__subtitle">\${this.config.widgetSubtitle}</p>
          </div>
          <button class="mattressai-widget__close" aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4L4 12M4 4l8 8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="mattressai-widget__messages" id="mattressai-messages">
          <div class="mattressai-message mattressai-message--assistant">
            <div class="mattressai-message__avatar"><span>AI</span></div>
            <div class="mattressai-message__content">\${this.config.welcomeMessage}</div>
          </div>
          <div class="mattressai-quick-replies" id="mattressai-quick-replies">
            <button class="mattressai-quick-reply" data-message="I need a soft mattress">Soft</button>
            <button class="mattressai-quick-reply" data-message="I need a medium mattress">Medium</button>
            <button class="mattressai-quick-reply" data-message="I need a firm mattress">Firm</button>
            <button class="mattressai-quick-reply" data-message="Help me decide">Help me decide</button>
          </div>
        </div>
        
        <div class="mattressai-widget__input-container">
          <textarea
            id="mattressai-input"
            class="mattressai-widget__input"
            placeholder="Type your message..."
            rows="1"
          ></textarea>
          <button id="mattressai-send" class="mattressai-widget__send-btn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      \`;
      
      document.body.appendChild(widget);
      this.setupWidgetListeners(widget);
    },
    
    setupWidgetListeners: function(widget) {
      const self = this;
      const input = widget.querySelector('#mattressai-input');
      const sendBtn = widget.querySelector('#mattressai-send');
      const closeBtn = widget.querySelector('.mattressai-widget__close');
      
      closeBtn.addEventListener('click', () => this.closeChat());
      
      // Quick replies
      widget.querySelectorAll('.mattressai-quick-reply').forEach(btn => {
        btn.addEventListener('click', () => {
          const message = btn.getAttribute('data-message');
          input.value = message;
          this.sendMessage(message);
          document.getElementById('mattressai-quick-replies').style.display = 'none';
        });
      });
      
      const doSend = () => {
        const message = input.value.trim();
        if (message) this.sendMessage(message);
      };
      
      sendBtn.addEventListener('click', doSend);
      
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        sendBtn.disabled = !input.value.trim();
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          doSend();
        }
      });
    },
    
    addMessage: function(role, content) {
      const container = document.querySelector('#mattressai-messages');
      const div = document.createElement('div');
      div.className = 'mattressai-message mattressai-message--' + role;
      
      if (role === 'assistant') {
        div.innerHTML = \`
          <div class="mattressai-message__avatar"><span>AI</span></div>
          <div class="mattressai-message__content">\${content}</div>
        \`;
      } else {
        div.innerHTML = '<div class="mattressai-message__content">' + content + '</div>';
      }
      
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    },
    
    sendMessage: async function(message) {
      const input = document.querySelector('#mattressai-input');
      const sendBtn = document.querySelector('#mattressai-send');
      
      input.value = '';
      input.style.height = 'auto';
      sendBtn.disabled = true;
      
      // Track conversation history
      if (!this.conversationHistory) this.conversationHistory = [];
      this.conversationHistory.push({ role: 'user', content: message });
      
      this.addMessage('user', message);
      
      // Add loading indicator
      const loadingDiv = this.addMessage('assistant', '<div class="mattressai-loading"><span></span><span></span><span></span></div>');
      
      try {
        const response = await fetch(this.config.apiBase + '/api/woo/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey
          },
          body: JSON.stringify({
            messages: this.conversationHistory,
            conversation_id: this.getConversationId()
          })
        });
        
        if (!response.ok) throw new Error('Chat request failed');
        
        // Remove loading
        loadingDiv.remove();
        
        // Handle SSE stream
        await this.handleStream(response);
        
      } catch (error) {
        console.error('MattressAI chat error:', error);
        loadingDiv.remove();
        this.addMessage('assistant', 'Sorry, something went wrong. Please try again.');
      }
      
      // Refocus input after sending
      input.focus();
    },
    
    handleStream: async function(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEl = null;
      let currentText = '';
      
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
                const container = document.querySelector('#mattressai-messages');
                if (!currentEl) {
                  currentEl = this.addMessage('assistant', data.chunk);
                  currentText = data.chunk;
                } else {
                  currentText += data.chunk;
                  // Parse markdown links and render as HTML
                  const contentEl = currentEl.querySelector('.mattressai-message__content');
                  contentEl.innerHTML = this.parseMarkdown(currentText);
                }
                // Auto-scroll to bottom
                if (container) container.scrollTop = container.scrollHeight;
              } else if (data.type === 'product_results' && data.products) {
                this.displayProducts(data.products);
              } else if (data.type === 'end_turn') {
                // Save assistant response to history
                if (currentText && window.MattressAI.conversationHistory) {
                  window.MattressAI.conversationHistory.push({ role: 'assistant', content: currentText });
                }
                currentEl = null;
                currentText = '';
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    },
    
    displayProducts: function(products) {
      if (!products || !products.length) return;
      
      const container = document.querySelector('#mattressai-messages');
      const grid = document.createElement('div');
      grid.className = 'mattressai-products';
      
      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'rec-card';
        
        card.innerHTML = \`
          <div class="rec-card__image">
            \${product.imageUrl ? '<img src="' + product.imageUrl + '" alt="' + product.title + '">' : ''}
            \${product.fitScore ? '<div class="rec-card__badge">' + Math.round(product.fitScore) + '% match</div>' : ''}
          </div>
          <div class="rec-card__content">
            \${product.vendor ? '<div class="rec-card__vendor">' + product.vendor + '</div>' : ''}
            <h3 class="rec-card__title">\${product.title}</h3>
            \${product.firmness ? '<div class="rec-card__firmness">Firmness: ' + product.firmness + '</div>' : ''}
            <div class="rec-card__actions">
              <a href="\${product.url || product.permalink || '#'}" class="rec-card__btn rec-card__btn--primary" target="_blank">View Product</a>
            </div>
          </div>
        \`;
        
        grid.appendChild(card);
      });
      
      container.appendChild(grid);
      container.scrollTop = container.scrollHeight;
    }
  };
  
  // Expose globally
  window.MattressAI = MattressAI;
  
  // Auto-init if API key provided in script tag
  if (MATTRESSAI_CONFIG.apiKey) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => MattressAI.init());
    } else {
      MattressAI.init();
    }
  }
})();
`;

  return new Response(embedScript, { headers });
};
