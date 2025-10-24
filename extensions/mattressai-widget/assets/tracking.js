/**
 * MattressAI Analytics Tracking
 * Client-side event tracking for funnel analysis and attribution
 */

(function() {
  'use strict';

  const MattressAITracking = {
    tenantId: null,
    sessionId: null,
    proxyUrl: null,

    /**
     * Initialize tracking
     */
    init: function(tenantId, proxyUrl) {
      this.tenantId = tenantId;
      this.proxyUrl = proxyUrl || '/apps/mattressai';
      
      // Get or create session ID
      this.sessionId = sessionStorage.getItem('mattressai_session_id');
      
      // Track widget viewed
      this.track('widget_viewed');
      
      // Set up event listeners
      this.setupListeners();
    },

    /**
     * Set up event listeners for tracking
     */
    setupListeners: function() {
      // Track when chat is opened
      const chatBubble = document.querySelector('.mattressai-chat-bubble');
      if (chatBubble) {
        chatBubble.addEventListener('click', () => {
          this.track('opened');
        });
      }

      // Track first message (will be triggered from chat module)
      document.addEventListener('mattressai:first_message', () => {
        this.track('first_message');
      });

      // Track data point captured
      document.addEventListener('mattressai:data_point_captured', (e) => {
        this.track('data_point_captured', {
          questionType: e.detail?.questionType
        });
      });

      // Track recommendations shown
      document.addEventListener('mattressai:recommendation_shown', (e) => {
        const products = e.detail?.products || [];
        products.forEach(product => {
          this.track('recommendation_shown', {
            productId: product.id,
            productTitle: product.title,
            productPrice: product.price
          });
        });
      });

      // Track recommendation clicked
      document.addEventListener('mattressai:recommendation_clicked', (e) => {
        const product = e.detail?.product;
        if (product) {
          const clickId = this.generateClickId();
          this.track('recommendation_clicked', {
            productId: product.id,
            productTitle: product.title,
            productPrice: product.price
          }, clickId);
          
          // Store click_id in URL or session for attribution
          sessionStorage.setItem(`mattressai_click_${product.id}`, clickId);
        }
      });

      // Track add to cart (global Shopify event)
      document.addEventListener('product:added-to-cart', (e) => {
        const productId = e.detail?.variant?.product_id || e.detail?.product_id;
        if (productId) {
          const clickId = sessionStorage.getItem(`mattressai_click_${productId}`);
          this.track('add_to_cart', {
            productId,
            variantId: e.detail?.variant?.id
          }, clickId);
        }
      });

      // Try to detect Shopify cart add events
      if (window.Shopify && window.Shopify.theme) {
        document.addEventListener('cart:item-added', (e) => {
          const productId = e.detail?.product_id;
          if (productId) {
            const clickId = sessionStorage.getItem(`mattressai_click_${productId}`);
            this.track('add_to_cart', {
              productId
            }, clickId);
          }
        });
      }

      // Intercept Shopify cart/add.js calls
      if (window.fetch) {
        const originalFetch = window.fetch;
        const self = this;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && (url.includes('/cart/add') || url.endsWith('add.js'))) {
            return originalFetch.apply(this, args).then(response => {
              if (response.ok) {
                response.clone().json().then(data => {
                  const productId = data.product_id || data.items?.[0]?.product_id;
                  if (productId) {
                    const clickId = sessionStorage.getItem(`mattressai_click_${productId}`);
                    self.track('add_to_cart', {
                      productId,
                      variantId: data.variant_id || data.id
                    }, clickId);
                  }
                }).catch(() => {});
              }
              return response;
            });
          }
          return originalFetch.apply(this, args);
        };
      }
    },

    /**
     * Set session ID (called when session starts)
     */
    setSessionId: function(sessionId) {
      this.sessionId = sessionId;
      sessionStorage.setItem('mattressai_session_id', sessionId);
    },

    /**
     * Generate a unique click ID for attribution
     */
    generateClickId: function() {
      return 'click_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Track an event
     */
    track: async function(eventType, metadata = {}, clickId = null) {
      if (!this.tenantId) {
        console.warn('MattressAI Tracking: tenantId not set');
        return;
      }

      try {
        const payload = {
          tenantId: this.tenantId,
          sessionId: this.sessionId,
          type: eventType,
          metadata,
          clickId,
          timestamp: new Date().toISOString()
        };

        // Send to tracking endpoint
        await fetch(`${this.proxyUrl}/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          // Don't wait for response
          keepalive: true
        }).catch(err => {
          console.warn('MattressAI Tracking error:', err);
        });

        // Log for debugging
        console.debug('MattressAI Track:', eventType, metadata);
      } catch (error) {
        console.warn('MattressAI Tracking error:', error);
      }
    },

    /**
     * Track checkout started (should be called from checkout page)
     */
    trackCheckoutStarted: function(cartData) {
      const clickIds = Object.keys(sessionStorage)
        .filter(key => key.startsWith('mattressai_click_'))
        .map(key => sessionStorage.getItem(key))
        .filter(Boolean);

      this.track('checkout_started', {
        cartTotal: cartData?.total,
        itemCount: cartData?.item_count,
        clickIds
      });
    },

    /**
     * Track order placed (should be called from thank you page)
     */
    trackOrderPlaced: function(orderData) {
      const clickIds = Object.keys(sessionStorage)
        .filter(key => key.startsWith('mattressai_click_'))
        .map(key => sessionStorage.getItem(key))
        .filter(Boolean);

      this.track('order_placed', {
        orderId: orderData?.order_id,
        orderTotal: orderData?.total,
        orderNumber: orderData?.order_number,
        clickIds
      });

      // Clear click IDs after order
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('mattressai_click_'))
        .forEach(key => sessionStorage.removeItem(key));
    }
  };

  // Expose globally
  window.MattressAITracking = MattressAITracking;

  // Auto-initialize if tenant ID is available
  const widgetScript = document.querySelector('script[data-tenant]');
  if (widgetScript) {
    const tenantId = widgetScript.getAttribute('data-tenant');
    if (tenantId) {
      MattressAITracking.init(tenantId);
    }
  }
})();

