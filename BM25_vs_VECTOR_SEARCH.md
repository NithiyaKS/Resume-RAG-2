# BM25 vs Vector Search Comparison Guide

## Quick Comparison

| Feature | BM25 Search | Vector Search | Hybrid |
|---------|------------|---------------|---------|
| **Search Type** | Keyword-based | Semantic (concept-based) | Both |
| **Technology** | Full-text index | Embeddings (Mistral AI) | Combined |
| **Speed** | ⚡ Very fast | 🐢 Slower (includes embedding generation) | ✅ Optimized |
| **Cost** | 💰 Low | 💸 High (API calls) | 💵 Balanced |
| **Accuracy** | 📊 Lexical | 🧠 Semantic | 🎯 Best |
| **Indexed Fields** | 7 fields | All document content | Both |
| **Latency** | <100ms | 500-2000ms | 100-2000ms |
| **Recall** | Exact word matches | Concept matches | Complete |
| **Scaling** | Excellent | Good | Excellent |

---

## When to Use Each

### ✅ Use BM25 When:
```
- Searching for specific technologies/tools
  Query: "python", "react", "aws"
  
- Looking for exact job titles
  Query: "senior engineer", "manager", "analyst"
  
- Need fast results (<100ms)
  Real-time autocomplete, quick lookups
  
- Searching structured fields
  Specific companies, locations, roles
  
- Want exact keyword matching
  Compliance searches, specific requirements
```

**Example Queries for BM25:**
- "Java developer"
- "AWS architect"  
- "Scrum master"
- "machine learning"

---

### ✅ Use Vector Search When:
```
- Finding semantically similar candidates
  Query: "someone like John", profile similarity
  
- Natural language queries
  Query: "backend engineer with 5+ years in microservices"
  
- Concept-based matching
  Query: "modern full-stack developer" (without listing exact techs)
  
- Experience profile matching
  Query: "team leader transitioning to management"
  
- Finding alternatives/substitutes
  Query: "Python developer" finds Java developers with similar roles
```

**Example Queries for Vector Search:**
- "senior backend engineer with distributed systems experience"
- "data scientist passionate about machine learning"
- "frontend developer skilled in modern web technologies"
- "DevOps engineer comfortable with cloud platforms"

---

### ✅ Use Hybrid (Both) When:
```
- Maximum recall and precision required
  Combine both methods and merge results
  
- You're unsure about technical details
  "Someone good at building scalable systems"
  
- Recruiting for senior positions
  Both keyword precision + semantic fit matter
  
- Filtering large candidate pools
  Use BM25 for quick filter, Vector for ranking
```

---

## Detailed Comparison

### BM25 Full-Text Search

**How it works:**
1. Indexes text fields (name, skills, role, company, etc.)
2. Splits query into keywords
3. Finds exact word matches
4. Ranks by frequency and importance

**Best for:**
- ✅ "Python developer" → finds all resumes with "Python" AND/OR "developer"
- ✅ "AWS architect" → exact matches in skills field
- ✅ "Bangalore" → location filtering
- ✅ "5 years" → searching experience descriptions

**Examples:**

```bash
# Search for specific skills
curl -X POST http://localhost:5000/v1/search/bm25 \
  -H "Content-Type: application/json" \
  -d '{"query": "kubernetes docker python", "limit": 10}'

# Results: All resumes mentioning these terms
# ✅ "Kubernetes and Docker expert, Python specialist"
# ✅ "DevOps: Docker, Kubernetes, Python scripting"
# ✅ "Cloud engineer: certified in Docker and Kubernetes"
```

---

### Vector Search (Semantic)

**How it works:**
1. Converts query into 1024D embedding using Mistral AI
2. Compares with stored candidate embeddings
3. Calculates cosine similarity (0-1 scale)
4. Returns candidates by semantic closeness

**Best for:**
- ✅ "Someone who builds scalable systems" → finds various approaches
- ✅ "Full-stack developer" → finds Python/JS/Java developers
- ✅ "Team leadership" → finds managers and technical leads
- ✅ "Problem solver" → finds researchers, engineers, architects

**Examples:**

```bash
# Semantic similarity search
curl -X POST http://localhost:5000/v1/search/vector \
  -H "Content-Type: application/json" \
  -d '{
    "query": "backend engineer with experience in distributed systems",
    "limit": 10
  }'

# Results: May include developers with different tech stacks
# ✅ "Java Spring Boot microservices architect" (Score: 0.82)
# ✅ "Go gRPC distributed systems expert" (Score: 0.79)
# ✅ "Python Django REST APIs developer" (Score: 0.75)
# NOT included: Frontend developers (too different semantically)
```

---

## Real-World Scenarios

### Scenario 1: Quick Technology Search
**Need**: Find all Python developers

**Solution**: Use BM25
```bash
# Fast, accurate
curl -X POST http://localhost:5000/v1/search/bm25 \
  -H "Content-Type: application/json" \
  -d '{"query": "python", "limit": 20}'
```

**Why?** Finds "Python developer", "Python/Django", "expert in Python" instantly

---

### Scenario 2: Senior Hire Requiem
**Need**: Find someone to lead a distributed systems team with 10+ years experience

**Solution**: Use Vector Search
```bash
# More nuanced
curl -X POST http://localhost:5000/v1/search/vector/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "senior leader in distributed systems with 10 years managing teams",
    "scoreThreshold": 0.75,
    "limit": 10
  }'
```

**Why?** Understands the concept of "leadership", "experience", "systems design"

---

### Scenario 3: Flexible Contractor Search
**Need**: Need someone to help with our internal tooling and we're flexible on tech

