"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVectorSearchStats = exports.advancedVectorSearch = exports.vectorSearch = void 0;
const vectorSearchService_1 = require("../services/vectorSearchService");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('VectorSearchController');
const vectorSearchService = new vectorSearchService_1.VectorSearchService();
/**
 * Vector similarity search endpoint
 * POST /v1/search/vector
 *
 * Request body:
 * {
 *   "query": "senior python developer",
 *   "limit": 10,
 *   "skip": 0
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Vector search completed",
 *   "data": [
 *     {
 *       "_id": "...",
 *       "name": "...",
 *       "email": "...",
 *       "role": "...",
 *       "company": "...",
 *       "skills": "...",
 *       "score": 0.89
 *     }
 *   ],
 *   "metadata": {
 *     "total": 1,
 *     "limit": 10,
 *     "skip": 0,
 *     "metric": "cosine"
 *   }
 * }
 */
const vectorSearch = async (req, res) => {
    try {
        const { query, limit = 10, skip = 0 } = req.body;
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            logger.warn('Invalid query: empty or missing');
            res.status(400).json({
                status: 'error',
                message: 'Query is required and must be a non-empty string',
            });
            return;
        }
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
        const parsedSkip = Math.max(parseInt(skip) || 0, 0);
        logger.info(`Vector search: query="${query}", limit=${parsedLimit}, skip=${parsedSkip}`);
        const results = await vectorSearchService.search(query, parsedLimit, parsedSkip);
        res.json({
            status: 'success',
            message: `Vector search found ${results.length} similar results`,
            data: results,
            metadata: {
                total: results.length,
                limit: parsedLimit,
                skip: parsedSkip,
                metric: 'cosine',
            },
        });
    }
    catch (error) {
        logger.error(`Vector search error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: `Vector search failed: ${error.message}`,
        });
    }
};
exports.vectorSearch = vectorSearch;
/**
 * Advanced vector search with threshold filtering
 * POST /v1/search/vector/advanced
 *
 * Request body:
 * {
 *   "query": "machine learning engineer",
 *   "scoreThreshold": 0.7,
 *   "limit": 10,
 *   "skip": 0
 * }
 *
 * Response: Same structure as vectorSearch but filtered by threshold
 */
const advancedVectorSearch = async (req, res) => {
    try {
        const { query, scoreThreshold = 0.5, limit = 10, skip = 0 } = req.body;
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            logger.warn('Invalid query in advanced search');
            res.status(400).json({
                status: 'error',
                message: 'Query is required and must be a non-empty string',
            });
            return;
        }
        const threshold = Math.min(Math.max(parseFloat(scoreThreshold) || 0.5, 0), 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
        const parsedSkip = Math.max(parseInt(skip) || 0, 0);
        logger.info(`Advanced vector search: query="${query}", threshold=${threshold}, limit=${parsedLimit}`);
        const results = await vectorSearchService.advancedSearch(query, threshold, parsedLimit, parsedSkip);
        res.json({
            status: 'success',
            message: `Advanced vector search found ${results.length} results with score >= ${threshold}`,
            data: results,
            metadata: {
                total: results.length,
                limit: parsedLimit,
                skip: parsedSkip,
                scoreThreshold: threshold,
                metric: 'cosine',
            },
        });
    }
    catch (error) {
        logger.error(`Advanced vector search error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: `Advanced vector search failed: ${error.message}`,
        });
    }
};
exports.advancedVectorSearch = advancedVectorSearch;
/**
 * Get vector search statistics
 * GET /v1/search/vector/stats
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Vector search statistics",
 *   "data": {
 *     "totalDocuments": 92,
 *     "documentsWithEmbeddings": 92,
 *     "embeddingDimension": 1024,
 *     "similarityMetric": "cosine"
 *   }
 * }
 */
const getVectorSearchStats = async (req, res) => {
    try {
        logger.info('Fetching vector search statistics');
        const stats = await vectorSearchService.getSearchStats();
        res.json({
            status: 'success',
            message: 'Vector search statistics retrieved',
            data: stats,
        });
    }
    catch (error) {
        logger.error(`Failed to get vector search stats: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: `Failed to retrieve statistics: ${error.message}`,
        });
    }
};
exports.getVectorSearchStats = getVectorSearchStats;
