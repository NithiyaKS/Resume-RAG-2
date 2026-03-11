"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoStorageService = void 0;
const resumeSchema_1 = require("../models/resumeSchema");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('MongoStorageService');
class MongoStorageService {
    /**
     * Save JSON resume to MongoDB
     */
    async saveResume(resumeData) {
        try {
            const resume = new resumeSchema_1.Resume(resumeData);
            const savedResume = await resume.save();
            logger.info(`Resume saved successfully: ${savedResume._id}`);
            return savedResume;
        }
        catch (error) {
            logger.error(`Failed to save resume: ${error}`);
            throw error;
        }
    }
    /**
     * Update resume with embedding
     */
    async updateResumeEmbeddings(resumeId, embedding) {
        try {
            const updated = await resumeSchema_1.Resume.findByIdAndUpdate(resumeId, {
                embedding: embedding,
                embeddingStatus: 'completed',
            }, { new: true });
            logger.info(`Resume embedding updated: ${resumeId} (${embedding.length} dimensions)`);
            return updated;
        }
        catch (error) {
            logger.error(`Failed to update embedding: ${error}`);
            throw error;
        }
    }
    /**
     * Update resume with embedding failure status
     */
    async markEmbeddingFailed(resumeId, error) {
        try {
            const updated = await resumeSchema_1.Resume.findByIdAndUpdate(resumeId, {
                embeddingStatus: 'failed',
            }, { new: true });
            logger.warn(`Resume marked as failed: ${resumeId} - ${error}`);
            return updated;
        }
        catch (err) {
            logger.error(`Failed to mark resume as failed: ${err}`);
            throw err;
        }
    }
    /**
     * Get resume by ID
     */
    async getResume(resumeId) {
        try {
            return await resumeSchema_1.Resume.findById(resumeId);
        }
        catch (error) {
            logger.error(`Failed to fetch resume: ${error}`);
            throw error;
        }
    }
    /**
     * Get all resumes
     */
    async getAllResumes(limit = 10) {
        try {
            return await resumeSchema_1.Resume.find().limit(limit).sort({ createdAt: -1 });
        }
        catch (error) {
            logger.error(`Failed to fetch resumes: ${error}`);
            throw error;
        }
    }
    /**
     * Get resumes count
     */
    async getResumeCount() {
        try {
            return await resumeSchema_1.Resume.countDocuments();
        }
        catch (error) {
            logger.error(`Failed to count resumes: ${error}`);
            throw error;
        }
    }
    /**
     * Get embedding statistics
     */
    async getEmbeddingStats() {
        try {
            const total = await resumeSchema_1.Resume.countDocuments();
            const completed = await resumeSchema_1.Resume.countDocuments({
                embeddingStatus: 'completed',
            });
            const pending = await resumeSchema_1.Resume.countDocuments({
                embeddingStatus: 'pending',
            });
            const failed = await resumeSchema_1.Resume.countDocuments({
                embeddingStatus: 'failed',
            });
            return { total, completed, pending, failed };
        }
        catch (error) {
            logger.error(`Failed to get embedding stats: ${error}`);
            throw error;
        }
    }
    /**
     * Delete resume by ID
     */
    async deleteResume(resumeId) {
        try {
            const deleted = await resumeSchema_1.Resume.findByIdAndDelete(resumeId);
            logger.info(`Resume deleted: ${resumeId}`);
            return deleted;
        }
        catch (error) {
            logger.error(`Failed to delete resume: ${error}`);
            throw error;
        }
    }
}
exports.MongoStorageService = MongoStorageService;
