import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ResultViewer } from './ResultViewer';
import { PromptOptimizationResult } from '../types/api';

interface OneClickOptimizerProps {
  initialText?: string;
}

interface OptimizationHistoryItem {
  iteration: number;
  prompt: string;
  score: number;
  timestamp: Date;
}

const OneClickOptimizer: React.FC<OneClickOptimizerProps> = ({ initialText = '' }) => {
  const [currentPrompt, setCurrentPrompt] = useState(initialText);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [error, setError] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [result, setResult] = useState<PromptOptimizationResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (initialText) {
      setCurrentPrompt(initialText);
    }
    // Test connection on mount
    testConnection();
  }, [initialText]);

  const testConnection = async () => {
    try {
      console.log('Testing connection to API...');
      const response = await apiService.testConnection();
      console.log('Connection test result:', response);
      setIsConnected(response);
      if (response) {
        setError(''); // Clear any previous errors
        console.log('✅ API connection successful');
      } else {
        setError('API server is not responding. Please check if the server is running on localhost:8000');
        console.log('❌ API connection failed');
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setIsConnected(false);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || 
                          (error && typeof error === 'object' ? JSON.stringify(error) : 'Unknown connection error');
      setError(`Connection failed: ${errorMessage}`);
    }
  };

  const handleOptimize = async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to optimize');
      return;
    }
    
    setIsOptimizing(true);
    setError('');
    console.log('🚀 Starting optimization process...');

    try {
      console.log('Sending optimization request with prompt:', currentPrompt.trim());
      
      const response = await apiService.optimizePrompt({
        system_prompt: currentPrompt.trim(),
        optimization_focus: ['clarity', 'specificity', 'completeness']
      });
      
      console.log('✅ Optimization successful!');
      console.log('Response keys:', Object.keys(response));
      
      setResult(response);
      setCurrentIteration(prev => prev + 1);
      
      // Add to history
      const historyItem: OptimizationHistoryItem = {
        iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
        timestamp: new Date()
      };
      
      setOptimizationHistory(prev => [historyItem, ...prev]);
      
    } catch (error: any) {
      console.error('❌ Optimization failed:', error);
      
      // Improved error message handling
      let errorMessage = 'Optimization failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle different error object structures
        if (error.response?.data) {
          errorMessage = `Server error: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Please check if the API server is running.';
        } else {
          errorMessage = `Request error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;
        }
      }
      
      setError(errorMessage);
      console.log('Error details:', {
        type: typeof error,
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
        request: error?.request
      });
      
      // Re-test connection if optimization fails
      await testConnection();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRefine = async (instructions: string) => {
    if (!currentPrompt.trim() || !instructions.trim()) {
      setError('Please provide both a prompt and refinement instructions');
      return;
    }
    
    setIsOptimizing(true);
    setError('');
    console.log('🔄 Starting refinement process...');

    try {
      const refinedPrompt = `${currentPrompt}\n\nRefinement instructions: ${instructions}`;
      console.log('Sending refinement request...');
      
      const response = await apiService.optimizePrompt({
        system_prompt: refinedPrompt,
        optimization_focus: ['clarity', 'specificity', 'completeness']
      });
      
      console.log('✅ Refinement successful!');
      
      setResult(response);
      setCurrentPrompt(response.optimized_prompt);
      setCurrentIteration(prev => prev + 1);
      
      // Add to history
      const historyItem: OptimizationHistoryItem = {
        iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
        timestamp: new Date()
      };
      
      setOptimizationHistory(prev => [historyItem, ...prev]);
      
    } catch (error: any) {
      console.error('❌ Refinement failed:', error);
      
      // Improved error message handling (same as above)
      let errorMessage = 'Refinement failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        if (error.response?.data) {
          errorMessage = `Server error: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Please check if the API server is running.';
        } else {
          errorMessage = `Request error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;
        }
      }
      
      setError(errorMessage);
      
      // Re-test connection if refinement fails
      await testConnection();
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('✅ Text copied to clipboard');
    }).catch((err) => {
      console.error('❌ Failed to copy text:', err);
    });
  };

  const resetOptimization = () => {
    console.log('🔄 Resetting optimization...');
    setCurrentPrompt(initialText);
    setOptimizationHistory([]);
    setCurrentIteration(0);
    setResult(null);
    setError('');
  };

  const quickRefinements = [
    { label: 'Make it more concise', instructions: 'Make this prompt more concise and to the point' },
    { label: 'Add more detail', instructions: 'Add more specific details and examples' },
    { label: 'Improve clarity', instructions: 'Make this prompt clearer and easier to understand' },
    { label: 'Add constraints', instructions: 'Add specific constraints and limitations' },
    { label: 'Make it more professional', instructions: 'Make this prompt more professional and formal' },
    { label: 'Add examples', instructions: 'Add specific examples and use cases' }
  ];

  if (result) {
    return <ResultViewer result={result} onBack={() => setResult(null)} />;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">One-Click Optimizer</h1>
              <p className="text-blue-100 text-xs">Instant AI-powered optimization</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isConnected ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <button
              onClick={testConnection}
              className="w-6 h-6 bg-white/20 rounded flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Retry connection"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Error Banner */}
      {!isConnected && (
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm font-medium">API Server Not Connected</span>
            </div>
            <button
              onClick={testConnection}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Current Prompt */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900">Current Prompt</label>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(currentPrompt)}
                className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={resetOptimization}
                className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          <textarea
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full bg-white border border-gray-200 rounded p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        {/* One-Click Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !currentPrompt.trim() || !isConnected}
          className="w-full py-3 px-4 rounded-lg text-base font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          {isOptimizing ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Optimize Now</span>
            </>
          )}
        </button>

        {/* Quick Refinement Options */}
        {optimizationHistory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-900 mb-3 block">Quick Refinements</label>
            <div className="grid grid-cols-2 gap-2">
              {quickRefinements.map((refinement, index) => (
                <button
                  key={index}
                  onClick={() => handleRefine(refinement.instructions)}
                  disabled={isOptimizing || !isConnected}
                  className="p-3 rounded border text-xs transition-all bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium mb-1">{refinement.label}</div>
                  <div className="text-gray-500 text-xs">{refinement.instructions.substring(0, 50)}...</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Refinement */}
        {optimizationHistory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-900 mb-3 block">Custom Refinement</label>
            <textarea
              value={refinementInstructions}
              onChange={(e) => setRefinementInstructions(e.target.value)}
              placeholder="Enter your custom refinement instructions..."
              className="w-full h-16 px-3 py-2 border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                handleRefine(refinementInstructions);
                setRefinementInstructions('');
              }}
              disabled={isOptimizing || !refinementInstructions.trim() || !isConnected}
              className="mt-2 bg-blue-600 py-2 px-4 rounded text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply Refinement
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-700 text-sm font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Optimization History */}
        {optimizationHistory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-900">Optimization History</label>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {showHistory ? 'Hide' : 'Show'} History
              </button>
            </div>
            {showHistory && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {optimizationHistory.map((item, index) => (
                  <div key={index} className="rounded p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Iteration {item.iteration}</span>
                      <span className="text-xs text-gray-500">Score: {item.score.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-700 truncate">
                      {item.prompt.length > 100 ? item.prompt.substring(0, 100) + '...' : item.prompt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OneClickOptimizer; 