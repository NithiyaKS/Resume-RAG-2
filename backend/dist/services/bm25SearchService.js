"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BM25SearchService = void 0;
const resumeSchema_1 = require("../models/resumeSchema");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('BM25SearchService');
class BM25SearchService {
    constructor() {
        logger.info('BM25SearchService initialized');
    }
    /**
     * Ensure text index exists on resume collection
     * Text index is required for BM25/full-text search
     */
    async ensureTextIndex() {
        try {
            // Create text index on searchable fields
            await resumeSchema_1.Resume.collection.createIndex({
                name: 'text',
                email: 'text',
                role: 'text',
                company: 'text',
                education: 'text',
                skills: 'text',
                text: 'text',
            });
            logger.info('Text index created/verified on resume collection');
        }
        catch (error) {
            logger.warn(`Could not create text index: ${error}`);
            // Index might already exist, which is fine
        }
    }
    /**
     * Perform BM25 full-text search on resume collection
     * Uses MongoDB text search with relevance scoring
     */
    async search(options) {
        try {
            const { query, limit = 10, skip = 0 } = options;
            if (!query || query.trim().length === 0) {
                throw new Error('Search query cannot be empty');
            }
            logger.info(`Performing BM25 search: query="${query}", limit=${limit}, skip=${skip}`);
            // Ensure text index exists before searching
            await this.ensureTextIndex();
            // Perform text search with MongoDB's built-in text search (which uses BM25-like scoring)
            const results = await resumeSchema_1.Resume.aggregate([
                {
                    $match: {
                        $text: { $search: query },
                    },
                },
                {
                    $addFields: {
                        score: { $meta: 'textScore' }, // BM25-like relevance score
                    },
                },
                {
                    $sort: { score: -1 }, // Sort by relevance score descending
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        role: 1,
                        company: 1,
                        skills: 1,
                        score: 1,
                    },
                },
            ]).exec();
            // Get total count of matching documents
            const totalCount = await resumeSchema_1.Resume.countDocuments({
                $text: { $search: query },
            });
            logger.info(`BM25 search completed: found ${results.length} results (${totalCount} total matches)`);
            return {
                results: results.map((r) => ({
                    _id: r._id.toString(),
                    name: r.name,
                    email: r.email,
                    role: r.role,
                    company: r.company,
                    skills: r.skills || [],
                    score: r.score,
                })),
                total: totalCount,
                query,
                limit,
                skip,
            };
        }
        catch (error) {
            logger.error(`BM25 search failed: ${error}`);
            throw error;
        }
    }
    /**
     * Perform advanced BM25 search with field-specific queries
     * Allows searching specific fields with different weights
     */
    async advancedSearch(options) {
        try {
            const { query, fields = {}, limit = 10, skip = 0 } = options;
            if (!query || query.trim().length === 0) {
                throw new Error('Search query cannot be empty');
            }
            logger.info(`Performing advanced BM25 search: query="${query}", fields=${JSON.stringify(fields)}`);
            // Ensure text index exists
            await this.ensureTextIndex();
            // Build weighted text index score
            const results = await resumeSchema_1.Resume.aggregate([
                {
                    $match: {
                        $text: { $search: query },
                    },
                },
                {
                    $addFields: {
                        score: { $meta: 'textScore' },
                        // Apply field-specific weights
                        weightedScore: {
                            $add: [
                                { $multiply: [{ $meta: 'textScore' }, fields.text || 1] },
                            ],
                        },
                    },
                },
                {
                    $sort: { weightedScore: -1 },
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        role: 1,
                        company: 1,
                        skills: 1,
                        score: 1,
                    },
                },
            ]).exec();
            const totalCount = await resumeSchema_1.Resume.countDocuments({
                $text: { $search: query },
            });
            logger.info(`Advanced BM25 search completed: found ${results.length} results`);
            return {
                results: results.map((r) => ({
                    _id: r._id.toString(),
                    name: r.name,
                    email: r.email,
                    role: r.role,
                    company: r.company,
                    skills: r.skills || [],
                    score: r.score,
                })),
                total: totalCount,
                query,
                limit,
                skip,
            };
        }
        catch (error) {
            logger.error(`Advanced BM25 search failed: ${error}`);
            throw error;
        }
    }
    /**
     * Get search statistics and indexed fields
     */
    async getSearchStats() {
        try {
            const totalDocuments = await resumeSchema_1.Resume.countDocuments();
            // Get all indexes on the collection
            const indexes = await resumeSchema_1.Resume.collection.getIndexes();
            const textIndexExists = Object.keys(indexes).some((indexName) => indexes[indexName]?.text !== undefined);
            const indexedFields = textIndexExists
                ? Object.keys(indexes).filter((indexName) => indexes[indexName]?.text !== undefined)
                : [];
            logger.info(`Search stats: ${totalDocuments} documents, text index: ${textIndexExists}`);
            return {
                totalDocuments,
                textIndexExists,
                indexedFields,
            };
        }
        catch (error) {
            logger.error(`Failed to get search stats: ${error}`);
            throw error;
        }
    }
}
exports.BM25SearchService = BM25SearchService;
