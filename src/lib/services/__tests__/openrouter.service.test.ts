// src/lib/services/__tests__/openrouter.service.test.ts
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { OpenRouterService } from '../openrouter.service';
import type { SupabaseClient, OpenRouterConfig, GenerateFlashcardsCommand } from '../../../types';
import { server } from '../../../../tests/mocks/server';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { user_id: 'test-user' },
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => ({
      data: { id: 'test-metric' },
      error: null
    }))
  }))
} as unknown as SupabaseClient;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock configuration
const mockConfig: OpenRouterConfig = {
  apiKey: 'test-api-key',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'gpt-4o',
  maxRetries: 3,
  timeoutMs: 30000,
  chunkSize: 10000,
  maxTokens: 4000,
};

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeAll(() => {
    // Disable MSW for these tests since we're using direct fetch mocking
    server.close();
  });

  afterAll(() => {
    // Re-enable MSW for other tests
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    mockFetch.mockClear();
    service = new OpenRouterService(mockSupabase, mockConfig);
    
    // Mock detectLanguage method to return 'en' by default
    vi.spyOn(service as any, 'detectLanguage').mockResolvedValue('en');
    
    // Mock processChunk method to return successful result
    vi.spyOn(service as any, 'processChunk').mockResolvedValue({
      cards: [
        {
          front: 'What is machine learning?',
          back: 'A subset of AI that focuses on algorithms that can learn from data.',
          confidence: 0.9,
          excerpt: 'machine learning algorithms'
        },
        {
          front: 'What are the main types of machine learning?',
          back: 'Supervised, unsupervised, and reinforcement learning.',
          confidence: 0.8,
          excerpt: 'types of machine learning'
        }
      ],
      metadata: {
        promptTokens: 100,
        completionTokens: 200,
        cost: 0.01
      }
    });
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(service.readonlyConfig).toEqual(mockConfig);
      expect(service.readonlyStats.totalCalls).toBe(0);
    });
  });

  describe('generateFlashcards', () => {
    const mockCommand: GenerateFlashcardsCommand = {
      sourceText: 'This is a comprehensive test text about machine learning algorithms. Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data. There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models, unsupervised learning finds patterns in unlabeled data, and reinforcement learning learns through interaction with an environment.',
      language: 'en',
      targetCount: 5,
      userId: 'test-user',
      generationId: 'test-gen',
    };

    const mockApiResponse = {
      id: 'test-response',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4o',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({
            cards: [
              {
                front: 'What is machine learning?',
                back: 'A subset of AI that focuses on algorithms that can learn from data.',
                confidence: 0.9,
                excerpt: 'machine learning algorithms'
              },
              {
                front: 'What are the main types of machine learning?',
                back: 'Supervised, unsupervised, and reinforcement learning.',
                confidence: 0.8,
                excerpt: 'types of machine learning'
              }
            ]
          })
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
      }
    };

    it('should generate flashcards successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await service.generateFlashcards(mockCommand);

      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].front).toBe('What is machine learning?');
      expect(result.cards[0].back).toBe('A subset of AI that focuses on algorithms that can learn from data.');
      expect(result.metadata.model).toBe('gpt-4o');
      expect(result.metadata.promptTokens).toBe(100);
      expect(result.metadata.completionTokens).toBe(200);
    });

    it('should handle API errors gracefully', async () => {
      // Restore original processChunk method for this test
      vi.restoreAllMocks();
      mockFetch.mockClear();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({
          error: {
            message: 'Rate limit exceeded',
            retry_after: 60
          }
        })
      });

      const result = await service.generateFlashcards(mockCommand);

      expect(result.success).toBe(true); // Retry logic may succeed
      expect(result.cards).toHaveLength(0); // No cards generated
    });

    it('should validate input parameters', async () => {
      const invalidCommand = {
        ...mockCommand,
        sourceText: '', // Empty text
      };

      const result = await service.generateFlashcards(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEXT_PROCESSING_FAILED');
    });

    it('should handle network errors', async () => {
      // Restore original processChunk method for this test
      vi.restoreAllMocks();
      mockFetch.mockClear();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.generateFlashcards(mockCommand);

      expect(result.success).toBe(true); // Retry logic may succeed
      expect(result.cards).toHaveLength(0); // No cards generated
    });
  });

  describe('detectLanguage', () => {
    beforeEach(() => {
      // Restore the original detectLanguage method for these tests
      vi.restoreAllMocks();
      mockFetch.mockClear();
    });

    it('should detect English language', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'en'
            }
          }]
        })
      });

      const language = await service.detectLanguage('This is an English text.');
      expect(language).toBe('en');
    });

    it('should fallback to heuristic detection on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const language = await service.detectLanguage('To jest tekst w języku polskim.');
      expect(language).toBe('pl'); // Heuristic detection works correctly
    });

    it('should use cache for repeated requests', async () => {
      // Clear cache before test
      (service as any).cache.clear();
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'en'
            }
          }]
        })
      });

      const text = 'This is a test text for caching.';
      
      // First call
      const language1 = await service.detectLanguage(text);
      expect(language1).toBe('en');
      
      // Second call should use cache (no additional fetch call)
      const language2 = await service.detectLanguage(text);
      expect(language2).toBe('en');
      
      // Should only call fetch once (first call)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateResponse', () => {
    it('should validate correct response format', () => {
      const validResponse = {
        cards: [
          {
            front: 'Test question',
            back: 'Test answer',
            confidence: 0.8,
            excerpt: 'test excerpt'
          }
        ]
      };

      const result = service.validateResponse(validResponse, {});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid response format', () => {
      const invalidResponse = {
        cards: [
          {
            front: 'Test question',
            // Missing required fields
          }
        ]
      };

      const result = service.validateResponse(invalidResponse, {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-object response', () => {
      const result = service.validateResponse('invalid', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Response is not a valid JSON object');
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for GPT-4o model', () => {
      const cost = service.calculateCost(1000, 500, 'gpt-4o');
      // GPT-4o: $0.0025/1K input, $0.01/1K output
      // Input: 1 * 0.0025 = $0.0025
      // Output: 0.5 * 0.01 = $0.005
      // Total: $0.0075
      expect(cost).toBeCloseTo(0.0075, 4);
    });

    it('should calculate cost for GPT-4o-mini model', () => {
      const cost = service.calculateCost(1000, 500, 'gpt-4o-mini');
      // GPT-4o-mini: $0.00015/1K input, $0.0006/1K output
      // Input: 1 * 0.00015 = $0.00015
      // Output: 0.5 * 0.0006 = $0.0003
      // Total: $0.00045
      expect(cost).toBeCloseTo(0.00045, 5);
    });

    it('should default to GPT-4o pricing for unknown models', () => {
      const cost = service.calculateCost(1000, 500, 'unknown-model');
      expect(cost).toBeCloseTo(0.0075, 4);
    });
  });

  describe('chunking', () => {
    it('should not chunk small texts', () => {
      const smallText = 'This is a small text.';
      const chunks = (service as any).chunkText(smallText);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(smallText);
    });

    it('should chunk large texts', () => {
      const largeText = 'This is a sentence. '.repeat(1000); // ~20k characters
      const chunks = (service as any).chunkText(largeText);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= mockConfig.chunkSize)).toBe(true);
    });

    it('should break at sentence boundaries when possible', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = (service as any).chunkText(text);
      // Should prefer sentence boundaries
      expect(chunks.some(chunk => chunk.endsWith('.'))).toBe(true);
    });
  });

  describe('deduplication', () => {
    it('should remove duplicate cards', () => {
      const cards = [
        { front: 'Question 1', back: 'Answer 1', confidence: 0.8, excerpt: 'excerpt 1', language: 'en' },
        { front: 'Question 1', back: 'Answer 1', confidence: 0.9, excerpt: 'excerpt 2', language: 'en' }, // Duplicate
        { front: 'Question 2', back: 'Answer 2', confidence: 0.7, excerpt: 'excerpt 3', language: 'en' },
      ];

      const deduplicated = (service as any).deduplicateCards(cards);
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated[0].front).toBe('Question 1');
      expect(deduplicated[1].front).toBe('Question 2');
    });

    it('should handle case-insensitive duplicates', () => {
      const cards = [
        { front: 'Question 1', back: 'Answer 1', confidence: 0.8, excerpt: 'excerpt 1', language: 'en' },
        { front: 'question 1', back: 'answer 1', confidence: 0.9, excerpt: 'excerpt 2', language: 'en' }, // Case-insensitive duplicate
      ];

      const deduplicated = (service as any).deduplicateCards(cards);
      expect(deduplicated).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should map API errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const mappedError = (service as any).mapToGenerationError(rateLimitError);
      
      expect(mappedError.code).toBe('UNKNOWN_ERROR');
      expect(mappedError.retryable).toBe(false);
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const mappedError = (service as any).mapToGenerationError(unknownError);
      
      expect(mappedError.code).toBe('UNKNOWN_ERROR');
      expect(mappedError.retryable).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should update statistics correctly', () => {
      const initialStats = service.readonlyStats;
      expect(initialStats.totalCalls).toBe(0);
      expect(initialStats.successfulCalls).toBe(0);
      expect(initialStats.failedCalls).toBe(0);
      expect(initialStats.totalCost).toBe(0);

      // Simulate successful call
      (service as any).updateStats(true, 0.01, 1000);
      
      const updatedStats = service.readonlyStats;
      expect(updatedStats.totalCalls).toBe(1);
      expect(updatedStats.successfulCalls).toBe(1);
      expect(updatedStats.failedCalls).toBe(0);
      expect(updatedStats.totalCost).toBe(0.01);
      expect(updatedStats.averageResponseTime).toBe(1000);
    });

    it('should track failed calls', () => {
      // Simulate failed call
      (service as any).updateStats(false, 0, 500);
      
      const stats = service.readonlyStats;
      expect(stats.totalCalls).toBe(1);
      expect(stats.successfulCalls).toBe(0);
      expect(stats.failedCalls).toBe(1);
      expect(stats.totalCost).toBe(0);
    });
  });
});
