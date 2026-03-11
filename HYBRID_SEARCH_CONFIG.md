# Hybrid Search Configuration Guide

## Quick Reference

| Use Case | Intent | Configuration | BM25:Vector |
|----------|--------|----------------|-------------|
| **Exact Title Search** | keyword | Job title queries | 0.7 : 0.3 |
| **Specific Skills** | keyword | Skill-focused | 0.7 : 0.3 |
| **Role & Experience** | balanced | General search | 0.5 : 0.5 |
| **Cultural Fit** | semantic | Similar background | 0.3 : 0.7 |
| **Broad Candidate Search** | semantic | Open-ended queries | 0.3 : 0.7 |

---

## Configuration Profiles

### Profile 1: Keyword Power
**For:** Job description matching, specific role searches
```json
{
  "query": "Senior Python Developer with Django",
  "bm25Weight": 0.7,
  "vectorWeight": 0.3,
  "limit": 20
}
```
**Why:** Prioritizes exact keyword matches in resumes

---

### Profile 2: Balanced (Default)
**For:** General recruitment, screening
```json
{
  "query": "engineer",
  "bm25Weight": 0.5,
  "vectorWeight": 0.5,
  "limit": 10
}
```
**Why:** Good mix of keyword matching and meaning

---

### Profile 3: Semantic Intelligence
**For:** Cultural fit, role similarity, career pathing
```json
{
  "query": "tech lead transitioning to product",
  "bm25Weight": 0.3,
  "vectorWeight": 0.7,
  "limit": 15
}
```
**Why:** Finds candidates with similar career trajectories

---

### Profile 4: Strict Filtering
**For:** Senior positions, critical roles
```json
{
  "query": "Principal Architect",
  "bm25Weight": 0.5,
  "vectorWeight": 0.5,
  "bm25Threshold": 0.5,
  "vectorThreshold": 0.75,
  "normalizeScores": true,
  "limit": 10
}
```
**Why:** Only high-confidence matches pass filters

---

### Profile 5: Broad Search
**For:** Initial screening, sourcing
```json
{
  "query": "software",
  "bm25Weight": 0.3,
  "vectorWeight": 0.7,
  "limit": 50
}
```
**Why:** Casts wide net with semantic matching

---

## Weight Configuration Decision Tree

```
START: What are you looking for?
│
├─→ "EXACT JOB TITLE MATCH"
│   └─→ Use: bm25Weight: 0.7, vectorWeight: 0.3
│   └─→ Example: "Senior Python Developer"
│
├─→ "SPECIFIC SKILLS"
│   └─→ Use: bm25Weight: 0.7, vectorWeight: 0.3
│   └─→ Example: "Machine Learning, TensorFlow, PyTorch"
│
├─→ "GENERAL ROLE DESCRIPTION"
│   └─→ Use: bm25Weight: 0.5, vectorWeight: 0.5
│   └─→ Example: "software engineer"
│
├─→ "SIMILAR BACKGROUND/PROFILE"
│   └─→ Use: bm25Weight: 0.3, vectorWeight: 0.7
│   └─→ Example: "founder with sales experience"
│
└─→ "CULTURAL/EXPERIENCE FIT"
    └─→ Use: bm25Weight: 0.3, vectorWeight: 0.7
    └─→ Example: "fast-paced startup experience"
```

---

## Threshold Configuration Guide

### Low Thresholds (Broad Results)
```json
{
  "bm25Threshold": 0.0,
  "vectorThreshold": 0.5
}
```
**Use When:** Initial sourcing, large candidate pools needed
**Result:** Max candidates with minimal filtering

### Medium Thresholds (Balanced)
```json
{
  "bm25Threshold": 0.3,
  "vectorThreshold": 0.65
}
```
**Use When:** Standard screening, normal recruitment
**Result:** Good balance of quantity and quality

### High Thresholds (Strict Filtering)
```json
{
  "bm25Threshold": 0.5,
  "vectorThreshold": 0.8
}
```
**Use When:** Senior positions, critical roles
**Result:** Only top candidates pass filters

---

## Real-World Examples

### Example 1: Hiring Junior Developer

**Scenario:** Need to fill a junior developer role, many candidates to review

```json
{
  "query": "junior developer",
  "bm25Weight": 0.6,
  "vectorWeight": 0.4,
  "limit": 50,
  "skip": 0
}
```

**Why:** 
- Keyword weight (0.6) catches exact "junior" matches
- Vector weight (0.4) finds similar profiles with different keywords
- 50 results gives broad candidate pool for screening

---

### Example 2: Finding Cultural Fit

