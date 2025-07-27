// Background service worker for UsersPrompts Chrome Extension

let lastSelectedText: string = '';

chrome.runtime.onInstalled.addListener(() => {
  console.log('UsersPrompts AI Extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.type === 'OPEN_POPUP') {
    // Open the popup
    console.log('Opening popup...');
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
  
  if (request.type === 'OPEN_POPUP_WITH_TEXT') {
    // Store the text for the popup to access
    const text = request.text || request.data?.text || '';
    lastSelectedText = text;
    console.log('Storing text and opening popup:', text.substring(0, 50) + '...');
    chrome.storage.local.set({ selectedText: text }, () => {
      chrome.action.openPopup();
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.type === 'GET_LAST_TEXT') {
    sendResponse({ text: lastSelectedText });
    return true;
  }
  
  if (request.type === 'OPTIMIZE_PROMPT') {
    // Handle prompt optimization request
    console.log('Received prompt optimization request:', request.data);
    sendResponse({ success: true });
  }
  
  if (request.type === 'SCORE_PROMPT') {
    // Handle prompt scoring request
    console.log('Received prompt scoring request:', request.data);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'optimizePrompt',
      title: 'Optimize Prompt with UsersPrompts',
      contexts: ['selection']
    });
    console.log('Context menu created');
  } catch (error) {
    console.log('Context menus not available:', error);
  }
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'optimizePrompt' && info.selectionText) {
    console.log('Context menu clicked, storing text:', info.selectionText.substring(0, 50) + '...');
    // Store selected text and open popup
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      chrome.action.openPopup();
    });
  }
});

// Handle popup opening
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
  chrome.action.openPopup();
}); 