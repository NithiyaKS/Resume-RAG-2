"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorIndexService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('VectorIndexService');
class VectorIndexService {
    constructor() {
        this.cached = null;
        this.cacheExpiry = 0;
        this.CACHE_TTL = 3600000; // 1 hour in milliseconds
    }
    /**
     * Get vector index mapping from MongoDB Atlas
     * Determines which fields should be embedded based on vector index definition
     * Results are cached for 1 hour to avoid repeated API calls
     */
    async getVectorIndexConfig() {
        try {
            // Check cache
            if (this.cached && Date.now() < this.cacheExpiry) {
                logger.info('Using cached vector index configuration');
                return this.cached;
            }
            logger.info('Fetching vector index configuration from MongoDB...');
            const db = mongoose_1.default.connection.db;
            if (!db) {
                throw new Error('MongoDB connection not established');
            }
            const collection = db.collection('resumes');
            // Get vector search indexes
            const indexes = await collection.listSearchIndexes().toArray();
            const indexName = process.env.VECTOR_INDEX_NAME || 'resume_vector_index';
            const vectorIndex = indexes.find((idx) => idx.name === indexName);
            if (!vectorIndex) {
                logger.warn(`Vector index "${indexName}" not found. Using default configuration.`);
                return this.getDefaultConfig();
            }
            logger.info(`Found vector index: ${vectorIndex.name}`);
            // Extract fields to embed from index definition
            // Vector index mappings show which fields are indexed
            const fieldsToEmbed = this.extractFieldsFromMapping(vectorIndex.mappings);
            const config = {
                indexName: vectorIndex.name,
                fieldsToEmbed,
                dimension: parseInt(process.env.VECTOR_DIMENSION || '1024'),
                metric: vectorIndex.mappings?.vectorSearch?.metric || 'cosine',
            };
            // Cache the configuration
            this.cached = config;
            this.cacheExpiry = Date.now() + this.CACHE_TTL;
            logger.info(`Vector index config: fields=[${config.fieldsToEmbed.join(', ')}], dimension=${config.dimension}, metric=${config.metric}`);
            return config;
        }
        catch (error) {
            logger.error(`Failed to fetch vector index config: ${error}`);
            // Return default configuration as fallback
            return this.getDefaultConfig();
        }
    }
    /**
     * Extract field paths from MongoDB vector index mappings
     */
    extractFieldsFromMapping(mappings) {
        try {
            const fields = [];
            if (!mappings || !mappings.fields) {
                logger.warn('No field mappings found in vector index');
                return this.getDefaultFields();
            }
            for (const field of mappings.fields) {
                if (field.type === 'vector') {
                    // Extract the field path (e.g., "embedding" from "embedding.field")
                    const fieldPath = field.path || field.name;
                    if (fieldPath) {
                        fields.push(fieldPath);
                        logger.debug(`Found vector field: ${fieldPath}`);
                    }
                }
            }
            if (fields.length === 0) {
                logger.warn('No vector fields found in index mappings, using defaults');
                return this.getDefaultFields();
            }
            return fields;
        }
        catch (error) {
            logger.error(`Error extracting fields from mapping: ${error}`);
            return this.getDefaultFields();
        }
    }
    /**
     * Get default fields to embed (fallback when index config unavailable)
     * Embeds the "text" field which combines skills and full resume text
     */
    getDefaultFields() {
        return ['text'];
    }
    /**
     * Get default configuration (fallback when index unavailable)
     */
    getDefaultConfig() {
        return {
            indexName: process.env.VECTOR_INDEX_NAME || 'resume_vector_index',
            fieldsToEmbed: this.getDefaultFields(),
            dimension: parseInt(process.env.VECTOR_DIMENSION || '1024'),
            metric: 'cosine',
        };
    }
    /**
     * Clear the cache (useful for testing or manual refresh)
     */
    clearCache() {
        this.cached = null;
        this.cacheExpiry = 0;
        logger.info('Vector index cache cleared');
    }
}
exports.VectorIndexService = VectorIndexService;
