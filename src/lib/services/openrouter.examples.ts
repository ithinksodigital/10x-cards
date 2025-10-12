// src/lib/services/openrouter.examples.ts
import { OpenRouterService } from "./openrouter.service";
import { createClient } from "../../db/supabase.client";
import type { GenerateFlashcardsCommand } from "../../types";

/**
 * Example usage of OpenRouterService
 * This file demonstrates how to use the service in different scenarios
 */

// Initialize Supabase client
const supabase = createClient();

// Example configuration
const config = {
  apiKey: Deno.env.get('OPENROUTER_API_KEY') || '',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'gpt-4o',
  maxRetries: 3,
  timeoutMs: 30000,
  chunkSize: 10000,
  maxTokens: 4000,
};

// Create service instance
const openRouterService = new OpenRouterService(supabase, config);

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
    language: 'en',
    targetCount: 5,
    userId: 'user-123',
    generationId: 'gen-456',
  };

  try {
    const result = await openRouterService.generateFlashcards(command);
    
    if (result.success) {
      console.log(`Generated ${result.cards.length} flashcards:`);
      result.cards.forEach((card, index) => {
        console.log(`${index + 1}. Front: ${card.front}`);
        console.log(`   Back: ${card.back}`);
        console.log(`   Confidence: ${card.confidence}`);
        console.log('---');
      });
      
      console.log(`Cost: $${result.metadata.totalCost.toFixed(4)}`);
      console.log(`Processing time: ${result.metadata.processingTimeMs}ms`);
    } else {
      console.error('Generation failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
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
      language: 'es' as const,
      expected: 'Spanish flashcards'
    },
    {
      text: `
        Sztuczna inteligencja to dziedzina informatyki zajmująca się tworzeniem systemów 
        zdolnych do wykonywania zadań wymagających ludzkiej inteligencji. Obejmuje 
        uczenie maszynowe, przetwarzanie języka naturalnego i rozpoznawanie obrazów.
      `,
      language: 'pl' as const,
      expected: 'Polish flashcards'
    }
  ];

  for (const example of examples) {
    const command: GenerateFlashcardsCommand = {
      sourceText: example.text,
      language: example.language,
      targetCount: 3,
      userId: 'user-123',
      generationId: `gen-${Date.now()}`,
    };

    try {
      const result = await openRouterService.generateFlashcards(command);
      console.log(`\n${example.expected}:`);
      console.log(`Success: ${result.success}`);
      console.log(`Language: ${result.metadata.language}`);
      console.log(`Cards generated: ${result.cards.length}`);
    } catch (error) {
      console.error(`Error generating ${example.expected}:`, error);
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
      const detectedLanguage = await openRouterService.detectLanguage(text);
      console.log(`Text: "${text.substring(0, 50)}..."`);
      console.log(`Detected language: ${detectedLanguage}`);
      console.log('---');
    } catch (error) {
      console.error('Language detection failed:', error);
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
    userId: 'user-123',
    generationId: `gen-large-${Date.now()}`,
  };

  try {
    console.log(`Processing large text (${largeText.length} characters)...`);
    const result = await openRouterService.generateFlashcards(command);
    
    if (result.success) {
      console.log(`Generated ${result.cards.length} flashcards from large text`);
      console.log(`Total cost: $${result.metadata.totalCost.toFixed(4)}`);
      console.log(`Processing time: ${result.metadata.processingTimeMs}ms`);
    } else {
      console.error('Large text processing failed:', result.error);
    }
  } catch (error) {
    console.error('Error processing large text:', error);
  }
}

/**
 * Example 5: Error handling and retry logic
 */
export async function exampleErrorHandling() {
  const command: GenerateFlashcardsCommand = {
    sourceText: "This is a test text for error handling.",
    targetCount: 5,
    userId: 'user-123',
    generationId: `gen-error-${Date.now()}`,
  };

  try {
    const result = await openRouterService.generateFlashcards(command);
    
    if (!result.success && result.error) {
      console.log('Error details:');
      console.log(`Code: ${result.error.code}`);
      console.log(`Message: ${result.error.message}`);
      console.log(`Retryable: ${result.error.retryable}`);
      
      if (result.error.retryAfter) {
        console.log(`Retry after: ${result.error.retryAfter} seconds`);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Example 6: Service statistics
 */
export async function exampleServiceStats() {
  // Generate some flashcards to populate stats
  await exampleBasicGeneration();
  
  // Get service statistics
  const stats = openRouterService.readonlyStats;
  console.log('Service Statistics:');
  console.log(`Total calls: ${stats.totalCalls}`);
  console.log(`Successful calls: ${stats.successfulCalls}`);
  console.log(`Failed calls: ${stats.failedCalls}`);
  console.log(`Total cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`Average response time: ${stats.averageResponseTime.toFixed(0)}ms`);
  console.log(`Last call: ${stats.lastCallAt}`);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== OpenRouter Service Examples ===\n');
  
  console.log('1. Basic Generation:');
  await exampleBasicGeneration();
  
  console.log('\n2. Multi-language Generation:');
  await exampleMultiLanguageGeneration();
  
  console.log('\n3. Language Detection:');
  await exampleLanguageDetection();
  
  console.log('\n4. Large Text Processing:');
  await exampleLargeTextProcessing();
  
  console.log('\n5. Error Handling:');
  await exampleErrorHandling();
  
  console.log('\n6. Service Statistics:');
  await exampleServiceStats();
  
  console.log('\n=== Examples Complete ===');
}

// Export for use in other files
export { openRouterService };
