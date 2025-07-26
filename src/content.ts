// Content script for Chrome extension
let buttonDiv: HTMLElement | null = null;
let tooltipDiv: HTMLElement | null = null;
let isVisible = false;
let chatInputField: HTMLTextAreaElement | null = null;

// Detect if we're on ChatGPT
const isChatGPT = window.location.hostname.includes('chat.openai.com');

function findChatGPTInput(): HTMLTextAreaElement | null {
  // More comprehensive selectors for ChatGPT input field
  const selectors = [
    // ChatGPT specific selectors
    'textarea[data-id="root"]',
    'textarea[data-testid="chat-input"]',
    'textarea[data-testid="chat-input-field"]',
    'textarea[data-testid="input"]',
    'textarea[data-testid="text-input"]',
    'textarea[data-testid="message-input"]',
    // Common ChatGPT placeholders
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Message ChatGPT"]',
    'textarea[placeholder*="Send a message to ChatGPT"]',
    'textarea[placeholder*="Ask me anything"]',
    'textarea[placeholder*="Type your message"]',
    'textarea[placeholder*="Send a message to"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Chat"]',
    'textarea[placeholder*="Send"]',
    'textarea[placeholder*="Type"]',
    'textarea[placeholder*="Write"]',
    'textarea[placeholder*="Enter"]',
    'textarea[placeholder*="Input"]',
    // Role-based selectors
    'textarea[role="textbox"]',
    'textarea[aria-label*="chat"]',
    'textarea[aria-label*="message"]',
    'textarea[aria-label*="input"]',
    // Generic textarea as fallback
    'textarea'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector) as NodeListOf<HTMLTextAreaElement>;
    for (const element of elements) {
      // Check if it's visible and likely to be the main input
      if (element.offsetParent !== null && 
          element.style.display !== 'none' && 
          element.style.visibility !== 'hidden' &&
          element.getBoundingClientRect().width > 100 &&
          element.getBoundingClientRect().height > 20) {
        console.log('Found ChatGPT input with selector:', selector, element);
        return element;
      }
    }
  }

  return null;
}

function positionButtonNearInput(): void {
  if (!buttonDiv) return;

  const input = findChatGPTInput();
  console.log('Positioning button, found input:', input);
  
  if (input && isChatGPT) {
    chatInputField = input;
    
    // Get the input field position
    const rect = input.getBoundingClientRect();
    const buttonSize = 48;
    
    console.log('Input rect:', rect);
    
    // Position button to the right of the input field, but ensure it's visible
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = rect.right + 10;
    let top = rect.top + (rect.height / 2) - (buttonSize / 2);
    
    // Ensure button stays within viewport
    if (left + buttonSize > viewportWidth - 20) {
      left = rect.left - buttonSize - 10;
    }
    
    if (top < 20) {
      top = 20;
    } else if (top + buttonSize > viewportHeight - 20) {
      top = viewportHeight - buttonSize - 20;
    }
    
    buttonDiv.style.position = 'fixed';
    buttonDiv.style.left = `${left}px`;
    buttonDiv.style.top = `${top}px`;
    buttonDiv.style.zIndex = '999999';
    buttonDiv.style.display = 'flex';
    buttonDiv.style.animation = 'pulse 2s infinite';
    isVisible = true;
    
    console.log('Button positioned at:', left, top);
  } else {
    // Fallback position for all pages
    buttonDiv.style.position = 'fixed';
    buttonDiv.style.right = '20px';
    buttonDiv.style.bottom = '20px';
    buttonDiv.style.zIndex = '999999';
    buttonDiv.style.display = 'flex';
    isVisible = true;
    
    console.log('Button positioned at fallback location');
  }
}

