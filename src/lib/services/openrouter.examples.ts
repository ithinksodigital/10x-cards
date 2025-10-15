// src/lib/services/openrouter.examples.ts
import { OpenRouterService } from "./openrouter.service";
// import { createClient } from "../../db/supabase.client";
import type { GenerateFlashcardsCommand } from "../../types";

/**
 * Example usage of OpenRouterService
 * This file demonstrates how to use the service in different scenarios
 */

// Initialize Supabase client
// const supabase = createClient();

// Example configuration
const config = {
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "gpt-4o",
  maxRetries: 3,
  timeoutMs: 30000,
  chunkSize: 10000,
  maxTokens: 4000,
};

// Create service instance
// const openRouterService = new OpenRouterService(supabase, config);

/**
 * Example 1: Basic flashcard generation
 */
export async function exampleBasicGeneration() {
  const command: GenerateFlashcardsCommand = {
    sourceText: `
      Machine learning is a subset of artificial intelligence that focuses on algorithms 
      that can learn from data. It includes supervised learning, where models are trained 
      on labeled data, unsupervised learning, which finds patterns in unlabeled data, 
      and reinforcement learning, where agents learn through interaction with an environment.
    `,
    language: "en",
    targetCount: 5,
    userId: "user-123",
    generationId: "gen-456",
  };

  try {
    // const result = await openRouterService.generateFlashcards(command);
    // if (result.success) {
    //   Generated flashcards successfully
    //   Cost: result.metadata.totalCost
    //   Processing time: result.metadata.processingTimeMs
    // } else {
    //   Generation failed: result.error
    // }
  } catch (_error) {
    // Error occurred during generation
  }
}

/**
 * Example 2: Multi-language generation
 */
export async function exampleMultiLanguageGeneration() {
  const examples = [
    {
      text: `
        La inteligencia artificial es una rama de la informática que se ocupa de crear 
        sistemas capaces de realizar tareas que normalmente requieren inteligencia humana. 
        Incluye el aprendizaje automático, el procesamiento del lenguaje natural y la 
        visión por computadora.
      `,
      language: "es" as const,
      expected: "Spanish flashcards",
    },
    {
      text: `
        Sztuczna inteligencja to dziedzina informatyki zajmująca się tworzeniem systemów 
        zdolnych do wykonywania zadań wymagających ludzkiej inteligencji. Obejmuje 
        uczenie maszynowe, przetwarzanie języka naturalnego i rozpoznawanie obrazów.
      `,
      language: "pl" as const,
      expected: "Polish flashcards",
    },
  ];

  for (const example of examples) {
    const command: GenerateFlashcardsCommand = {
      sourceText: example.text,
      language: example.language,
      targetCount: 3,
      userId: "user-123",
      generationId: `gen-${Date.now()}`,
    };

    try {
      // const _result = await openRouterService.generateFlashcards(command);
      // Generated cards for example.expected
      // Success: _result.success
      // Language: _result.metadata.language
      // Cards generated: _result.cards.length
    } catch (_error) {
      // Error generating example.expected
    }
  }
}

/**
 * Example 3: Language detection
 */
export async function exampleLanguageDetection() {
  const texts = [
    "This is an English text about machine learning algorithms.",
    "Este es un texto en español sobre algoritmos de aprendizaje automático.",
    "To jest tekst w języku polskim o algorytmach uczenia maszynowego.",
  ];

  for (const text of texts) {
    try {
      // const _detectedLanguage = await openRouterService.detectLanguage(text);
      // Text: text.substring(0, 50)
      // Detected language: _detectedLanguage
    } catch (_error) {
      // Language detection failed
    }
  }
}

/**
 * Example 4: Large text processing with chunking
 */
export async function exampleLargeTextProcessing() {
  // Generate a large text (simulate a long article)
  const largeText = `
    Machine learning is a subset of artificial intelligence that focuses on algorithms 
    that can learn from data. It includes supervised learning, where models are trained 
    on labeled data, unsupervised learning, which finds patterns in unlabeled data, 
    and reinforcement learning, where agents learn through interaction with an environment.
    
    Supervised learning algorithms build a mathematical model of training data that contains 
    both inputs and desired outputs. The data is known as training data and consists of a 
    set of training examples. Each training example has one or more inputs and a desired 
    output, also known as a supervisory signal.
    
    Unsupervised learning algorithms take a set of data that contains only inputs, and find 
    structure in the data, like grouping or clustering of data points. The algorithms, 
    therefore, learn from test data that has not been labeled, classified or categorized.
    
    Reinforcement learning is an area of machine learning concerned with how software agents 
    ought to take actions in an environment in order to maximize the notion of cumulative reward.
  `.repeat(10); // Make it large enough to trigger chunking

  const command: GenerateFlashcardsCommand = {
    sourceText: largeText,
    targetCount: 15,
    userId: "user-123",
    generationId: `gen-large-${Date.now()}`,
  };

  try {
    // Processing large text (largeText.length characters)
    // const result = await openRouterService.generateFlashcards(command);
    // if (result.success) {
    //   Generated result.cards.length flashcards from large text
    //   Total cost: result.metadata.totalCost
    //   Processing time: result.metadata.processingTimeMs
    // } else {
    //   Large text processing failed: result.error
    // }
  } catch (_error) {
    // Error processing large text
  }
}

/**
 * Example 5: Error handling and retry logic
 */
export async function exampleErrorHandling() {
  const command: GenerateFlashcardsCommand = {
    sourceText: "This is a test text for error handling.",
    targetCount: 5,
    userId: "user-123",
    generationId: `gen-error-${Date.now()}`,
  };

  try {
    // const result = await openRouterService.generateFlashcards(command);
    // if (!result.success && result.error) {
    //   Error details:
    //   Code: result.error.code
    //   Message: result.error.message
    //   Retryable: result.error.retryable
    //   Retry after: result.error.retryAfter seconds (if applicable)
    // }
  } catch (_error) {
    // Unexpected error occurred
  }
}

/**
 * Example 6: Service statistics
 */
export async function exampleServiceStats() {
  // Generate some flashcards to populate stats
  await exampleBasicGeneration();

  // Get service statistics
  // const _stats = openRouterService.readonlyStats;
  // Service Statistics:
  // Total calls: _stats.totalCalls
  // Successful calls: _stats.successfulCalls
  // Failed calls: _stats.failedCalls
  // Total cost: _stats.totalCost
  // Average response time: _stats.averageResponseTime
  // Last call: _stats.lastCallAt
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  // === OpenRouter Service Examples ===

  // 1. Basic Generation:
  await exampleBasicGeneration();

  // 2. Multi-language Generation:
  await exampleMultiLanguageGeneration();

  // 3. Language Detection:
  await exampleLanguageDetection();

  // 4. Large Text Processing:
  await exampleLargeTextProcessing();

  // 5. Error Handling:
  await exampleErrorHandling();

  // 6. Service Statistics:
  await exampleServiceStats();

  // === Examples Complete ===
}

// Export for use in other files
// export { openRouterService };
