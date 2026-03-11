import axios from 'axios';
import { VectorIndexService } from './vectorIndexService';
import { Logger } from '../utils/logger';

const logger = new Logger('EmbeddingGenerationService');

interface EmbeddingRequest {
  input: string[];
  model: string;
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
}

export class EmbeddingGenerationService {
  private mistralApiKey: string;
  private mistralApiUrl: string;
  private model: string;
  private dimension: number;
  private vectorIndexService: VectorIndexService;
  private lastRequestTime: number = 0; // Track last API call for rate limiting
  private minRequestInterval: number = 200; // Minimum 200ms between requests (5 req/sec)

  constructor() {
    this.mistralApiKey = process.env.MISTRAL_API_KEY || '';
    this.mistralApiUrl = 'https://api.mistral.ai/v1/embeddings';
    this.model = 'mistral-embed';
    this.dimension = parseInt(process.env.VECTOR_DIMENSION || '1024');
    this.vectorIndexService = new VectorIndexService();

    // Debug: Log the environment variables
    console.log('[DEBUG] process.env.MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? '***SET***' : '***NOT SET***');
    console.log('[DEBUG] process.env.VECTOR_DIMENSION:', process.env.VECTOR_DIMENSION);
    console.log('[DEBUG] All env keys:', Object.keys(process.env).filter(k => k.includes('MISTRAL')));

    if (!this.mistralApiKey) {
      logger.warn('MISTRAL_API_KEY not configured');
    } else {
      logger.info('MISTRAL_API_KEY configured successfully');
    }
  }

  /**
   * Enforce rate limiting by adding delay between API calls
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayNeeded = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`Rate limiting: waiting ${delayNeeded}ms`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Generate embeddings for multiple texts with retry logic and rate limiting
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!texts || texts.length === 0) {
          throw new Error('No texts provided for embedding');
        }

        // Enforce rate limiting before making request
        await this.enforceRateLimit();

        const request: EmbeddingRequest = {
          input: texts.map((text) => (text || '').substring(0, 2048)), // Limit text length
          model: this.model,
        };

        logger.info(`[Attempt ${attempt}/${maxRetries}] Calling Mistral API with ${texts.length} text(s)`);

        const response = await axios.post<EmbeddingResponse>(
          this.mistralApiUrl,
          request,
          {
            headers: {
              Authorization: `Bearer ${this.mistralApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000, // Increased to 60 seconds
          }
        );

        // Sort by index to maintain order
        const embeddings = response.data.data
          .sort((a, b) => a.index - b.index)
          .map((item) => item.embedding);

        logger.info(`✓ Generated ${embeddings.length} embeddings successfully on attempt ${attempt}`);
        return embeddings;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          logger.warn(
            `[Attempt ${attempt}/${maxRetries}] Embedding generation failed: ${lastError.message}. ` +
            `Retrying in ${backoffMs}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          logger.error(`[Attempt ${attempt}/${maxRetries}] Final attempt failed: ${lastError.message}`);
        }
      }
    }

    logger.error(`Failed to generate embeddings after ${maxRetries} attempts: ${lastError?.message}`);
    throw lastError;
  }

  /**
   * Generate embedding for resume record based on MongoDB vector index configuration
   * Extracts text from fields specified in the vector index and generates combined embedding
   * @param record - Resume record from MongoDB
   * @returns Single embedding vector matching configured dimension
   */
  async generateResumeEmbedding(record: any): Promise<{
    embedding: number[];
    fieldsEmbedded: string[];
    dimension: number;
  }> {
    try {
      // Get vector index configuration to know which fields to embed
      const indexConfig = await this.vectorIndexService.getVectorIndexConfig();

      // Extract text from specified fields
      const textsToEmbed = indexConfig.fieldsToEmbed.map((field: string) => {
        const value = this.extractFieldValue(record, field);
        return value;
      });

      logger.info(
        `Extracting fields for embedding: [${indexConfig.fieldsToEmbed.join(', ')}]`
      );

      // Combine all texts with space separator
      const combinedText = textsToEmbed
        .filter((text: string) => text && text.length > 0)
        .join(' ');

      if (!combinedText || combinedText.length === 0) {
        throw new Error('No text found to embed from specified fields');
      }

      // Generate single embedding for combined text
      const [embedding] = await this.generateEmbeddings([combinedText]);

      // Verify dimension matches expected size
      if (embedding.length !== this.dimension) {
        logger.warn(
          `Embedding dimension mismatch: got ${embedding.length}, expected ${this.dimension}`
        );
      }

      logger.info(
        `Resume embedding generated: dimension=${embedding.length}, fields=[${indexConfig.fieldsToEmbed.join(', ')}]`
      );

      return {
        embedding,
        fieldsEmbedded: indexConfig.fieldsToEmbed,
        dimension: embedding.length,
      };
    } catch (error) {
      logger.error(`Failed to generate resume embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Extract field value from record
   * Handles nested paths and special field transformations
   */
  private extractFieldValue(record: any, fieldPath: string): string {
    try {
      // Special handling for common fields
      if (fieldPath === 'text') {
        return record.text || '';
      }

      if (fieldPath === 'skills') {
        if (Array.isArray(record.skills)) {
          return record.skills.join(', ');
        }
        return record.skills || '';
      }

      if (fieldPath === 'embedding') {
        // Skip embedding field itself
        return '';
      }

      // Handle nested paths like "profile.summary"
      const parts = fieldPath.split('.');
      let value = record;

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          break;
        }
      }

      // Convert arrays to comma-separated string
      if (Array.isArray(value)) {
        return value.join(', ');
      }

      // Convert to string if not already
      return value ? String(value) : '';
    } catch (error) {
      logger.warn(`Error extracting field ${fieldPath}: ${error}`);
      return '';
    }
  }

  /**
   * @deprecated Use generateResumeEmbedding instead
   * Kept for backward compatibility
   */
  async generateResumeEmbeddings(
    skillsText: string,
    fullText: string
  ): Promise<number[]> {
    try {
      const skillsInput = skillsText || 'No skills';
      const textInput = fullText || 'No text';

      // Generate embeddings for skills and full text
      const [skillsEmb, textEmb] = await this.generateEmbeddings([
        skillsInput,
        textInput,
      ]);

      // Combine embeddings (average) - returns single 1024-dim vector
      const combinedEmb = skillsEmb.map(
        (val, idx) => (val + textEmb[idx]) / 2
      );

      logger.info(`Resume embedding generated successfully (${combinedEmb.length} dimensions)`);

      return combinedEmb;
    } catch (error) {
      logger.error(`Failed to generate resume embeddings: ${error}`);
      throw error;
    }
  }
}
