import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Loader2, 
  Zap, 
  Settings, 
  Wand2, 
  Target, 
  Sparkles, 
  Palette, 
  Code, 
  Layers,
  TrendingUp,
  Search,
  Users,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

interface PromptAnalysis {
  prompt_type: string;
  confidence: number;
  keywords: string[];
  tone_indicators: string[];
  suggested_improvements: string[];
  target_audience?: string;
}

interface RefinementOption {
  id: string;
  label: string;
  description: string;
  goal: string;
  api_endpoint: string;
  ui_changes: {
    show_tone_slider?: boolean;
    show_specificity_slider?: boolean;
    show_verbosity_slider?: boolean;
    show_keyword_suggestions?: boolean;
    show_seo_metrics?: boolean;
    show_action_metrics?: boolean;
    show_cta_suggestions?: boolean;
    show_tone_presets?: boolean;
    show_target_audience?: boolean;
    button_style?: 'minimal' | 'default' | 'prominent';
  };
}

interface RefinementResult {
  refined_prompt: string;
  original_prompt: string;
  refinement_type: string;
  diff_view: {
    original: string;
    refined: string;
    changes: Array<{
      position: number;
      original: string;
      refined: string;
      type: 'added' | 'removed' | 'modified';
    }>;
    summary: {
      words_added: number;
      words_removed: number;
      words_modified: number;
    };
  };
  explanation: string;
  ui_changes: any;
}

interface AdvancedRefinerProps {
  originalPrompt: string;
  onRefined: (result: RefinementResult) => void;
  onBack: () => void;
}

const SliderControl: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
  icon?: React.ElementType;
}> = ({ label, value, onChange, minLabel, maxLabel, icon: Icon }) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      {Icon && <Icon size={16} className="text-gray-500" />}
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <span className="text-xs text-gray-500 ml-auto">{Math.round(value * 100)}%</span>
    </div>
    <div className="relative">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  </div>
);

