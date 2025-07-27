import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PromptOptimizationResult } from '../types/api';
import { FileText, Loader2, Zap, Sparkles, Copy, ArrowRight, CheckCircle, AlertCircle, RefreshCw, History, Settings, Wand2, Target, Layers, Code, Palette, Users, Lightbulb } from 'lucide-react';
import DynamicRefinement from './DynamicRefinement';

interface OneClickOptimizerProps {
  initialText?: string;
  onResult?: (result: PromptOptimizationResult) => void;
}

interface OptimizationHistoryItem {
  iteration: number;
  prompt: string;
  score: number;
  timestamp: Date;
  refinementType?: string;
  analysis?: any;
}

interface AdvancedRefinementOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  instruction: string;
  category: string;
  color: string;
}

const OneClickOptimizer: React.FC<OneClickOptimizerProps> = ({ initialText = '', onResult }) => {
  const [currentPrompt, setCurrentPrompt] = useState(initialText);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvancedRefinements, setShowAdvancedRefinements] = useState(false);
  const [customRefinement, setCustomRefinement] = useState('');

  useEffect(() => {
    if (initialText) {
      setCurrentPrompt(initialText);
    }
    testConnection();
  }, [initialText]);

  const testConnection = async () => {
    try {
      const response = await apiService.testConnection();
      setIsConnected(response);
      if (response) {
        setError('');
      } else {
        setError('API server is not responding. Please check if the server is running on localhost:8000');
      }
    } catch (error: any) {
      setIsConnected(false);
      setError(`Connection failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleOptimize = async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to optimize');
      return;
    }
    
    setIsOptimizing(true);
    setError('');

    try {
      const response = await apiService.optimizePrompt({
        system_prompt: currentPrompt.trim(),
        optimization_focus: ['clarity', 'specificity', 'completeness']
      });
      
      if (!response.optimized_prompt) {
        throw new Error('Invalid response: missing optimized_prompt');
      }
      
      if (onResult) {
        onResult(response);
      }
      
      setCurrentIteration(prev => prev + 1);
      
      const historyItem: OptimizationHistoryItem = {
        iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
        timestamp: new Date(),
        refinementType: 'initial_optimization',
        analysis: response.optimization_analysis
      };
      
      setOptimizationHistory(prev => [historyItem, ...prev]);
      
    } catch (error: any) {
      let errorMessage = 'Optimization failed';
      
      if (error?.message) {
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exceeded')) {
          errorMessage = 'API quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or upgrade your plan.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check if the server is running and try again.';
        } else {
          errorMessage = error.message;
        }
      } else if (error && typeof error === 'object') {
        if (error.response?.data) {
          const responseData = error.response.data;
          if (responseData.includes('429') || responseData.includes('quota') || responseData.includes('exceeded')) {
            errorMessage = 'API quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or upgrade your plan.';
          } else {
            errorMessage = `Server error: ${JSON.stringify(responseData)}`;
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check if the API server is running.';
        } else {
          errorMessage = `Request error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;
        }
      }
      
      setError(errorMessage);
      await testConnection();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRefine = async (instructions: string, refinementType: string = 'custom') => {
    if (!currentPrompt.trim() || !instructions.trim()) {
      setError('Please provide both a prompt and refinement instructions');
      return;
    }
    
    setIsOptimizing(true);
    setError('');

    try {
      const refinedPrompt = `${currentPrompt}\n\nRefinement instructions: ${instructions}`;
      
      const response = await apiService.optimizePrompt({
        system_prompt: refinedPrompt,
        optimization_focus: ['clarity', 'specificity', 'completeness']
      });
      
      if (onResult) {
        onResult(response);
      }
      
      setCurrentPrompt(response.optimized_prompt);
      setCurrentIteration(prev => prev + 1);
      
      const historyItem: OptimizationHistoryItem = {
        iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
        timestamp: new Date(),
        refinementType: refinementType,
        analysis: response.optimization_analysis
      };
      
      setOptimizationHistory(prev => [historyItem, ...prev]);
      
    } catch (error: any) {
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
      await testConnection();
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const resetOptimization = () => {
    setCurrentPrompt(initialText);
    setOptimizationHistory([]);
    setCurrentIteration(0);
    setError('');
    setCustomRefinement('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Beautiful advanced refinement options
  const advancedRefinements: AdvancedRefinementOption[] = [
    {
      id: 'make_concise',
      title: 'Make Concise',
      description: 'Simplify and shorten while keeping essentials',
      icon: Target,
      instruction: 'Make this prompt more concise and to the point while maintaining all essential information',
      category: 'clarity',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
    },
    {
      id: 'add_details',
      title: 'Add Details',
      description: 'Expand with specific information and examples',
      icon: Layers,
      instruction: 'Add more specific details, examples, and comprehensive information to make this prompt more thorough',
      category: 'completeness',
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
    },
    {
      id: 'professional_tone',
      title: 'Professional Tone',
      description: 'Make it formal and business-appropriate',
      icon: Code,
      instruction: 'Transform this prompt to have a more professional, formal, and business-appropriate tone',
      category: 'tone',
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
    },
    {
      id: 'creative_style',
      title: 'Creative Style',
      description: 'Make it imaginative and engaging',
      icon: Sparkles,
      instruction: 'Make this prompt more creative, engaging, and imaginative while maintaining its core purpose',
      category: 'style',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
    },
    {
      id: 'target_audience',
      title: 'Target Audience',
      description: 'Specify who this is for',
      icon: Users,
      instruction: 'Add specific details about your target audience (e.g., "for marketing professionals", "for beginners")',
      category: 'audience',
      color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
    },
    {
      id: 'output_format',
      title: 'Output Format',
      description: 'Define response structure',
      icon: FileText,
      instruction: 'Specify the desired output format (e.g., "provide as bullet points", "write in code format")',
      category: 'format',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
    }
  ];

  const handleAdvancedRefinement = (refinement: AdvancedRefinementOption) => {
    handleRefine(refinement.instruction, refinement.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wand2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Prompt Optimizer</h1>
              <p className="text-sm text-gray-500">AI-powered prompt enhancement</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <button
              onClick={testConnection}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
              title="Retry connection"
            >
              <RefreshCw size={16} className={isOptimizing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Error Banner */}
      {!isConnected && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Connection Issue</p>
              <p className="text-red-600 text-sm">{error || 'API server is not responding'}</p>
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
      <div className="p-4 space-y-6">
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {optimizationHistory.length > 0 ? "Optimized Prompt" : "Your Prompt"}
                </h2>
              </div>
              
              <div className="flex items-center space-x-2">
                {optimizationHistory.length > 0 && (
                  <button
                    onClick={() => copyToClipboard(optimizationHistory[0].prompt)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
                
                {optimizationHistory.length > 0 && (
                  <button
                    onClick={() => setCurrentPrompt(optimizationHistory[0].prompt)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                  >
                    Use as Input
                  </button>
                )}
                
                <button
                  onClick={resetOptimization}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
            
            <textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Enter your prompt here... (e.g., 'I want to write an email to a client')"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              rows={4}
            />
            
            {optimizationHistory.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">Latest Optimization</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(optimizationHistory[0].score)}`}>
                    Score: {optimizationHistory[0].score.toFixed(1)}/10
                  </div>
                </div>
                <p className="text-sm text-blue-600">
                  {optimizationHistory[0].refinementType ? 
                    `Refined with: ${optimizationHistory[0].refinementType.replace('_', ' ')}` : 
                    'Initial optimization completed'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !currentPrompt.trim() || !isConnected}
          className="w-full py-4 px-6 rounded-2xl text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
        >
          {isOptimizing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Zap size={20} />
          )}
          <span>{isOptimizing ? 'Optimizing...' : 'Optimize Prompt'}</span>
        </button>

        {/* Results Section */}
        {optimizationHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Optimized Result</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(optimizationHistory[0].prompt)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {optimizationHistory[0].prompt}
                </p>
              </div>

              {/* Advanced Refinements Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Settings size={18} className="text-gray-600" />
                    <h4 className="text-base font-semibold text-gray-800">Advanced Refinements</h4>
                  </div>
                  <button
                    onClick={() => setShowAdvancedRefinements(!showAdvancedRefinements)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showAdvancedRefinements ? 'Hide' : 'Show'} Advanced
                  </button>
                </div>
                
                {showAdvancedRefinements && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {advancedRefinements.map((refinement) => {
                        const Icon = refinement.icon;
                        return (
                          <button
                            key={refinement.id}
                            onClick={() => handleAdvancedRefinement(refinement)}
                            disabled={isOptimizing}
                            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group ${refinement.color}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <Icon size={16} className="text-current" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-sm">{refinement.title}</h5>
                                  <ArrowRight size={14} className="text-current opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xs opacity-80 leading-relaxed">{refinement.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Refinement */}
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Custom Refinement</h5>
                      <div className="space-y-3">
                        <textarea
                          value={customRefinement}
                          onChange={(e) => setCustomRefinement(e.target.value)}
                          placeholder="Enter your custom refinement instructions..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                          rows={3}
                        />
                        <button
                          onClick={() => {
                            if (customRefinement.trim()) {
                              handleRefine(customRefinement, 'custom');
                              setCustomRefinement('');
                            }
                          }}
                          disabled={isOptimizing || !customRefinement.trim() || !isConnected}
                          className="w-full bg-blue-600 py-2 px-4 rounded-lg text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <Sparkles size={14} />
                          <span>Apply Custom Refinement</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Refinement Component */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles size={18} className="text-purple-600" />
                    <h4 className="text-base font-semibold text-gray-800">Smart Refinements</h4>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(optimizationHistory[0].score)}`}>
                    Score: {optimizationHistory[0].score.toFixed(1)}/10
                  </div>
                </div>
                
                <DynamicRefinement
                  originalPrompt={initialText}
                  optimizedPrompt={optimizationHistory[0].prompt}
                  optimizationAnalysis={optimizationHistory[0].analysis}
                  currentIteration={currentIteration}
                  onRefine={handleRefine}
                  isOptimizing={isOptimizing}
                />
              </div>

              {/* Optimization History */}
              {optimizationHistory.length > 1 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <History size={18} className="text-gray-600" />
                      <h4 className="text-base font-semibold text-gray-800">Optimization History</h4>
                    </div>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showHistory ? 'Hide' : 'Show'} History
                    </button>
                  </div>
                  
                  {showHistory && (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {optimizationHistory.slice(1).map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Iteration {item.iteration}</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(item.score)}`}>
                              {item.score.toFixed(1)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {item.prompt.length > 100 ? item.prompt.substring(0, 100) + '...' : item.prompt}
                          </p>
                          {item.refinementType && (
                            <span className="text-xs text-blue-600 mt-1 block">{item.refinementType}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneClickOptimizer; 