**Scenario:** Looking for candidates with startup experience and entrepreneurial mindset

```json
{
  "query": "startup founder early-stage growth",
  "bm25Weight": 0.3,
  "vectorWeight": 0.7,
  "limit": 20
}
```

**Why:**
- Low keyword weight - exact keywords less important
- High vector weight - semantic similarity finds related experience
- Finds people with startup DNA even if keywords differ

---

### Example 3: Skill-Specific Search

**Scenario:** Need Kubernetes and DevOps specialists

```json
{
  "query": "Kubernetes Docker Terraform AWS DevOps",
  "bm25Weight": 0.8,
  "vectorWeight": 0.2,
  "bm25Threshold": 0.4,
  "limit": 25
}
```

**Why:**
- Very high keyword weight - tech stack is precise
- Threshold ensures candidates have real DevOps experience
- Small vector weight catches related infra/cloud skills

---

### Example 4: Strict Executive Search

**Scenario:** CTO role - strict requirements

```json
{
  "query": "Chief Technology Officer VP Engineering",
  "bm25Weight": 0.5,
  "vectorWeight": 0.5,
  "bm25Threshold": 0.6,
  "vectorThreshold": 0.8,
  "normalizeScores": true,
  "limit": 10
}
```

**Why:**
- Balanced weights for executive roles
- High thresholds for strict qualification
- Small result set for detailed review

---

## A/B Testing Weights

Compare different configurations for same query:

```bash
# Configuration 1: Keyword-heavy
curl -X POST http://localhost:5000/v1/search/hybrid \
  -d '{"query": "engineer", "bm25Weight": 0.7, "vectorWeight": 0.3}'

# Configuration 2: Balanced
curl -X POST http://localhost:5000/v1/search/hybrid \
  -d '{"query": "engineer", "bm25Weight": 0.5, "vectorWeight": 0.5}'

# Configuration 3: Semantic-heavy
curl -X POST http://localhost:5000/v1/search/hybrid \
  -d '{"query": "engineer", "bm25Weight": 0.3, "vectorWeight": 0.7}'

# Compare results and pick best for your use case
```

---

## Performance Tuning

### For Faster Results
```json
{
  "bm25Weight": 0.8,
  "vectorWeight": 0.2,
  "limit": 5
}
```
- Higher BM25 weight = faster exact matching
- Lower limit = fewer results to process

### For Better Quality
```json
{
  "bm25Weight": 0.5,
  "vectorWeight": 0.5,
  "bm25Threshold": 0.4,
  "vectorThreshold": 0.7,
  "limit": 10
}
```
- Balanced weights = comprehensive search
- Thresholds = better result quality

### Best of Both Worlds
```json
{
  "bm25Weight": 0.6,
  "vectorWeight": 0.4,
  "bm25Threshold": 0.2,
  "vectorThreshold": 0.6,
  "limit": 15
}
```
- Balanced config with quality gates
- Good speed and quality tradeoff

---

## Troubleshooting Configurations

| Problem | Symptom | Solution |
|---------|---------|----------|
| Too many irrelevant results | Low scores (0.2-0.3) | Increase thresholds or increase vectorWeight |
| Missing exact matches | Keyword-heavy query missing matches | Decrease bm25Weight or lower bm25Threshold |
| Too few results | Need more candidates | Lower thresholds or increase vectorWeight |
| All results look same | No variety in results | Increase vectorWeight for diversity |
| Top result wrong | Best match not #1 | Check keyword importance, may need semantic boost |

---

## Integration Example

```javascript
// Get recommended weights for use case
async function getConfig(useCase) {
  const intents = {
    'exact-match': 'keyword',
    'similar-role': 'semantic',
    'general': 'balanced'
  };
  
  const response = await fetch(
    `/v1/search/hybrid/weights/${intents[useCase] || 'balanced'}`
  );
  return response.json();
}

// Search with recommended weights
async function search(query, useCase = 'general') {
  const config = await getConfig(useCase);
  
  const response = await fetch('/v1/search/hybrid', {
    method: 'POST',
    body: JSON.stringify({
      query,
      ...config.data,
      limit: 20
    })
  });
  
  return response.json();
}
```

---

## Key Takeaways

✅ **Keyword-focused (0.7/0.3)**: Use for specific job titles or skills
✅ **Balanced (0.5/0.5)**: Default for most scenarios  
✅ **Semantic-focused (0.3/0.7)**: Use for experience/culture fit
✅ **Thresholds**: Add when you need quality filtering
✅ **Test**: Try different configs for your specific use case

