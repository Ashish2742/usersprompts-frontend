export interface PromptOptimizationRequest {
  system_prompt: string;
  context?: string;
  target_audience?: string;
  optimization_focus?: string[];
  constraints?: string;
  specialization_type?: string;
}

export interface CriterionScore {
  score: number;
  explanation: string;
  issues?: string[];
  strengths?: string[];
  improvements?: string[];
}

export interface PromptScores {
  clarity: CriterionScore;
  specificity: CriterionScore;
  completeness: CriterionScore;
  effectiveness: CriterionScore;
  robustness: CriterionScore;
  overall: number;
}

export interface OptimizationAnalysis {
  purpose: string;
  target_audience: string;
  key_improvements: string[];
  optimization_techniques_used: string[];
}

export interface OriginalIssues {
  critical_issues: string[];
  major_issues: string[];
  minor_issues: string[];
  missing_elements: string[];
  unclear_instructions: string[];
}

export interface BeforeAfterComparison {
  before: string;
  after: string;
  key_changes: string[];
}

export interface PromptAnalysis {
  original_issues: OriginalIssues;
  original_strengths: string[];
  optimization_focus_areas: string[];
  before_after_comparison: BeforeAfterComparison;
}

export interface WhatWasWrong {
  primary_issues: string[];
  secondary_issues: string[];
  impact_assessment: string;
}

export interface WhatWasImproved {
  major_improvements: string[];
  minor_improvements: string[];
  new_features_added: string[];
}

export interface DetailedFeedback {
  what_was_wrong: WhatWasWrong;
  what_was_improved: WhatWasImproved;
  specific_recommendations: string[];
  best_practices_applied: string[];
  avoidance_guidance: string[];
}

export interface ScoreBreakdown {
  clarity_improvement: number;
  specificity_improvement: number;
  completeness_improvement: number;
  effectiveness_improvement: number;
  robustness_improvement: number;
}

export interface ImprovementMetrics {
  overall_improvement: number;
  improvement_percentage: number;
  key_enhancements: string[];
  score_breakdown: ScoreBreakdown;
}

export interface PromptOptimizationResult {
  original_prompt: string;
  optimized_prompt: string;
  optimization_analysis: OptimizationAnalysis;
  scores: {
    original: PromptScores;
    optimized: PromptScores;
  };
  prompt_analysis: PromptAnalysis;
  improvement_metrics: ImprovementMetrics;
  detailed_feedback: DetailedFeedback;
  recommendations: string[];
  usage_notes: string;
}

export interface BatchOptimizationRequest {
  system_prompts: string[];
  optimization_strategy?: string;
}

export interface BatchOptimizationResult {
  results: PromptOptimizationResult[];
  batch_statistics: {
    total_prompts: number;
    average_improvement: number;
    best_improvement: number;
    prompts_with_improvement: number;
    optimization_strategy: string;
  };
  optimization_strategy: string;
} 