# Hybrid Search Implementation (BM25 + Vector)

## Overview

The Hybrid Search system intelligently combines **BM25 full-text search** with **vector semantic search** to deliver powerful, flexible resume matching. Users can configure weighting between keyword matching and meaning-based search based on their needs.

## Architecture

```
User Query
    ↓
[Hybrid Search Service]
    ↓
    ├─→ [BM25SearchService] ──→ Keyword matching
    │      (100 results)          
    │
    └─→ [VectorSearchService] ──→ Semantic similarity
           (100 results)            (0-1 score)
    ↓
[Result Combination & Scoring]
    - Merge by document ID
    - Normalize scores (BM25 → 0-1 scale)
    - Apply weights (default 0.5/0.5)
    - Apply thresholds (optional)
    ↓
[Sorted Results with Combined Scores]
    - Combined = (BM25_Score × BM25_Weight) + (Vector_Score × Vector_Weight)
    - Highest scores first
    - Pagination support
```

## API Endpoints

### 1. Basic Hybrid Search
**POST `/v1/search/hybrid`**

Combine BM25 and vector search with configurable weights.

**Request:**
```json
{
  "query": "python developer",
  "bm25Weight": 0.5,
  "vectorWeight": 0.5,
  "limit": 10,
  "skip": 0
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Found 5 results",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "USHA R",
      "email": "usha.r@example.com",
      "role": "QA Lead",
      "company": "Tech Company",
      "skills": "Python, Testing, Automation",
      "bm25Score": 0.7251,
      "vectorScore": 0.3253,
      "combinedScore": 0.5152
    }
  ],
  "metadata": {
    "totalResults": 5,
    "limit": 10,
    "skip": 0,
    "config": {
      "bm25Weight": 0.5,
      "vectorWeight": 0.5
    }
  }
}
```

**Parameters:**
- `query` (string, required): Search terms
- `bm25Weight` (number, 0-1, default 0.5): Keyword matching weight
- `vectorWeight` (number, 0-1, default 0.5): Semantic similarity weight
- `limit` (number, 1-100, default 10): Results per page
- `skip` (number, default 0): Pagination offset

---

### 2. Advanced Hybrid Search with Filtering
**POST `/v1/search/hybrid/advanced`**

Apply score thresholds to filter low-quality results.

**Request:**
```json
{
  "query": "machine learning engineer",
  "bm25Weight": 0.6,
  "vectorWeight": 0.4,
  "bm25Threshold": 0.3,
  "vectorThreshold": 0.65,
  "normalizeScores": true,
  "limit": 10,
  "skip": 0
}
```

**Response:** Same as basic search, but filtered by thresholds

**Additional Parameters:**
- `bm25Threshold` (number, 0-1, optional): Minimum BM25 score to include
- `vectorThreshold` (number, 0-1, optional): Minimum vector score to include
- `normalizeScores` (boolean, default true): Normalize different score scales

---

### 3. Hybrid Search Statistics
**GET `/v1/search/hybrid/stats`**

Get capabilities and statistics about hybrid search.

**Response:**
```json
{
  "status": "success",
  "message": "Hybrid search statistics",
  "data": {
    "bm25Available": true,
    "vectorAvailable": true,
    "totalDocuments": 92,
    "documentsWithEmbeddings": 90,
    "recommendedWeights": {
      "bm25": 0.5,
      "vector": 0.5
    }
  },
  "metadata": {
    "searchMethods": ["bm25", "vector"],
    "timestamp": "2026-03-10T19:35:42.123Z"
  }
}
```

---

### 4. Get Recommended Weights by Intent
**GET `/v1/search/hybrid/weights/:intent`**

Get optimized weight configurations for specific use cases.

**Intents:**
- `keyword`: Favor exact matches (BM25: 0.7, Vector: 0.3)
- `semantic`: Favor meaning and concepts (BM25: 0.3, Vector: 0.7)
- `balanced`: Equal weighting (BM25: 0.5, Vector: 0.5)

**Example Request:** `GET /v1/search/hybrid/weights/keyword`

**Response:**
```json
{
  "status": "success",
  "message": "Recommended weights for keyword intent",
  "data": {
    "intent": "keyword",
    "bm25Weight": 0.7,
    "vectorWeight": 0.3
  }
}
```

---

## Usage Scenarios

### Scenario 1: Job Title Search
**Goal:** Find candidates with exact job titles

```bash
curl -X POST http://localhost:5000/v1/search/hybrid/weights/keyword
# Returns: {bm25Weight: 0.7, vectorWeight: 0.3}

curl -X POST http://localhost:5000/v1/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Senior Python Developer",
    "bm25Weight": 0.7,
    "vectorWeight": 0.3
  }'
```

### Scenario 2: Skills-Based Search
**Goal:** Find candidates by skillset and experience level

```bash
curl -X POST http://localhost:5000/v1/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning AI deep learning neural networks",
    "bm25Weight": 0.5,
    "vectorWeight": 0.5
  }'
```

### Scenario 3: Semantic Matching
**Goal:** Find candidates with similar background/role

```bash
curl -X POST http://localhost:5000/v1/search/hybrid/weights/semantic
# Returns: {bm25Weight: 0.3, vectorWeight: 0.7}

curl -X POST http://localhost:5000/v1/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "experienced software architect",
    "bm25Weight": 0.3,
    "vectorWeight": 0.7
  }'
```

### Scenario 4: Strict Filtering
**Goal:** Only high-quality matches

