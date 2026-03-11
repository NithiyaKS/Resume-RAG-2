# LLM Re-Ranking Implementation

## Overview

The LLM Re-Ranking service adds an additional layer of intelligence to the search pipeline by using a Large Language Model (via Groq API) to re-rank candidates based on semantic understanding of both the query and candidate profiles.

## Architecture

### Components

1. **LLMRankingService** (`backend/src/services/llmRankingService.ts`)
   - Core service for LLM-based re-ranking
   - Orchestrates communication with Groq API
   - Implements intelligent fallback to original scores if LLM fails
   - Validates candidate data and configuration

2. **RankingController** (`backend/src/controllers/rankingController.ts`)
   - HTTP request handlers for re-ranking endpoints
   - Input validation and error handling
   - Response formatting

3. **Routes** (`backend/src/routes/searchRoutes.ts`)
   - Registers `/v1/search/rerank` POST endpoint
   - Registers `/v1/search/rerank/status` GET endpoint

## API Endpoints

### 1. POST /v1/search/rerank

Re-rank a list of candidates using LLM based on query relevance.

**Request Body:**
```json
{
  "query": "senior python developer with microservices experience",
  "candidates": [
    {
      "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
      "name": "John Doe",
      "role": "Senior Backend Engineer",
      "company": "Tech Corp",
      "skills": "Python, Django, microservices",
      "email": "john@example.com",
      "score": 0.85
    }
  ],
  "topK": 10,
  "maxTokens": 2000,
  "temperature": 0.5,
  "detailed": true
}
```

**Parameters:**
- `query` (string, required): The search query to use for relevance assessment
- `candidates` (array, required): List of candidates to re-rank (max 100)
  - Each candidate must have `_id`, `name`, and `role`
  - `company`, `skills`, `email`, and `score` are optional
- `topK` (number, optional): Number of candidates to re-rank (default: 10)
- `maxTokens` (number, optional): Max tokens for LLM response (100-4000, default: 2000)
- `temperature` (number, optional): LLM temperature (0-2, default: 0.5)
  - Lower = more consistent, Higher = more creative
- `detailed` (boolean, optional): Include reasoning in response (default: true)

**Response:**
```json
{
  "status": "success",
  "message": "Re-ranked 3 candidates",
  "data": [
    {
      "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
      "name": "John Doe",
      "role": "Senior Backend Engineer",
      "company": "Tech Corp",
      "skills": "Python, Django, microservices",
      "email": "john@example.com",
      "rerankScore": 0.95,
      "originalScore": 0.85,
      "reasoning": "Strong match for senior role with microservices experience"
    }
  ],
  "metadata": {
    "query": "senior python developer with microservices experience",
    "totalCandidates": 10,
    "rerankResults": 3,
    "durationMs": 1234,
    "config": {
      "topK": 10,
      "maxTokens": 2000,
      "temperature": 0.5,
      "detailed": true
    }
  }
}
```

### 2. GET /v1/search/rerank/status

Get LLM re-ranking service status and configuration.

**Response:**
```json
{
  "status": "success",
  "message": "LLM re-ranking service status",
  "data": {
    "configured": true,
    "model": "mixtral-8x7b-32768",
    "apiUrl": "https://api.groq.com/openai/v1/chat/completions",
    "defaultTopK": 10,
    "defaultMaxTokens": 2000
  }
}
```

## Configuration

Environment variables in `.env`:

```bash
# Groq LLM Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=mixtral-8x7b-32768
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions

# LLM Re-Ranking Configuration
LLM_RERANK_TOP_K=10
LLM_RERANK_MAX_TOKENS=2000
```

## Features

### 1. Intelligent Prompting
- Builds context-aware prompts that help the LLM understand the job search criteria
- Includes candidate profile information for more accurate scoring
- Uses structured JSON response format for reliable parsing

### 2. Score Normalization
- Normalizes all scores to 0-1 range
- Handles edge cases and parsing errors gracefully
- Preserves meaningful ranking even if parsing partially fails

### 3. Fallback Mechanism
- If Groq API fails (connectivity, auth, etc.), automatically falls back to original scores
- Maintains service availability even when LLM is unavailable
- Logs all errors for debugging

### 4. Input Validation
- Validates query is not empty
- Validates candidates array is not empty and max 100 items
- Validates each candidate has required fields (_id, name, role)
- Validates configuration parameters (temperature: 0-2, maxTokens: 100-4000)
- Returns helpful error messages for invalid input

### 5. Performance
- Parallel candidate processing
- Configurable response token limits
- Average response time: 100-500ms (depending on LLM latency)

## Usage Examples

### Example 1: Basic Re-ranking