**Solution**: Hybrid Approach

```javascript
// Step 1: Get candidates mentioning common tools
const keywords = await bm25Search("python golang rust c++");

// Step 2: Get candidates with similar background/experience
const similar = await vectorSearch(
  "full-stack developer comfortable learning new languages"
);

// Step 3: Combine and merge
const combined = mergeResults(keywords, similar);
```

---

### Scenario 4: Exact JD Matching
**Need**: Need someone who fits exact requirements

**Solution**: Use BM25 strictly

```bash
# Need someone with these EXACT skills
curl -X POST http://localhost:5000/v1/search/bm25 \
  -H "Content-Type: application/json" \
  -d '{
    "query": "TypeScript React AWS Node.js Docker",
    "limit": 5
  }'
```

**Why?** Must have all specific technologies listed

---

## Performance Comparison

### Search Speed

```
BM25 Search:
Query: "python developer"
Time: 50-100ms (from index)
Results: 86 matches

Vector Search:
Query: "senior python developer"
Time: 1500-2000ms (includes embedding generation)
Results: 10 similar candidates (by score)

Hybrid (Combined):
First query: 2000ms (vector takes longer)
Cached results: 100-200ms (subsequent same query)
```

### Cost Comparison

```
BM25: Free (MongoDB text index)
Vector: ~$0.0001 per query (Mistral API)
       = ~$0.10 per 1000 queries
       = ~$30/month at 100K queries/month

Hybrid: Combined cost
```

---

## Implementation Examples

### Example 1: Quick Lookup
```javascript
// User types "python" in search box
const results = await fetch(
  'http://localhost:5000/v1/search/bm25',
  {
    method: 'POST',
    body: JSON.stringify({
      query: 'python',
      limit: 20
    })
  }
).then(r => r.json());

// Returns 86 matches instantly
```

### Example 2: Semantic Profile Match
```javascript
// User says "I need someone like John"
// John's profile summary: "Full-stack engineer, 8 years, Node.js, React"

const similar = await fetch(
  'http://localhost:5000/v1/search/vector',
  {
    method: 'POST',
    body: JSON.stringify({
      query: 'full-stack engineer 8 years node.js react experience',
      limit: 10
    })
  }
).then(r => r.json());

// Returns candidates with similar profiles
```

### Example 3: Hybrid Search
```javascript
// Complete solution: keyword + semantic
async function comprehensiveSearch(query, specificKeywords) {
  // Fast keyword search first
  const bm25 = await fetch('http://localhost:5000/v1/search/bm25', {
    method: 'POST',
    body: JSON.stringify({ query: specificKeywords, limit: 50 })
  }).then(r => r.json());
  
  // Deeper semantic search
  const vector = await fetch('http://localhost:5000/v1/search/vector', {
    method: 'POST',
    body: JSON.stringify({ query, limit: 50 })
  }).then(r => r.json());
  
  // Merge: prefer candidates matching both
  const merged = new Map();
  
  // Weight BM25 results (exact matches)
  bm25.data.results.forEach((r, i) => {
    merged.set(r._id, {
      ...r,
      finalScore: (1 - i/50) * 100  // Ranking score
    });
  });
  
  // Add vector results (semantic matches)
  vector.data.forEach((r, i) => {
    const id = r._id;
    if (merged.has(id)) {
      const existing = merged.get(id);
      existing.finalScore += r.score * 50;  // Boost combined matches
    } else {
      merged.set(id, {
        ...r,
        finalScore: r.score * 50
      });
    }
  });
  
  // Sort and return top results
  return Array.from(merged.values())
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 20);
}
```

---

## Decision Tree

```
START: What are you searching for?
│
├─ Specific technology/skill (like "python", "aws")
│  └─ BM25 ✅
│     "I need someone who knows Python"
│
├─ Specific job title (like "manager", "architect")
│  └─ BM25 ✅
│     "I need a senior engineer"
│
├─ Exact requirement match
│  └─ BM25 ✅
│     "Need: React, Node.js, AWS, Docker"
│
├─ Natural language query
│  └─ VECTOR ✅
│     "Someone who builds scalable systems"
│
├─ Personality/culture fit
│  └─ VECTOR ✅
│     "Team player who loves innovation"
│
├─ Similar to existing employee
│  └─ VECTOR ✅
│     "Find someone like John"
│
├─ Broad role (like "backend engineer")
│  ├─ Do they mention specific tech? YES → BM25
│  └─ Flexible on tech? NO → VECTOR
│
└─ Maximize candidate pool
   └─ HYBRID (Both) ✅
      Use both methods, merge results
```

---

## Recommendations

### For Recruiters
- **Fast Screening**: Use BM25 for high-volume initial filtering
- **Final Selection**: Use Vector for semantic fit / culture match
- **Best Practice**: Start with BM25 (fast), then Vector (deep dive)

### For Process Automation
- **Keywords**: BM25 (reliable, predictable)
- **Recommendations**: Vector (serendipitous finds)
- **Combined**: Hybrid (comprehensiveness)

### For User Experience
- **Search Suggestions**: BM25 (fast, indexed keywords)
- **"Similar Profiles"**: Vector (semantic matches)
- **"Recommended"**: Hybrid (combined ranking)

---

## Conclusion

| Use Case | Recommendation |
|----------|---|
| Quick technology search | 🎯 BM25 |
| Semantic profile matching | 🎯 Vector |
| Maximum coverage | 🎯 Hybrid |
| Budget-conscious | 🎯 BM25 |
| Precision + Recall | 🎯 Hybrid |

**For best results, use BOTH and let the application combine them intelligently!**
