// Content script for Chrome extension
let buttonDiv: HTMLElement | null = null;
let tooltipDiv: HTMLElement | null = null;
let isVisible = false;
let chatInputField: HTMLTextAreaElement | null = null;
let lastInputValue = '';
let isOptimizing = false;
let optimizationTimeout: number | null = null;
let isExtensionValid = true;

// Detect if we're on ChatGPT
const isChatGPT = window.location.hostname.includes('chat.openai.com');

// API service for optimization
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Helper function to safely access Chrome APIs
function isExtensionContextValid(): boolean {
  if (!isExtensionValid) return false;
  
  try {
    // Check if Chrome APIs are available
    if (typeof chrome === 'undefined') {
      console.warn('Chrome API not available');
      return false;
    }
    
    // Check if runtime API is available
    if (!chrome.runtime) {
      console.warn('Chrome runtime API not available');
      return false;
    }
    
    // Check if storage API is available
    if (!chrome.storage) {
      console.warn('Chrome storage API not available');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Extension context invalid:', error);
    isExtensionValid = false;
    return false;
  }
}

// Cleanup function to handle extension context invalidation
function cleanupOnContextInvalidation(): void {
  console.log('Extension context invalidated, cleaning up...');
  isExtensionValid = false;
  
  // Remove floating button if it exists
  if (buttonDiv && document.body.contains(buttonDiv)) {
    document.body.removeChild(buttonDiv);
    buttonDiv = null;
  }
  
  // Remove tooltip if it exists
  if (tooltipDiv && document.body.contains(tooltipDiv)) {
    document.body.removeChild(tooltipDiv);
    tooltipDiv = null;
  }
  
  // Reset state
  isVisible = false;
  chatInputField = null;
  lastInputValue = '';
  isOptimizing = false;
  
  if (optimizationTimeout) {
    clearTimeout(optimizationTimeout);
    optimizationTimeout = null;
  }
}

// Listen for extension context invalidation
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onSuspend) {
  try {
    chrome.runtime.onSuspend.addListener(() => {
      console.log('Extension suspended, cleaning up...');
      cleanupOnContextInvalidation();
    });
  } catch (error) {
    console.warn('Could not add suspend listener:', error);
  }
}

// Safe wrapper for Chrome storage operations
async function safeChromeStorageSet(key: string, value: any): Promise<void> {
  if (!isExtensionContextValid()) {
    console.warn('Extension context invalid, cannot access storage');
    return;
  }
  
  try {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Failed to set storage:', error);
    cleanupOnContextInvalidation();
    throw error;
  }
}

// Safe wrapper for Chrome runtime messaging
async function safeChromeRuntimeSendMessage(message: any): Promise<any> {
  if (!isExtensionContextValid()) {
    console.warn('Extension context invalid, cannot send message');
    return null;
  }
  
  try {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime message error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    cleanupOnContextInvalidation();
    return null;
  }
}

