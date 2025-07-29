
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
  ChevronUp,
  Star,
  AlertCircle,
  Info,
  CheckCircle2
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 6) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
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
    <div className="h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Wand2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Prompt Optimizer</h1>
              <p className="text-sm text-slate-600">AI-powered prompt enhancement</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              isConnected 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
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
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isConnecting ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {!isConnected && !isConnecting && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center space-x-2">
              <FileText size={18} className="text-slate-600" />
              <h2 className="font-semibold text-slate-900">Your Prompt</h2>
            </div>
          </div>
          
          <div className="p-4">
            <textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-slate-500">
                {currentPrompt.length} characters
              </div>
              
              <button
                onClick={handleOptimize}
                disabled={isOptimizing || !currentPrompt.trim() || !isConnected || isConnecting}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Optimize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Score Overview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                    <TrendingUp size={18} className="text-green-600" />
                    <span>Optimization Complete</span>
                  </h3>
                  
                  <div className="flex items-center space-x-3">
                    {/* Original Score */}
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Original</div>
                      <div className={`text-lg font-bold ${getScoreColor(result.scores?.original?.overall || 5)}`}>
                        {(result.scores?.original?.overall || 5).toFixed(1)}
                      </div>
                    </div>
                    
                    <ArrowRight size={16} className="text-slate-400" />
                    
                    {/* Optimized Score */}
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Optimized</div>
                      <div className={`text-xl font-bold ${getScoreColor(result.scores?.optimized?.overall || 8.5)}`}>
                        {(result.scores?.optimized?.overall || 8.5).toFixed(1)}
                      </div>
                    </div>
                    
                    {/* Improvement Badge */}
                    <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                      <div className="text-xs text-green-700 font-medium">
                        +{((result.scores?.optimized?.overall || 8.5) - (result.scores?.original?.overall || 5)).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues and Improvements */}
            <div className="grid grid-cols-1 gap-4">
              {/* Issues Found */}
              {result.detailed_feedback?.what_was_wrong?.primary_issues && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="border-b border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                      <AlertCircle size={18} className="text-red-500" />
                      <span>Issues Found</span>
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {result.detailed_feedback.what_was_wrong.primary_issues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg border border-red-100">
                          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                          <span className="text-sm text-red-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Improvements Made */}
              {result.detailed_feedback?.what_was_improved?.major_improvements && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="border-b border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                      <CheckCircle2 size={18} className="text-green-500" />
                      <span>Improvements Made</span>
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {result.detailed_feedback.what_was_improved.major_improvements.map((improvement, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg border border-green-100">
                          <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={14} />
                          <span className="text-sm text-green-700">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Prompt Comparison</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Original Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700">Original Prompt</h4>
                    <span className={`text-xs px-2 py-1 rounded border ${getScoreBadgeColor(result.scores?.original?.overall || 5)}`}>
                      Score: {(result.scores?.original?.overall || 5).toFixed(1)}/10
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {result.original_prompt}
                    </p>
                  </div>
                </div>

                {/* Optimized Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700">Optimized Prompt</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded border ${getScoreBadgeColor(result.scores?.optimized?.overall || 8.5)}`}>
                        Score: {(result.scores?.optimized?.overall || 8.5).toFixed(1)}/10
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.optimized_prompt || '')}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-500" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {result.optimized_prompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReplaceInChatGPT}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all"
              >
                <Zap size={16} />
                <span>Use in ChatGPT</span>
                <ArrowRight size={14} />
              </button>
              
              <button
                onClick={() => setShowAdvancedView(true)}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
              >
                <BarChart3 size={16} />
                <span>Detailed Analysis</span>
              </button>
            </div>

            {/* Quick Refinements */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                  <Sparkles size={18} className="text-purple-600" />
                  <span>Quick Refinements</span>
                </h3>
                <p className="text-sm text-slate-600 mt-1">One-click improvements</p>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {quickRefinementOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleQuickRefinement(option)}
                      disabled={isOptimizing}
                      className="p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-6 h-6 rounded bg-gradient-to-r ${option.color} flex items-center justify-center`}>
                          <option.icon size={12} className="text-white" />
                        </div>
                        <span className="font-medium text-sm text-slate-900">{option.label}</span>
                      </div>
                      <p className="text-xs text-slate-600">{option.description}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Refinement Toggle */}
                <button
                  onClick={() => setShowCustomRefinement(!showCustomRefinement)}
                  className="w-full mt-3 flex items-center justify-center space-x-2 py-2 px-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-all"
                >
                  <Plus size={14} />
                  <span className="text-sm font-medium">Custom Refinement</span>
                  {showCustomRefinement ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* Custom Refinement Input */}
                {showCustomRefinement && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <textarea
                      value={customRefinement}
                      onChange={(e) => setCustomRefinement(e.target.value)}
                      placeholder="Describe how you'd like to refine your prompt..."
                      className="w-full h-16 px-3 py-2 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm"
                    />
                    <button
                      onClick={handleCustomRefinement}
                      disabled={isOptimizing || !customRefinement.trim()}
                      className="mt-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 rounded-lg text-white font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      {isOptimizing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 size={14} className="animate-spin" />
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

        {/* Error Display */}
        {error && !isConnecting && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneClickOptimizer;
