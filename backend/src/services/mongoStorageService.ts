import { Resume } from '../models/resumeSchema';
import { Logger } from '../utils/logger';

const logger = new Logger('MongoStorageService');

export class MongoStorageService {
  /**
   * Save JSON resume to MongoDB
   */
  async saveResume(resumeData: any): Promise<any> {
    try {
      const resume = new Resume(resumeData);
      const savedResume = await resume.save();
      logger.info(`Resume saved successfully: ${savedResume._id}`);
      return savedResume;
    } catch (error) {
      logger.error(`Failed to save resume: ${error}`);
      throw error;
    }
  }

  /**
   * Update resume with embedding
   */
  async updateResumeEmbeddings(
    resumeId: string,
    embedding: number[]
  ): Promise<any> {
    try {
      const updated = await Resume.findByIdAndUpdate(
        resumeId,
        {
          embedding: embedding,
          embeddingStatus: 'completed',
        },
        { new: true }
      );

      logger.info(`Resume embedding updated: ${resumeId} (${embedding.length} dimensions)`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Update resume with embedding failure status
   */
  async markEmbeddingFailed(resumeId: string, error: string): Promise<any> {
    try {
      const updated = await Resume.findByIdAndUpdate(
        resumeId,
        {
          embeddingStatus: 'failed',
        },
        { new: true }
      );

      logger.warn(`Resume marked as failed: ${resumeId} - ${error}`);
      return updated;
    } catch (err) {
      logger.error(`Failed to mark resume as failed: ${err}`);
      throw err;
    }
  }

  /**
   * Get resume by ID
   */
  async getResume(resumeId: string): Promise<any> {
    try {
      return await Resume.findById(resumeId);
    } catch (error) {
      logger.error(`Failed to fetch resume: ${error}`);
      throw error;
    }
  }

  /**
   * Get all resumes
   */
  async getAllResumes(limit: number = 10): Promise<any[]> {
    try {
      return await Resume.find().limit(limit).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Failed to fetch resumes: ${error}`);
      throw error;
    }
  }

  /**
   * Get resumes count
   */
  async getResumeCount(): Promise<number> {
    try {
      return await Resume.countDocuments();
    } catch (error) {
      logger.error(`Failed to count resumes: ${error}`);
      throw error;
    }
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
  }> {
    try {
      const total = await Resume.countDocuments();
      const completed = await Resume.countDocuments({
        embeddingStatus: 'completed',
      });
      const pending = await Resume.countDocuments({
        embeddingStatus: 'pending',
      });
      const failed = await Resume.countDocuments({
        embeddingStatus: 'failed',
      });

      return { total, completed, pending, failed };
    } catch (error) {
      logger.error(`Failed to get embedding stats: ${error}`);
      throw error;
    }
  }

  /**
   * Delete resume by ID
   */
  async deleteResume(resumeId: string): Promise<any> {
    try {
      const deleted = await Resume.findByIdAndDelete(resumeId);
      logger.info(`Resume deleted: ${resumeId}`);
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete resume: ${error}`);
      throw error;
    }
  }
}
