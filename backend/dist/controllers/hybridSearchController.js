"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridSearch = hybridSearch;
exports.advancedHybridSearch = advancedHybridSearch;
exports.getHybridSearchStats = getHybridSearchStats;
exports.getRecommendedWeights = getRecommendedWeights;
const hybridSearchService_1 = require("../services/hybridSearchService");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('HybridSearchController');
const hybridSearchService = new hybridSearchService_1.HybridSearchService();
/**
 * POST /v1/search/hybrid
 * Basic hybrid search combining BM25 and vector results
 *
 * Request Body:
 * {
 *   "query": "python developer",
 *   "bm25Weight": 0.5,
 *   "vectorWeight": 0.5,
 *   "limit": 10,
 *   "skip": 0
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Hybrid search completed",
 *   "data": [...results with combined scores...],
 *   "metadata": {
 *     "totalResults": 25,
 *     "limit": 10,
 *     "skip": 0,
 *     "config": {...}
 *   }
 * }
 */
async function hybridSearch(req, res) {
    try {
        const { query, bm25Weight = 0.5, vectorWeight = 0.5, limit = 10, skip = 0 } = req.body;
        // Validation
        if (!query || query.trim().length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Query cannot be empty',
                data: null,
            });
            return;
        }
        const queryLimit = Math.max(1, Math.min(limit, 100));
        const querySkip = Math.max(0, skip);
        // Validate weights
        if (bm25Weight < 0 || bm25Weight > 1) {
            res.status(400).json({
                status: 'error',
                message: 'bm25Weight must be between 0 and 1',
                data: null,
            });
            return;
        }
        if (vectorWeight < 0 || vectorWeight > 1) {
            res.status(400).json({
                status: 'error',
                message: 'vectorWeight must be between 0 and 1',
                data: null,
            });
            return;
        }
        const config = {
            bm25Weight,
            vectorWeight,
        };
        logger.info(`Hybrid search request: query="${query}", weights: bm25=${bm25Weight}, vector=${vectorWeight}`);
        const results = await hybridSearchService.search(query, config, queryLimit, querySkip);
        res.json({
            status: 'success',
            message: `Found ${results.length} results`,
            data: results,
            metadata: {
                totalResults: results.length,
                limit: queryLimit,
                skip: querySkip,
                config: {
                    bm25Weight,
                    vectorWeight,
                },
            },
        });
    }
    catch (error) {
        logger.error(`Hybrid search error: ${error}`);
        res.status(500).json({
            status: 'error',
            message: `Hybrid search failed: ${error}`,
            data: null,
        });
    }
}
/**
 * POST /v1/search/hybrid/advanced
 * Advanced hybrid search with thresholds and detailed configuration
 *
 * Request Body:
 * {
 *   "query": "python developer",
 *   "bm25Weight": 0.5,
 *   "vectorWeight": 0.5,
 *   "bm25Threshold": 0.3,
 *   "vectorThreshold": 0.65,
 *   "normalizeScores": true,
 *   "limit": 10,
 *   "skip": 0
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Advanced hybrid search completed",
 *   "data": [...results...],
 *   "metadata": {...config and stats...}
 * }
 */
async function advancedHybridSearch(req, res) {
    try {
        const { query, bm25Weight = 0.5, vectorWeight = 0.5, bm25Threshold, vectorThreshold, normalizeScores = true, limit = 10, skip = 0, } = req.body;
        // Validation
        if (!query || query.trim().length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Query cannot be empty',
                data: null,
            });
            return;
        }
        const queryLimit = Math.max(1, Math.min(limit, 100));
        const querySkip = Math.max(0, skip);
        // Validate weights
        if (bm25Weight < 0 || bm25Weight > 1 || vectorWeight < 0 || vectorWeight > 1) {
            res.status(400).json({
                status: 'error',
                message: 'Weights must be between 0 and 1',
                data: null,
            });
            return;
        }
        // Validate thresholds
        if ((bm25Threshold !== undefined && (bm25Threshold < 0 || bm25Threshold > 1)) ||
            (vectorThreshold !== undefined && (vectorThreshold < 0 || vectorThreshold > 1))) {
            res.status(400).json({
                status: 'error',
                message: 'Thresholds must be between 0 and 1',
                data: null,
            });
            return;
        }
        const config = {
            bm25Weight,
            vectorWeight,
            bm25Threshold,
            vectorThreshold,
            normalizeScores,
        };
        logger.info(`Advanced hybrid search: query="${query}", weights: bm25=${bm25Weight}, vector=${vectorWeight}, ` +
            `thresholds: bm25=${bm25Threshold}, vector=${vectorThreshold}`);
        const results = await hybridSearchService.advancedSearch(query, config, queryLimit, querySkip);
        res.json({
            status: 'success',
            message: `Found ${results.length} results after filtering`,
            data: results,
            metadata: {
                totalResults: results.length,
                limit: queryLimit,
                skip: querySkip,
                config,
            },
        });
    }
    catch (error) {
        logger.error(`Advanced hybrid search error: ${error}`);
        res.status(500).json({
            status: 'error',
            message: `Advanced hybrid search failed: ${error}`,
            data: null,
        });
    }
}
/**
 * GET /v1/search/hybrid/stats
 * Get statistics about hybrid search capabilities and recommendations
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Hybrid search statistics",
 *   "data": {
 *     "bm25Available": true,
 *     "vectorAvailable": true,
 *     "totalDocuments": 92,
 *     "documentsWithEmbeddings": 90,
 *     "recommendedWeights": {
 *       "bm25": 0.5,
 *       "vector": 0.5
 *     }
 *   },
 *   "metadata": {
 *     "searchMethods": [...]
 *   }
 * }
 */
async function getHybridSearchStats(req, res) {
    try {
        logger.info('Fetching hybrid search statistics');
        const stats = await hybridSearchService.getSearchStats();
        res.json({
            status: 'success',
            message: 'Hybrid search statistics',
            data: stats,
            metadata: {
                searchMethods: stats.bm25Available && stats.vectorAvailable ? ['bm25', 'vector'] : [],
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger.error(`Failed to get hybrid search stats: ${error}`);
        res.status(500).json({
            status: 'error',
            message: `Failed to get statistics: ${error}`,
            data: null,
        });
    }
}
/**
 * GET /v1/search/hybrid/weights/:intent
 * Get recommended weights for a specific search intent
 * Intent can be: 'keyword' (0.7 BM25, 0.3 vector), 'semantic' (0.3 BM25, 0.7 vector), or 'balanced' (0.5/0.5)
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
async function getRecommendedWeights(req, res) {
    try {
        const { intent } = req.params;
        if (!['keyword', 'semantic', 'balanced'].includes(intent)) {
            res.status(400).json({
                status: 'error',
                message: 'Intent must be one of: keyword, semantic, balanced',
                data: null,
            });
            return;
        }
        logger.info(`Getting recommended weights for intent: ${intent}`);
        const weights = hybridSearchService.getRecommendedWeights(intent);
        res.json({
            status: 'success',
            message: `Recommended weights for ${intent} intent`,
            data: {
                intent,
                ...weights,
            },
        });
    }
    catch (error) {
        logger.error(`Failed to get recommended weights: ${error}`);
        res.status(500).json({
            status: 'error',
            message: `Failed to get weights: ${error}`,
            data: null,
        });
    }
}
