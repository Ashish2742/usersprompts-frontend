
import React, { useState } from 'react';
import { PromptOptimizationResult } from '../types/api';
import { 
  Clipboard, 
  Check, 
  ArrowLeft, 
  Lightbulb, 
  BarChart2, 
  Zap, 
  Sparkles, 
  Target, 
  Settings, 
  Wand2, 
  Palette, 
  Code, 
  Layers,
  TrendingUp,
  Shield,
  Eye,
  Users,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowRight,
  RefreshCw,
  Copy,
  Download
} from 'lucide-react';

interface ResultViewerProps {
  result: PromptOptimizationResult;
  onBack: () => void;
  onRefine?: (instructions: string, refinementType: string, optimizationFocus: string[]) => void;
}

interface RefinementOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  instructions: string;
  optimizationFocus: string[];
  color: string;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result, onBack, onRefine }) => {
  const [activeTab, setActiveTab] = useState<'optimized' | 'analysis' | 'feedback' | 'refine'>('optimized');
  const [copied, setCopied] = useState(false);
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(getOptimizedPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOptimizedPrompt = () => result.optimized_prompt || 'No optimized prompt available';
  const getOriginalPrompt = () => result.original_prompt || 'No original prompt available';
  const getScores = () => result.scores?.optimized || {};
  const getKeyImprovements = () => result.optimization_analysis?.key_improvements || [];
  const getRecommendations = () => result.recommendations || [];
  const getDetailedFeedback = () => result.detailed_feedback || {};

  const tabs = [
    { id: 'optimized', label: 'Result', icon: Star, color: 'from-green-500 to-blue-500' },
    { id: 'analysis', label: 'Analysis', icon: BarChart2, color: 'from-blue-500 to-purple-500' },
    { id: 'feedback', label: 'Insights', icon: Lightbulb, color: 'from-yellow-500 to-orange-500' },
    { id: 'refine', label: 'Refine', icon: Sparkles, color: 'from-purple-500 to-pink-500' }
  ];

  const refinementOptions: RefinementOption[] = [
    {
      id: 'concise',
      label: 'Make Concise',
      description: 'Simplify and shorten',
      icon: Target,
      instructions: 'Make this prompt more concise and to the point while maintaining all essential information',
      optimizationFocus: ['clarity', 'specificity'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'detailed',
      label: 'Add Details',
      description: 'Expand with specifics',
      icon: Layers,
      instructions: 'Add more specific details, examples, and comprehensive information to make this prompt more thorough',
      optimizationFocus: ['completeness', 'specificity'],
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'professional',
      label: 'Professional',
      description: 'Business-appropriate tone',
      icon: Code,
      instructions: 'Transform this prompt to have a more professional, formal, and business-appropriate tone',
      optimizationFocus: ['clarity', 'effectiveness'],
      color: 'from-gray-600 to-gray-800'
    },
    {
      id: 'creative',
      label: 'Creative Style',
      description: 'More imaginative approach',
      icon: Sparkles,
      instructions: 'Make this prompt more creative, engaging, and imaginative while maintaining its core purpose',
      optimizationFocus: ['effectiveness', 'robustness'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'technical',
      label: 'Technical Focus',
      description: 'Add technical constraints',
      icon: Settings,
      instructions: 'Add technical specifications, constraints, and detailed requirements to make this prompt more precise',
      optimizationFocus: ['specificity', 'completeness'],
      color: 'from-indigo-500 to-blue-600'
    },
    {
      id: 'user_friendly',
      label: 'User-Friendly',
      description: 'More accessible language',
      icon: Users,
      instructions: 'Make this prompt more user-friendly, accessible, and easy to understand for a general audience',
      optimizationFocus: ['clarity', 'effectiveness'],
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleRefinementSelection = async (refinement: RefinementOption) => {
    if (!onRefine) return;
    
    setIsRefining(true);
    try {
      await onRefine(refinement.instructions, refinement.id, refinement.optimizationFocus);
    } catch (error) {
      console.error('Refinement failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCustomRefinement = async () => {
    if (!onRefine || !refinementInstructions.trim()) return;
    
    setIsRefining(true);
    try {
      await onRefine(refinementInstructions, 'custom', ['clarity', 'specificity', 'completeness']);
      setRefinementInstructions('');
    } catch (error) {
      console.error('Custom refinement failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'optimized':
        return <OptimizedPromptView />;
      case 'analysis':
        return <AnalysisView />;
      case 'feedback':
        return <FeedbackView />;
      case 'refine':
        return <RefinementView />;
      default:
        return null;
    }
  };

  const OptimizedPromptView = () => {
    const handleReplaceInChatGPT = () => {
      const optimizedText = getOptimizedPrompt();
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id!, {
            type: 'REPLACE_CHATGPT_TEXT',
            text: optimizedText
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

    return (
      <div className="space-y-6">
        {/* Score Overview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Optimization Complete</h3>
                <p className="text-sm text-gray-600">Your prompt has been enhanced</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {result.scores?.optimized?.overall?.toFixed(1) || '8.5'}/10
              </div>
              <p className="text-sm text-gray-500">Overall Score</p>
            </div>
          </div>
        </div>

        {/* Original vs Optimized */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Eye size={16} />
                <span>Original Prompt</span>
              </h4>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {getOriginalPrompt()}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Sparkles size={16} />
                  <span>Optimized Prompt</span>
                </h4>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {getOptimizedPrompt()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
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
            onClick={() => setActiveTab('refine')}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={18} />
            <span>Refine Further</span>
          </button>
        </div>
      </div>
    );
  };

  const AnalysisView = () => {
    const scores = getScores();
    const scoreEntries = Object.entries(scores).filter(([key, value]) => 
      key !== 'overall' && typeof value === 'object' && 'score' in value
    );

    const getScoreColor = (score: number) => {
      if (score >= 8) return 'from-green-500 to-emerald-500';
      if (score >= 6) return 'from-yellow-500 to-orange-500';
      return 'from-red-500 to-pink-500';
    };

    const getScoreIcon = (score: number) => {
      if (score >= 8) return CheckCircle2;
      if (score >= 6) return AlertCircle;
      return AlertCircle;
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Gauge size={20} />
              <span>Performance Metrics</span>
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {scoreEntries.map(([key, value]) => {
              const score = (value as any).score;
              const explanation = (value as any).explanation;
              const ScoreIcon = getScoreIcon(score);
              
              return (
                <div key={key} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <ScoreIcon size={18} className={`${score >= 8 ? 'text-green-500' : score >= 6 ? 'text-yellow-500' : 'text-red-500'}`} />
                      <span className="font-semibold capitalize text-gray-700">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {score}/10
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className={`bg-gradient-to-r ${getScoreColor(score)} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${score * 10}%` }}
                    ></div>
                  </div>
                  
                  {explanation && (
                    <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-4 py-3">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <TrendingUp size={20} />
              <span>Key Improvements</span>
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {getKeyImprovements().map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FeedbackView = () => {
    const feedback = getDetailedFeedback();
    
    return (
      <div className="space-y-6">
        {feedback.what_was_wrong?.primary_issues && feedback.what_was_wrong.primary_issues.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-4 py-3">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <AlertCircle size={20} />
                <span>Issues Identified</span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {feedback.what_was_wrong.primary_issues.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {feedback.what_was_improved?.major_improvements && feedback.what_was_improved.major_improvements.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 px-4 py-3">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <CheckCircle2 size={20} />
                <span>Improvements Made</span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {feedback.what_was_improved.major_improvements.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-3">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Lightbulb size={20} />
              <span>Recommendations</span>
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {getRecommendations().map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Lightbulb className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RefinementView = () => {
    if (!onRefine) {
      return (
        <div className="text-center py-12">
          <Sparkles size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Refinement Not Available</h3>
          <p className="text-sm text-gray-500">Refinement functionality is not available in this context.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
            <h3 className="text-lg font-semibold text-white">Refine Your Prompt</h3>
            <p className="text-sm text-purple-100">Choose a refinement style or create custom instructions</p>
          </div>
          
          <div className="p-6">
            {/* Quick Refinement Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {refinementOptions.map((refinement) => (
                <button
                  key={refinement.id}
                  onClick={() => handleRefinementSelection(refinement)}
                  disabled={isRefining}
                  className="group p-4 rounded-xl border transition-all bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${refinement.color} flex items-center justify-center`}>
                      <refinement.icon size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-sm text-gray-900">{refinement.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-left">{refinement.description}</p>
                </button>
              ))}
            </div>

            {/* Custom Refinement */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Refinement</h4>
              <div className="space-y-3">
                <textarea
                  value={refinementInstructions}
                  onChange={(e) => setRefinementInstructions(e.target.value)}
                  placeholder="Describe how you'd like to refine your prompt..."
                  className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm"
                />
                <button
                  onClick={handleCustomRefinement}
                  disabled={isRefining || !refinementInstructions.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 px-4 rounded-xl text-white font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isRefining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Refining...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      <span>Apply Custom Refinement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Star size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Optimization Results
                </h1>
                <p className="text-sm text-gray-600">
                  {isRefining ? 'Refining your prompt...' : 'Your enhanced prompt is ready'}
                </p>
              </div>
              {isRefining && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-blue-600 font-medium">Processing...</span>
                </div>
              )}
            </div>
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/50 text-gray-600 hover:text-gray-800 transition-all"
              disabled={isRefining}
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Enhanced Tabs */}
          <div className="mt-4">
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  disabled={isRefining}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  } ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
};
