const Groq = require('groq-sdk');
const { z } = require('zod');

class GroqService {
  constructor() {
    this.client = null;
    this.config = {
      apiKey: process.env.GROQ_API_KEY,
      primaryModel: process.env.GROQ_PRIMARY_MODEL || 'llama-3.1-70b-versatile',
      fastModel: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
      fallbackModel: process.env.GROQ_FALLBACK_MODEL || 'mixtral-8x7b-32768',
      maxRetries: parseInt(process.env.GROQ_MAX_RETRIES) || 3,
      timeout: parseInt(process.env.GROQ_TIMEOUT) || 30000,
    };
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      errors: 0,
    };
  }

  /**
   * Initialize the Groq client
   */
  initialize() {
    if (!this.config.apiKey) {
      console.warn('⚠️  GROQ_API_KEY not found. AI features will be disabled.');
      return false;
    }

    try {
      this.client = new Groq({
        apiKey: this.config.apiKey,
      });
      console.log('✓ Groq AI Service initialized');
      return true;
    } catch (error) {
      console.error('✗ Failed to initialize Groq client:', error.message);
      return false;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.client !== null;
  }

  /**
   * Select optimal model based on task type
   */
  selectModel(taskType = 'standard') {
    const modelMap = {
      fast: this.config.fastModel,
      complex: this.config.primaryModel,
      standard: this.config.primaryModel,
    };
    return modelMap[taskType] || this.config.primaryModel;
  }

  /**
   * Standard chat completion
   */
  async chat(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Groq service not initialized');
    }

    const {
      model = this.selectModel(options.taskType),
      temperature = 0.7,
      maxTokens = 2048,
      topP = 1,
      stream = false,
    } = options;

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stream,
        });
      });

      // Track usage
      this.usageStats.totalRequests++;
      if (response.usage) {
        this.usageStats.totalTokens += response.usage.total_tokens;
      }

      this.logUsage(response.usage, model, 'chat');

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      this.usageStats.errors++;
      console.error('Groq chat error:', error.message);
      throw error;
    }
  }

  /**
   * Streaming chat completion
   */
  async chatStream(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Groq service not initialized');
    }

    const {
      model = this.selectModel(options.taskType),
      temperature = 0.7,
      maxTokens = 2048,
    } = options;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      this.usageStats.totalRequests++;
      return stream;
    } catch (error) {
      this.usageStats.errors++;
      console.error('Groq stream error:', error.message);
      throw error;
    }
  }

  /**
   * Generate structured JSON output
   */
  async generateJSON(messages, schema = null, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Groq service not initialized');
    }

    const {
      model = this.selectModel('complex'),
      temperature = 0.3, // Lower temp for structured output
      maxTokens = 4096,
    } = options;

    try {
      // Add JSON instruction to system message
      const enhancedMessages = [...messages];
      if (enhancedMessages[0]?.role === 'system') {
        enhancedMessages[0].content += '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanations, just pure JSON.';
      } else {
        enhancedMessages.unshift({
          role: 'system',
          content: 'You are a JSON generator. Respond with valid JSON only. No markdown, no explanations.',
        });
      }

      const response = await this.retryWithBackoff(async () => {
        return await this.client.chat.completions.create({
          model,
          messages: enhancedMessages,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        });
      });

      this.usageStats.totalRequests++;
      if (response.usage) {
        this.usageStats.totalTokens += response.usage.total_tokens;
      }

      this.logUsage(response.usage, model, 'generateJSON');

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Validate against schema if provided
      let validatedData = parsed;
      if (schema) {
        validatedData = this.validateResponse(parsed, schema);
      }

      return {
        data: validatedData,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      this.usageStats.errors++;
      console.error('Groq JSON generation error:', error.message);
      
      // Try to extract JSON from response if parsing failed
      if (error instanceof SyntaxError) {
        console.error('Failed to parse JSON response');
      }
      
      throw error;
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = this.config.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Validate response against Zod schema
   */
  validateResponse(response, schema) {
    try {
      if (schema instanceof z.ZodType) {
        return schema.parse(response);
      }
      return response;
    } catch (error) {
      console.error('Schema validation failed:', error.message);
      throw new Error(`Invalid response structure: ${error.message}`);
    }
  }

  /**
   * Log token usage for monitoring
   */
  logUsage(usage, model, endpoint) {
    if (!usage) return;

    const log = {
      timestamp: new Date().toISOString(),
      endpoint,
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    };

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Groq Usage:', JSON.stringify(log));
    }
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      ...this.usageStats,
      averageTokensPerRequest: this.usageStats.totalRequests > 0
        ? Math.round(this.usageStats.totalTokens / this.usageStats.totalRequests)
        : 0,
      errorRate: this.usageStats.totalRequests > 0
        ? (this.usageStats.errors / this.usageStats.totalRequests * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      errors: 0,
    };
  }
}

// Singleton instance
const groqService = new GroqService();

module.exports = groqService;
