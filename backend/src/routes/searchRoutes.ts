import { Router } from 'express';
import {
  bm25Search,
  advancedBM25Search,
  getSearchStats,
  initializeSearchIndexes,
} from '../controllers/searchController';
import {
  vectorSearch,
  advancedVectorSearch,
  getVectorSearchStats,
} from '../controllers/vectorSearchController';
import {
  hybridSearch,
  advancedHybridSearch,
  getHybridSearchStats,
  getRecommendedWeights,
} from '../controllers/hybridSearchController';
import {
  rerankCandidates,
  getRerankStatus,
} from '../controllers/rankingController';
import {
  summarizeCandidate,
  batchSummarizeCandidates,
  getSummarizationStatus,
} from '../controllers/summarizationController';

const router = Router();

/**
 * BM25 Full-Text Search Routes
 * Base path: /v1/search
 */

/**
 * POST /v1/search/bm25
 * Perform BM25 full-text search on resume collection
 * 
 * Request body:
 * {
 *   "query": "python developer",
 *   "limit": 10,
 *   "skip": 0
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Found X matching resumes",
 *   "data": {
 *     "query": "python developer",
 *     "total": 25,
 *     "returned": 10,
 *     "results": [
 *       {
 *         "_id": "...",
 *         "name": "John Doe",
 *         "email": "john@example.com",
 *         "role": "Senior Python Developer",
 *         "company": "Tech Corp",
 *         "skills": ["Python", "Django", "REST APIs"],
 *         "score": 5.234
 *       }
 *     ]
 *   }
 * }
 */
router.post('/bm25', bm25Search);

/**
 * POST /v1/search/bm25/advanced
 * Perform advanced BM25 search with field-specific weights
 * 
 * Request body:
 * {
 *   "query": "python developer",
 *   "fields": {
 *     "skills": 2,
 *     "role": 1.5,
 *     "text": 1,
 *     "company": 0.5
 *   },
 *   "limit": 10,
 *   "skip": 0
 * }
 */
router.post('/bm25/advanced', advancedBM25Search);

/**
 * GET /v1/search/stats
 * Get search statistics and information about configured indexes
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "totalDocuments": 92,
 *     "textIndexExists": true,
 *     "indexedFields": ["name", "email", "role", "company", "education", "skills", "text"]
 *   }
 * }
 */
router.get('/stats', getSearchStats);

/**
 * POST /v1/search/init
 * Initialize search indexes (create text indexes if they don't exist)
 */
router.post('/init', initializeSearchIndexes);

/**
 * Vector Similarity Search Routes
 * Using semantic embeddings with cosine similarity
 */

/**
 * POST /v1/search/vector
 * Perform vector similarity search using embeddings
 * 
 * Request body:
 * {
 *   "query": "senior python developer with machine learning",
 *   "limit": 10,
 *   "skip": 0
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Vector search found 10 similar results",
 *   "data": [
 *     {
 *       "_id": "...",
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "role": "Senior Python Developer",
 *       "company": "Tech Corp",
 *       "skills": "Python, Machine Learning, TensorFlow",
 *       "score": 0.89
 *     }
 *   ],
 *   "metadata": {
 *     "total": 10,
 *     "limit": 10,
 *     "skip": 0,
 *     "metric": "cosine"
 *   }
 * }
 */
router.post('/vector', vectorSearch);

/**
 * POST /v1/search/vector/advanced
 * Perform advanced vector search with score threshold filtering
 * 
 * Request body:
 * {
 *   "query": "machine learning engineer",
 *   "scoreThreshold": 0.7,
 *   "limit": 10,
 *   "skip": 0
 * }
 * 
 * Score Threshold:
 * - 1.0: Identical match
 * - 0.9: Very similar
 * - 0.7: Similar
 * - 0.5: Somewhat similar
 * - 0.0: No similarity
 */
router.post('/vector/advanced', advancedVectorSearch);

