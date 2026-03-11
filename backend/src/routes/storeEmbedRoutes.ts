import { Router } from 'express';
import {
  storeAndEmbed,
  storeAndEmbedAsync,
  getBatchStatus,
  getEmbeddingStatus,
  getResumeWithEmbeddings,
  deleteResume,
} from '../controllers/embeddingController';

const router = Router();

/**
 * POST /api/store-embed/store-and-embed
 * Store JSON data and generate embeddings with batch processing
 * Supports up to 6000+ records using intelligent batching
 * Request size limit: 50MB
 */
router.post('/store-and-embed', storeAndEmbed);

/**
 * POST /api/store-embed/store-and-embed-async
 * Async batch processing endpoint
 * Accepts large payloads and processes in background
 * Returns immediately with job ID for status tracking
 * Ideal for 10,000+ records
 */
router.post('/store-and-embed-async', storeAndEmbedAsync);

/**
 * GET /api/store-embed/batch-status/:jobId
 * Check status of async batch processing job
 */
router.get('/batch-status/:jobId', getBatchStatus);

/**
 * GET /api/store-embed/status
 * Get current embedding status and statistics
 */
router.get('/status', getEmbeddingStatus);

/**
 * GET /api/store-embed/:id
 * Get resume with embeddings by ID
 */
router.get('/:id', getResumeWithEmbeddings);

/**
 * DELETE /api/store-embed/:id
 * Delete resume by ID
 */
router.delete('/:id', deleteResume);

export default router;
