import React, { useState } from 'react';
import { PromptOptimizationResult } from '../types/api';

interface ResultViewerProps {
  result: PromptOptimizationResult;
  onBack: () => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result, onBack }) => {
  const [activeTab, setActiveTab] = useState<'optimized' | 'analysis' | 'feedback'>('optimized');
  const [showRefinement, setShowRefinement] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Safely access nested properties
  const getOptimizedPrompt = () => {
    return result.optimized_prompt || 'No optimized prompt available';
  };

  const getOriginalPrompt = () => {
    return result.original_prompt || 'No original prompt available';
  };

  const getScores = () => {
    return result.scores?.optimized || {};
  };

  const getKeyImprovements = () => {
    return result.optimization_analysis?.key_improvements || [];
  };

  const getRecommendations = () => {
    return result.recommendations || [];
  };

  const getDetailedFeedback = () => {
    return result.detailed_feedback || {};
  };

  const getImprovementMetrics = () => {
    return result.improvement_metrics || {};
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">✨ Optimization Complete</h1>
            <p className="text-sm opacity-90">Your prompt has been enhanced</p>
          </div>
          <button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'optimized', label: 'Optimized Prompt', icon: '✨' },
              { id: 'analysis', label: 'Analysis', icon: '📊' },
              { id: 'feedback', label: 'Feedback', icon: '💡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'optimized' && (
            <div className="space-y-4">
              {/* Original Prompt */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Prompt</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{getOriginalPrompt()}</p>
                </div>
              </div>

              {/* Optimized Prompt */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Optimized Prompt</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{getOptimizedPrompt()}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getOptimizedPrompt());
                  }}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowRefinement(!showRefinement)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  🔧 Refine Further
                </button>
              </div>

              {/* Refinement Options */}
              {showRefinement && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Refinement Options</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 rounded hover:bg-blue-100 text-sm text-blue-700">
                      🎯 Make it more specific
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-blue-100 text-sm text-blue-700">
                      📝 Add more context
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-blue-100 text-sm text-blue-700">
                      ⚡ Make it more concise
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-blue-100 text-sm text-blue-700">
                      🛡️ Add safety constraints
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {/* Scores */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Optimization Scores</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(getScores()).map(([key, score]: [string, any]) => {
                    if (key === 'overall') return null;
                    if (typeof score === 'object' && score.score !== undefined) {
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {key}
                            </span>
                            <span className={`text-sm font-bold ${getScoreColor(score.score)}`}>
                              {score.score}/10
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getScoreBg(score.score)}`}
                              style={{ width: `${(score.score / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Key Improvements */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Improvements</h3>
                <div className="space-y-2">
                  {getKeyImprovements().map((enhancement, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-sm text-gray-700">{enhancement}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Metrics */}
              {getImprovementMetrics().overall_improvement && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Improvement Summary</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">Overall Improvement</span>
                      <span className="text-lg font-bold text-green-600">
                        +{getImprovementMetrics().overall_improvement.toFixed(1)} points
                      </span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {getImprovementMetrics().improvement_percentage?.toFixed(0)}% improvement
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {/* What Was Wrong */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Issues Identified</h3>
                <div className="space-y-2">
                  {getDetailedFeedback().what_was_wrong?.primary_issues?.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-0.5">⚠</span>
                      <span className="text-sm text-gray-700">{issue}</span>
                    </div>
                  )) || (
                    <div className="text-sm text-gray-500">No specific issues identified</div>
                  )}
                </div>
              </div>

              {/* What Was Improved */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Improvements Made</h3>
                <div className="space-y-2">
                  {getDetailedFeedback().what_was_improved?.major_improvements?.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-sm text-gray-700">{improvement}</span>
                    </div>
                  )) || (
                    <div className="text-sm text-gray-500">No specific improvements listed</div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
                <div className="space-y-2">
                  {getRecommendations().map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-0.5">💡</span>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </div>
                  )) || (
                    <div className="text-sm text-gray-500">No specific recommendations available</div>
                  )}
                </div>
              </div>

              {/* Usage Notes */}
              {result.usage_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Usage Notes</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{result.usage_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 