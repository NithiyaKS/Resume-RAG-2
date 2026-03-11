import { BM25SearchService } from './bm25SearchService';
import { VectorSearchService } from './vectorSearchService';
import { Logger } from '../utils/logger';

const logger = new Logger('HybridSearchService');

export interface HybridSearchResult {
  _id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  skills: string;
  bm25Score: number;
  vectorScore: number;
  combinedScore: number;
}

export interface HybridSearchConfig {
  bm25Weight: number; // 0-1, default 0.5
  vectorWeight: number; // 0-1, default 0.5
  bm25Threshold?: number; // Min BM25 score to include (optional)
  vectorThreshold?: number; // Min vector score to include (optional)
  normalizeScores?: boolean; // Normalize different score scales (default: true)
}

export class HybridSearchService {
  private bm25SearchService: BM25SearchService;
  private vectorSearchService: VectorSearchService;

  constructor() {
    this.bm25SearchService = new BM25SearchService();
    this.vectorSearchService = new VectorSearchService();
  }

  /**
   * Normalize a score to 0-1 range
   * BM25 scores can be large, vector scores are already 0-1
   */
  private normalizeScore(score: number, isVector: boolean, maxBm25: number = 10): number {
    if (isVector) {
      return Math.min(Math.max(score, 0), 1); // Already normalized
    } else {
      // Normalize BM25 score: cap at maxBm25 then divide
      return Math.min(score / maxBm25, 1);
    }
  }

  /**
   * Combine BM25 and vector search results
   * @param query - Search query
   * @param config - Weighting and threshold configuration
   * @param limit - Max results to return
   * @param skip - Results to skip for pagination
   * @returns Array of hybrid search results sorted by combined score
   */
  async search(
    query: string,
    config: Partial<HybridSearchConfig> = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<HybridSearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Query cannot be empty');
      }

      // Set defaults for configuration
      const finalConfig: HybridSearchConfig = {
        bm25Weight: config.bm25Weight ?? 0.5,
        vectorWeight: config.vectorWeight ?? 0.5,
        bm25Threshold: config.bm25Threshold,
        vectorThreshold: config.vectorThreshold,
        normalizeScores: config.normalizeScores ?? true,
      };

