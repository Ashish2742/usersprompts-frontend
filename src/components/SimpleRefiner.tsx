import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  ArrowRight,
  Copy,
  RotateCcw
} from 'lucide-react';

interface RefinementSuggestion {
  id: string;
  label: string;
  description: string;
  category: string;
  priority: number;
}

interface RefinementResult {
  original_prompt: string;
  refined_prompt: string;
  refinement_id: string;
  refinement_label: string;
  changes_made: string[];
  improvement_explanation: string;
  diff_view: any;
}

interface SimpleRefinerProps {
  optimizedPrompt: string;
  onRefined: (result: RefinementResult) => void;
  onBack: () => void;
}

const SimpleRefiner: React.FC<SimpleRefinerProps> = ({ optimizedPrompt, onRefined, onBack }) => {
  const [suggestions, setSuggestions] = useState<RefinementSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RefinementSuggestion | null>(null);
  const [refinementResult, setRefinementResult] = useState<RefinementResult | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [optimizedPrompt]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/refinement/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: optimizedPrompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load refinement suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
    } catch (error: any) {
      setError(error.message);
      // Set fallback suggestions
      setSuggestions([
        {
          id: "make_concise",
          label: "Make more concise",
          description: "Remove unnecessary words while keeping key information",
          category: "structure",
          priority: 4
        },
        {
          id: "add_specifics",
          label: "Add specific details",
          description: "Include more specific examples or context",
          category: "specificity",
          priority: 3
        },
        {
          id: "improve_clarity",
          label: "Improve clarity",
          description: "Make the prompt clearer and easier to understand",
          category: "tone",
          priority: 5
        },
        {
          id: "add_cta",
          label: "Add call-to-action",
          description: "Include a clear next step for the reader",
          category: "engagement",
          priority: 4
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyRefinement = async (suggestion: RefinementSuggestion) => {
    setIsApplying(true);
    setError('');
    setSelectedSuggestion(suggestion);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/refinement/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_prompt: optimizedPrompt,
          refinement_id: suggestion.id,
          refinement_label: suggestion.label,
          refinement_description: suggestion.description
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply refinement');
      }
      
      const result = await response.json();
      setRefinementResult(result);
      onRefined(result);
      
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
      structure: 'bg-green-100 text-green-800',
      specificity: 'bg-purple-100 text-purple-800',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your optimized prompt...</p>
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
              <h1 className="text-lg font-semibold text-gray-900">Simple Refiner</h1>
              <p className="text-sm text-gray-500">Tap to choose your refinement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Optimized Prompt Display */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Optimized Prompt</h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {optimizedPrompt}
            </p>
          </div>
        </div>

        {/* Refinement Suggestions */}
        {!refinementResult && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Suggested Refinements</h3>
            </div>
            
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => applyRefinement(suggestion)}
                  disabled={isApplying}
                  className="w-full p-4 rounded-lg border text-left transition-all bg-white border-gray-200 hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-sm">{suggestion.label}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                          {suggestion.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                          Priority {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{suggestion.description}</p>
                    </div>
                    {isApplying && selectedSuggestion?.id === suggestion.id && (
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
                    setSelectedSuggestion(null);
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
                  Applied: {refinementResult.refinement_label}
                </span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                {refinementResult.improvement_explanation}
              </p>
              <div className="bg-white rounded p-3">
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

export default SimpleRefiner; 