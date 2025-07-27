import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  ArrowRight,
  Copy,
  RotateCcw,
  History,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface RefinementOption {
  id: string;
  label: string;
  instruction: string;
  category: string;
  priority: number;
}

interface RefinementResult {
  original_prompt: string;
  enhanced_prompt: string;
  refined_prompt: string;
  applied_refinement: string;
  optimization_score: number;
  iteration: number;
  changes_made: string[];
  improvement_explanation: string;
}

interface HistoryItem {
  iteration: number;
  original_prompt: string;
  refined_prompt: string;
  applied_refinement?: string;
  optimization_score?: number;
}

interface SimpleRefineAppendProps {
  originalPrompt: string;
  onRefined: (result: RefinementResult) => void;
  onBack: () => void;
}

const SimpleRefineAppend: React.FC<SimpleRefineAppendProps> = ({ originalPrompt, onRefined, onBack }) => {
  const [refinementOptions, setRefinementOptions] = useState<RefinementOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedOption, setSelectedOption] = useState<RefinementOption | null>(null);
  const [refinementResult, setRefinementResult] = useState<RefinementResult | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  useEffect(() => {
    loadRefinementOptions();
    loadPromptHistory();
  }, [originalPrompt]);

  const loadRefinementOptions = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/simple-refinement/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: originalPrompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load refinement options');
      }
      
      const data = await response.json();
      setRefinementOptions(data.refinement_options || []);
      
    } catch (error: any) {
      setError(error.message);
      // Set fallback options
      setRefinementOptions([
        {
          id: "make_clearer",
          label: "Make it clearer",
          instruction: "Make the prompt clearer and easier to understand",
          category: "tone",
          priority: 5
        },
        {
          id: "add_specifics",
          label: "Add specific details",
          instruction: "Include more specific details and examples",
          category: "specificity",
          priority: 4
        },
        {
          id: "make_concise",
          label: "Make it more concise",
          instruction: "Make the prompt more concise and to the point",
          category: "structure",
          priority: 3
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPromptHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simple-refinement/history');
      
      if (response.ok) {
        const data = await response.json();
        setPromptHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading prompt history:', error);
    }
  };

  const applyRefinement = async (option: RefinementOption) => {
    setIsApplying(true);
    setError('');
    setSelectedOption(option);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/simple-refinement/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_prompt: originalPrompt,
          refinement_instruction: option.instruction
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply refinement');
      }
      
      const result = await response.json();
      setRefinementResult(result);
      onRefined(result);
      
      // Reload history after applying refinement
      await loadPromptHistory();
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tone: 'bg-blue-100 text-blue-800',
      specificity: 'bg-green-100 text-green-800',
      structure: 'bg-purple-100 text-purple-800',
      engagement: 'bg-orange-100 text-orange-800',
      technical: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'bg-red-100 text-red-800';
    if (priority >= 4) return 'bg-orange-100 text-orange-800';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const iterateFromHistory = async (historyItem: HistoryItem, refinementInstruction: string) => {
    setIsApplying(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/simple-refinement/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iteration: historyItem.iteration,
          refinement_instruction: refinementInstruction
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to iterate from history');
      }
      
      const result = await response.json();
      setRefinementResult(result);
      onRefined(result);
      
      // Reload history after iteration
      await loadPromptHistory();
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your prompt for refinement options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Simple Refine</h1>
              <p className="text-sm text-gray-500">Append and re-optimize</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Show history"
          >
            <History className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Original Prompt Display */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Original Prompt</h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {originalPrompt}
            </p>
          </div>
        </div>

        {/* Prompt History */}
        {showHistory && promptHistory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Prompt History</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {promptHistory.map((item, index) => (
                <div key={item.iteration} className="rounded p-3 bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Iteration {item.iteration}</span>
                    <span className="text-xs text-gray-500">
                      Score: {item.optimization_score?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mb-2 truncate">
                    {item.refined_prompt.length > 80 ? item.refined_prompt.substring(0, 80) + '...' : item.refined_prompt}
                  </p>
                  {item.applied_refinement && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600">{item.applied_refinement}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refinement Options */}
        {!refinementResult && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Refinement Options</h3>
            </div>
            
            <div className="space-y-3">
              {refinementOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => applyRefinement(option)}
                  disabled={isApplying}
                  className="w-full p-4 rounded-lg border text-left transition-all bg-white border-gray-200 hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-sm">{option.label}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(option.category)}`}>
                          {option.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(option.priority)}`}>
                          Priority {option.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{option.instruction}</p>
                      <div className="bg-blue-50 rounded p-2">
                        <p className="text-xs text-blue-700 font-medium">Will append:</p>
                        <p className="text-xs text-blue-600 italic">"{option.instruction}"</p>
                      </div>
                    </div>
                    {isApplying && selectedOption?.id === option.id && (
                      <Loader2 className="animate-spin h-4 w-4 text-blue-600 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Refinement Result */}
        {refinementResult && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Refinement Applied</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(refinementResult.refined_prompt)}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => {
                    setRefinementResult(null);
                    setSelectedOption(null);
                  }}
                  className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-700"
                >
                  <RotateCcw size={14} />
                  <span>Try Another</span>
                </button>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Applied: {refinementResult.applied_refinement}
                </span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                {refinementResult.improvement_explanation}
              </p>
              
              {/* Enhanced Prompt */}
              <div className="bg-white rounded p-3 mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Enhanced Prompt:</h4>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">
                  {refinementResult.enhanced_prompt}
                </p>
              </div>
              
              {/* Refined Result */}
              <div className="bg-white rounded p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Refined Result:</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {refinementResult.refined_prompt}
                </p>
              </div>
            </div>

            {refinementResult.changes_made.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-blue-800 mb-2">Changes Made:</h4>
                <ul className="space-y-1">
                  {refinementResult.changes_made.map((change, index) => (
                    <li key={index} className="text-xs text-blue-700 flex items-center space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0">⚠️</div>
              <div>
                <p className="text-red-700 text-sm font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleRefineAppend; 