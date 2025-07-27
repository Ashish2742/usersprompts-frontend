import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Sparkles, Lightbulb, Target, FileText, Users, Palette, Settings, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface RefinementSuggestion {
  id: string;
  title: string;
  description: string;
  instruction: string;
  category: string;
  priority: number;
}

interface DynamicRefinementProps {
  originalPrompt: string;
  optimizedPrompt: string;
  optimizationAnalysis?: any;
  currentIteration: number;
  onRefine: (instruction: string, refinementType: string) => Promise<void>;
  isOptimizing: boolean;
}

const DynamicRefinement: React.FC<DynamicRefinementProps> = ({
  originalPrompt,
  optimizedPrompt,
  optimizationAnalysis,
  currentIteration,
  onRefine,
  isOptimizing
}) => {
  const [suggestions, setSuggestions] = useState<RefinementSuggestion[]>([]);
  const [guidanceMessage, setGuidanceMessage] = useState<string>('');
  const [needsClarification, setNeedsClarification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSuggestions();
  }, [originalPrompt, optimizedPrompt, currentIteration]);

  const loadSuggestions = async () => {
    if (!originalPrompt.trim() || !optimizedPrompt.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.getDynamicRefinementSuggestions(
        originalPrompt,
        optimizedPrompt,
        optimizationAnalysis,
        currentIteration
      );
      
      setSuggestions(response.suggestions || []);
      setGuidanceMessage(response.guidance_message || '');
      setNeedsClarification(response.needs_clarification || false);
    } catch (error: any) {
      console.error('Failed to load refinement suggestions:', error);
      setError('Failed to load refinement suggestions. Using default suggestions.');
      
      // Always provide fallback suggestions
      const fallbackSuggestions = [
        {
          id: 'add_audience',
          title: 'Add Target Audience',
          description: 'Specify who this prompt is for',
          instruction: 'Add details about your target audience (e.g., "for marketing professionals", "for beginners")',
          category: 'audience',
          priority: 1
        },
        {
          id: 'add_format',
          title: 'Specify Output Format',
          description: 'Define how you want the response structured',
          instruction: 'Specify the desired output format (e.g., "provide as bullet points", "write in code format")',
          category: 'format',
          priority: 2
        },
        {
          id: 'add_tone',
          title: 'Adjust Tone',
          description: 'Make the tone more specific',
          instruction: 'Specify the desired tone (e.g., "use a professional tone", "make it conversational")',
          category: 'tone',
          priority: 3
        },
        {
          id: 'add_context',
          title: 'Add Context',
          description: 'Provide more background information',
          instruction: 'Add relevant context or background information to make the prompt more specific',
          category: 'clarity',
          priority: 4
        },
        {
          id: 'add_examples',
          title: 'Include Examples',
          description: 'Add specific examples or use cases',
          instruction: 'Include specific examples or use cases to make the prompt more concrete',
          category: 'completeness',
          priority: 5
        },
        {
          id: 'add_goals',
          title: 'Define Goals',
          description: 'Specify what you want to achieve',
          instruction: 'Clearly define your goals and desired outcomes for this prompt',
          category: 'goal',
          priority: 6
        }
      ];
      
      setSuggestions(fallbackSuggestions);
      setGuidanceMessage('Want to add your goal or expected output? Click a suggestion below to refine.');
      setNeedsClarification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: RefinementSuggestion) => {
    if (isOptimizing) return;
    
    try {
      await onRefine(suggestion.instruction, suggestion.id);
    } catch (error) {
      console.error('Refinement failed:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'audience':
        return Users;
      case 'format':
        return FileText;
      case 'tone':
        return Palette;
      case 'clarity':
        return Target;
      case 'completeness':
        return Settings;
      case 'goal':
        return Lightbulb;
      default:
        return Sparkles;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'audience':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'format':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'tone':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      case 'clarity':
        return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100';
      case 'completeness':
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
      case 'goal':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Generating smart suggestions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Guidance Message */}
      {guidanceMessage && (
        <div className={`p-4 rounded-xl border-l-4 ${
          needsClarification 
            ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
            : 'bg-blue-50 border-blue-400 text-blue-800'
        }`}>
          <div className="flex items-start space-x-3">
            <Lightbulb size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{guidanceMessage}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Dynamic Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">AI-powered suggestions</span>
            </div>
          </div>
          
          <div className="grid gap-3">
            {suggestions.map((suggestion) => {
              const Icon = getCategoryIcon(suggestion.category);
              const colorClasses = getCategoryColor(suggestion.category);
              
              return (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isOptimizing}
                  className={`w-full p-4 rounded-xl border text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group ${colorClasses}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon size={16} className="text-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-sm">{suggestion.title}</h5>
                        <ArrowRight size={14} className="text-current opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed">{suggestion.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicRefinement; 