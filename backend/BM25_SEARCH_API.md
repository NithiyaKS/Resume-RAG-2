# BM25 Full-Text Search API Documentation

## Overview

The BM25 Search API provides full-text search capabilities on the resume collection using MongoDB's text search with BM25-like relevance scoring. This allows users to find resumes based on keywords in skills, roles, company names, education, and full text.

## Base URL

```
http://localhost:5000/v1/search
```

## Endpoints

### 1. **BM25 Full-Text Search**

**Endpoint:** `POST /bm25`

Perform a simple full-text search for resumes matching your query.

**Request Body:**
```json
{
  "query": "python developer",
  "limit": 10,
  "skip": 0
}
```

**Parameters:**
- `query` (string, required): Search query (keywords to search for)
- `limit` (number, optional): Maximum number of results to return (default: 10, max: 100)
- `skip` (number, optional): Number of results to skip for pagination (default: 0)

**Response:**
```json
{
  "status": "success",
  "message": "Found 12 matching resumes for query: \"python developer\"",
  "data": {
    "query": "python developer",
    "total": 12,
    "returned": 5,
    "limit": 5,
    "skip": 0,
    "results": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Senior Python Developer",
        "company": "Tech Corp",
        "skills": ["Python", "Django", "REST APIs", "PostgreSQL"],
        "score": 5.234
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "Full Stack Developer",
        "company": "StartUp Inc",
        "skills": ["Python", "React", "Node.js", "MongoDB"],
        "score": 4.891
      }
    ]
  },
  "metadata": {
    "searchType": "BM25 Full-Text Search",
    "timestamp": "2026-03-10T12:30:45.123Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/v1/search/bm25 \
  -H "Content-Type: application/json" \
  -d '{
    "query": "python developer",
    "limit": 10,
    "skip": 0
  }'
```

---

### 2. **Advanced BM25 Search with Field Weights**

**Endpoint:** `POST /bm25/advanced`

Perform an advanced search with custom field-specific weights to prioritize certain fields.

**Request Body:**
```json
{
  "query": "senior engineer",
  "fields": {
    "role": 2,
    "skills": 1.5,
    "company": 1,
    "text": 1,
    "education": 0.5
  },
  "limit": 10,
  "skip": 0
}
```

**Parameters:**
- `query` (string, required): Search query
- `fields` (object, optional): Field weights (0-10 scale, higher = more important)
  - `name` (number): Weight for name field
  - `role` (number): Weight for job role field
  - `company` (number): Weight for company field
  - `skills` (number): Weight for skills field
  - `education` (number): Weight for education field
  - `text` (number): Weight for full text field
- `limit` (number, optional): Maximum results (default: 10, max: 100)
- `skip` (number, optional): Results to skip (default: 0)

**Response:**
```json
{
  "status": "success",
  "message": "Found 90 matching resumes using advanced BM25 search",
  "data": {
    "query": "senior engineer",
    "total": 90,
    "returned": 5,
    "limit": 5,
    "skip": 0,
    "results": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "Senior Software Engineer",
        "company": "Google",
        "skills": ["Java", "Kubernetes", "Cloud Architecture"],
        "score": 7.521
      }
    ],
    "fieldWeights": {
      "role": 2,
      "skills": 1.5,
      "company": 1
    }
  },
  "metadata": {
    "searchType": "Advanced BM25 Full-Text Search",
    "timestamp": "2026-03-10T12:30:45.123Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/v1/search/bm25/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "senior engineer",
    "fields": {
      "role": 2,
      "skills": 1.5,
      "company": 1
    },
    "limit": 10
  }'
```

---

### 3. **Get Search Statistics**

**Endpoint:** `GET /stats`

Retrieve information about the search indexes and database configuration.

