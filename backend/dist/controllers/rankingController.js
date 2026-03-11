"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerankCandidates = rerankCandidates;
exports.getRerankStatus = getRerankStatus;
const llmRankingService_1 = require("../services/llmRankingService");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('RankingController');
const llmRankingService = new llmRankingService_1.LLMRankingService();
/**
 * POST /v1/search/rerank
 * Re-rank a list of candidates using LLM based on query relevance
 *
 * Request Body:
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
 *     },
 *     ...
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
 *       "originalScore": 0.85,
 *       "reasoning": "Strong match for senior role with microservices experience"
 *     },
 *     ...
 *   ],
 *   "metadata": {
 *     "query": "senior python backend engineer with microservices experience",
 *     "totalCandidates": 10,
 *     "rerankResults": 3,
 *     "config": {
 *       "topK": 10,
 *       "maxTokens": 2000,
 *       "temperature": 0.5,
 *       "detailed": true
 *     }
 *   }
 * }
 */
async function rerankCandidates(req, res) {
    try {
        const { query, candidates, topK = 10, maxTokens = 2000, temperature = 0.5, detailed = true } = req.body;
        // Validation
        if (!query || query.trim().length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Query cannot be empty',
                data: null,
            });
            return;
        }
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Candidates must be a non-empty array',
                data: null,
            });
            return;
        }
        if (candidates.length > 100) {
            res.status(400).json({
                status: 'error',
                message: 'Maximum 100 candidates allowed for re-ranking',
                data: null,
            });
            return;
        }
        // Validate topK
        if (topK < 1 || topK > candidates.length) {
            res.status(400).json({
                status: 'error',
                message: `topK must be between 1 and ${candidates.length}`,
                data: null,
            });
            return;
        }
        // Validate query parameters
        if (temperature < 0 || temperature > 2) {
            res.status(400).json({
                status: 'error',
                message: 'temperature must be between 0 and 2',
                data: null,
            });
            return;
        }
        if (maxTokens < 100 || maxTokens > 4000) {
            res.status(400).json({
                status: 'error',
                message: 'maxTokens must be between 100 and 4000',
                data: null,
            });
            return;
        }
        // Validate candidate structure
        const validatedCandidates = candidates.map((candidate) => {
            if (!candidate._id || !candidate.name || !candidate.role) {
                throw new Error('Each candidate must have _id, name, and role');
            }
            return {
                _id: candidate._id,
                name: candidate.name,
                role: candidate.role,
                company: candidate.company || 'Unknown',
                skills: candidate.skills || '',
                email: candidate.email,
                snippet: candidate.snippet,
                score: candidate.score,
            };
        });
        logger.info(`Re-ranking request: query="${query}", candidates=${validatedCandidates.length}, topK=${topK}`);
        // Create config
        const config = {
            topK,
            maxTokens,
            temperature,
            detailed,
        };
        // Perform re-ranking
        const startTime = Date.now();
        const rerankResults = await llmRankingService.rerankCandidates(query, validatedCandidates, config);
        const duration = Date.now() - startTime;
        logger.info(`Re-ranking completed in ${duration}ms. Top result: ${rerankResults[0]?.name}`);
        res.json({
            status: 'success',
            message: `Re-ranked ${rerankResults.length} candidates`,
            data: rerankResults,
            metadata: {
                query,
                totalCandidates: validatedCandidates.length,
                rerankResults: rerankResults.length,
                durationMs: duration,
                config: {
                    topK,
                    maxTokens,
                    temperature,
                    detailed,
                },
            },
        });
    }
    catch (error) {
        logger.error(`Re-ranking error: ${error}`);
        res.status(500).json({
            status: 'error',
            message: `Re-ranking failed: ${error}`,
            data: null,
        });
    }
}
/**
 * GET /v1/search/rerank/status
 * Get LLM re-ranking service status
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
async function getRerankStatus(req, res) {
    try {
        const status = llmRankingService.getStatus();
        res.json({
            status: 'success',
            message: 'LLM re-ranking service status',
            data: status,
        });
    }
    catch (error) {
        logger.error(`Failed to get re-rank status: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service status',
            data: null,
        });
    }
}