async function optimizePrompt(prompt: string): Promise<string> {
  try {
    console.log('Optimizing prompt:', prompt.substring(0, 50) + '...');
    
    const response = await fetch(`${API_BASE_URL}/prompt-optimizer/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_prompt: prompt,
        context: '',
        target_audience: '',
        optimization_focus: ['clarity', 'specificity', 'completeness'],
        constraints: ''
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Optimization result received');
    
    return result.optimized_prompt || prompt;
  } catch (error) {
    console.error('Optimization failed:', error);
    return prompt; // Return original prompt if optimization fails
  }
}

function findChatGPTInput(): HTMLTextAreaElement | null {
  // More comprehensive selectors for ChatGPT input field
  const selectors = [
    // ChatGPT specific selectors - prioritize these
    'textarea[data-testid="chat-input"]',
    'textarea[data-testid="chat-input-field"]',
    'textarea[data-testid="input"]',
    'textarea[data-testid="text-input"]',
    'textarea[data-testid="message-input"]',
    'textarea[data-id="root"]',
    // Common ChatGPT placeholders
    'textarea[placeholder*="Message ChatGPT"]',
    'textarea[placeholder*="Send a message to ChatGPT"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Ask me anything"]',
    'textarea[placeholder*="Type your message"]',
    'textarea[placeholder*="Send a message to"]',
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
    try {
      const elements = document.querySelectorAll(selector) as NodeListOf<HTMLTextAreaElement>;
      for (const element of elements) {
        // Check if it's visible and likely to be the main input
        if (element.offsetParent !== null && 
            element.style.display !== 'none' && 
            element.style.visibility !== 'hidden' &&
            element.getBoundingClientRect().width > 100 &&
            element.getBoundingClientRect().height > 20 &&
            element.getBoundingClientRect().top > 0 &&
            element.getBoundingClientRect().left > 0) {
          console.log('Found ChatGPT input with selector:', selector, element);
          return element;
        }
      }
    } catch (error) {
      console.warn('Error checking selector:', selector, error);
      continue;
    }
  }

  return null;
}

function positionButtonNearInput(): void {
  if (!buttonDiv) {
    console.log('Button div is null, creating it...');
    createFloatingButton();
  }

  const input = findChatGPTInput();
  console.log('Positioning button, found input:', input);
  
  if (input && isChatGPT) {
    chatInputField = input;
    
    // Get the input field position
    const rect = input.getBoundingClientRect();
    const buttonSize = 56; // Match the button size from createFloatingButton
    
    console.log('Input rect:', rect);
    
    // Calculate viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Improved positioning logic - try to position the button very close to the input
    let left: number;
    let top: number;
    
    // First try: Position to the right of the input field, very close
    if (rect.right + buttonSize + 5 <= viewportWidth) {
      left = rect.right + 5;
      top = rect.top + (rect.height / 2) - (buttonSize / 2);
    }
    // Second try: Position to the left of the input field, very close
    else if (rect.left - buttonSize - 5 >= 0) {
      left = rect.left - buttonSize - 5;
      top = rect.top + (rect.height / 2) - (buttonSize / 2);
    }
    // Third try: Position directly above the input field
    else if (rect.top - buttonSize - 5 >= 0) {
      left = rect.left + (rect.width / 2) - (buttonSize / 2);
      top = rect.top - buttonSize - 5;
    }
    // Fourth try: Position directly below the input field
    else if (rect.bottom + buttonSize + 5 <= viewportHeight) {
      left = rect.left + (rect.width / 2) - (buttonSize / 2);
      top = rect.bottom + 5;
    }
    // Fifth try: Position in the top-right corner of the input area
    else {
      left = rect.right - buttonSize - 10;
      top = rect.top - buttonSize - 10;
    }
    
    // Ensure button stays within viewport bounds with minimal padding
    const padding = 10;
    left = Math.max(padding, Math.min(left, viewportWidth - buttonSize - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - buttonSize - padding));
    
    // Apply positioning with enhanced visibility and make it more prominent
    Object.assign(buttonDiv!.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: '999999',
      display: 'flex',
      visibility: 'visible',
      opacity: '1',
      animation: 'pulse 2s infinite',
      boxShadow: '0 8px 32px rgba(37, 99, 235, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.5)',
      transform: 'scale(1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))'
    });
    
    isVisible = true;
    console.log('Button positioned at:', left, top, 'near ChatGPT input');
    
    // Add a subtle highlight to the input field to show the connection
    input.style.borderColor = '#2563eb';
    input.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.3)';
    setTimeout(() => {
      if (input) {
        input.style.borderColor = '';
        input.style.boxShadow = '';
      }
    }, 2000);
  } else {
    // For non-ChatGPT pages, use a more prominent bottom-right position
    Object.assign(buttonDiv!.style, {
      position: 'fixed',
      right: '30px',
      bottom: '30px',
      zIndex: '999999',
      display: 'flex',
      visibility: 'visible',
      opacity: '1',
      boxShadow: '0 8px 32px rgba(37, 99, 235, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3)',
      animation: 'pulse 2s infinite',
      transform: 'scale(1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    isVisible = true;
    console.log('Button positioned at fallback location (bottom-right)');
  }
}

function createFloatingButton(): void {
  if (buttonDiv) return;

  console.log('Creating floating button...');

  // Create button
  buttonDiv = document.createElement('div');
  buttonDiv.className = 'prompt-optimizer-button';
  buttonDiv.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `;
  
  // Style the button - make it more visible and prominent
  Object.assign(buttonDiv.style, {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: '999999',
    boxShadow: '0 12px 40px rgba(37, 99, 235, 0.7), 0 0 0 3px rgba(255, 255, 255, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    border: '3px solid rgba(255, 255, 255, 0.5)',
    outline: 'none',
    animation: 'pulse 2s infinite',
    visibility: 'visible',
    opacity: '1',
    position: 'fixed',
    transform: 'scale(1)',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
  });

  // Add hover effects
  buttonDiv.addEventListener('mouseenter', () => {
    buttonDiv!.style.transform = 'scale(1.15) rotate(5deg)';
    buttonDiv!.style.boxShadow = '0 20px 60px rgba(37, 99, 235, 0.9), 0 0 0 5px rgba(255, 255, 255, 0.7)';
    buttonDiv!.style.animation = 'none';
    buttonDiv!.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
  });
  
  buttonDiv.addEventListener('mouseleave', () => {
    buttonDiv!.style.transform = 'scale(1) rotate(0deg)';
    buttonDiv!.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.7), 0 0 0 3px rgba(255, 255, 255, 0.4)';
    buttonDiv!.style.animation = 'pulse 2s infinite, float 3s ease-in-out infinite';
    buttonDiv!.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
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

  // Always get the latest value from ChatGPT input if available
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
  safeChromeStorageSet('selectedText', textToOptimize)
    .then(() => {
      console.log('Text stored in chrome storage');
      // Add a short delay to ensure storage is updated before opening popup
      setTimeout(() => {
        // Send message to background script to open popup
        safeChromeRuntimeSendMessage({
          type: 'OPEN_POPUP_WITH_TEXT',
          text: textToOptimize
        })
        .then(response => {
          console.log('Background script response:', response);
        })
        .catch(error => {
          console.error('Error sending message to background script:', error);
        });
      }, 100); // 100ms delay
    })
    .catch(error => {
      console.error('Error storing text in chrome storage:', error);
    });
}

// Function to get current ChatGPT text
function getCurrentChatGPTText(): string {
  if (isChatGPT && chatInputField) {
    return chatInputField.value;
  }
  return '';
}

// Debug function to check button visibility
function debugButtonVisibility(): void {
  console.log('=== Button Debug Info ===');
  console.log('Button div exists:', !!buttonDiv);
  if (buttonDiv) {
    console.log('Button display:', buttonDiv.style.display);
    console.log('Button visibility:', buttonDiv.style.visibility);
    console.log('Button opacity:', buttonDiv.style.opacity);
    console.log('Button position:', buttonDiv.style.position);
    console.log('Button z-index:', buttonDiv.style.zIndex);
    console.log('Button rect:', buttonDiv.getBoundingClientRect());
    console.log('Button in DOM:', document.body.contains(buttonDiv));
  }
  console.log('Is visible flag:', isVisible);
  console.log('========================');
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

function showOptimizationIndicator(): void {
  if (!chatInputField) return;

  // Show optimization in progress
  chatInputField.style.borderColor = '#f59e0b';
  chatInputField.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.2)';
  
  // Add a small indicator
  const indicator = document.createElement('div');
  indicator.textContent = '🔄 Optimizing...';
  indicator.style.cssText = `
    position: absolute;
    top: -25px;
    right: 0;
    background: #f59e0b;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    z-index: 1000;
  `;
  
  chatInputField.parentElement?.appendChild(indicator);
  
  setTimeout(() => {
    indicator.remove();
  }, 3000);
}

function replaceInputText(newText: string): void {
  if (!chatInputField) return;

  // Store cursor position
  const start = chatInputField.selectionStart;
  const end = chatInputField.selectionEnd;
  
  // Replace the text
  chatInputField.value = newText;
  
  // Trigger input event to notify ChatGPT
  chatInputField.dispatchEvent(new Event('input', { bubbles: true }));
  chatInputField.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Restore cursor position
  chatInputField.setSelectionRange(start, start + newText.length);
  chatInputField.focus();
  
  // Show success indicator
  chatInputField.style.borderColor = '#10b981';
  chatInputField.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.2)';
  
  setTimeout(() => {
    if (chatInputField) {
      chatInputField.style.borderColor = '';
      chatInputField.style.boxShadow = '';
    }
  }, 2000);
}

function handleInputChange(event: Event): void {
  if (!isChatGPT || !chatInputField || isOptimizing) return;
  
  const currentValue = (event.target as HTMLTextAreaElement).value;
  
  // Only optimize if there's meaningful text (more than 10 characters)
  if (currentValue.length > 10 && currentValue !== lastInputValue) {
    lastInputValue = currentValue;
    
    // Clear previous timeout
    if (optimizationTimeout) {
      clearTimeout(optimizationTimeout);
    }
    
    // Set a timeout to optimize after user stops typing for 2 seconds
    optimizationTimeout = setTimeout(async () => {
      if (currentValue.length > 10 && !isOptimizing) {
        isOptimizing = true;
        showOptimizationIndicator();
        
        try {
          const optimizedText = await optimizePrompt(currentValue);
          
          if (optimizedText !== currentValue) {
            replaceInputText(optimizedText);
            console.log('Text automatically optimized and replaced');
          }
        } catch (error) {
          console.error('Auto-optimization failed:', error);
        } finally {
          isOptimizing = false;
        }
      }
    }, 2000); // Wait 2 seconds after user stops typing
  }
}

function addStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 0 12px 40px rgba(37, 99, 235, 0.7), 0 0 0 3px rgba(255, 255, 255, 0.4);
      }
      50% { 
        transform: scale(1.08);
        box-shadow: 0 16px 50px rgba(37, 99, 235, 0.8), 0 0 0 4px rgba(255, 255, 255, 0.6);
      }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }
    
    .prompt-optimizer-button {
      animation: pulse 2s infinite, float 3s ease-in-out infinite;
    }
    
    .prompt-optimizer-button:hover {
      animation: none;
      transform: scale(1.15) rotate(5deg);
      box-shadow: 0 20px 60px rgba(37, 99, 235, 0.9), 0 0 0 5px rgba(255, 255, 255, 0.7);
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
      
      // Remove previous event listeners
      chatInputField.removeEventListener('input', handleInputChange);
      
      // Add new event listener
      chatInputField.addEventListener('input', handleInputChange);
      
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
    if (input && input !== chatInputField) {
      console.log('New ChatGPT input found via interval');
      chatInputField = input;
      
      // Remove previous event listeners
      chatInputField.removeEventListener('input', handleInputChange);
      
      // Add new event listener
      chatInputField.addEventListener('input', handleInputChange);
      
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
      
      // Add event listener for automatic optimization
      chatInputField.addEventListener('input', handleInputChange);
      
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
  
  try {
    createFloatingButton();
    addStyles();
    
    // Ensure button is visible immediately
    if (buttonDiv) {
      buttonDiv.style.display = 'flex';
      buttonDiv.style.visibility = 'visible';
      buttonDiv.style.opacity = '1';
      console.log('Button created and made visible');
    }
    
    // Position button immediately
    setTimeout(() => {
      try {
        positionButtonNearInput();
      } catch (error) {
        console.error('Error positioning button:', error);
      }
    }, 100);
    
    // Position button multiple times to ensure visibility
    setTimeout(() => {
      if (buttonDiv) {
        try {
          positionButtonNearInput();
          console.log('Button repositioned after 1s');
        } catch (error) {
          console.error('Error repositioning button after 1s:', error);
        }
      }
    }, 1000);
    
    setTimeout(() => {
      if (buttonDiv) {
        try {
          positionButtonNearInput();
          console.log('Button repositioned after 2s');
        } catch (error) {
          console.error('Error repositioning button after 2s:', error);
        }
      }
    }, 2000);
    
    setTimeout(() => {
      if (buttonDiv) {
        try {
          positionButtonNearInput();
          console.log('Button repositioned after 5s');
        } catch (error) {
          console.error('Error repositioning button after 5s:', error);
        }
      }
    }, 5000);
    
    // Add window resize listener to reposition button
    window.addEventListener('resize', () => {
      if (buttonDiv && isVisible) {
        try {
          positionButtonNearInput();
        } catch (error) {
          console.error('Error repositioning button on resize:', error);
        }
      }
    });
    
    // Add scroll listener to ensure button stays visible
    window.addEventListener('scroll', () => {
      if (buttonDiv && isVisible) {
        try {
          positionButtonNearInput();
        } catch (error) {
          console.error('Error repositioning button on scroll:', error);
        }
      }
    });
    
    // Monitor ChatGPT input if on ChatGPT
    if (isChatGPT) {
      monitorChatGPTInput();
    }
    
    console.log('Content script initialized');
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'GET_SELECTED_TEXT') {
    let selectedText = '';
    
    // Try to get text from ChatGPT input first
    if (isChatGPT && chatInputField) {
      selectedText = chatInputField.value;
      console.log('Got text from ChatGPT input:', selectedText.substring(0, 50) + '...');
    }
    
    // If no text in input, get selected text
    if (!selectedText) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        selectedText = selection.toString().trim();
        console.log('Got text from selection:', selectedText.substring(0, 50) + '...');
      }
    }
    
    console.log('Sending selected text:', selectedText.substring(0, 50) + '...');
    sendResponse({ text: selectedText });
  }
  
  if (message.type === 'GET_CHATGPT_TEXT') {
    let chatGPTText = '';
    
    if (isChatGPT && chatInputField) {
      chatGPTText = chatInputField.value;
      console.log('Sending ChatGPT text:', chatGPTText.substring(0, 50) + '...');
    }
    
    sendResponse({ text: chatGPTText });
  }
  
  if (message.type === 'REPLACE_CHATGPT_TEXT') {
    const newText = message.text || '';
    console.log('Replacing ChatGPT text with:', newText.substring(0, 50) + '...');
    
    if (isChatGPT && chatInputField) {
      replaceInputText(newText);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'ChatGPT input not found' });
    }
  }
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Add keyboard shortcut to debug button (Ctrl+Shift+B)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'B') {
    console.log('Debug shortcut pressed');
    debugButtonVisibility();
    
    // Force create and show button if it doesn't exist
    if (!buttonDiv) {
      createFloatingButton();
    }
    if (buttonDiv) {
      buttonDiv.style.display = 'flex';
      buttonDiv.style.visibility = 'visible';
      buttonDiv.style.opacity = '1';
      buttonDiv.style.transform = 'scale(1.2)';
      buttonDiv.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.8)';
      positionButtonNearInput();
      
      // Reset transform after 2 seconds
      setTimeout(() => {
        if (buttonDiv) {
          buttonDiv.style.transform = 'scale(1)';
          buttonDiv.style.boxShadow = '0 8px 32px rgba(37, 99, 235, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3)';
        }
      }, 2000);
    }
  }
});

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