```bash
curl -X POST http://localhost:5000/v1/search/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "query": "python developer",
    "candidates": [
      {
        "_id": "1",
        "name": "Alice Johnson",
        "role": "Python Developer",
        "company": "TechCorp",
        "skills": "Python, Django",
        "score": 0.85
      },
      {
        "_id": "2",
        "name": "Bob Smith",
        "role": "Java Developer",
        "company": "StartUp Inc",
        "skills": "Java, Spring",
        "score": 0.75
      }
    ],
    "topK": 2
  }'
```

### Example 2: With Groq Hybrid Search Results

```javascript
// First, get hybrid search results
const hybridResults = await axios.post('http://localhost:5000/v1/search/hybrid', {
  query: 'senior backend engineer',
  bm25Weight: 0.5,
  vectorWeight: 0.5,
  limit: 10
});

// Then re-rank them with LLM for final ordering
const rerankResults = await axios.post('http://localhost:5000/v1/search/rerank', {
  query: 'senior backend engineer with 5+ years experience',
  candidates: hybridResults.data.data.map(r => ({
    _id: r._id,
    name: r.name,
    role: r.role,
    company: r.company,
    skills: r.skills.join(', '),
    email: r.email,
    score: r.combinedScore
  })),
  topK: 5,
  temperature: 0.3, // More consistent results
  detailed: true
});
```

### Example 3: Dynamic Configuration

```bash
# More creative scoring (higher temperature)
curl -X POST http://localhost:5000/v1/search/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "query": "innovative product manager",
    "candidates": [...],
    "temperature": 1.5,
    "maxTokens": 3000,
    "detailed": true
  }'

# Quick ranking with lower tokens
curl -X POST http://localhost:5000/v1/search/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "query": "python developer",
    "candidates": [...],
    "temperature": 0.3,
    "maxTokens": 800,
    "detailed": false
  }'
```

## Integration with Hybrid Search Pipeline

The re-ranking service is designed to enhance the hybrid search pipeline:

```
User Query
    ↓
Generate Query Embedding
    ↓
┌─────────────────────┬──────────────────────┐
│                     │                      │
BM25 Search    Vector Similarity Search
│                     │                      │
└─────────────────────┴──────────────────────┘
    ↓
  Merge Results (Hybrid Score)
    ↓
  Select Top N (topK)
    ↓
  LLM Re-Ranking ← HERE
    ↓
  Final Sorted Results
```

## Error Handling

### Input Validation Errors (400)

```json
{
  "status": "error",
  "message": "Query cannot be empty",
  "data": null
}
```

Possible validation error messages:
- "Query cannot be empty"
- "Candidates must be a non-empty array"
- "Maximum 100 candidates allowed for re-ranking"
- "topK must be between 1 and {length}"
- "temperature must be between 0 and 2"
- "maxTokens must be between 100 and 4000"
- "Each candidate must have _id, name, and role"

### LLM API Errors (500 with Fallback)

When Groq API is unavailable, the service automatically falls back to returning candidates sorted by their original score:

```json
{
  "status": "success",
  "message": "Re-ranked 5 candidates",
  "data": [
    {
      "_id": "...",
      "name": "...",
      "role": "...",
      "rerankScore": 0.85,
      "originalScore": 0.85
    }
  ],
  "metadata": {
    "config": {...}
  }
}
```

Note: The `rerankScore` will equal `originalScore` when using fallback ranking.

## Testing

Run the comprehensive test suite:

```bash
cd backend
node test-rerank.js
```

Test results include:
- ✅ Service status endpoint
- ✅ Input validation (empty query, candidates, limits)
- ✅ Re-ranking with fallback handling
- ✅ Response structure validation
- ✅ Configuration parameter validation

## Performance Characteristics

| Aspect | Value |
|--------|-------|
| Max candidates per request | 100 |
| Avg response time | 100-500ms |
| Max token response | 4000 |
| Fallback availability | Yes |
| Concurrent requests supported | Yes (stateless) |

## LLM Model

- **Model**: Mixtral-8x7b-32768 (via Groq)
- **Provider**: Groq API
- **Features**:
  - Fast inference (sub-second typical)
  - Good understanding of professional context
  - Supports JSON output format
  - Temperature tuning supported

## Future Enhancements

1. **Caching**: Cache frequently re-ranked queries
2. **Analytics**: Track re-ranking effectiveness and score distribution
3. **Custom Prompts**: Allow users to provide custom ranking criteria
4. **Batch Re-ranking**: Group multiple re-rank requests
5. **Model Selection**: Support multiple LLM models from different providers
6. **Explainability**: Detailed reasoning for each ranking decision

## Related Files

- Service: `backend/src/services/llmRankingService.ts`
- Controller: `backend/src/controllers/rankingController.ts`
- Routes: `backend/src/routes/searchRoutes.ts`
- App: `backend/src/app.ts` (logging)
- Tests: `backend/test-rerank.js`
- Config: `backend/.env`