      // Validate weights sum to 1
      const totalWeight = finalConfig.bm25Weight + finalConfig.vectorWeight;
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        logger.warn(
          `Weights don't sum to 1: bm25=${finalConfig.bm25Weight}, vector=${finalConfig.vectorWeight}`
        );
      }

      logger.info(`Hybrid search: "${query}" (bm25:${finalConfig.bm25Weight}, vector:${finalConfig.vectorWeight})`);

      // Run both searches in parallel
      const [bm25Response, vectorResults] = await Promise.all([
        this.bm25SearchService.search({ query, limit: 100, skip: 0 }).catch(err => {
          logger.warn(`BM25 search failed: ${err.message}`);
          return { results: [], total: 0, query, limit: 100, skip: 0 };
        }),
        this.vectorSearchService.search(query, 100, 0).catch(err => {
          logger.warn(`Vector search failed: ${err.message}`);
          return [];
        }),
      ]);

      const bm25Results = bm25Response.results || [];
      logger.debug(`BM25 returned ${bm25Results.length} results, Vector returned ${vectorResults.length}`);

      // Combine results by document ID
      const combined = new Map<string, HybridSearchResult>();

      // Add BM25 results
      bm25Results.forEach((result: any, index: number) => {
        const bm25Score = finalConfig.normalizeScores ? this.normalizeScore(result.score, false) : result.score;

        // Skip if below threshold
        if (finalConfig.bm25Threshold && bm25Score < finalConfig.bm25Threshold) {
          return;
        }

        const hybridResult: HybridSearchResult = {
          _id: result._id,
          name: result.name || '',
          email: result.email || '',
          role: result.role || '',
          company: result.company || '',
          skills: result.skills || '',
          bm25Score,
          vectorScore: 0,
          combinedScore: bm25Score * finalConfig.bm25Weight,
        };

        combined.set(result._id, hybridResult);
      });

      // Add/merge vector results
      vectorResults.forEach((result: any) => {
        const vectorScore = finalConfig.normalizeScores ? this.normalizeScore(result.score, true) : result.score;

        // Skip if below threshold
        if (finalConfig.vectorThreshold && vectorScore < finalConfig.vectorThreshold) {
          return;
        }

        const existingResult = combined.get(result._id);

        if (existingResult) {
          // Merge: update scores
          existingResult.vectorScore = vectorScore;
          existingResult.combinedScore =
            existingResult.bm25Score * finalConfig.bm25Weight + vectorScore * finalConfig.vectorWeight;
        } else {
          // New result: add it
          const hybridResult: HybridSearchResult = {
            _id: result._id,
            name: result.name || '',
            email: result.email || '',
            role: result.role || '',
            company: result.company || '',
            skills: result.skills || '',
            bm25Score: 0,
            vectorScore,
            combinedScore: vectorScore * finalConfig.vectorWeight,
          };

          combined.set(result._id, hybridResult);
        }
      });

      // Convert to array, sort by combined score (highest first)
      const allResults = Array.from(combined.values()).sort((a, b) => b.combinedScore - a.combinedScore);

      logger.info(`Hybrid search combined ${allResults.length} unique results`);

      // Apply pagination
      const paginated = allResults.slice(skip, skip + limit);

      return paginated;
    } catch (error) {
      logger.error(`Hybrid search failed: ${error}`);
      throw error;
    }
  }

  /**
   * Advanced hybrid search with more control
   */
  async advancedSearch(
    query: string,
    config: HybridSearchConfig = {
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      normalizeScores: true,
    },
    limit: number = 10,
    skip: number = 0
  ): Promise<HybridSearchResult[]> {
    try {
      logger.info(
        `Advanced hybrid search: "${query}" (config: bm25Weight=${config.bm25Weight}, vectorWeight=${config.vectorWeight}, ` +
          `bm25Threshold=${config.bm25Threshold}, vectorThreshold=${config.vectorThreshold})`
      );

      return await this.search(query, config, limit, skip);
    } catch (error) {
      logger.error(`Advanced hybrid search failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get statistics about hybrid search capabilities
   */
  async getSearchStats(): Promise<{
    bm25Available: boolean;
    vectorAvailable: boolean;
    totalDocuments: number;
    documentsWithEmbeddings: number;
    recommendedWeights: {
      bm25: number;
      vector: number;
    };
  }> {
    try {
      logger.info('Fetching hybrid search statistics');

      const [bm25Stats, vectorStats] = await Promise.all([
        this.bm25SearchService.getSearchStats().catch(() => null),
        this.vectorSearchService.getSearchStats().catch(() => null),
      ]);

      const stats = {
        bm25Available: !!bm25Stats,
        vectorAvailable: !!vectorStats,
        totalDocuments: bm25Stats?.totalDocuments || vectorStats?.totalDocuments || 0,
        documentsWithEmbeddings: vectorStats?.documentsWithEmbeddings || 0,
        recommendedWeights: {
          bm25: 0.5, // Equal weighting recommended
          vector: 0.5,
        },
      };

      logger.info(`Hybrid search available: BM25=${stats.bm25Available}, Vector=${stats.vectorAvailable}`);

      return stats;
    } catch (error) {
      logger.error(`Failed to get hybrid search stats: ${error}`);
      throw error;
    }
  }

  /**
   * Get recommended weights based on search intent
   */
  getRecommendedWeights(intent: 'keyword' | 'semantic' | 'balanced'): {
    bm25Weight: number;
    vectorWeight: number;
  } {
    switch (intent) {
      case 'keyword':
        return { bm25Weight: 0.7, vectorWeight: 0.3 }; // Favor exact matches
      case 'semantic':
        return { bm25Weight: 0.3, vectorWeight: 0.7 }; // Favor meaning/concepts
      case 'balanced':
      default:
        return { bm25Weight: 0.5, vectorWeight: 0.5 }; // Equal weighting
    }
  }
}
