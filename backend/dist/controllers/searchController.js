"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSearchIndexes = exports.getSearchStats = exports.advancedBM25Search = exports.bm25Search = void 0;
const bm25SearchService_1 = require("../services/bm25SearchService");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('SearchController');
const searchService = new bm25SearchService_1.BM25SearchService();
/**
 * BM25 Full-Text Search Endpoint
 * POST /v1/search/bm25
 *
 * Request body:
 * {
 *   "query": "python java skills",
 *   "limit": 10,
 *   "skip": 0
 * }
 */
const bm25Search = async (req, res) => {
    try {
        const { query, limit = 10, skip = 0 } = req.body;
        logger.info(`[BM25 Search] Received query: "${query}"`);
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new errorHandler_1.ValidationError('Search query is required and must be a non-empty string');
        }
        if (limit < 1 || limit > 100) {
            throw new errorHandler_1.ValidationError('Limit must be between 1 and 100');
        }
        if (skip < 0) {
            throw new errorHandler_1.ValidationError('Skip must be >= 0');
        }
        // Perform search
        const searchResult = await searchService.search({
            query: query.trim(),
            limit: parseInt(String(limit)),
            skip: parseInt(String(skip)),
        });
        logger.info(`[BM25 Search] Found ${searchResult.results.length} results for query: "${query}"`);
        res.status(200).json({
            status: 'success',
            message: `Found ${searchResult.total} matching resumes for query: "${query}"`,
            data: {
                query: searchResult.query,
                total: searchResult.total,
                returned: searchResult.results.length,
                limit: searchResult.limit,
                skip: searchResult.skip,
                results: searchResult.results,
            },
            metadata: {
                searchType: 'BM25 Full-Text Search',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger.error(`[BM25 Search] Error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.bm25Search = bm25Search;
/**
 * Advanced BM25 Search with Field Weights
 * POST /v1/search/bm25/advanced
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
const advancedBM25Search = async (req, res) => {
    try {
        const { query, fields, limit = 10, skip = 0 } = req.body;
        logger.info(`[Advanced BM25 Search] Received query: "${query}"`);
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new errorHandler_1.ValidationError('Search query is required and must be a non-empty string');
        }
        if (limit < 1 || limit > 100) {
            throw new errorHandler_1.ValidationError('Limit must be between 1 and 100');
        }
        if (skip < 0) {
            throw new errorHandler_1.ValidationError('Skip must be >= 0');
        }
        // Perform advanced search
        const searchResult = await searchService.advancedSearch({
            query: query.trim(),
            fields,
            limit: parseInt(String(limit)),
            skip: parseInt(String(skip)),
        });
        logger.info(`[Advanced BM25 Search] Found ${searchResult.results.length} results for query: "${query}"`);
        res.status(200).json({
            status: 'success',
            message: `Found ${searchResult.total} matching resumes using advanced BM25 search`,
            data: {
                query: searchResult.query,
                total: searchResult.total,
                returned: searchResult.results.length,
                limit: searchResult.limit,
                skip: searchResult.skip,
                results: searchResult.results,
                fieldWeights: fields,
            },
            metadata: {
                searchType: 'Advanced BM25 Full-Text Search',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger.error(`[Advanced BM25 Search] Error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.advancedBM25Search = advancedBM25Search;
/**
 * Get Search Statistics
 * GET /v1/search/stats
 *
 * Returns information about text indexes and search capabilities
 */
const getSearchStats = async (req, res) => {
    try {
        logger.info('[Search Stats] Retrieving search statistics');
        const stats = await searchService.getSearchStats();
        res.status(200).json({
            status: 'success',
            message: 'Search statistics retrieved successfully',
            data: stats,
            metadata: {
                searchEngines: ['BM25 Full-Text Search'],
                totalDocuments: stats.totalDocuments,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger.error(`[Search Stats] Error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getSearchStats = getSearchStats;
/**
 * Initialize Search Indexes
 * POST /v1/search/init
 *
 * Manually trigger creation of search inde
xes
 */
const initializeSearchIndexes = async (req, res) => {
    try {
        logger.info('[Search Init] Initializing search indexes');
        // Ensure text index is created
        await searchService.ensureTextIndex();
        const stats = await searchService.getSearchStats();
        res.status(200).json({
            status: 'success',
            message: 'Search indexes initialized successfully',
            data: stats,
            metadata: {
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger.error(`[Search Init] Error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.initializeSearchIndexes = initializeSearchIndexes;