**Response:**
```json
{
  "status": "success",
  "message": "Search statistics retrieved successfully",
  "data": {
    "totalDocuments": 92,
    "textIndexExists": true,
    "indexedFields": ["name", "email", "role", "company", "education", "skills", "text"]
  },
  "metadata": {
    "searchEngines": ["BM25 Full-Text Search"],
    "totalDocuments": 92,
    "timestamp": "2026-03-10T12:30:45.123Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/v1/search/stats
```

---

### 4. **Initialize Search Indexes**

**Endpoint:** `POST /init`

Manually trigger creation of text indexes on the resume collection. This is automatically done on first search, but can be called explicitly to ensure indexes exist.

**Request Body:** (empty or optional)
```json
{}
```

**Response:**
```json
{
  "status": "success",
  "message": "Search indexes initialized successfully",
  "data": {
    "totalDocuments": 92,
    "textIndexExists": true,
    "indexedFields": ["name", "email", "role", "company", "education", "skills", "text"]
  },
  "metadata": {
    "timestamp": "2026-03-10T12:30:45.123Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/v1/search/init \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Search Score Explanation

The **score** field in results represents the BM25 relevance score:
- **Higher score** = More relevant match
- Scores are calculated based on:
  - Term frequency in the document
  - Inverse document frequency (how rare the term is)
  - Field-specific weights (in advanced search)
  - Document length normalization

**Example scores:**
- `score: 5.234` - Very relevant match
- `score: 2.091` - Moderately relevant match
- `score: 0.5` - Weak match

---

## Pagination

Both search endpoints support pagination:

```json
{
  "query": "python",
  "limit": 10,
  "skip": 20
}
```

This retrieves results 21-30 (skipping first 20, returning 10 results).

---

## Indexed Fields

The following fields are indexed for full-text search:

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Resume owner's name | "John Doe" |
| `email` | Email address | "john@example.com" |
| `role` | Job title/role | "Senior Python Developer" |
| `company` | Company name | "Tech Corp" |
| `education` | Education details | "BS Computer Science" |
| `skills` | Skills (comma-separated or array) | "Python, Django, REST APIs" |
| `text` | Full text representation | Full resume text |

---

## Error Responses

### Empty Query
```json
{
  "status": "error",
  "message": "Search query is required and must be a non-empty string",
  "statusCode": 400
}
```

### Invalid Limit
```json
{
  "status": "error",
  "message": "Limit must be between 1 and 100",
  "statusCode": 400
}
```

### No Results
```json
{
  "status": "success",
  "message": "Found 0 matching resumes for query: \"xyz\"",
  "data": {
    "query": "xyz",
    "total": 0,
    "returned": 0,
    "results": []
  }
}
```

---

## Performance Tips

1. **Use specific keywords** - "python django" is more efficient than "skills"
2. **Limit results appropriately** - Use `limit: 10-50` for better performance
3. **Use pagination** - For large result sets, use `skip` and `limit`
4. **Advanced search for precision** - Use field weights when searching specific types of candidates

---

## Integration Example

```javascript
// Example: Search for Python developers
async function searchResumes() {
  const response = await fetch('http://localhost:5000/v1/search/bm25', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'python developer',
      limit: 20,
      skip: 0
    })
  });

  const data = await response.json();
  
  if (data.status === 'success') {
    console.log(`Found ${data.data.total} resumes`);
    data.data.results.forEach(resume => {
      console.log(`${resume.name} (${resume.role}) - Score: ${resume.score.toFixed(2)}`);
    });
  }
}
```

---

## Next Steps

After implementing BM25 search, you can:

1. **Combine with Vector Search** - Implement hybrid search combining BM25 + semantic vector search for better results
2. **Add Filters** - Filter results by role, company, experience level, etc.
3. **Add Sorting** - Sort by relevance, date added, name, etc.
4. **Cache Results** - Cache popular searches for faster performance
5. **Analytics** - Track popular search queries and improve the search experience

---

**Last Updated:** March 10, 2026  
**Status:** ✅ Production Ready
