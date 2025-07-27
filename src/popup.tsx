import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import OneClickOptimizer from './components/OneClickOptimizer';
import { PromptOptimizationResult } from './types/api';

const Popup: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [result, setResult] = useState<PromptOptimizationResult | null>(null);

  useEffect(() => {
    console.log('Popup useEffect - getting text from storage and content script');
    
    // Get selected text from storage
    chrome.storage.local.get(['selectedText'], (result) => {
      console.log('Storage result:', result);
      if (result.selectedText) {
        console.log('Setting text from storage:', result.selectedText.substring(0, 50) + '...');
        setSelectedText(result.selectedText);
      }
    });

    // Get active tab info and request current text from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('Active tab:', tabs[0].url);
        
        // Request current text from content script with error handling
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'GET_CHATGPT_TEXT' }, (response) => {
          console.log('Content script response:', response);
          if (chrome.runtime.lastError) {
            console.log('Error getting text from content script:', chrome.runtime.lastError);
          } else if (response && response.text && response.text.trim()) {
            console.log('Got text from content script:', response.text.substring(0, 50) + '...');
            setSelectedText(response.text);
          }
        });
      }
    });

    // After querying storage and content script, also ask background for last text
    chrome.runtime.sendMessage({ type: 'GET_LAST_TEXT' }, (resp) => {
      if (resp && resp.text && resp.text.trim()) {
        console.log('Got text from background:', resp.text.substring(0, 50) + '...');
        setSelectedText(resp.text);
      }
    });
  }, []);

  return (
    <div className="w-[400px] h-[600px] overflow-hidden">
      <OneClickOptimizer 
        initialText={selectedText} 
        onResult={setResult}
      />
    </div>
  );
};

// Mount the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} else {
  console.error('Root element not found');
} 