const DiffView: React.FC<{ diff: RefinementResult['diff_view'] }> = ({ diff }) => (
  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
    <h4 className="text-sm font-semibold text-gray-900">Changes Made</h4>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="bg-green-100 text-green-800 p-2 rounded">
        <div className="font-medium">+{diff.summary.words_added}</div>
        <div>Added</div>
      </div>
      <div className="bg-red-100 text-red-800 p-2 rounded">
        <div className="font-medium">-{diff.summary.words_removed}</div>
        <div>Removed</div>
      </div>
      <div className="bg-blue-100 text-blue-800 p-2 rounded">
        <div className="font-medium">{diff.summary.words_modified}</div>
        <div>Modified</div>
      </div>
    </div>
    
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {diff.changes.slice(0, 10).map((change, index) => (
        <div key={index} className="flex items-center space-x-2 text-xs">
          <span className={`px-2 py-1 rounded ${
            change.type === 'added' ? 'bg-green-100 text-green-800' :
            change.type === 'removed' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
          </span>
          <span className="text-gray-600">
            {change.type === 'removed' ? change.original : change.refined}
          </span>
        </div>
      ))}
      {diff.changes.length > 10 && (
        <div className="text-xs text-gray-500 text-center">
          ... and {diff.changes.length - 10} more changes
        </div>
      )}
    </div>
  </div>
);

const AdvancedRefiner: React.FC<AdvancedRefinerProps> = ({ originalPrompt, onRefined, onBack }) => {
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysis | null>(null);
  const [refinementOptions, setRefinementOptions] = useState<RefinementOption[]>([]);
  const [selectedRefinement, setSelectedRefinement] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementResult, setRefinementResult] = useState<RefinementResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // Slider states
  const [toneSlider, setToneSlider] = useState(0.5);
  const [specificitySlider, setSpecificitySlider] = useState(0.5);
  const [verbositySlider, setVerbositySlider] = useState(0.5);
  
  // UI state
  const [showSliders, setShowSliders] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  useEffect(() => {
    analyzePrompt();
  }, [originalPrompt]);

  const analyzePrompt = async () => {
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/refinement/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: originalPrompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze prompt');
      }
      
      const data = await response.json();
      setPromptAnalysis(data.prompt_analysis);
      setRefinementOptions(data.options);
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyRefinement = async () => {
    if (!selectedRefinement) {
      setError('Please select a refinement type');
      return;
    }
    
    setIsRefining(true);
    setError('');
    
    try {
      const sliderValues: Record<string, number> = {};
      if (showSliders) {
        sliderValues.tone = toneSlider;
        sliderValues.specificity = specificitySlider;
        sliderValues.verbosity = verbositySlider;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/refinement/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_prompt: originalPrompt,
          refinement_type: selectedRefinement,
          slider_values: Object.keys(sliderValues).length > 0 ? sliderValues : undefined,
          custom_instructions: customInstructions || undefined
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
      setIsRefining(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPromptTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      cold_email: MessageSquare,
      landing_page: TrendingUp,
      question: Search,
      content_idea: Sparkles,
      social_media: Users,
      blog_post: FileText,
      product_description: Code,
      customer_service: Users,
      general: FileText
    };
    return icons[type] || FileText;
  };

  const getRefinementIcon = (id: string) => {
    const icons: Record<string, React.ElementType> = {
      clarity: Target,
      persuasion: Sparkles,
      conciseness: Code,
      detail: Layers,
      seo: Search,
      performance: TrendingUp,
      tone: Palette,
      specificity: Settings
    };
    return icons[id] || Settings;
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your prompt...</p>
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
              <h1 className="text-lg font-semibold text-gray-900">Advanced Refiner</h1>
              <p className="text-sm text-gray-500">Intelligent prompt refinement with AI analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Prompt Analysis */}
        {promptAnalysis && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              {React.createElement(getPromptTypeIcon(promptAnalysis.prompt_type), { size: 20, className: "text-blue-600" })}
              <h3 className="text-sm font-semibold text-gray-900">Prompt Analysis</h3>
              <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {Math.round(promptAnalysis.confidence * 100)}% confident
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium capitalize">{promptAnalysis.prompt_type.replace('_', ' ')}</span>
              </div>
              {promptAnalysis.target_audience && (
                <div>
                  <span className="text-gray-500">Audience:</span>
                  <span className="ml-2 font-medium">{promptAnalysis.target_audience}</span>
                </div>
              )}
            </div>
            
            {promptAnalysis.keywords.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-500 text-sm">Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {promptAnalysis.keywords.slice(0, 5).map((keyword, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {promptAnalysis.suggested_improvements.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-500 text-sm">Suggested improvements:</span>
                <ul className="mt-1 space-y-1">
                  {promptAnalysis.suggested_improvements.slice(0, 3).map((improvement, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Refinement Options */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Refinement Options</h3>
          <div className="grid grid-cols-2 gap-3">
            {refinementOptions.map((option) => {
              const Icon = getRefinementIcon(option.id);
              const isSelected = selectedRefinement === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedRefinement(option.id);
                    setShowSliders(true);
                  }}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected 
                      ? 'border-blue-300 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon size={16} className="text-blue-600" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <div className="text-gray-600 text-xs">{option.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Controls */}
        {selectedRefinement && showSliders && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Advanced Controls</h3>
              <button
                onClick={() => setShowSliders(!showSliders)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showSliders ? 'Hide' : 'Show'} Controls
              </button>
            </div>
            
            <div className="space-y-4">
              <SliderControl
                label="Tone"
                value={toneSlider}
                onChange={setToneSlider}
                minLabel="Casual"
                maxLabel="Professional"
                icon={Palette}
              />
              
              <SliderControl
                label="Specificity"
                value={specificitySlider}
                onChange={setSpecificitySlider}
                minLabel="Broad"
                maxLabel="Targeted"
                icon={Target}
              />
              
              <SliderControl
                label="Verbosity"
                value={verbositySlider}
                onChange={setVerbositySlider}
                minLabel="Concise"
                maxLabel="Detailed"
                icon={FileText}
              />
            </div>
          </div>
        )}

        {/* Custom Instructions */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Custom Instructions (Optional)</h3>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific instructions for the refinement..."
            className="w-full h-20 px-3 py-2 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Apply Button */}
        <button
          onClick={applyRefinement}
          disabled={isRefining || !selectedRefinement}
          className="w-full py-3 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          {isRefining ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Applying Refinement...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              <span>Apply Refinement</span>
            </>
          )}
        </button>

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

        {/* Refinement Result */}
        {refinementResult && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Refinement Result</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(refinementResult.refined_prompt)}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-700"
                >
                  {showDiff ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showDiff ? 'Hide' : 'Show'} Changes</span>
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {refinementResult.refined_prompt}
              </p>
            </div>
            
            {showDiff && <DiffView diff={refinementResult.diff_view} />}
            
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Explanation:</p>
              <p>{refinementResult.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedRefiner; 