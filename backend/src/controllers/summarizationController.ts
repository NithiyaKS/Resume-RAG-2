import { Request, Response } from 'express';
import {
  LLMSummarizationService,
  CandidateForSummarization,
  LLMSummarizationConfig,
} from '../services/llmSummarizationService';
import { Logger } from '../utils/logger';

const logger = new Logger('SummarizationController');
const llmSummarizationService = new LLMSummarizationService();

/**
 * POST /v1/search/summarize
 * Summarize a candidate's fit for a job query
 *
 * Request Body:
 * {
 *   "query": "senior python backend engineer with 5+ years microservices experience",
 *   "candidate": {
 *     "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
 *     "name": "John Doe",
 *     "role": "Senior Backend Engineer",
 *     "company": "Tech Corp",
 *     "skills": "Python, Django, FastAPI, Kubernetes",
 *     "email": "john@example.com",
 *     "text": "Full resume text...",
 *     "snippet": "Summary snippet..."
 *   },
 *   "style": "detailed",
 *   "maxTokens": 400,
 *   "temperature": 0.7,
 *   "includeMatchScore": true
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Candidate summary generated",
 *   "data": {
 *     "_id": "64f1b3c8e9f0a1b2c3d4e5f6",
 *     "name": "John Doe",
 *     "role": "Senior Backend Engineer",
 *     "company": "Tech Corp",
 *     "query": "senior python backend engineer with 5+ years microservices experience",
 *     "summary": "John Doe is a Senior Backend Engineer at Tech Corp with strong Python expertise...",
 *     "style": "detailed",
 *     "maxTokens": 400,
 *     "matchScore": 0.92
 *   },
 *   "metadata": {
 *     "durationMs": 1234
 *   }
 * }
 */
export async function summarizeCandidate(req: Request, res: Response): Promise<void> {
  try {
    const { query, candidate, style = 'short', maxTokens = 150, temperature = 0.7, includeMatchScore = true } = req.body;

    // Validation
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Query cannot be empty',
        data: null,
      });
      return;
    }

    if (!candidate || typeof candidate !== 'object') {
      res.status(400).json({
        status: 'error',
        message: 'Candidate object is required',
        data: null,
      });
      return;
    }

    if (!candidate._id || !candidate.name) {
      res.status(400).json({
        status: 'error',
        message: 'Candidate must have _id and name fields',
        data: null,
      });
      return;
    }

    // Validate style
    if (style !== 'short' && style !== 'detailed') {
      res.status(400).json({
        status: 'error',
        message: 'Style must be "short" or "detailed"',
        data: null,
      });
      return;
    }

    // Validate maxTokens
    if (maxTokens < 100 || maxTokens > 2000) {
      res.status(400).json({
        status: 'error',
        message: 'maxTokens must be between 100 and 2000',
        data: null,
      });
      return;
    }

    // Validate temperature
    if (temperature < 0 || temperature > 2) {
      res.status(400).json({
        status: 'error',
        message: 'temperature must be between 0 and 2',
        data: null,
      });
      return;
    }

    // Validate candidate structure
    const validatedCandidate: CandidateForSummarization = {
      _id: candidate._id,
      name: candidate.name,
      role: candidate.role || 'Unknown',
      company: candidate.company || 'Unknown',
      skills: candidate.skills,
      email: candidate.email,
      text: candidate.text,
      snippet: candidate.snippet,
    };

    logger.info(
      `Summarization request: query="${query}", candidate=${candidate.name}, style=${style}, maxTokens=${maxTokens}`
    );

    // Create config
    const config: Partial<LLMSummarizationConfig> = {
      style: style as 'short' | 'detailed',
      maxTokens,
      temperature,
      includeMatchScore,
    };

    // Perform summarization
    const startTime = Date.now();
    const result = await llmSummarizationService.summarizeCandidate(query, validatedCandidate, config);
    const duration = Date.now() - startTime;

    logger.info(`Summarization completed in ${duration}ms for ${candidate.name}`);

    res.json({
      status: 'success',
      message: 'Candidate summary generated',
      data: result,
      metadata: {
        durationMs: duration,
      },
    });
  } catch (error) {
    logger.error(`Summarization error: ${error}`);
    res.status(500).json({
      status: 'error',
      message: `Summarization failed: ${error}`,
      data: null,
    });
  }
}

