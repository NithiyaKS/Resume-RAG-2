"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchService = void 0;
const resumeSchema_1 = require("../models/resumeSchema");
const embeddingGenerationService_1 = require("./embeddingGenerationService");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('VectorSearchService');
class VectorSearchService {
    constructor() {
        this.embeddingService = new embeddingGenerationService_1.EmbeddingGenerationService();
    }
    /**
     * Compute cosine similarity between two vectors (application-level)
     * Used as fallback when MongoDB vector search is not available
     */
    computeCosineSimilarity(vec1, vec2) {
        if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== vec2.length) {
            return 0;
        }
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            magnitude1 += vec1[i] * vec1[i];
            magnitude2 += vec2[i] * vec2[i];
        }
        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);
        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }
        return dotProduct / (magnitude1 * magnitude2);
    }
    /**
     * Perform vector similarity search using semantic embeddings
     * Falls back to application-level similarity if MongoDB vector search is unavailable
     *
     * @param query - Query text to search for
     * @param limit - Maximum number of results to return (default: 10, max: 100)
     * @param skip - Number of results to skip for pagination (default: 0)
     * @returns Array of similar resumes with similarity scores
     */
    async search(query, limit = 10, skip = 0) {
        try {
            if (!query || query.trim().length === 0) {
                throw new Error('Query cannot be empty');
            }
            // Validate limits
            if (limit < 1 || limit > 100) {
                throw new Error('Limit must be between 1 and 100');
            }
            if (skip < 0) {
                throw new Error('Skip must be >= 0');
            }
            logger.info(`Searching for vector similarity: "${query}" (limit=${limit}, skip=${skip})`);
            // Step 1: Generate embedding for the query
            logger.debug(`Generating embedding for query: "${query}"`);
            const queryEmbeddings = await this.embeddingService.generateEmbeddings([query]);
            if (!queryEmbeddings || queryEmbeddings.length === 0) {
                throw new Error('Failed to generate query embedding');
            }
            const queryEmbedding = queryEmbeddings[0];
            logger.debug(`Generated embedding with ${queryEmbedding.length} dimensions`);
            // Step 2: Try MongoDB Atlas Vector Search first
            try {
                logger.debug('Attempting MongoDB Vector Search...');
                const results = await this.mongoVectorSearch(queryEmbedding, limit, skip);
                if (results && results.length > 0) {
                    logger.info(`Vector search found ${results.length} results using MongoDB Atlas`);
                    return results;
                }
            }
            catch (mongoErr) {
                logger.debug(`MongoDB vector search unavailable, falling back to application-level similarity: ${mongoErr}`);
            }
            // Step 3: Fallback to application-level vector similarity
            logger.debug('Using application-level vector similarity calculation');
            const results = await this.applicationVectorSearch(queryEmbedding, limit, skip);
            logger.info(`Vector search found ${results.length} results using application-level similarity`);
            return results;
        }
        catch (error) {
            logger.error(`Vector search failed: ${error}`);
            throw error;
        }
    }
    /**
     * MongoDB Atlas Vector Search (approximate nearest neighbor)
     */
    async mongoVectorSearch(queryEmbedding, limit, skip) {
        try {
            const results = await resumeSchema_1.Resume.aggregate([
                {
                    $search: {
                        vectorSearch: {
                            queryVector: queryEmbedding,
                            path: 'embedding',
                            limit: Math.min(limit + skip, 1000),
                            numCandidates: Math.min(limit + skip + 100, 5000),
                        },
                    },
                },
                {
                    $addFields: {
                        score: { $meta: 'searchScore' },
                    },
                },
                { $skip: skip },
                { $limit: limit },
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
            ]);
            const formattedResults = results.map((doc) => ({
                _id: doc._id.toString(),
                name: doc.name || '',
                email: doc.email || '',
                role: doc.role || '',
                company: doc.company || '',
                skills: doc.skills || '',
                score: doc.score || 0,
            }));
            return formattedResults;
        }
        catch (error) {
            logger.debug(`MongoDB vector search error: ${error}`);
            throw error; // Let caller decide to fallback
        }
    }
    /**
     * Application-level vector similarity search (exact nearest neighbor using cosine similarity)
     * Used as fallback when MongoDB Atlas Vector Search is unavailable
     */
    async applicationVectorSearch(queryEmbedding, limit, skip) {
        try {
            // Fetch all documents with embeddings
            const allDocuments = await resumeSchema_1.Resume.aggregate([
                {
                    $match: {
                        embedding: {
                            $exists: true,
                            $ne: null,
                            $type: 'array',
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        role: 1,
                        company: 1,
                        skills: 1,
                        embedding: 1,
                    },
                },
            ]);
            // Calculate similarity for each document
            const scored = allDocuments.map((doc) => {
                const similarity = this.computeCosineSimilarity(queryEmbedding, doc.embedding || []);
                return {
                    _id: doc._id.toString(),
                    name: doc.name || '',
                    email: doc.email || '',
                    role: doc.role || '',
                    company: doc.company || '',
                    skills: doc.skills || '',
                    score: similarity,
                    rawScore: similarity,
                };
            });
            // Sort by similarity (highest first)
            scored.sort((a, b) => b.rawScore - a.rawScore);
            // Apply pagination
            const paginated = scored.slice(skip, skip + limit);
            // Remove rawScore from results
            return paginated.map(({ rawScore, ...rest }) => rest);
        }
        catch (error) {
            logger.error(`Application-level vector search failed: ${error}`);
            throw error;
        }
    }
    /**
     * Perform vector search with optional score threshold filtering
     * @param query - Query text to search for
     * @param scoreThreshold - Minimum similarity score threshold (0-1)
     * @param limit - Maximum number of results
     * @param skip - Number of results to skip
     * @returns Array of filtered similar resumes
     */
    async advancedSearch(query, scoreThreshold = 0.5, limit = 10, skip = 0) {
        try {
            if (!query || query.trim().length === 0) {
                throw new Error('Query cannot be empty');
            }
            // Validate threshold
            if (scoreThreshold < 0 || scoreThreshold > 1) {
                throw new Error('Score threshold must be between 0 and 1');
            }
            logger.info(`Performing advanced vector search: "${query}" (threshold=${scoreThreshold})`);
            // Generate embedding for the query
            const queryEmbeddings = await this.embeddingService.generateEmbeddings([query]);
            if (!queryEmbeddings || queryEmbeddings.length === 0) {
                throw new Error('Failed to generate query embedding');
            }
            const queryEmbedding = queryEmbeddings[0];
            // Get all results and apply threshold
            const allDocuments = await resumeSchema_1.Resume.aggregate([
                {
                    $match: {
                        embedding: {
                            $exists: true,
                            $ne: null,
                            $type: 'array',
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        role: 1,
                        company: 1,
                        skills: 1,
                        embedding: 1,
                    },
                },
            ]);
            // Calculate similarity and filter by threshold
            const scored = allDocuments
                .map((doc) => {
                const similarity = this.computeCosineSimilarity(queryEmbedding, doc.embedding || []);
                return {
                    _id: doc._id.toString(),
                    name: doc.name || '',
                    email: doc.email || '',
                    role: doc.role || '',
                    company: doc.company || '',
                    skills: doc.skills || '',
                    score: similarity,
                    rawScore: similarity,
                };
            })
                .filter(doc => doc.rawScore >= scoreThreshold);
            // Sort by similarity (highest first)
            scored.sort((a, b) => b.rawScore - a.rawScore);
            // Apply pagination
            const paginated = scored.slice(skip, skip + limit);
            logger.info(`Advanced vector search found ${paginated.length} results above threshold ${scoreThreshold}`);
            // Remove rawScore from results
            return paginated.map(({ rawScore, ...rest }) => rest);
        }
        catch (error) {
            logger.error(`Advanced vector search failed: ${error}`);
            throw error;
        }
    }
    /**
     * Get vector search statistics
     * @returns Statistics about indexed documents and embedding configuration
     */
    async getSearchStats() {
        try {
            logger.info('Fetching vector search statistics');
            const totalDocuments = await resumeSchema_1.Resume.countDocuments();
            // Count documents that have embeddings
            const documentsWithEmbeddings = await resumeSchema_1.Resume.countDocuments({
                embedding: { $exists: true, $type: 'array', $ne: [] },
            });
            const stats = {
                totalDocuments,
                documentsWithEmbeddings,
                embeddingDimension: parseInt(process.env.VECTOR_DIMENSION || '1024'),
                similarityMetric: 'cosine',
                searchMethod: 'hybrid (MongoDB Atlas with application-level fallback)',
            };
            logger.info(`Stats: total=${totalDocuments}, embedded=${documentsWithEmbeddings}, dimension=${stats.embeddingDimension}`);
            return stats;
        }
        catch (error) {
            logger.error(`Failed to fetch search stats: ${error}`);
            throw error;
        }
    }
}
exports.VectorSearchService = VectorSearchService;