```bash
curl -X POST http://localhost:5000/v1/search/hybrid/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "data scientist",
    "bm25Weight": 0.5,
    "vectorWeight": 0.5,
    "bm25Threshold": 0.5,
    "vectorThreshold": 0.75,
    "normalizeScores": true
  }'
```

---

## Score Interpretation

### Combined Score (0-1 scale)
- **0.9-1.0**: Excellent match - highly relevant
- **0.7-0.9**: Very good match - relevant results
- **0.5-0.7**: Good match - relevant with some variation
- **0.3-0.5**: Fair match - related but may need review
- **0.0-0.3**: Weak match - distant or minimal relevance

### Component Scores
- **BM25 Score**: Measures keyword presence and frequency
  - Higher = more keyword matches
  - Normalized to 0-1 range for combination
  
- **Vector Score**: Measures semantic similarity
  - Already 0-1 scale (cosine similarity)
  - Higher = more meaning-based similarity

---

## Configuration Guide

### When to Use Each Weight Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ GOAL                      │ CONFIG              │ WEIGHTS    │
├─────────────────────────────────────────────────────────────┤
│ Exact title/role match    │ Keyword-focused     │ 0.7 / 0.3  │
│ Specific skill search     │ Keyword-focused     │ 0.7 / 0.3  │
│ Experience level search   │ Balanced            │ 0.5 / 0.5  │
│ Similar profile search    │ Semantic-focused    │ 0.3 / 0.7  │
│ Broad candidate search    │ Semantic-focused    │ 0.3 / 0.7  │
│ Mixed requirement match   │ Balanced            │ 0.5 / 0.5  │
└─────────────────────────────────────────────────────────────┘
```

### Threshold Recommendations

**For High-Quality Results:**
```json
{
  "bm25Threshold": 0.4,
  "vectorThreshold": 0.7
}
```

**For Broad Results:**
```json
{
  "bm25Threshold": 0.0,  // No BM25 filter
  "vectorThreshold": 0.5
}
```

**For Strict Matching:**
```json
{
  "bm25Threshold": 0.6,
  "vectorThreshold": 0.75
}
```

---

## Implementation Details

### HybridSearchService

**Location:** `src/services/hybridSearchService.ts`

**Key Methods:**

1. **search(query, config, limit, skip)**
   - Main search entry point
   - Runs BM25 and vector searches in parallel
   - Combines results by document ID
   - Returns sorted by combined score

2. **advancedSearch(query, config, limit, skip)**
   - Advanced version with thresholds
   - Filters results before returning
   - Same scoring mechanism as basic search

3. **getSearchStats()**
   - Returns search capability information
   - Shows availability of BM25 and vector search
   - Provides recommended default weights

4. **getRecommendedWeights(intent)**
   - Returns optimized weights for specific intent
   - Supports: 'keyword', 'semantic', 'balanced'

### Scoring Algorithm

```typescript
// 1. Get BM25 and vector scores (fetched in parallel)
const bm25Score = result.bm25Score;        // Raw BM25 score
const vectorScore = result.vectorScore;    // Cosine similarity (0-1)

// 2. Normalize BM25 score to 0-1 range
const normalizedBM25 = Math.min(bm25Score / 10, 1);  // Cap at 10

// 3. Apply weights and combine
const combinedScore = 
  (normalizedBM25 × config.bm25Weight) + 
  (vectorScore × config.vectorWeight);

// 4. Sort by combined score (highest first)
results.sort((a, b) => b.combinedScore - a.combinedScore);
```

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Parallel Search Time | Both searches run simultaneously |
| BM25 Search | ~100-500ms for 100 results |
| Vector Search | ~200-800ms for 100 results (with fallback) |
| Total Hybrid Time | ~500-1500ms for 10 results |
| Combination Time | ~10-50ms |
| Pagination Overhead | Negligible (in-memory sorting) |

---

## Error Handling

If either search method fails:
- **BM25 fails**: Returns vector search results only
- **Vector fails**: Returns BM25 search results only
- **Both fail**: Returns error response

Example fallback behavior:
```
Query: "senior engineer"
├─ BM25: ❌ Connection error → Skip
├─ Vector: ✅ Success → Use results
└─ Result: Vector search results returned
```

---

## Pagination Example

Get page 2 of results:
```bash
curl -X POST http://localhost:5000/v1/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "python developer",
    "limit": 10,
    "skip": 10,
    "bm25Weight": 0.5,
    "vectorWeight": 0.5
  }'
```

---

## Troubleshooting

**Problem:** Always getting same results regardless of weights
- **Cause:** Weights not properly configured
- **Solution:** Verify weights sum to ~1.0 and are in 0-1 range

**Problem:** BM25-heavy search returning many irrelevant results
- **Cause:** Too many keyword matches unrelated to intent
- **Solution:** Increase vectorWeight or add vectorThreshold

**Problem:** Vector-heavy search missing exact matches
- **Cause:** Semantic search prioritizes meaning over keywords
- **Solution:** Increase bm25Weight or use keyword-focused intent

**Problem:** Getting very few results after thresholds
- **Cause:** Thresholds set too high
- **Solution:** Lower thresholds or remove them (use advanced endpoint without thresholds)

---

## Next Steps

1. **Frontend Integration**: Build UI component for hybrid search
2. **Result Caching**: Cache popular queries for faster responses
3. **Analytics**: Track which weight configurations users prefer
4. **Result Clustering**: Group similar results together
5. **Feedback Loop**: Learn from user selections to adjust weights