/**
 * GET /v1/search/vector/stats
 * Get vector search statistics
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Vector search statistics retrieved",
 *   "data": {
 *     "totalDocuments": 92,
 *     "documentsWithEmbeddings": 92,
 *     "embeddingDimension": 1024,
 *     "similarityMetric": "cosine"
 *   }
 * }
 */
router.get('/vector/stats', getVectorSearchStats);

/**
 * Hybrid Search Routes
 * Combines BM25 full-text search with vector semantic search
 * Allows configurable weighting of both methods
 */

/**
 * POST /v1/search/hybrid
 * Perform hybrid search combining BM25 and vector methods
 * 
 * Request body:
 * {
 *   "query": "python developer with machine learning",
 *   "bm25Weight": 0.5,
 *   "vectorWeight": 0.5,
 *   "limit": 10,
 *   "skip": 0
 * }
 * 
 * Weights:
 * - bm25Weight: How much to weight keyword matching (0-1, default 0.5)
 * - vectorWeight: How much to weight semantic similarity (0-1, default 0.5)
 * - Weights should typically sum to 1.0 (though not strictly enforced)
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Found 10 results",
 *   "data": [
 *     {
 *       "_id": "...",
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "role": "Senior Python Developer",
 *       "company": "Tech Corp",
 *       "skills": "Python, Machine Learning",
 *       "bm25Score": 0.85,
 *       "vectorScore": 0.92,
 *       "combinedScore": 0.885
 *     }
 *   ],
 *   "metadata": {
 *     "config": {
 *       "bm25Weight": 0.5,
 *       "vectorWeight": 0.5
 *     }
 *   }
 * }
 */
router.post('/hybrid', hybridSearch);

/**
 * POST /v1/search/hybrid/advanced
 * Perform advanced hybrid search with filtering thresholds
 * 
 * Request body:
 * {
 *   "query": "machine learning engineer",
 *   "bm25Weight": 0.6,
 *   "vectorWeight": 0.4,
 *   "bm25Threshold": 0.3,
 *   "vectorThreshold": 0.65,
 *   "normalizeScores": true,
 *   "limit": 10,
 *   "skip": 0
 * }
 * 
 * Additional Parameters:
 * - bm25Threshold: Minimum BM25 score to include result (0-1)
 * - vectorThreshold: Minimum vector score to include result (0-1)
 * - normalizeScores: Normalize different score scales (recommended: true)
 * 
 * Response includes results after filtering with combined scores
 */
router.post('/hybrid/advanced', advancedHybridSearch);

/**
 * GET /v1/search/hybrid/stats
 * Get statistics about hybrid search capabilities
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "bm25Available": true,
 *     "vectorAvailable": true,
 *     "totalDocuments": 92,
 *     "documentsWithEmbeddings": 90,
 *     "recommendedWeights": {
 *       "bm25": 0.5,
 *       "vector": 0.5
 *     }
 *   }
 * }
 */
router.get('/hybrid/stats', getHybridSearchStats);

/**
 * GET /v1/search/hybrid/weights/:intent
 * Get recommended weights for a specific search intent
 * 
 * Intent options:
 * - keyword: Favor exact matches (BM25: 0.7, Vector: 0.3)
 * - semantic: Favor meaning and concepts (BM25: 0.3, Vector: 0.7)
 * - balanced: Equal weighting (BM25: 0.5, Vector: 0.5)
 * 
 * Example: GET /v1/search/hybrid/weights/keyword
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "intent": "keyword",
 *     "bm25Weight": 0.7,
 *     "vectorWeight": 0.3
 *   }
 * }
 */
router.get('/hybrid/weights/:intent', getRecommendedWeights);

/**
 * LLM Re-Ranking Routes
 * Base path: /v1/search/rerank
 */

