# Quick Reference: Hybrid Search API

## Endpoints At a Glance

```
┌─────────────────────────────────────────────────────────┐
│              HYBRID SEARCH API ENDPOINTS               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ POST   /v1/search/hybrid                               │
│        Basic hybrid search with configurable weights   │
│                                                         │
│ POST   /v1/search/hybrid/advanced                      │
│        Advanced search with threshold filtering        │
│                                                         │
│ GET    /v1/search/hybrid/stats                         │
│        Get search capabilities and statistics          │
│                                                         │
│ GET    /v1/search/hybrid/weights/:intent               │
│        Get recommended weights (keyword|semantic|...   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Request/Response Template

### BASIC SEARCH
```json
REQUEST:
{
  "query": "python developer",
  "bm25Weight": 0.5,
  "vectorWeight": 0.5,
  "limit": 10,
  "skip": 0
}

RESPONSE:
{
  "status": "success",
  "message": "Found 5 results",
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Senior Developer",
      "company": "Tech Corp",
      "skills": "Python, Django, REST",
      "bm25Score": 0.75,
      "vectorScore": 0.82,
      "combinedScore": 0.785
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

---

## Weight Configurations

```
┌──────────────┬──────────┬──────────┬─────────────────────────┐
│ Intent       │ BM25     │ Vector   │ Best For                │
├──────────────┼──────────┼──────────┼─────────────────────────┤
│ keyword      │ 0.7      │ 0.3      │ Exact job titles        │
│ semantic     │ 0.3      │ 0.7      │ Similar experience      │
│ balanced     │ 0.5      │ 0.5      │ General searches        │
└──────────────┴──────────┴──────────┴─────────────────────────┘
```

---

## Common Curl Commands

### 1. Get Recommended Weights
```bash
curl http://localhost:5000/v1/search/hybrid/weights/keyword
curl http://localhost:5000/v1/search/hybrid/weights/semantic
curl http://localhost:5000/v1/search/hybrid/weights/balanced
```

### 2. Basic Search
```bash
curl -X POST http://localhost:5000/v1/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "python developer",
    "bm25Weight": 0.5,
    "vectorWeight": 0.5
  }'
```

### 3. Advanced Search with Thresholds
```bash
curl -X POST http://localhost:5000/v1/search/hybrid/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning engineer",
    "bm25Weight": 0.5,
    "vectorWeight": 0.5,
    "bm25Threshold": 0.3,
    "vectorThreshold": 0.65
  }'
```

### 4. Get Statistics
```bash
curl http://localhost:5000/v1/search/hybrid/stats
```

---

## Score Interpretation Chart

```
Combined Score → Meaning
┌────────────────────────────────────────┐
│ 0.9 - 1.0 │ ████████████ Excellent    │
│ 0.7 - 0.9 │ ██████████   Very Good    │
│ 0.5 - 0.7 │ ████████     Good         │
│ 0.3 - 0.5 │ ██████       Fair         │
│ 0.0 - 0.3 │ ████         Weak         │
└────────────────────────────────────────┘
```

---

## Threshold Guide

```
BM25 Threshold: 0.0 → 1.0
  0.0 = All BM25 results included
  0.3 = Moderate keyword matching required
  0.5 = Strong keyword matching required
  1.0 = Only perfect BM25 matches

Vector Threshold: 0.0 → 1.0
  0.0 = All semantic results included
  0.5 = Moderate semantic match required
  0.7 = Strong semantic match required
  1.0 = Only perfect semantic matches
```

---

## Pagination Example

```bash
# Page 1: First 10 results
curl -X POST http://localhost:5000/v1/search/hybrid \
  -d '{"query": "engineer", "limit": 10, "skip": 0}'

# Page 2: Next 10 results
curl -X POST http://localhost:5000/v1/search/hybrid \
  -d '{"query": "engineer", "limit": 10, "skip": 10}'

# Page 3: Next 10 results
curl -X POST http://localhost:5000/v1/search/hybrid \
  -d '{"query": "engineer", "limit": 10, "skip": 20}'
```

---

## Decision Tree: Which Configuration?

```
START: What are you looking for?
│
├─ "EXACT JOB TITLE"
│  └─ Use: keyword (0.7/0.3)
│
├─ "SPECIFIC SKILLS"
│  └─ Use: keyword (0.7/0.3)
│
├─ "GENERAL ROLE"
│  └─ Use: balanced (0.5/0.5)
│
├─ "SIMILAR BACKGROUND"
│  └─ Use: semantic (0.3/0.7)
│
└─ "CUSTOM WEIGHTS"
   └─ POST with custom bm25Weight and vectorWeight
```

---

## Status Codes & Errors

```
200 OK          ✅ Search successful
400 Bad Request ❌ Invalid query or parameters
  - Empty query
  - Invalid weights (not 0-1)
  - Invalid thresholds
  - Skip < 0

500 Server Error ❌ Internal error
  - Both searches failed
  - Database connection issue
  - Service error
```

---

## Response Fields Explained

```
{
  "status": "success"           → Always "success" or "error"
  "message": "Found X results"  → Short human-readable message
  "data": [...]                 → Array of resume matches
  
  In each result:
  ├─ _id: Document ID
  ├─ name: Candidate name
  ├─ email: Contact email
  ├─ role: Current job title
  ├─ company: Current employer
  ├─ skills: Skill summary
  ├─ bm25Score: Keyword match score (0-1 normalized)
  ├─ vectorScore: Semantic match score (0-1)
  └─ combinedScore: Final weighted score
  
  metadata:
  ├─ totalResults: Number of results returned
  ├─ limit: Results per page
  ├─ skip: Pagination offset
  └─ config: Search configuration used
}
```

---

## Performance Tips

```
FAST SEARCH:
- Use: limit: 5, bm25Weight: 0.8
- Run time: ~200-500ms

QUALITY SEARCH:
- Use: thresholds, balanced weights
- Run time: ~1-1.5s

BROAD SEARCH:
- Use: limit: 50, vectorWeight: 0.8
- Run time: ~1-2s
```

---

## Integration Example (JavaScript)

```javascript
// Get recommended config
async function getConfig(intent = 'balanced') {
  const res = await fetch(`/v1/search/hybrid/weights/${intent}`);
  return res.json();
}

// Perform search
async function hybridSearch(query) {
  const config = await getConfig('balanced');
  
  const res = await fetch('/v1/search/hybrid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      ...config.data,
      limit: 20
    })
  });
  
  return res.json();
}

// Use it
const results = await hybridSearch('python developer');
console.log(`Found ${results.data.length} candidates`);
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too many results | Increase thresholds or decrease limit |
| Too few results | Decrease thresholds or increase vectorWeight |
| Wrong top result | Check weights - may need different config |
| No results | Verify query is non-empty and database has data |
| Slow search | Increase bm25Weight (exact matching faster) |
| Error 400 | Check query not empty, weights 0-1, skip ≥0 |

---

## All Endpoints Quick List

```
1. POST   /v1/search/hybrid
   → Basic hybrid search

2. POST   /v1/search/hybrid/advanced
   → Hybrid with thresholds

3. GET    /v1/search/hybrid/stats
   → System status

4. GET    /v1/search/hybrid/weights/:intent
   → weight recommendations

Plus existing endpoints:
5. POST   /v1/search/bm25
6. POST   /v1/search/vector
7. GET    /v1/search/stats
... and others
```

---

## Server Info

```
URL:     http://localhost:5000
Health:  GET /health
Docs:
  - HYBRID_SEARCH_IMPLEMENTATION.md (complete guide)
  - HYBRID_SEARCH_CONFIG.md (configuration examples)
  - COMPLETE_SYSTEM_ARCHITECTURE.md (overview)
```