/**
 * POST /v1/search/summarize/batch
 * Batch summarize multiple candidates
 *
 * Request Body:
 * {
 *   "query": "senior python developer",
 *   "candidates": [
 *     {
 *       "_id": "1",
 *       "name": "Alice",
 *       "role": "Python Developer",
 *       "company": "TechCorp",
 *       "skills": "Python, Django"
 *     },
 *     {
 *       "_id": "2",
 *       "name": "Bob",
 *       "role": "Backend Engineer",
 *       "company": "StartUp Inc",
 *       "skills": "Python, FastAPI"
 *     }
 *   ],
 *   "style": "short",
 *   "maxTokens": 150
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "Batch summarization completed: 2/2 successful",
 *   "data": [...summaries...],
 *   "metadata": {
 *     "totalRequested": 2,
 *     "totalCompleted": 2,
 *     "totalFailed": 0,
 *     "totalDurationMs": 5000
 *   }
 * }
 */
export async function batchSummarizeCandidates(req: Request, res: Response): Promise<void> {
  try {
    const { query, candidates, style = 'short', maxTokens = 150, temperature = 0.7, includeMatchScore = true } = req.body;

    // Validation
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Query cannot be empty',
        data: null,
      });
      return;
    }

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Candidates must be a non-empty array',
        data: null,
      });
      return;
    }

    if (candidates.length > 20) {
      res.status(400).json({
        status: 'error',
        message: 'Maximum 20 candidates allowed for batch summarization',
        data: null,
      });
      return;
    }

    // Validate style and parameters
    if (style !== 'short' && style !== 'detailed') {
      res.status(400).json({
        status: 'error',
        message: 'Style must be "short" or "detailed"',
        data: null,
      });
      return;
    }

    if (maxTokens < 100 || maxTokens > 2000) {
      res.status(400).json({
        status: 'error',
        message: 'maxTokens must be between 100 and 2000',
        data: null,
      });
      return;
    }

    // Validate candidate structure
    const validatedCandidates: CandidateForSummarization[] = candidates.map((candidate: any) => {
      if (!candidate._id || !candidate.name) {
        throw new Error('Each candidate must have _id and name');
      }
      return {
        _id: candidate._id,
        name: candidate.name,
        role: candidate.role || 'Unknown',
        company: candidate.company || 'Unknown',
        skills: candidate.skills,
        email: candidate.email,
        text: candidate.text,
        snippet: candidate.snippet,
      };
    });

    logger.info(`Batch summarization request: query="${query}", candidates=${candidates.length}, style=${style}`);

    // Create config
    const config: Partial<LLMSummarizationConfig> = {
      style: style as 'short' | 'detailed',
      maxTokens,
      temperature,
      includeMatchScore,
    };

    // Perform batch summarization
    const startTime = Date.now();
    const results = await llmSummarizationService.summarizeCandidates(query, validatedCandidates, config);
    const duration = Date.now() - startTime;

    logger.info(`Batch summarization completed in ${duration}ms. ${results.length}/${candidates.length} successful`);

    res.json({
      status: 'success',
      message: `Batch summarization completed: ${results.length}/${candidates.length} successful`,
      data: results,
      metadata: {
        totalRequested: candidates.length,
        totalCompleted: results.length,
        totalFailed: candidates.length - results.length,
        totalDurationMs: duration,
      },
    });
  } catch (error) {
    logger.error(`Batch summarization error: ${error}`);
    res.status(500).json({
      status: 'error',
      message: `Batch summarization failed: ${error}`,
      data: null,
    });
  }
}

/**
 * GET /v1/search/summarize/status
 * Get LLM summarization service status
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "configured": true,
 *     "model": "mixtral-8x7b-32768",
 *     "apiUrl": "https://api.groq.com/openai/v1/chat/completions",
 *     "defaultMaxTokens": 2000
 *   }
 * }
 */
export async function getSummarizationStatus(req: Request, res: Response): Promise<void> {
  try {
    const status = llmSummarizationService.getStatus();

    res.json({
      status: 'success',
      message: 'LLM summarization service status',
      data: status,
    });
  } catch (error) {
    logger.error(`Failed to get summarization status: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get service status',
      data: null,
    });
  }
}