/**
 * POST /v1/search/rerank
 * Re-rank a list of candidates using LLM based on query relevance
 * 
 * Request body:
 * {
 *   "query": "senior python backend engineer with microservices experience",
 *   "candidates": [
 *     {
 *       "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
 *       "name": "John Doe",
 *       "role": "Senior Backend Engineer",
 *       "company": "Tech Corp",
 *       "skills": "Python, Django, microservices",
 *       "email": "john@example.com",
 *       "score": 0.85
 *     }
 *   ],
 *   "topK": 10,
 *   "maxTokens": 2000,
 *   "temperature": 0.5,
 *   "detailed": true
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Re-ranked 3 candidates",
 *   "data": [
 *     {
 *       "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
 *       "name": "John Doe",
 *       "role": "Senior Backend Engineer",
 *       "company": "Tech Corp",
 *       "skills": "Python, Django, microservices",
 *       "email": "john@example.com",
 *       "rerankScore": 0.95,
 *       "originalScore": 0.85
 *     }
 *   ],
 *   "metadata": {
 *     "query": "senior python backend engineer with microservices experience",
 *     "totalCandidates": 1,
 *     "rerankResults": 1,
 *     "durationMs": 1234,
 *     "config": {
 *       "topK": 10,
 *       "maxTokens": 2000,
 *       "temperature": 0.5,
 *       "detailed": true
 *     }
 *   }
 * }
 */
router.post('/rerank', rerankCandidates);

/**
 * GET /v1/search/rerank/status
 * Get LLM re-ranking service status and configuration
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "configured": true,
 *     "model": "mixtral-8x7b-32768",
 *     "apiUrl": "https://api.groq.com/openai/v1/chat/completions",
 *     "defaultTopK": 10,
 *     "defaultMaxTokens": 2000
 *   }
 * }
 */
router.get('/rerank/status', getRerankStatus);

/**
 * LLM Summarization Routes
 * Base path: /v1/search/summarize
 */

/**
 * POST /v1/search/summarize
 * Summarize a candidate's fit for a job query
 * 
 * Request body:
 * {
 *   "query": "senior python backend engineer with microservices experience",
 *   "candidate": {
 *     "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
 *     "name": "John Doe",
 *     "role": "Senior Backend Engineer",
 *     "company": "Tech Corp",
 *     "skills": "Python, Django, microservices",
 *     "email": "john@example.com",
 *     "text": "Full resume text..."
 *   },
 *   "style": "detailed",
 *   "maxTokens": 400,
 *   "temperature": 0.7,
 *   "includeMatchScore": true
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Candidate summary generated",
 *   "data": {
 *     "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
 *     "name": "John Doe",
 *     "role": "Senior Backend Engineer",
 *     "company": "Tech Corp",
 *     "query": "senior python backend engineer with microservices experience",
 *     "summary": "John Doe is a Senior Backend Engineer at Tech Corp with strong Python expertise...",
 *     "style": "detailed",
 *     "maxTokens": 400,
 *     "matchScore": 0.92
 *   },
 *   "metadata": {
 *     "durationMs": 1234
 *   }
 * }
 */
router.post('/summarize', summarizeCandidate);

/**
 * POST /v1/search/summarize/batch
 * Batch summarize multiple candidates
 * 
 * Request body:
 * {
 *   "query": "senior python developer",
 *   "candidates": [
 *     {
 *       "_id": "1",
 *       "name": "Alice",
 *       "role": "Python Developer",
 *       "company": "TechCorp",
 *       "skills": "Python, Django"
 *     }
 *   ],
 *   "style": "short",
 *   "maxTokens": 150
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Batch summarization completed: 2/2 successful",
 *   "data": [...summaries...],
 *   "metadata": {
 *     "totalRequested": 2,
 *     "totalCompleted": 2,
 *     "totalFailed": 0,
 *     "totalDurationMs": 5000
 *   }
 * }
 */
router.post('/summarize/batch', batchSummarizeCandidates);

/**
 * GET /v1/search/summarize/status
 * Get LLM summarization service status and configuration
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "configured": true,
 *     "model": "mixtral-8x7b-32768",
 *     "apiUrl": "https://api.groq.com/openai/v1/chat/completions",
 *     "defaultMaxTokens": 2000
 *   }
 * }
 */
router.get('/summarize/status', getSummarizationStatus);

export default router;
