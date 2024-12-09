(function() {
  // Configuration
  const CHAT_URL = 'https://chat.example.com';
  
  // Get merchant ID from script tag
  const scriptTag = document.currentScript;
  const merchantId = new URL(scriptTag.src).searchParams.get('merchantId');
  
  if (!merchantId) {
    console.error('MattressAI Chat: No merchant ID provided');
    return;
  }

  // Create and inject styles
  const styles = `
    .mattress-ai-chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: var(--chat-primary-color, #2563eb);
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
    }

    .mattress-ai-chat-button:hover {
      transform: scale(1.1);
    }

    .mattress-ai-chat-icon {
      width: 30px;
      height: 30px;
      fill: white;
    }

    .mattress-ai-chat-frame {
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 400px;
      height: 600px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      background: white;
      z-index: 999999;
      overflow: hidden;
      transition: transform 0.3s, opacity 0.3s;
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      border: none;
    }

    .mattress-ai-chat-frame.open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create chat button
  const button = document.createElement('button');
  button.className = 'mattress-ai-chat-button';
  button.innerHTML = \`
    <svg class="mattress-ai-chat-icon" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  \`;

  // Create chat frame
  const frame = document.createElement('iframe');
  frame.className = 'mattress-ai-chat-frame';
  frame.src = \`\${CHAT_URL}?merchantId=\${merchantId}\`;
  frame.title = 'Customer Chat';
  frame.allow = 'microphone';

  // Add elements to page
  document.body.appendChild(button);
  document.body.appendChild(frame);

  // Handle button click
  let isOpen = false;
  button.addEventListener('click', () => {
    isOpen = !isOpen;
    frame.classList.toggle('open', isOpen);
    
    // Update button icon
    button.innerHTML = isOpen
      ? \`<svg class="mattress-ai-chat-icon" viewBox="0 0 24 24">
           <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
         </svg>\`
      : \`<svg class="mattress-ai-chat-icon" viewBox="0 0 24 24">
           <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
         </svg>\`;
  });

  // Handle clicks outside the chat
  document.addEventListener('click', (event) => {
    if (isOpen && 
        !frame.contains(event.target) && 
        !button.contains(event.target)) {
      isOpen = false;
      frame.classList.remove('open');
      button.innerHTML = \`
        <svg class="mattress-ai-chat-icon" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      \`;
    }
  });

  // Handle messages from iframe
  window.addEventListener('message', (event) => {
    if (event.origin !== CHAT_URL) return;
    
    // Handle any messages from the chat iframe
    // For example, updating branding colors
    if (event.data.type === 'updateBranding') {
      const { colors } = event.data;
      if (colors?.primary) {
        document.documentElement.style.setProperty('--chat-primary-color', colors.primary);
      }
    }
  });
})(); 