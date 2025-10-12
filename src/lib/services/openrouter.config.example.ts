// src/lib/services/openrouter.config.example.ts
import type { OpenRouterConfig } from "../../types";

/**
 * Example configuration for OpenRouter service
 * Copy this file to openrouter.config.ts and update with your actual values
 */

export const openRouterConfig: OpenRouterConfig = {
  // OpenRouter API key - get from https://openrouter.ai/keys
  // Set as environment variable: OPENROUTER_API_KEY
  apiKey: Deno.env.get('OPENROUTER_API_KEY') || '',

  // OpenRouter API base URL
  baseUrl: 'https://openrouter.ai/api/v1',

  // Default model to use for generation
  // Available models: gpt-4o, gpt-4o-mini, gpt-4, claude-3-5-sonnet, etc.
  defaultModel: 'gpt-4o',

  // Maximum number of retry attempts for failed requests
  maxRetries: 3,

  // Request timeout in milliseconds
  timeoutMs: 30000,

  // Maximum chunk size for text processing (characters)
  chunkSize: 10000,

  // Maximum tokens in API response
  maxTokens: 4000,
};

/**
 * Development configuration with more lenient settings
 */
export const openRouterConfigDev: OpenRouterConfig = {
  ...openRouterConfig,
  defaultModel: 'gpt-4o-mini', // Cheaper model for development
  maxRetries: 2,
  timeoutMs: 15000,
  chunkSize: 5000,
  maxTokens: 2000,
};

/**
 * Production configuration with optimized settings
 */
export const openRouterConfigProd: OpenRouterConfig = {
  ...openRouterConfig,
  defaultModel: 'gpt-4o', // Best quality model
  maxRetries: 5,
  timeoutMs: 45000,
  chunkSize: 12000,
  maxTokens: 6000,
};

/**
 * Configuration for different environments
 */
export const getOpenRouterConfig = (): OpenRouterConfig => {
  const env = Deno.env.get('ENVIRONMENT') || 'development';
  
  switch (env) {
    case 'production':
      return openRouterConfigProd;
    case 'development':
      return openRouterConfigDev;
    default:
      return openRouterConfig;
  }
};
