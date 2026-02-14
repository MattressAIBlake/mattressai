/**
 * WooCommerce Widget CSS
 * 
 * Serves the widget styles for WooCommerce stores.
 * This is standalone CSS designed for the WooCommerce widget specifically.
 */

export const loader = async ({ request }) => {
  const headers = {
    'Content-Type': 'text/css; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
  };

  // WooCommerce widget CSS (standalone, not using Shopify widget styles)
  const widgetCss = `
/* MattressAI Widget Styles */
:root {
  --mattress-primary: #3B82F6;
  --mattress-avatar-bg: #3B82F6;
}

/* Chat Bubble */
.mattressai-chat-bubble {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  left: auto !important;
  z-index: 999999 !important;
  background: var(--mattress-primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 50px !important;
  padding: 12px 24px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
  width: auto !important;
  max-width: 200px !important;
  min-width: auto !important;
  display: inline-block !important;
  text-align: center !important;
}

.mattressai-chat-bubble:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.mattressai-chat-bubble[data-badge]::after {
  content: attr(data-badge);
  position: absolute;
  top: -5px;
  right: -5px;
  background: #EF4444;
  color: white;
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Widget Container */
.mattressai-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  height: 600px;
  max-height: calc(100vh - 40px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  display: none;
  flex-direction: column;
  z-index: 1000000;
  overflow: hidden;
}

.mattressai-widget--open {
  display: flex;
}

/* Mobile */
@media (max-width: 768px) {
  .mattressai-widget {
    width: 100%;
    height: 100%;
    max-height: 100%;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }
  
  body.mattressai-chat-open .mattressai-chat-bubble {
    display: none;
  }
}

/* Header */
.mattressai-widget__header {
  background: var(--mattress-primary);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mattressai-widget__header-content {
  flex: 1;
}

.mattressai-widget__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.mattressai-widget__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.9;
}

.mattressai-widget__close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  opacity: 0.8;
}

.mattressai-widget__close:hover {
  opacity: 1;
}

.mattressai-widget__close svg {
  width: 16px;
  height: 16px;
}

/* Messages */
.mattressai-widget__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mattressai-message {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.mattressai-message--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.mattressai-message--assistant {
  align-self: flex-start;
}

.mattressai-message__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--mattress-avatar-bg);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.mattressai-message__content {
  background: #F3F4F6;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
}

.mattressai-message--user .mattressai-message__content {
  background: var(--mattress-primary);
  color: white;
}

/* Quick Replies */
.mattressai-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.mattressai-quick-reply {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mattressai-quick-reply:hover {
  border-color: var(--mattress-primary);
  color: var(--mattress-primary);
}

/* Input */
.mattressai-widget__input-container {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #E5E7EB;
}

.mattressai-widget__input {
  flex: 1;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  resize: none;
  outline: none;
}

.mattressai-widget__input:focus {
  border-color: var(--mattress-primary);
}

.mattressai-widget__send-btn {
  background: var(--mattress-primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.mattressai-widget__send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mattressai-widget__send-btn svg {
  width: 18px;
  height: 18px;
}

/* Loading */
.mattressai-loading {
  display: flex;
  gap: 4px;
}

.mattressai-loading span {
  width: 8px;
  height: 8px;
  background: #9CA3AF;
  border-radius: 50%;
  animation: mattressai-bounce 1.4s infinite ease-in-out both;
}

.mattressai-loading span:nth-child(1) { animation-delay: -0.32s; }
.mattressai-loading span:nth-child(2) { animation-delay: -0.16s; }

@keyframes mattressai-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Product Cards */
.mattressai-products {
  display: grid;
  gap: 12px;
  padding: 8px 0;
}

.rec-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}

.rec-card__image {
  position: relative;
  height: 140px;
  background: #F9FAFB;
}

.rec-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rec-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #10B981;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.rec-card__content {
  padding: 12px;
}

.rec-card__vendor {
  font-size: 11px;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rec-card__title {
  margin: 4px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.rec-card__firmness {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 12px;
}

.rec-card__actions {
  display: flex;
  gap: 8px;
}

.rec-card__btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.rec-card__btn--primary {
  background: var(--mattress-primary);
  color: white;
  border: none;
}

.rec-card__btn--primary:hover {
  opacity: 0.9;
}
`;

  return new Response(widgetCss, { headers });
};
