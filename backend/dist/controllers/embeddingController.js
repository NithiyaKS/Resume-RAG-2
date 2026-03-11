"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResume = exports.getResumeWithEmbeddings = exports.getEmbeddingStatus = exports.getBatchStatus = exports.storeAndEmbedAsync = exports.storeAndEmbed = void 0;
const embeddingGenerationService_1 = require("../services/embeddingGenerationService");
const mongoStorageService_1 = require("../services/mongoStorageService");
const batchProcessingService_1 = require("../services/batchProcessingService");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('EmbeddingController');
const embeddingService = new embeddingGenerationService_1.EmbeddingGenerationService();
const storageService = new mongoStorageService_1.MongoStorageService();
const batchService = new batchProcessingService_1.BatchProcessingService();
/**
 * Store JSON data and generate embeddings with batch processing support
 * Handles large payloads (up to 6000+ records) using batch processing
 */
const storeAndEmbed = async (req, res) => {
    try {
        const { records } = req.body;
        logger.info(`Received request: ${records?.length || 0} records`);
        if (!records || !Array.isArray(records) || records.length === 0) {
            logger.error(`Invalid records: records=${records}, isArray=${Array.isArray(records)}, length=${Array.isArray(records) ? records.length : 'N/A'}`);
            throw new errorHandler_1.ValidationError('Invalid records format. Expected non-empty array of resume objects.');
        }
        const recordCount = records.length;
        logger.info(`Processing ${recordCount} records for embedding`);
        // Step 1: Save all records to MongoDB first
        logger.info('Step 1: Saving all records to MongoDB...');
        const savedRecords = [];
        let saveFailures = 0;
        for (const record of records) {
            try {
                const saved = await storageService.saveResume(record);
                savedRecords.push(saved);
            }
            catch (error) {
                logger.warn(`Failed to save record: ${error}`);
                saveFailures++;
            }
        }
        logger.info(`Step 1 Complete: ${savedRecords.length} records saved, ${saveFailures} failed`);
        // Step 2: Process embeddings using batch processing
        logger.info(`Step 2: Processing embeddings for ${savedRecords.length} records in batches...`);
        const results = await batchService.processBatchEmbeddings(savedRecords, (progress) => {
            logger.info(`Batch progress: ${progress.currentBatch}/${progress.totalBatches} (${progress.processedRecords}/${progress.totalRecords})`);
        });
        const successCount = results.filter((r) => r.status === 'completed').length;
        const failureCount = results.filter((r) => r.status === 'failed').length;
        logger.info(`Embedding process completed: ${successCount} successful, ${failureCount} failed`);
        res.status(200).json({
            status: 'success',
            message: 'Large batch embedding completed with batch processing',
            summary: {
                totalRequested: recordCount,
                totalSaved: savedRecords.length,
                totalProcessed: successCount + failureCount,
                successful: successCount,
                failed: failureCount,
                saveFailures,
            },
            results: results.slice(0, 20), // Return first 20 results for preview
            note: recordCount > 100
                ? 'Processing large batches. Check /api/store-embed/status for full details'
                : undefined,
            processingDetails: {
                batchConfig: batchService.getConfiguration(),
                startTime: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger.error(`Store and embed error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.storeAndEmbed = storeAndEmbed;
/**
 * Async batch processing endpoint
 * For very large payloads, accepts request and processes in background
 * Returns immediately with job ID for status tracking
 */
const storeAndEmbedAsync = async (req, res) => {
    try {
        const { records } = req.body;
        if (!records || !Array.isArray(records) || records.length === 0) {
            throw new errorHandler_1.ValidationError('Invalid records format. Expected non-empty array of resume objects.');
        }
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const totalRecords = records.length;
        const estimatedBatches = Math.ceil(totalRecords / batchService.getConfiguration().batchSize);
        const estimatedSeconds = estimatedBatches * 1; // ~1 second per batch
        logger.info(`Async job ${jobId} accepted: ${totalRecords} records, estimated ${estimatedSeconds}s`);
        // Return immediately with job ID
        res.status(202).json({
            status: 'accepted',
            message: 'Large batch accepted for async processing',
            jobId,
            totalRecords,
            estimatedProcessingTime: `${estimatedSeconds} seconds`,
            statusCheckUrl: `/api/store-embed/batch-status/${jobId}`,
        });
        // Process in background (don't await)
        processBackgroundBatch(jobId, records).catch((error) => {
            logger.error(`Background batch ${jobId} failed: ${error}`);
        });
    }
    catch (error) {
        logger.error(`Async store and embed error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.storeAndEmbedAsync = storeAndEmbedAsync;
/**
 * Get batch processing status
 */
const getBatchStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            throw new errorHandler_1.ValidationError('Job ID is required');
        }
        // In production, you would fetch this from Redis or database
        // For now, return a placeholder response
        res.status(200).json({
            status: 'success',
            jobId,
            processingStatus: 'in-progress',
            message: 'Background batch processing is in progress',
            checkAgainIn: '5 seconds',
            checkStatusUrl: `/api/store-embed/batch-status/${jobId}`,
        });
    }
    catch (error) {
        logger.error(`Failed to get batch status: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getBatchStatus = getBatchStatus;
/**
 * Get embedding status and statistics
 */
const getEmbeddingStatus = async (req, res) => {
    try {
        const stats = await storageService.getEmbeddingStats();
        const resumes = await storageService.getAllResumes(5);
        res.status(200).json({
            status: 'success',
            totalResumes: stats.total,
            embeddedCount: stats.completed,
            pendingCount: stats.pending,
            failedCount: stats.failed,
            completionPercentage: stats.total > 0
                ? ((stats.completed / stats.total) * 100).toFixed(2)
                : '0',
            recentResumes: resumes.map((r) => ({
                id: r._id.toString(),
                name: r.name,
                email: r.email,
                embeddingStatus: r.embeddingStatus,
                createdAt: r.createdAt || new Date().toISOString(),
            })),
        });
    }
    catch (error) {
        logger.error(`Failed to get embedding status: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getEmbeddingStatus = getEmbeddingStatus;
/**
 * Helper function for background batch processing
 */
async function processBackgroundBatch(jobId, records) {
    try {
        logger.info(`Background batch ${jobId} started: ${records.length} records`);
        // Save records
        const savedRecords = [];
        for (const record of records) {
            try {
                const saved = await storageService.saveResume(record);
                savedRecords.push(saved);
            }
            catch (error) {
                logger.warn(`Background batch ${jobId}: Failed to save record: ${error}`);
            }
        }
        // Process embeddings
        const results = await batchService.processBatchEmbeddings(savedRecords, (progress) => {
            logger.debug(`Background batch ${jobId} progress: ${progress.currentBatch}/${progress.totalBatches}`);
        });
        const successCount = results.filter((r) => r.status === 'completed').length;
        const failureCount = results.filter((r) => r.status === 'failed').length;
        logger.info(`Background batch ${jobId} completed: ${successCount} successful, ${failureCount} failed`);
    }
    catch (error) {
        logger.error(`Background batch ${jobId} error: ${error}`);
    }
}
/**
 * Get resume with embeddings by ID
 */
const getResumeWithEmbeddings = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new errorHandler_1.ValidationError('Resume ID is required');
        }
        const resume = await storageService.getResume(id);
        if (!resume) {
            throw new errorHandler_1.ValidationError('Resume not found');
        }
        res.status(200).json({
            status: 'success',
            data: {
                id: resume._id,
                name: resume.name,
                email: resume.email,
                phone: resume.phone,
                location: resume.location,
                company: resume.company,
                role: resume.role,
                education: resume.education,
                skills: resume.skills,
                totalExperience: resume.totalExperience,
                embeddingStatus: resume.embeddingStatus,
                embeddingDimension: resume.embeddings?.combined_embedding?.length || 0,
                createdAt: resume.createdAt,
                updatedAt: resume.updatedAt,
            },
        });
    }
    catch (error) {
        logger.error(`Failed to get resume: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getResumeWithEmbeddings = getResumeWithEmbeddings;
/**
 * Delete resume by ID
 */
const deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new errorHandler_1.ValidationError('Resume ID is required');
        }
        const deleted = await storageService.deleteResume(id);
        if (!deleted) {
            throw new errorHandler_1.ValidationError('Resume not found');
        }
        res.status(200).json({
            status: 'success',
            message: 'Resume deleted successfully',
            deletedId: deleted._id,
        });
    }
    catch (error) {
        logger.error(`Failed to delete resume: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.deleteResume = deleteResume;
