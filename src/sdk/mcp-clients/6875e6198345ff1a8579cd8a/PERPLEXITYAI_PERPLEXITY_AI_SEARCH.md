# Perplexity AI Search - MCP Client Module

## Overview

This module provides a TypeScript interface to the Perplexity AI Search MCP tool. It allows you to perform AI-powered searches and generate completions using Perplexity's language models with optional search grounding, citations, and images.

## Installation/Import

```typescript
import { request as requestPerplexitySearch } from '@/sdk/mcp-clients/6875e6198345ff1a8579cd8a/PERPLEXITYAI_PERPLEXITY_AI_SEARCH';
```

## Function Signature

```typescript
async function request(params: PerplexitySearchParams): Promise<PerplexitySearchData>
```

## Parameters

### Required Parameters

- **`userContent`** (string): The user's question or input query
  - Example: `"How many stars are there in our galaxy?"`

### Optional Parameters

- **`model`** (string): Model to use for generation. Options: `"sonar"`, `"sonar-reasoning-pro"`, `"sonar-reasoning"`, `"sonar-pro"`
  - Default: `"sonar"`

- **`temperature`** (number): Controls randomness (0 = deterministic, approaching 2 = more random)
  - Range: 0 to <2
  - Example: `0.7`

- **`max_tokens`** (number): Maximum tokens to generate
  - Example: `150`

- **`top_p`** (number): Nucleus sampling threshold
  - Range: 0 to 1
  - Example: `0.9`

- **`top_k`** (number): Limits high-probability tokens (0 to disable)
  - Range: 0 to 2048
  - Example: `40`

- **`frequency_penalty`** (number): Penalty for token frequency (mutually exclusive with `presence_penalty`)
  - Range: >0
  - Example: `1.0`

- **`presence_penalty`** (number): Penalty for token presence (mutually exclusive with `frequency_penalty`)
  - Range: -2 to 2
  - Example: `0.5`

- **`systemContent`** (string): System instructions to guide model behavior
  - Default: `"You are a helpful assistant that provides accurate and informative responses."`
  - Example: `"Be precise and concise."`

- **`return_citations`** (boolean): Include citations in response (closed beta)
  - Example: `true`

- **`return_images`** (boolean): Include images in response (closed beta)
  - Example: `true`

- **`stream`** (boolean): Stream response incrementally
  - Example: `false`

## Return Value

Returns a `Promise<PerplexitySearchData>` containing:

- **`id`** (string): Unique completion identifier
- **`model`** (string): Model used for generation
- **`created`** (number): Unix timestamp of creation
- **`object`** (string): Always `"chat.completion"`
- **`choices`** (array): List of completion choices, each containing:
  - `index`: Choice index
  - `finish_reason`: Why generation stopped
  - `message`: Generated message with `role` and `content`
- **`usage`** (object): Token usage information:
  - `prompt_tokens`: Tokens in prompt
  - `completion_tokens`: Tokens in completion
  - `total_tokens`: Total tokens used
  - Optional: `citation_tokens`, `reasoning_tokens`, `num_search_queries`, `search_context_size`
- **`search_results`** (array, optional): Search results used for grounding
- **`videos`** (array, optional): Related videos

## Usage Examples

### Basic Search Query

```typescript
import { request as requestPerplexitySearch } from '@/sdk/mcp-clients/6875e6198345ff1a8579cd8a/PERPLEXITYAI_PERPLEXITY_AI_SEARCH';

async function searchGalaxyStars() {
  try {
    const result = await requestPerplexitySearch({
      userContent: 'How many stars are there in our galaxy?'
    });

    console.log('Response:', result.choices[0].message.content);
    console.log('Tokens used:', result.usage.total_tokens);
    
    if (result.search_results) {
      console.log('Sources:', result.search_results.map(r => r.url));
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}
```

### Advanced Search with Custom Parameters

```typescript
import { request as requestPerplexitySearch } from '@/sdk/mcp-clients/6875e6198345ff1a8579cd8a/PERPLEXITYAI_PERPLEXITY_AI_SEARCH';

async function advancedSearch() {
  try {
    const result = await requestPerplexitySearch({
      userContent: 'Explain quantum computing in simple terms',
      model: 'sonar-pro',
      temperature: 0.3,
      max_tokens: 200,
      systemContent: 'Be precise and concise. Use simple language.',
      return_citations: true,
      top_p: 0.9
    });

    console.log('Answer:', result.choices[0].message.content);
    console.log('Model used:', result.model);
    console.log('Search queries performed:', result.usage.num_search_queries);
  } catch (error) {
    console.error('Advanced search failed:', error);
  }
}
```

### Using Reasoning Models

```typescript
import { request as requestPerplexitySearch } from '@/sdk/mcp-clients/6875e6198345ff1a8579cd8a/PERPLEXITYAI_PERPLEXITY_AI_SEARCH';

async function reasoningSearch() {
  try {
    const result = await requestPerplexitySearch({
      userContent: 'What are the implications of AI on future job markets?',
      model: 'sonar-reasoning-pro',
      temperature: 0.5,
      presence_penalty: 0.6
    });

    console.log('Reasoning response:', result.choices[0].message.content);
    
    if (result.usage.reasoning_tokens) {
      console.log('Reasoning tokens used:', result.usage.reasoning_tokens);
    }
  } catch (error) {
    console.error('Reasoning search failed:', error);
  }
}
```

## Error Handling

The function may throw errors in the following cases:

1. **Missing Required Parameters**: If `userContent` is not provided
   ```typescript
   Error: Missing required parameter: userContent
   ```

2. **Mutually Exclusive Parameters**: If both `frequency_penalty` and `presence_penalty` are set
   ```typescript
   Error: Parameters frequency_penalty and presence_penalty are mutually exclusive
   ```

3. **Parameter Range Violations**: If parameters are outside valid ranges
   ```typescript
   Error: Parameter temperature must be between 0 and <2
   Error: Parameter top_k must be between 0 and 2048
   ```

4. **MCP Tool Execution Failure**: If the underlying MCP tool fails
   ```typescript
   Error: MCP tool execution failed
   ```

5. **Invalid Response Format**: If the MCP response cannot be parsed
   ```typescript
   Error: Invalid MCP response format: missing content[0].text
   Error: Failed to parse MCP response JSON: [parse error details]
   ```

### Error Handling Example

```typescript
import { request as requestPerplexitySearch } from '@/sdk/mcp-clients/6875e6198345ff1a8579cd8a/PERPLEXITYAI_PERPLEXITY_AI_SEARCH';

async function safeSearch(query: string) {
  try {
    const result = await requestPerplexitySearch({
      userContent: query,
      temperature: 0.7
    });
    
    return {
      success: true,
      data: result.choices[0].message.content,
      sources: result.search_results?.map(r => r.url) || []
    };
  } catch (error) {
    console.error('Search error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
```

## Notes

- The `frequency_penalty` and `presence_penalty` parameters are mutually exclusive
- Citations and images features are in closed beta
- Different models offer different capabilities - see [Perplexity Model Cards](https://docs.perplexity.ai/guides/model-cards)
- Token usage is tracked and returned in the `usage` object
- Search results are automatically included when available to ground the response