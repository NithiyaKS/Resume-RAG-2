"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessingService = void 0;
const embeddingGenerationService_1 = require("./embeddingGenerationService");
const mongoStorageService_1 = require("./mongoStorageService");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('BatchProcessingService');
class BatchProcessingService {
    constructor() {
        this.batchSize = parseInt(process.env.BATCH_SIZE || '100');
        this.delayBetweenBatches = parseInt(process.env.BATCH_DELAY_MS || '500'); // milliseconds
        this.embeddingService = new embeddingGenerationService_1.EmbeddingGenerationService();
        this.storageService = new mongoStorageService_1.MongoStorageService();
        logger.info(`BatchProcessingService initialized: batchSize=${this.batchSize}, delayMs=${this.delayBetweenBatches}`);
    }
    /**
     * Process large record set in batches with progress tracking
     * @param records Array of resume records to process
     * @param onProgress Optional callback for progress updates
     * @returns Array of batch results
     */
    async processBatchEmbeddings(records, onProgress) {
        try {
            const results = [];
            const totalBatches = Math.ceil(records.length / this.batchSize);
            let completedCount = 0;
            let failureCount = 0;
            logger.info(`Starting batch processing: ${records.length} records in ${totalBatches} batches of ${this.batchSize}`);
            for (let i = 0; i < records.length; i += this.batchSize) {
                const batchStart = i;
                const batchEnd = Math.min(i + this.batchSize, records.length);
                const batch = records.slice(batchStart, batchEnd);
                const batchNumber = Math.floor(i / this.batchSize) + 1;
                logger.info(`Processing batch ${batchNumber}/${totalBatches} (records ${batchStart + 1}-${batchEnd})`);
                // Process this batch
                const batchResults = await this.processSingleBatch(batch);
                results.push(...batchResults);
                // Update counters
                completedCount += batchResults.filter((r) => r.status === 'completed').length;
                failureCount += batchResults.filter((r) => r.status === 'failed').length;
                // Report progress
                if (onProgress) {
                    onProgress({
                        currentBatch: batchNumber,
                        totalBatches,
                        processedRecords: batchEnd,
                        totalRecords: records.length,
                        completedCount,
                        failureCount,
                    });
                }
                // Delay between batches to avoid overwhelming API/database
                if (batchEnd < records.length) {
                    logger.debug(`Waiting ${this.delayBetweenBatches}ms before next batch...`);
                    await this.delay(this.delayBetweenBatches);
                }
            }
            logger.info(`Batch processing completed: ${completedCount} successful, ${failureCount} failed`);
            return results;
        }
        catch (error) {
            logger.error(`Batch processing failed: ${error}`);
            throw error;
        }
    }
    /**
     * Process a single batch of records
     * @param records Records in this batch
     * @returns Results for this batch
     */
    async processSingleBatch(records) {
        const results = [];
        for (let index = 0; index < records.length; index++) {
            const record = records[index];
            try {
                // Generate embedding for this record
                const embeddingResult = await this.embeddingService.generateResumeEmbedding(record.toObject ? record.toObject() : record);
                // Update record with embedding
                const updated = await this.storageService.updateResumeEmbeddings(record._id.toString(), embeddingResult.embedding);
                results.push({
                    resumeId: updated._id.toString(),
                    name: updated.name,
                    status: 'completed',
                    embeddingDimension: embeddingResult.dimension,
                    fieldsEmbedded: embeddingResult.fieldsEmbedded,
                });
                logger.info(`✓ [${index + 1}/${records.length}] Processed record: ${record.name}`);
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                logger.warn(`✗ [${index + 1}/${records.length}] Failed to process record ${record.name}: ${errorMsg}`);
                results.push({
                    resumeId: record._id?.toString(),
                    name: record.name,
                    status: 'failed',
                    error: errorMsg,
                });
            }
        }
        return results;
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Set batch size configuration
     */
    setBatchSize(size) {
        if (size > 0) {
            this.batchSize = size;
            logger.info(`Batch size updated to ${size}`);
        }
    }
    /**
     * Set delay between batches
     */
    setDelayBetweenBatches(delayMs) {
        if (delayMs >= 0) {
            this.delayBetweenBatches = delayMs;
            logger.info(`Delay between batches updated to ${delayMs}ms`);
        }
    }
    /**
     * Get current batch configuration
     */
    getConfiguration() {
        return {
            batchSize: this.batchSize,
            delayBetweenBatches: this.delayBetweenBatches,
        };
    }
}
exports.BatchProcessingService = BatchProcessingService;
