import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ResultViewer } from './ResultViewer';
import { Zap, Wifi, WifiOff, RefreshCw, AlertTriangle, ChevronsRight, Settings, Target, Text, FileText, Loader2, Wand2 } from 'lucide-react';

interface PromptOptimizerProps {
  initialText?: string;
  onResult?: (result: any) => void;
}

const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ initialText = '', onResult }) => {
  const [system_prompt, setSystemPrompt] = useState(initialText);
  const [context, setContext] = useState('');
  const [target_audience, setTargetAudience] = useState('');
  const [optimization_focus, setOptimizationFocus] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true); // Assume connected initially
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setError('');
    try {
      await apiService.testConnection();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      setError('API server is not running. Start the server at localhost:8000');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOptimize = async () => {
    if (!system_prompt.trim() || !isConnected) return;
    
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
      
      // Use the onResult callback if provided
      if (onResult) {
        onResult(response);
      }
    } catch (error: any) {
      setError(error.message || 'Optimization failed. Please try again.');
      testConnection(); // Re-test connection on failure
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

  const InputSection: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wand2 size={20} className="text-blue-600" />
                </div>
                <div>
                    <h1 className="text-base font-semibold text-gray-900">Prompt Optimizer</h1>
                    <p className="text-sm text-gray-500">AI-powered prompt engineering</p>
                </div>
            </div>
             <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnecting ? <Loader2 size={12} className="animate-spin" /> : isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                  <span>{isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <button
                    onClick={testConnection}
                    disabled={isConnecting}
                    className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    title="Retry connection"
                >
                    <RefreshCw size={16} className={isConnecting ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {!isConnected && !isConnecting && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 text-sm font-medium">{error || 'API Server connection failed.'}</p>
                </div>
            </div>
        )}

        <InputSection title="System Prompt" icon={FileText}>
          <textarea
            value={system_prompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter the core instruction for the AI..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            rows={6}
          />
        </InputSection>

        <InputSection title="Context" icon={ChevronsRight}>
           <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide relevant background or examples..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            rows={3}
          />
        </InputSection>

         <InputSection title="Target Audience" icon={Target}>
          <input
            type="text"
            value={target_audience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Software Developers, Marketing Experts"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </InputSection>
        
        <InputSection title="Optimization Focus" icon={Settings}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['clarity', 'specificity', 'completeness', 'effectiveness', 'robustness'].map((focus) => (
              <button
                key={focus}
                onClick={() => handleFocusChange(focus)}
                className={`p-3 rounded-md border text-sm font-medium capitalize transition-all ${
                  optimization_focus.includes(focus)
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                {focus}
              </button>
            ))}
          </div>
        </InputSection>

        <InputSection title="Constraints" icon={Text}>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="Define any rules or limitations..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            rows={2}
          />
        </InputSection>

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !system_prompt.trim() || !isConnected || isConnecting}
          className="w-full py-3 px-4 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          {isOptimizing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Zap size={20} />
          )}
          <span>{isOptimizing ? 'Optimizing...' : 'Optimize Prompt'}</span>
        </button>

        {error && !isConnecting && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
             <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptOptimizer; 