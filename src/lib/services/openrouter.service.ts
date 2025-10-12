// src/lib/services/openrouter.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  OpenRouterConfig,
  GenerateFlashcardsCommand,
  GenerationResult,
  FlashCardProposal,
  ValidationResult,
  ServiceStats,
  OpenRouterRequest,
  OpenRouterResponse,
  GenerationError
} from "../../types";
import {
  RateLimitError,
  QuotaExceededError,
  TimeoutError,
  LanguageDetectionError,
  TextProcessingError,
  ResponseValidationError,
  UnknownError,
  UnauthorizedError,
  InternalError
} from "../errors";

/**
 * Service responsible for communicating with OpenRouter.ai API
 * Handles flashcard generation, language detection, and response validation
 */
export class OpenRouterService {
  private readonly supabase: SupabaseClient;
  private readonly config: OpenRouterConfig;
  private readonly stats: ServiceStats;
  private readonly cache: Map<string, any>;

  constructor(supabase: SupabaseClient, config: OpenRouterConfig) {
    this.supabase = supabase;
    this.config = config;
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalCost: 0,
      averageResponseTime: 0,
    };
    this.cache = new Map();
  }

  /**
   * Get service configuration (read-only)
   */
  get readonlyConfig(): Readonly<OpenRouterConfig> {
    return { ...this.config };
  }

  /**
   * Get service statistics (read-only)
   */
  get readonlyStats(): Readonly<ServiceStats> {
    return { ...this.stats };
  }

  /**
   * Main method for generating flashcards from source text
   * @param command - Generation command with source text and parameters
   * @returns Promise with generation result containing cards and metadata
   */
  async generateFlashcards(command: GenerateFlashcardsCommand): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      // Validate input parameters
      this.validateInput(command);

      // Check user rate limit - TEMPORARILY DISABLED
      // await this.checkUserRateLimit(command.userId);

      // Sanitize source text
      const sanitizedText = this.sanitizeInput(command.sourceText);

      // Detect language if not provided
      const language = command.language || await this.detectLanguage(sanitizedText);
      
      // Chunk text if too long
      const chunks = this.chunkText(sanitizedText);
      
      // Generate flashcards from chunks
      const allCards: FlashCardProposal[] = [];
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalCost = 0;

      for (const chunk of chunks) {
        const chunkResult = await this.processChunk(chunk, language, command.targetCount || 30);
        allCards.push(...chunkResult.cards);
        totalPromptTokens += chunkResult.metadata.promptTokens;
        totalCompletionTokens += chunkResult.metadata.completionTokens;
        totalCost += chunkResult.metadata.totalCost;
      }

      // Deduplicate and limit cards
      const finalCards = this.deduplicateCards(allCards).slice(0, command.targetCount || 30);

      const processingTime = Date.now() - startTime;
      
      // Create result
      const result: GenerationResult = {
        success: true,
        cards: finalCards,
        metadata: {
          model: this.config.defaultModel,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalCost,
          processingTimeMs: processingTime,
          language,
        },
      };

      // Update stats
      this.updateStats(true, totalCost, processingTime);

      // Log metrics to database
      await this.logGenerationMetrics(result, command.generationId);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Create error result
      const result: GenerationResult = {
        success: false,
        cards: [],
        metadata: {
          model: this.config.defaultModel,
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
          processingTimeMs: processingTime,
          language: command.language || 'unknown',
        },
        error: this.mapToGenerationError(error),
      };

      // Update stats
      this.updateStats(false, 0, processingTime);

      // Log error metrics to database
      await this.logGenerationMetrics(result, command.generationId);

      return result;
    }
  }

  /**
   * Detect language of the source text using OpenRouter API
   * @param text - Text to analyze
   * @returns Promise with detected language code (ISO 639-1)
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `lang_${text.substring(0, 100).replace(/\s+/g, '_')}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const request: OpenRouterRequest = {
        model: this.config.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Analyze the text and return ONLY the ISO 639-1 language code. Supported languages: en (English), pl (Polish), es (Spanish). Return exactly one of these codes.'
          },
          {
            role: 'user',
            content: `Detect the language of this text: "${text.substring(0, 500)}"`
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      };

      const response = await this.makeApiRequest(request);
      const detectedLanguage = response.choices[0]?.message?.content?.trim().toLowerCase();
      
      // Validate language code
      const supportedLanguages = ['en', 'pl', 'es'];
      const validLanguage = supportedLanguages.includes(detectedLanguage) ? detectedLanguage : 'en';
      
      // Cache the result
      this.cache.set(cacheKey, validLanguage);
      
      return validLanguage;
      
    } catch (error) {
      console.error('Language detection failed:', error);
      // Try simple heuristic fallback
      const fallbackLanguage = this.detectLanguageHeuristic(text);
      return fallbackLanguage;
    }
  }

  /**
   * Validate API response against defined JSON schema
   * @param response - API response to validate
   * @param schema - JSON schema for validation
   * @returns Validation result with success status and errors
   */
  validateResponse(response: any, schema: any): ValidationResult {
    try {
      // Basic JSON structure validation
      if (!response || typeof response !== 'object') {
        return {
          valid: false,
          errors: ['Response is not a valid JSON object'],
        };
      }

      // Check for required fields
      if (!response.cards || !Array.isArray(response.cards)) {
        return {
          valid: false,
          errors: ['Response missing required "cards" array'],
        };
      }

      // Validate each card
      const errors: string[] = [];
      response.cards.forEach((card: any, index: number) => {
        if (!card.front || typeof card.front !== 'string') {
          errors.push(`Card ${index}: missing or invalid "front" field`);
        }
        if (!card.back || typeof card.back !== 'string') {
          errors.push(`Card ${index}: missing or invalid "back" field`);
        }
        if (typeof card.confidence !== 'number' || card.confidence < 0 || card.confidence > 1) {
          errors.push(`Card ${index}: invalid "confidence" field (must be number 0-1)`);
        }
        if (!card.excerpt || typeof card.excerpt !== 'string') {
          errors.push(`Card ${index}: missing or invalid "excerpt" field`);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? response : undefined,
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Calculate cost of generation based on tokens and model
   * @param promptTokens - Number of prompt tokens
   * @param completionTokens - Number of completion tokens
   * @param model - Model used for generation
   * @returns Cost in USD
   */
  calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    // GPT-4o pricing (as of 2024)
    const pricing = {
      'gpt-4o': { input: 0.0025, output: 0.01 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4': { input: 0.03, output: 0.06 },
    };

    const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4o'];
    
    const inputCost = (promptTokens / 1000) * modelPricing.input;
    const outputCost = (completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  // Private methods will be implemented in the next steps
  private validateInput(command: GenerateFlashcardsCommand): void {
    // Sanitize and validate source text
    const sanitizedText = this.sanitizeInput(command.sourceText);
    this.validateTextContent(sanitizedText);
    
    // Validate target count
    if (command.targetCount && (command.targetCount < 1 || command.targetCount > 30)) {
      throw new TextProcessingError('Target count must be between 1 and 30');
    }
    
    // Validate language
    if (command.language && !['en', 'pl', 'es'].includes(command.language)) {
      throw new TextProcessingError('Unsupported language. Supported: en, pl, es');
    }
    
    // Validate user ID
    if (!command.userId || command.userId.trim().length === 0) {
      throw new TextProcessingError('User ID is required');
    }
    
    // Validate generation ID
    if (!command.generationId || command.generationId.trim().length === 0) {
      throw new TextProcessingError('Generation ID is required');
    }
  }

  private async processChunk(chunk: string, language: string, targetCount: number): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log('Processing chunk:', { chunkLength: chunk.length, language, targetCount });
      
      // Build prompts for this chunk
      const systemPrompt = this.buildSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(chunk, targetCount, language);
      
      console.log('Built prompts:', { systemPromptLength: systemPrompt.length, userPromptLength: userPrompt.length });
      
      // Create API request
      const request: OpenRouterRequest = {
        model: this.config.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.7,
        response_format: this.getResponseFormat(),
      };

      console.log('Making API request to OpenRouter...');
      
      // Make API request with retry logic
      const response = await this.retryWithBackoff(() => this.makeApiRequest(request));
      
      console.log('Received API response:', { responseId: response.id, choicesCount: response.choices.length });
      
      // Parse and validate response
      const parsedResponse = this.parseResponse(response);
      const validation = this.validateResponse(parsedResponse, this.getResponseFormat().json_schema.schema);
      
      if (!validation.valid) {
        throw new ResponseValidationError(`Response validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Calculate costs
      const cost = this.calculateCost(
        response.usage.prompt_tokens,
        response.usage.completion_tokens,
        this.config.defaultModel
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        cards: parsedResponse.cards.map((card: any) => ({
          front: card.front,
          back: card.back,
          confidence: card.confidence,
          excerpt: card.excerpt,
          language,
        })),
        metadata: {
          model: this.config.defaultModel,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalCost: cost,
          processingTimeMs: processingTime,
          language,
        },
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        cards: [],
        metadata: {
          model: this.config.defaultModel,
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
          processingTimeMs: processingTime,
          language,
        },
        error: this.mapToGenerationError(error),
      };
    }
  }

  private chunkText(text: string): string[] {
    if (text.length <= this.config.chunkSize) {
      return [text];
    }
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + this.config.chunkSize;
      
      // Try to break at sentence boundary
      if (end < text.length) {
        const lastSentenceEnd = text.lastIndexOf('.', end);
        const lastQuestionEnd = text.lastIndexOf('?', end);
        const lastExclamationEnd = text.lastIndexOf('!', end);
        
        const lastEnd = Math.max(lastSentenceEnd, lastQuestionEnd, lastExclamationEnd);
        if (lastEnd > start + this.config.chunkSize * 0.5) {
          end = lastEnd + 1;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end;
    }
    
    return chunks;
  }

  private deduplicateCards(cards: FlashCardProposal[]): FlashCardProposal[] {
    const seen = new Set<string>();
    return cards.filter(card => {
      const key = `${card.front.toLowerCase()}-${card.back.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async makeApiRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    // Check if API key is available
    if (!this.config.apiKey) {
      throw new UnauthorizedError('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      // Use global fetch (available in both Deno and modern Node.js)
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://10x-cards.app',
          'X-Title': '10x Cards - Flashcard Generator',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleApiError({
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
      }

      const data: OpenRouterResponse = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${this.config.timeoutMs}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Build system prompt based on language
   * @param language - Target language code
   * @returns System prompt string
   */
  private buildSystemPrompt(language: string): string {
    const languageMap = {
      'pl': {
        role: 'Jesteś ekspertem w tworzeniu fiszek edukacyjnych w języku polskim.',
        rules: `Zasady tworzenia fiszek:
- Front: pytanie lub hasło (max 200 znaków)
- Back: odpowiedź lub definicja (max 500 znaków)
- Jakość: precyzyjne, zwięzłe, edukacyjne
- Język: konsekwentnie polski
- Struktura: pytanie-odpowiedź lub hasło-definicja`
      },
      'en': {
        role: 'You are an expert in creating educational flashcards in English.',
        rules: `Flashcard creation rules:
- Front: question or term (max 200 characters)
- Back: answer or definition (max 500 characters)
- Quality: precise, concise, educational
- Language: consistently English
- Structure: question-answer or term-definition`
      },
      'es': {
        role: 'Eres un experto en crear tarjetas educativas en español.',
        rules: `Reglas para crear tarjetas:
- Front: pregunta o término (máx 200 caracteres)
- Back: respuesta o definición (máx 500 caracteres)
- Calidad: preciso, conciso, educativo
- Idioma: consistentemente español
- Estructura: pregunta-respuesta o término-definición`
      }
    };

    const config = languageMap[language as keyof typeof languageMap] || languageMap['en'];
    
    return `${config.role}

${config.rules}

Format odpowiedzi: JSON z tablicą "cards" zawierającą obiekty z polami: front, back, confidence, excerpt.`;
  }

  /**
   * Build user prompt with source text
   * @param sourceText - Source text to process
   * @param targetCount - Target number of flashcards
   * @param language - Target language
   * @returns User prompt string
   */
  private buildUserPrompt(sourceText: string, targetCount: number, language: string): string {
    const languageMap = {
      'pl': `Przeanalizuj poniższy tekst i utwórz ${targetCount} fiszek edukacyjnych. Każda fiszka powinna być precyzyjna, zwięzła i edukacyjna.`,
      'en': `Analyze the following text and create ${targetCount} educational flashcards. Each flashcard should be precise, concise, and educational.`,
      'es': `Analiza el siguiente texto y crea ${targetCount} tarjetas educativas. Cada tarjeta debe ser precisa, concisa y educativa.`
    };

    const instruction = languageMap[language as keyof typeof languageMap] || languageMap['en'];
    
    return `${instruction}

Tekst źródłowy:
"${sourceText}"

Utwórz fiszki w formacie JSON z tablicą "cards".`;
  }

  /**
   * Get JSON schema for structured response format
   * @returns Response format configuration
   */
  private getResponseFormat(): any {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'flashcard_batch',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { 
                    type: 'string', 
                    maxLength: 200,
                    description: 'Question or term for the front of the flashcard'
                  },
                  back: { 
                    type: 'string', 
                    maxLength: 500,
                    description: 'Answer or definition for the back of the flashcard'
                  },
                  confidence: { 
                    type: 'number', 
                    minimum: 0, 
                    maximum: 1,
                    description: 'Confidence score for the quality of this flashcard'
                  },
                  excerpt: { 
                    type: 'string', 
                    maxLength: 500,
                    description: 'Relevant excerpt from source text that supports this flashcard'
                  }
                },
                required: ['front', 'back', 'confidence', 'excerpt'],
                additionalProperties: false
              },
              minItems: 1,
              maxItems: 30
            }
          },
          required: ['cards'],
          additionalProperties: false
        }
      }
    };
  }

  /**
   * Parse API response to extract flashcard data
   * @param response - OpenRouter API response
   * @returns Parsed response data
   */
  private parseResponse(response: OpenRouterResponse): any {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new ResponseValidationError('Empty response from API');
      }

      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      throw new ResponseValidationError(`Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle API errors and map them to appropriate error types
   * @param error - API error object
   * @returns Appropriate error instance
   */
  private handleApiError(error: any): Error {
    const status = error.status || error.statusCode;
    const message = error.data?.error?.message || error.message || 'Unknown API error';

    switch (status) {
      case 401:
        throw new UnauthorizedError('Invalid API key or authentication failed');
      case 402:
        throw new QuotaExceededError('API quota exceeded', error.data);
      case 429:
        const retryAfter = error.data?.retry_after || 60;
        throw new RateLimitError('API rate limit exceeded', retryAfter);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new InternalError(`API server error: ${message}`);
      default:
        throw new UnknownError(`API error (${status}): ${message}`, { originalError: error });
    }
  }

  private mapToGenerationError(error: any): GenerationError {
    if (error instanceof RateLimitError) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
        retryable: true,
        retryAfter: error.details?.retry_after,
      };
    }
    
    if (error instanceof QuotaExceededError) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: error.message,
        retryable: false,
        details: error.details,
      };
    }
    
    if (error instanceof TimeoutError) {
      return {
        code: 'TIMEOUT',
        message: error.message,
        retryable: true,
        details: error.details,
      };
    }
    
    if (error instanceof LanguageDetectionError) {
      return {
        code: 'LANGUAGE_DETECTION_FAILED',
        message: error.message,
        retryable: false,
        details: error.details,
      };
    }
    
    if (error instanceof TextProcessingError) {
      return {
        code: 'TEXT_PROCESSING_FAILED',
        message: error.message,
        retryable: false,
        details: error.details,
      };
    }
    
    if (error instanceof ResponseValidationError) {
      return {
        code: 'RESPONSE_VALIDATION_FAILED',
        message: error.message,
        retryable: false,
        details: error.details,
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      retryable: false,
      details: { originalError: error },
    };
  }

  private updateStats(success: boolean, cost: number, responseTime: number): void {
    this.stats.totalCalls++;
    if (success) {
      this.stats.successfulCalls++;
    } else {
      this.stats.failedCalls++;
    }
    this.stats.totalCost += cost;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalCalls - 1) + responseTime) / this.stats.totalCalls;
    this.stats.lastCallAt = new Date().toISOString();
  }

  /**
   * Log generation metrics to database for monitoring
   * @param result - Generation result to log
   * @param generationId - Generation ID for tracking
   */
  private async logGenerationMetrics(result: GenerationResult, generationId: string): Promise<void> {
    try {
      await this.supabase
        .from('generation_metrics')
        .insert({
          generation_id: generationId,
          model: result.metadata.model,
          prompt_tokens: result.metadata.promptTokens,
          completion_tokens: result.metadata.completionTokens,
          total_cost: result.metadata.totalCost,
          processing_time_ms: result.metadata.processingTimeMs,
          success: result.success,
          language: result.metadata.language,
          cards_generated: result.cards.length,
          error_code: result.error?.code,
          error_message: result.error?.message,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log generation metrics:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Check rate limiting for user
   * @param userId - User ID to check
   * @throws RateLimitError if limit exceeded
   */
  private async checkUserRateLimit(userId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Error checking user rate limit:', error);
      // Don't block user if we can't check rate limit
      return;
    }

    if (count !== null && count >= 10) {
      throw new RateLimitError('Rate limit exceeded: Maximum 10 generations per hour. Please try again later.', 3600);
    }
  }

  /**
   * Sanitize input text to prevent injection attacks
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  private sanitizeInput(text: string): string {
    // Remove potential injection patterns
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Validate text length and content
   * @param text - Text to validate
   * @throws TextProcessingError if validation fails
   */
  private validateTextContent(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new TextProcessingError('Source text cannot be empty');
    }
    
    if (text.length < 100) {
      throw new TextProcessingError('Source text too short (minimum 100 characters required)');
    }
    
    if (text.length > 15000) {
      throw new TextProcessingError('Source text too long (maximum 15,000 characters allowed)');
    }
    
    // Check for minimum word count
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 20) {
      throw new TextProcessingError('Source text must contain at least 20 words');
    }
  }

  /**
   * Retry operation with exponential backoff
   * @param operation - Function to retry
   * @param maxRetries - Maximum number of retries
   * @returns Promise with operation result
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
        
        const delay = this.calculateRetryDelay(attempt);
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Check if error is retryable
   * @param error - Error to check
   * @returns True if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof RateLimitError) {
      return true;
    }
    
    if (error instanceof TimeoutError) {
      return true;
    }
    
    if (error instanceof InternalError) {
      return true;
    }
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    
    // HTTP 5xx errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   * @param attempt - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const jitter = Math.random() * 0.1; // 10% jitter
    
    const delay = Math.min(
      baseDelay * Math.pow(2, attempt - 1) * (1 + jitter),
      maxDelay
    );
    
    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Heuristic language detection as fallback
   * @param text - Text to analyze
   * @returns Detected language code
   */
  private detectLanguageHeuristic(text: string): string {
    const sample = text.toLowerCase().substring(0, 1000);
    
    // Polish indicators
    const polishWords = ['i', 'w', 'na', 'z', 'do', 'od', 'że', 'się', 'nie', 'ale', 'lub', 'czy', 'jak', 'gdy', 'że', 'by', 'być', 'mieć', 'może', 'już'];
    const polishChars = /[ąćęłńóśźż]/;
    
    // Spanish indicators
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para'];
    const spanishChars = /[ñáéíóúü]/;
    
    // Count matches
    const polishScore = polishWords.reduce((score, word) => {
      return score + (sample.split(word).length - 1);
    }, 0) + (polishChars.test(sample) ? 10 : 0);
    
    const spanishScore = spanishWords.reduce((score, word) => {
      return score + (sample.split(word).length - 1);
    }, 0) + (spanishChars.test(sample) ? 10 : 0);
    
    // Return language with highest score, default to English
    if (polishScore > spanishScore && polishScore > 3) {
      return 'pl';
    } else if (spanishScore > 3) {
      return 'es';
    } else {
      return 'en';
    }
  }
}
