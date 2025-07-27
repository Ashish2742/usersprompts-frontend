
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ResultViewer } from './ResultViewer';
import { PromptOptimizationResult, OptimizationAnalysis } from '../types/api';
import { 
  Zap, 
  FileText, 
  Copy, 
  CheckCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  Loader2, 
  Wand2,
  Sparkles,
  Target,
  BarChart3,
  History,
  TrendingUp,
  Clock,
  ArrowRight,
  Users,
  Layers,
  Code,
  Palette,
  Settings,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OptimizationHistoryItem {
  iteration: number;
  prompt: string;
  score: number;
  timestamp: Date;
  refinementType: string;
  analysis?: OptimizationAnalysis;
}

interface QuickRefinementOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  instructions: string;
  color: string;
}

interface OneClickOptimizerProps {
  initialText?: string;
  onResult?: (result: PromptOptimizationResult) => void;
}

const OneClickOptimizer: React.FC<OneClickOptimizerProps> = ({ 
  initialText = '', 
  onResult 
}) => {
  const [currentPrompt, setCurrentPrompt] = useState(initialText);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<PromptOptimizationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryItem[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showAdvancedView, setShowAdvancedView] = useState(false);
  const [customRefinement, setCustomRefinement] = useState('');
  const [showCustomRefinement, setShowCustomRefinement] = useState(false);

  const quickRefinementOptions: QuickRefinementOption[] = [
    {
      id: 'concise',
      label: 'Make Concise',
      description: 'Simplify and shorten',
      icon: Target,
      instructions: 'Make this prompt more concise and to the point while maintaining all essential information',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'detailed',
      label: 'Add Details',
      description: 'Expand with specifics',
      icon: Layers,
      instructions: 'Add more specific details, examples, and comprehensive information to make this prompt more thorough',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'professional',
      label: 'Professional',
      description: 'Business-appropriate',
      icon: Code,
      instructions: 'Transform this prompt to have a more professional, formal, and business-appropriate tone',
      color: 'from-gray-600 to-gray-800'
    },
    {
      id: 'creative',
      label: 'Creative',
      description: 'More imaginative',
      icon: Sparkles,
      instructions: 'Make this prompt more creative, engaging, and imaginative while maintaining its core purpose',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  useEffect(() => {
    testConnection();
    if (initialText) {
      setCurrentPrompt(initialText);
    }
  }, [initialText]);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleOptimize = async () => {
    if (!currentPrompt.trim() || !isConnected) return;
    
    setIsOptimizing(true);
    setError('');
    setResult(null);

    try {
      const response = await apiService.optimizePrompt({
        system_prompt: currentPrompt.trim(),
        optimization_focus: ['clarity', 'specificity', 'completeness', 'effectiveness']
      });
      
      if (!response.optimized_prompt) {
        throw new Error('Invalid response: missing optimized_prompt');
      }
      
      setResult(response);
      if (onResult) {
        onResult(response);
      }
      
      setCurrentIteration(prev => prev + 1);
      
      const historyItem: OptimizationHistoryItem = {
        iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
        timestamp: new Date(),
        refinementType: 'optimization',
        analysis: response.optimization_analysis
      };
      
      setOptimizationHistory(prev => [historyItem, ...prev]);
      
    } catch (error: any) {
      let errorMessage = 'Optimization failed';
      
      if (error?.message) {
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exceeded')) {
          errorMessage = 'API quota exceeded. Please try again later.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check the server connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      testConnection();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleQuickRefinement = async (option: QuickRefinementOption) => {
    if (!result?.optimized_prompt) return;
    
    setIsOptimizing(true);
    setError('');

    try {
      const response = await apiService.optimizePrompt({
        system_prompt: result.optimized_prompt,
        context: `Refinement instructions: ${option.instructions}`,
        optimization_focus: ['clarity', 'specificity', 'completeness']
      });
      
      setResult(response);
      if (onResult) {
        onResult(response);
      }
      
      const historyItem: OptimizationHistoryItem = {
        iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
        timestamp: new Date(),
        refinementType: option.id,
        analysis: response.optimization_analysis
      };
      
      setOptimizationHistory(prev => [historyItem, ...prev]);
      setCurrentIteration(prev => prev + 1);
      
    } catch (error: any) {
      setError(error.message || 'Refinement failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCustomRefinement = async () => {
    if (!result?.optimized_prompt || !customRefinement.trim()) return;
    
    setIsOptimizing(true);
    setError('');

    try {
      const response = await apiService.optimizePrompt({
        system_prompt: result.optimized_prompt,
        context: `Custom refinement: ${customRefinement}`,
        optimization_focus: ['clarity', 'specificity', 'completeness']
      });
      
      setResult(response);
      if (onResult) {
        onResult(response);
      }
      
    const historyItem: OptimizationHistoryItem = {
      iteration: currentIteration + 1,
        prompt: response.optimized_prompt,
        score: response.scores?.optimized?.overall || 7.0,
      timestamp: new Date(),
        refinementType: 'custom',
        analysis: response.optimization_analysis
    };
    
    setOptimizationHistory(prev => [historyItem, ...prev]);
    setCurrentIteration(prev => prev + 1);
      setCustomRefinement('');
      setShowCustomRefinement(false);
      
    } catch (error: any) {
      setError(error.message || 'Custom refinement failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReplaceInChatGPT = () => {
    const textToReplace = result?.optimized_prompt || optimizationHistory[0]?.prompt;
    if (!textToReplace) return;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id!, {
          type: 'REPLACE_CHATGPT_TEXT',
          text: textToReplace
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Error replacing ChatGPT text:', chrome.runtime.lastError);
          } else if (response && response.success) {
            window.close();
          }
        });
      }
    });
  };

  if (showAdvancedView && result) {
    return (
      <ResultViewer 
        result={result} 
        onBack={() => setShowAdvancedView(false)}
      />
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wand2 size={24} className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Prompt Optimizer
                </h1>
                <p className="text-sm text-gray-600">AI-powered prompt enhancement</p>
              </div>
            </div>
            
          <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isConnected 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {isConnecting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isConnected ? (
                  <Wifi size={12} />
                ) : (
                  <WifiOff size={12} />
                )}
                <span>{isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Offline'}</span>
            </div>
              
            <button
              onClick={testConnection}
                disabled={isConnecting}
                className="p-2 rounded-lg hover:bg-white/50 text-gray-600 hover:text-gray-800 transition-all disabled:opacity-50"
            >
                <RefreshCw size={16} className={isConnecting ? 'animate-spin' : ''} />
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {!isConnected && !isConnecting && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto force-scroll p-4 space-y-4" style={{ minHeight: '0', maxHeight: 'calc(100vh - 120px)' }}>
        {/* Input Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div className="flex items-center space-x-2">
              <FileText size={20} className="text-white" />
              <h2 className="text-lg font-semibold text-white">Your Prompt</h2>
            </div>
                </div>
          
          <div className="p-6">
          <textarea
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Enter your prompt here and watch the magic happen..."
              className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm leading-relaxed"
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">
                {currentPrompt.length} characters
              </div>
              
        <button
          onClick={handleOptimize}
                disabled={isOptimizing || !currentPrompt.trim() || !isConnected || isConnecting}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {isOptimizing ? (
                  <>
            <Loader2 size={20} className="animate-spin" />
                    <span>Optimizing...</span>
                  </>
          ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Optimize</span>
                  </>
          )}
        </button>
            </div>
          </div>
        </div>

        {/* Results and Quick Refinement Section */}
        {result && (
          <div className="space-y-4">
            {/* Optimized Result */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={20} className="text-white" />
                    <h3 className="text-lg font-semibold text-white">Optimized Result</h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-white text-sm font-medium">
                        Score: {result.scores?.optimized?.overall?.toFixed(1) || '8.5'}/10
                      </span>
                    </div>
                    
                <button
                      onClick={() => copyToClipboard(result.optimized_prompt || '')}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
                    >
                      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                  </div>
              </div>
            </div>
            
              <div className="p-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4 border border-green-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {result.optimized_prompt}
              </p>
            </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleReplaceInChatGPT}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    <Zap size={18} />
                    <span>Use in ChatGPT</span>
                    <ArrowRight size={16} />
                  </button>
                  
                  <button
                    onClick={() => setShowAdvancedView(true)}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    <BarChart3 size={18} />
                    <span>View Analysis</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Refinement Options */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                <div className="flex items-center space-x-2">
                  <Sparkles size={20} className="text-white" />
                  <h3 className="text-lg font-semibold text-white">Quick Refinements</h3>
                  <span className="text-sm text-purple-100">One-click improvements</span>
            </div>
          </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {quickRefinementOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleQuickRefinement(option)}
                      disabled={isOptimizing}
                      className="group p-4 rounded-xl border transition-all bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center`}>
                          <option.icon size={16} className="text-white" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{option.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 text-left">{option.description}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Refinement Toggle */}
                <button
                  onClick={() => setShowCustomRefinement(!showCustomRefinement)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all"
                >
                  <Plus size={16} />
                  <span className="font-medium">Custom Refinement</span>
                  {showCustomRefinement ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Custom Refinement Input */}
                {showCustomRefinement && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <textarea
                      value={customRefinement}
                      onChange={(e) => setCustomRefinement(e.target.value)}
                      placeholder="Describe how you'd like to refine your prompt..."
                      className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm"
            />
            <button
                      onClick={handleCustomRefinement}
                      disabled={isOptimizing || !customRefinement.trim()}
                      className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isOptimizing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Refining...</span>
                        </div>
                      ) : (
                        'Apply Refinement'
                      )}
            </button>
          </div>
        )}
              </div>
            </div>
          </div>
        )}

        {/* Optimization History */}
        {optimizationHistory.length > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <History size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Optimization History</h3>
            </div>
            
            <div className="space-y-3">
              {optimizationHistory.slice(0, 3).map((item, index) => (
                <div key={item.iteration} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.iteration}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {item.refinementType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{item.timestamp.toLocaleTimeString()}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm font-bold text-gray-700">
                    {item.score.toFixed(1)}/10
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Error Display */}
        {error && !isConnecting && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneClickOptimizer; 
