import { Request, Response } from 'express';
import { VectorSearchService } from '../services/vectorSearchService';
import { Logger } from '../utils/logger';

const logger = new Logger('VectorSearchController');
const vectorSearchService = new VectorSearchService();

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
export const vectorSearch = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error(`Vector search error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: `Vector search failed: ${error.message}`,
    });
  }
};

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
export const advancedVectorSearch = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error(`Advanced vector search error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: `Advanced vector search failed: ${error.message}`,
    });
  }
};

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
export const getVectorSearchStats = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Fetching vector search statistics');

    const stats = await vectorSearchService.getSearchStats();

    res.json({
      status: 'success',
      message: 'Vector search statistics retrieved',
      data: stats,
    });
  } catch (error: any) {
    logger.error(`Failed to get vector search stats: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: `Failed to retrieve statistics: ${error.message}`,
    });
  }
};
