import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ResultViewer } from './ResultViewer';

interface PromptOptimizerProps {
  initialText?: string;
}

const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ initialText = '' }) => {
  const [system_prompt, setSystemPrompt] = useState(initialText);
  const [context, setContext] = useState('');
  const [target_audience, setTargetAudience] = useState('');
  const [optimization_focus, setOptimizationFocus] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [optimizationLevel, setOptimizationLevel] = useState<'basic' | 'advanced' | 'expert'>('basic');

  useEffect(() => {
    // Test connection on mount
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const response = await apiService.testConnection();
      setIsConnected(response);
      setError(''); // Clear any previous errors
    } catch (error) {
      setIsConnected(false);
      setError('API server is not running. Please start the server at localhost:8000');
    }
  };

  const handleOptimize = async () => {
    if (!system_prompt.trim()) return;
    
    setIsOptimizing(true);
    setError('');

    try {
      const response = await apiService.optimizePrompt({
        system_prompt: system_prompt.trim(),
        context: context.trim() || undefined,
        target_audience: target_audience.trim() || undefined,
        optimization_focus: optimization_focus.length > 0 ? optimization_focus : undefined,
        constraints: constraints.trim() || undefined
      });
      
      setResult(response);
    } catch (error: any) {
      setError(error.message || 'Optimization failed');
      // Re-test connection if optimization fails
      testConnection();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFocusChange = (focus: string) => {
    setOptimizationFocus(prev => 
      prev.includes(focus) 
        ? prev.filter(f => f !== focus)
        : [...prev, focus]
    );
  };

  const optimizationLevels = [
    { id: 'basic', label: 'Basic', icon: '⚡', description: 'Quick improvements' },
    { id: 'advanced', label: 'Advanced', icon: '🚀', description: 'Comprehensive optimization' },
    { id: 'expert', label: 'Expert', icon: '🎯', description: 'Professional-grade refinement' }
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
              <h1 className="text-lg font-bold">Prompt Optimizer</h1>
              <p className="text-blue-100 text-xs">Advanced AI-powered optimization</p>
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
        {/* Optimization Level */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Optimization Level</label>
          <div className="grid grid-cols-3 gap-2">
            {optimizationLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setOptimizationLevel(level.id as any)}
                className={`p-3 rounded border-2 text-xs transition-all ${
                  optimizationLevel === level.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm mb-1">{level.icon}</div>
                <div className="font-medium">{level.label}</div>
                <div className="text-xs opacity-75">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">
            System Prompt
            {isOptimizing && (
              <span className="ml-2 inline-flex items-center text-blue-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Optimizing...
              </span>
            )}
          </label>
          <textarea
            value={system_prompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter your system prompt here..."
            className="w-full px-3 py-2 border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
          />
        </div>

        {/* Context */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Context (Optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Additional context for optimization..."
            className="w-full px-3 py-2 border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Target Audience */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Target Audience (Optional)</label>
          <input
            type="text"
            value={target_audience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Developers, Students, Business Users"
            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Optimization Focus */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Optimization Focus (Optional)</label>
          <div className="grid grid-cols-2 gap-2">
            {['clarity', 'specificity', 'completeness', 'effectiveness', 'robustness'].map((focus) => (
              <button
                key={focus}
                onClick={() => handleFocusChange(focus)}
                className={`p-3 rounded border text-xs transition-all ${
                  optimization_focus.includes(focus)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium capitalize">{focus}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Constraints (Optional)</label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="Any constraints or requirements..."
            className="w-full px-3 py-2 border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !system_prompt.trim() || !isConnected}
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
              <span>Optimize Prompt</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptOptimizer; 