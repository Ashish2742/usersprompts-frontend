import React, { useState } from 'react';
import { PromptOptimizationResult } from '../types/api';
import { Clipboard, Check, ArrowLeft, Lightbulb, BarChart2, Zap, Sparkles, Target, Settings, Wand2, Palette, Code, Layers } from 'lucide-react';

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
    { id: 'optimized', label: 'Optimized Prompt', icon: Zap },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
    { id: 'feedback', label: 'Feedback', icon: Lightbulb },
    { id: 'refine', label: 'Refine', icon: Sparkles }
  ];

  // Refinement options for the optimized prompt
  const refinementOptions: RefinementOption[] = [
    {
      id: 'concise',
      label: 'Make Concise',
      description: 'Simplify and shorten the prompt',
      icon: Target,
      instructions: 'Make this prompt more concise and to the point while maintaining all essential information',
      optimizationFocus: ['clarity', 'specificity']
    },
    {
      id: 'detailed',
      label: 'Add Details',
      description: 'Expand with more specific information',
      icon: Layers,
      instructions: 'Add more specific details, examples, and comprehensive information to make this prompt more thorough',
      optimizationFocus: ['completeness', 'specificity']
    },
    {
      id: 'professional',
      label: 'Professional Tone',
      description: 'Make it more formal and business-like',
      icon: Code,
      instructions: 'Transform this prompt to have a more professional, formal, and business-appropriate tone',
      optimizationFocus: ['clarity', 'effectiveness']
    },
    {
      id: 'creative',
      label: 'Creative Style',
      description: 'Make it more imaginative and engaging',
      icon: Sparkles,
      instructions: 'Make this prompt more creative, engaging, and imaginative while maintaining its core purpose',
      optimizationFocus: ['effectiveness', 'robustness']
    },
    {
      id: 'technical',
      label: 'Technical Focus',
      description: 'Add technical specifications and constraints',
      icon: Settings,
      instructions: 'Add technical specifications, constraints, and detailed requirements to make this prompt more precise',
      optimizationFocus: ['specificity', 'completeness']
    },
    {
      id: 'user_friendly',
      label: 'User-Friendly',
      description: 'Make it more accessible and easy to understand',
      icon: Palette,
      instructions: 'Make this prompt more user-friendly, accessible, and easy to understand for a general audience',
      optimizationFocus: ['clarity', 'effectiveness']
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
      console.log('Replacing ChatGPT text with optimized prompt');
      
      // Send message to content script to replace ChatGPT text
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id!, {
            type: 'REPLACE_CHATGPT_TEXT',
            text: optimizedText
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Error replacing ChatGPT text:', chrome.runtime.lastError);
            } else if (response && response.success) {
              console.log('Successfully replaced ChatGPT text');
              // Close the popup after successful replacement
              window.close();
            } else {
              console.log('Failed to replace ChatGPT text:', response);
            }
          });
        }
      });
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Original Prompt</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {getOriginalPrompt()}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Optimized Prompt</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 whitespace-pre-wrap font-mono">
            {getOptimizedPrompt()}
          </div>
          <div className="mt-4">
            <button
              onClick={handleReplaceInChatGPT}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Zap size={16} />
              <span>Replace in ChatGPT</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AnalysisView = () => {
    const scores = getScores();
    const scoreEntries = Object.entries(scores).filter(([key, value]) => 
      key !== 'overall' && typeof value === 'object' && 'score' in value
    );

    const getColorClasses = (score: number) => {
      if (score >= 8) {
        return {
          text: 'text-green-600',
          bg: 'bg-green-500'
        };
      } else if (score >= 5) {
        return {
          text: 'text-yellow-600',
          bg: 'bg-yellow-500'
        };
      } else {
        return {
          text: 'text-red-600',
          bg: 'bg-red-500'
        };
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Optimization Scores</h3>
          <div className="grid grid-cols-1 gap-4">
            {scoreEntries.map(([key, value]) => {
              const score = (value as any).score;
              const explanation = (value as any).explanation;
              const colorClasses = getColorClasses(score);
              
              return (
                <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold capitalize text-gray-700">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-bold ${colorClasses.text}`}>
                      {score}/10
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`${colorClasses.bg} h-2.5 rounded-full transition-all duration-300`} 
                      style={{ width: `${score * 10}%` }}
                    ></div>
                  </div>
                  {explanation && (
                    <p className="text-xs text-gray-500 mt-2">{explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Key Improvements</h3>
          <ul className="space-y-2">
            {getKeyImprovements().map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <Check className="text-green-500" size={16} />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const FeedbackView = () => {
    const feedback = getDetailedFeedback();
    
    return (
      <div className="space-y-6">
        {feedback.what_was_wrong?.primary_issues && feedback.what_was_wrong.primary_issues.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Issues Identified</h3>
            <ul className="space-y-2">
              {feedback.what_was_wrong.primary_issues.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Zap className="text-red-500" size={16} />
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {feedback.what_was_improved?.major_improvements && feedback.what_was_improved.major_improvements.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Improvements Made</h3>
            <ul className="space-y-2">
              {feedback.what_was_improved.major_improvements.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Check className="text-green-500" size={16} />
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {getRecommendations().map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <Lightbulb className="text-yellow-500" size={16} />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const RefinementView = () => {
    if (!onRefine) {
      return (
        <div className="text-center py-8">
          <Sparkles size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Refinement Not Available</h3>
          <p className="text-sm text-gray-500">Refinement functionality is not available in this context.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Refine Your Optimized Prompt</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose from quick refinement options or create your own custom refinement instructions.
          </p>
        </div>

        {/* Quick Refinement Options */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Refinements</h4>
          <div className="grid grid-cols-2 gap-3">
            {refinementOptions.map((refinement) => (
              <button
                key={refinement.id}
                onClick={() => handleRefinementSelection(refinement)}
                disabled={isRefining}
                className="p-3 rounded-lg border text-left transition-all bg-white border-gray-200 hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <refinement.icon size={14} className="text-blue-600 group-hover:text-blue-700" />
                  <span className="font-medium text-xs">{refinement.label}</span>
                </div>
                <div className="text-gray-500 text-xs">{refinement.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Refinement */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Refinement</h4>
          <div className="space-y-3">
            <textarea
              value={refinementInstructions}
              onChange={(e) => setRefinementInstructions(e.target.value)}
              placeholder="Enter your custom refinement instructions..."
              className="w-full h-20 px-3 py-2 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
            <button
              onClick={handleCustomRefinement}
              disabled={isRefining || !refinementInstructions.trim()}
              className="w-full bg-blue-600 py-2 px-4 rounded-lg text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isRefining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Refining...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Apply Custom Refinement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Optimization Complete</h1>
              <p className="text-sm text-gray-500">
                {isRefining ? 'Refining your prompt...' : 'Your prompt has been enhanced.'}
              </p>
            </div>
            {isRefining && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600 font-medium">Refining...</span>
              </div>
            )}
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Go back"
            disabled={isRefining}
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={isRefining}
                className={`flex items-center space-x-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                } ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
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