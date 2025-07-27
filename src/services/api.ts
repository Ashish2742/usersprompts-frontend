import axios from 'axios';
import { 
  PromptOptimizationRequest, 
  PromptOptimizationResult,
  BatchOptimizationRequest,
  BatchOptimizationResult 
} from '../types/api';

const API_BASE_URL = 'http://localhost:8000/api/v1';

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async optimizePrompt(request: PromptOptimizationRequest): Promise<PromptOptimizationResult> {
    try {
      console.log('Making API request to:', `${API_BASE_URL}/prompt-optimizer/optimize`);
      console.log('Request data:', JSON.stringify(request, null, 2));
      
      const response = await this.api.post('/prompt-optimizer/optimize', request);
      console.log('API response received successfully');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      
      return response.data;
    } catch (error: any) {
      console.error('Error optimizing prompt:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
        
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.error || 
                           error.response.data?.message ||
                           `Server error: ${error.response.status}`;
        
        throw new Error(`API Error (${error.response.status}): ${JSON.stringify(errorMessage)}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received. Request details:', {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        });
        throw new Error('No response from server. Please check if the API server is running on localhost:8000');
      } else {
        // Request setup error
        console.error('Request setup error:', error.message);
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async batchOptimizePrompts(request: BatchOptimizationRequest): Promise<BatchOptimizationResult> {
    try {
      console.log('Making batch optimization request');
      const response = await this.api.post('/prompt-optimizer/batch-optimize', request);
      return response.data;
    } catch (error: any) {
      console.error('Error batch optimizing prompts:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.error || 
                           `Server error: ${error.response.status}`;
        throw new Error(`Batch optimization failed: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('No response from server during batch optimization');
      } else {
        throw new Error(`Batch optimization request failed: ${error.message}`);
      }
    }
  }

  async scorePrompt(prompt: string): Promise<any> {
    try {
      console.log('Making score prompt request');
      const response = await this.api.post('/prompt-scorer/score', {
        prompt,
        criteria: ['clarity', 'specificity', 'completeness', 'effectiveness', 'robustness']
      });
      return response.data;
    } catch (error: any) {
      console.error('Error scoring prompt:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.error || 
                           `Server error: ${error.response.status}`;
        throw new Error(`Prompt scoring failed: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('No response from server during prompt scoring');
      } else {
        throw new Error(`Prompt scoring request failed: ${error.message}`);
      }
    }
  }

  async discoverPrompts(searchPaths?: string[]): Promise<any> {
    try {
      console.log('Making discover prompts request');
      const response = await this.api.post('/prompt-optimizer/discover', {
        search_paths: searchPaths || ['.'],
        file_patterns: ['*.py', '*.js', '*.ts', '*.json', '*.yaml', '*.yml', '*.md'],
        include_hidden: false
      });
      return response.data;
    } catch (error: any) {
      console.error('Error discovering prompts:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.error || 
                           `Server error: ${error.response.status}`;
        throw new Error(`Prompt discovery failed: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('No response from server during prompt discovery');
      } else {
        throw new Error(`Prompt discovery request failed: ${error.message}`);
      }
    }
  }

  // Test method to check if API is reachable
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection...');
      const response = await this.api.get('/prompt-optimizer/specializations');
      console.log('API connection test successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('API connection test failed:', error);
      
      if (error.response) {
        console.error('Connection test - Response status:', error.response.status);
        console.error('Connection test - Response data:', error.response.data);
      } else if (error.request) {
        console.error('Connection test - No response received');
      } else {
        console.error('Connection test - Request setup error:', error.message);
      }
      
      return false;
    }
  }

  // Refinement API methods
  async analyzePrompt(prompt: string): Promise<any> {
    try {
      console.log('Analyzing prompt for refinement options...');
      const response = await this.api.post('/refinement/options', { prompt });
      console.log('Prompt analysis completed');
      return response.data;
    } catch (error: any) {
      console.error('Error analyzing prompt:', error);
      throw this.handleError(error);
    }
  }

  async applyRefinement(request: {
    original_prompt: string;
    refinement_type: string;
    slider_values?: Record<string, number>;
    custom_instructions?: string;
  }): Promise<any> {
    try {
      console.log('Applying refinement...');
      const response = await this.api.post('/refinement/apply', request);
      console.log('Refinement applied successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error applying refinement:', error);
      throw this.handleError(error);
    }
  }

  async getRefinementTypes(): Promise<any> {
    try {
      console.log('Getting refinement types...');
      const response = await this.api.get('/refinement/types');
      console.log('Refinement types retrieved');
      return response.data;
    } catch (error: any) {
      console.error('Error getting refinement types:', error);
      throw this.handleError(error);
    }
  }

  async getDynamicRefinementSuggestions(
    originalPrompt: string,
    optimizedPrompt: string,
    optimizationAnalysis?: any,
    currentIteration: number = 1
  ): Promise<any> {
    try {
      const response = await this.api.post('/api/v1/prompt-optimizer/dynamic-refinement-suggestions', {
        original_prompt: originalPrompt,
        optimized_prompt: optimizedPrompt,
        optimization_analysis: optimizationAnalysis,
        current_iteration: currentIteration
      });
      return response.data;
    } catch (error) {
      console.error('Error getting dynamic refinement suggestions:', error);
      throw error;
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const errorMessage = error.response.data?.detail || 
                         error.response.data?.error || 
                         `Server error: ${error.response.status}`;
      return new Error(`API Error (${error.response.status}): ${errorMessage}`);
    } else if (error.request) {
      return new Error('No response from server. Please check if the API server is running.');
    } else {
      return new Error(`Request failed: ${error.message}`);
    }
  }
}

export const apiService = new ApiService(); 