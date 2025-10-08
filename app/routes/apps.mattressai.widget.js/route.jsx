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
      
      // Create chat widget (in a full implementation, this would render React components)
      console.log('Opening chat widget...');
      alert('Chat widget would open here. Full React implementation needed.');
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
  
  // Add basic CSS for chat bubble
  const style = document.createElement('style');
  style.textContent = \`
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
    
    @media (max-width: 768px) {
      .mattressai-chat-bubble {
        bottom: 16px;
        right: 16px;
        width: 56px;
        height: 56px;
      }
    }
  \`;
  document.head.appendChild(style);
})();
  `;

  return new Response(widgetScript, { headers });
};
