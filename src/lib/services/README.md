# OpenRouter Service Integration

This document describes how to integrate and use the OpenRouter service for AI-powered flashcard generation.

## Overview

The `OpenRouterService` provides AI-powered flashcard generation using the OpenRouter.ai API. It supports multiple languages (English, Polish, Spanish), handles large texts through chunking, and includes comprehensive error handling and retry logic.

## Setup

### 1. Environment Configuration

Add your OpenRouter API key to your environment variables:

```bash
# For Supabase Edge Functions
supabase secrets set OPENROUTER_API_KEY=your_api_key_here

# For local development
export OPENROUTER_API_KEY=your_api_key_here
```

### 2. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add it to your environment variables

## Usage

### Basic Integration

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';
import { createClient } from './db/supabase.client';
import type { OpenRouterConfig } from './types';

// Initialize Supabase client
const supabase = createClient();

// Configure OpenRouter service
const config: OpenRouterConfig = {
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
```

### Generate Flashcards

```typescript
import type { GenerateFlashcardsCommand } from './types';

const command: GenerateFlashcardsCommand = {
  sourceText: `
    Machine learning is a subset of artificial intelligence that focuses on algorithms 
    that can learn from data. It includes supervised learning, unsupervised learning, 
    and reinforcement learning.
  `,
  language: 'en', // Optional: 'en', 'pl', 'es'
  targetCount: 10, // Optional: 1-30, default 30
  userId: 'user-123',
  generationId: 'gen-456',
};

const result = await openRouterService.generateFlashcards(command);

if (result.success) {
  console.log(`Generated ${result.cards.length} flashcards`);
  result.cards.forEach(card => {
    console.log(`Front: ${card.front}`);
    console.log(`Back: ${card.back}`);
    console.log(`Confidence: ${card.confidence}`);
  });
} else {
  console.error('Generation failed:', result.error);
}
```

### Language Detection

```typescript
const detectedLanguage = await openRouterService.detectLanguage(
  "This is an English text about machine learning."
);
console.log(`Detected language: ${detectedLanguage}`); // 'en'
```

### Service Statistics

```typescript
const stats = openRouterService.readonlyStats;
console.log(`Total calls: ${stats.totalCalls}`);
console.log(`Success rate: ${(stats.successfulCalls / stats.totalCalls * 100).toFixed(1)}%`);
console.log(`Total cost: $${stats.totalCost.toFixed(4)}`);
```

## Integration with GenerationService

The `GenerationService` has been updated to use the `OpenRouterService`:

```typescript
import { GenerationService } from './lib/services/generation.service';

const generationService = new GenerationService(supabase);

// Start generation (now uses AI instead of simulation)
const response = await generationService.startGeneration({
  source_text: "Your text here",
  language: "en",
  target_count: 15
}, userId);
```

## Configuration Options

### Model Selection

- **gpt-4o**: Best quality, higher cost
- **gpt-4o-mini**: Good quality, lower cost
- **gpt-4**: High quality, higher cost
- **claude-3-5-sonnet**: Alternative high-quality model

### Chunking Settings

- **chunkSize**: Maximum characters per chunk (default: 10,000)
- **maxTokens**: Maximum tokens in API response (default: 4,000)

### Retry Settings

- **maxRetries**: Maximum retry attempts (default: 3)
- **timeoutMs**: Request timeout (default: 30,000ms)

## Error Handling

The service includes comprehensive error handling:

```typescript
const result = await openRouterService.generateFlashcards(command);

if (!result.success) {
  switch (result.error?.code) {
    case 'RATE_LIMIT_EXCEEDED':
      console.log('Rate limit exceeded, retry after:', result.error.retryAfter);
      break;
    case 'QUOTA_EXCEEDED':
      console.log('API quota exceeded');
      break;
    case 'TEXT_PROCESSING_FAILED':
      console.log('Text validation failed:', result.error.message);
      break;
    default:
      console.log('Unknown error:', result.error?.message);
  }
}
```

## Supported Languages

- **English (en)**: Default language
- **Polish (pl)**: Full support with Polish prompts
- **Spanish (es)**: Full support with Spanish prompts

## Rate Limiting

- **User limit**: 10 generations per hour per user
- **API limit**: Handled automatically with retry logic
- **Cost tracking**: All API costs are tracked and logged

## Monitoring

The service automatically logs metrics to the database:

- Generation success/failure
- Token usage and costs
- Processing times
- Error details
- Language detection results

## Testing

Run the test suite:

```bash
npm test openrouter.service.test.ts
```

Run examples:

```typescript
import { runAllExamples } from './lib/services/openrouter.examples';

await runAllExamples();
```

## Best Practices

1. **Always check for API key**: Ensure `OPENROUTER_API_KEY` is set
2. **Handle errors gracefully**: Check `result.success` before using cards
3. **Monitor costs**: Track usage through service statistics
4. **Use appropriate models**: Choose model based on quality vs cost needs
5. **Validate input**: The service validates input, but additional validation is recommended

## Troubleshooting

### Common Issues

1. **"API key not found"**: Set `OPENROUTER_API_KEY` environment variable
2. **"Rate limit exceeded"**: Wait for the retry period or reduce request frequency
3. **"Text too long"**: The service handles chunking automatically
4. **"Language detection failed"**: Falls back to heuristic detection

### Debug Mode

Enable debug logging by setting:

```bash
export DEBUG=openrouter:*
```

## Cost Optimization

1. **Use gpt-4o-mini for development**: Lower cost, good quality
2. **Optimize chunk size**: Balance between API calls and processing efficiency
3. **Cache language detection**: Results are automatically cached
4. **Monitor usage**: Use service statistics to track costs

## Security

- API keys are stored as environment variables
- Input text is sanitized to prevent injection attacks
- Rate limiting prevents abuse
- All API calls are logged for monitoring