function createFloatingButton(): void {
  if (buttonDiv) return;

  console.log('Creating floating button...');

  // Create button
  buttonDiv = document.createElement('div');
  buttonDiv.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `;
  
  // Style the button
  Object.assign(buttonDiv.style, {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: '999999',
    boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    outline: 'none',
    animation: 'pulse 2s infinite'
  });

  // Add hover effects
  buttonDiv.addEventListener('mouseenter', () => {
    buttonDiv!.style.transform = 'scale(1.15) rotate(5deg)';
    buttonDiv!.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.5)';
    buttonDiv!.style.animation = 'none';
  });
  
  buttonDiv.addEventListener('mouseleave', () => {
    buttonDiv!.style.transform = 'scale(1) rotate(0deg)';
    buttonDiv!.style.boxShadow = '0 8px 32px rgba(37, 99, 235, 0.4)';
    buttonDiv!.style.animation = 'pulse 2s infinite';
  });

  // Add click handler
  buttonDiv.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Floating button clicked!');
    handleButtonClick();
  });

  // Create tooltip
  tooltipDiv = document.createElement('div');
  tooltipDiv.textContent = 'Optimize Prompt';
  Object.assign(tooltipDiv.style, {
    position: 'fixed',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
    zIndex: '1000000',
    cursor: 'pointer',
    display: 'none',
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  });

  // Add tooltip events
  buttonDiv.addEventListener('mouseenter', () => {
    if (tooltipDiv) {
      const rect = buttonDiv!.getBoundingClientRect();
      tooltipDiv.style.left = `${rect.left + rect.width / 2}px`;
      tooltipDiv.style.top = `${rect.top - 40}px`;
      tooltipDiv.style.transform = 'translateX(-50%)';
      tooltipDiv.style.display = 'block';
    }
  });

  buttonDiv.addEventListener('mouseleave', () => {
    if (tooltipDiv) {
      tooltipDiv.style.display = 'none';
    }
  });

  // Add to page
  document.body.appendChild(buttonDiv);
  document.body.appendChild(tooltipDiv);
  console.log('Floating button created and added to page');
}

function handleButtonClick(): void {
  console.log('handleButtonClick called');
  let textToOptimize = '';

  // Try to get text from ChatGPT input if available
  if (isChatGPT && chatInputField) {
    textToOptimize = chatInputField.value;
    console.log('Got text from ChatGPT input:', textToOptimize.substring(0, 50) + '...');
  }

  // If no text in input, try to get selected text
  if (!textToOptimize) {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      textToOptimize = selection.toString().trim();
      console.log('Got text from selection:', textToOptimize.substring(0, 50) + '...');
    }
  }

  console.log('Final text to optimize:', textToOptimize);

  // Show typing indicator if on ChatGPT
  if (isChatGPT && chatInputField) {
    showTypingIndicator();
  }

  // Store the text in chrome storage for the popup to access
  chrome.storage.local.set({ selectedText: textToOptimize }, () => {
    console.log('Text stored in chrome storage');
    
    // Send message to background script to open popup
    chrome.runtime.sendMessage({
      type: 'OPEN_POPUP_WITH_TEXT',
      text: textToOptimize
    }, (response) => {
      console.log('Background script response:', response);
    });
  });
}

function showTypingIndicator(): void {
  if (!chatInputField) return;

  // Add a subtle visual feedback
  chatInputField.style.borderColor = '#2563eb';
  chatInputField.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
  
  setTimeout(() => {
    if (chatInputField) {
      chatInputField.style.borderColor = '';
      chatInputField.style.boxShadow = '';
    }
  }, 2000);
}

function addStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .prompt-optimizer-button {
      animation: pulse 2s infinite;
    }
  `;
  document.head.appendChild(style);
}

function monitorChatGPTInput(): void {
  if (!isChatGPT) return;

  console.log('Starting ChatGPT input monitoring...');

  // Monitor for input field changes
  const observer = new MutationObserver(() => {
    const input = findChatGPTInput();
    if (input && input !== chatInputField) {
      console.log('New ChatGPT input found');
      chatInputField = input;
      positionButtonNearInput();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Check periodically for better responsiveness
  setInterval(() => {
    const input = findChatGPTInput();
    if (input) {
      chatInputField = input;
      positionButtonNearInput();
    }
  }, 1000);

  // Initial check with multiple attempts
  let attempts = 0;
  const maxAttempts = 10;
  
  const checkForInput = () => {
    const input = findChatGPTInput();
    if (input) {
      console.log('Initial ChatGPT input found');
      chatInputField = input;
      positionButtonNearInput();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(checkForInput, 500);
    }
  };
  
  setTimeout(checkForInput, 1000);
}

// Initialize
function init(): void {
  console.log('Content script initializing...');
  createFloatingButton();
  addStyles();
  
  // Position button immediately
  setTimeout(() => {
    positionButtonNearInput();
  }, 500);
  
  // Monitor ChatGPT input if on ChatGPT
  if (isChatGPT) {
    monitorChatGPTInput();
  }
  console.log('Content script initialized');
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.type === 'GET_SELECTED_TEXT') {
    let selectedText = '';
    
    // Try to get text from ChatGPT input first
    if (isChatGPT && chatInputField) {
      selectedText = chatInputField.value;
    }
    
    // If no text in input, get selected text
    if (!selectedText) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        selectedText = selection.toString().trim();
      }
    }
    
    console.log('Sending selected text:', selectedText.substring(0, 50) + '...');
    sendResponse({ text: selectedText });
  }
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle SPA navigation
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(() => {
      console.log('URL changed, reinitializing...');
      createFloatingButton();
      positionButtonNearInput();
      
      if (isChatGPT) {
        monitorChatGPTInput();
      }
    }, 1000);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
}); 