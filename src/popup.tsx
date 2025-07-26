import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import PromptOptimizer from './components/PromptOptimizer';
import { ResultViewer } from './components/ResultViewer';
import OneClickOptimizer from './components/OneClickOptimizer';
import { PromptOptimizationResult } from './types/api';

type ViewMode = 'one-click' | 'advanced';

const Popup: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('one-click');
  const [result, setResult] = useState<PromptOptimizationResult | null>(null);

  useEffect(() => {
    // Get selected text from storage
    chrome.storage.local.get(['selectedText'], (result) => {
      if (result.selectedText) {
        setSelectedText(result.selectedText);
      }
    });

    // Get active tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('Active tab:', tabs[0].url);
      }
    });
  }, []);

  if (result) {
    return <ResultViewer result={result} onBack={() => setResult(null)} />;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Mode Switcher */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('one-click')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              viewMode === 'one-click'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            One-Click
          </button>
          <button
            onClick={() => setViewMode('advanced')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              viewMode === 'advanced'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'one-click' ? (
        <OneClickOptimizer initialText={selectedText} />
      ) : (
        <PromptOptimizer initialText={selectedText} />
      )}
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