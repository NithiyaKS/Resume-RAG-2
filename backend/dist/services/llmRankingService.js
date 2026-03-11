"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMRankingService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('LLMRankingService');
class LLMRankingService {
    constructor() {
        this.groqApiKey = process.env.GROQ_API_KEY || '';
        this.groqModel = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
        this.groqApiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
        this.defaultTopK = parseInt(process.env.LLM_RERANK_TOP_K || '10', 10);
        this.defaultMaxTokens = parseInt(process.env.LLM_RERANK_MAX_TOKENS || '2000', 10);
        this.axiosClient = axios_1.default.create({
            baseURL: this.groqApiUrl,
            headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout for LLM calls
        });
        this.validateConfiguration();
    }
    validateConfiguration() {
        if (!this.groqApiKey) {
            logger.warn('GROQ_API_KEY not configured - LLM re-ranking will not work');
        }
    }
    /**
     * Re-rank a list of candidates using LLM
     * @param query - The search query context
     * @param candidates - List of candidates to re-rank
     * @param config - Configuration options for re-ranking
     * @returns Re-ranked candidates sorted by LLM score
     */
    async rerankCandidates(query, candidates, config = {}) {
        try {
            if (!query || query.trim().length === 0) {
                throw new Error('Query cannot be empty');
            }
            if (!candidates || candidates.length === 0) {
                throw new Error('Candidates list cannot be empty');
            }
            // Set configuration defaults
            const finalConfig = {
                topK: config.topK ?? this.defaultTopK,
                maxTokens: config.maxTokens ?? this.defaultMaxTokens,
                temperature: config.temperature ?? 0.5,
                detailed: config.detailed ?? true,
            };
            logger.info(`Re-ranking ${candidates.length} candidates for query: "${query}" (topK: ${finalConfig.topK})`);
            // Limit to topK candidates
            const candidatesToRank = candidates.slice(0, finalConfig.topK ?? this.defaultTopK);
            // Build the prompt for LLM
            const prompt = this.buildRerankPrompt(query, candidatesToRank, finalConfig.detailed ?? true);
            // Call Groq API
            const startTime = Date.now();
            const llmResponse = await this.callGroqAPI(prompt, finalConfig.maxTokens ?? this.defaultMaxTokens, finalConfig.temperature ?? 0.5);
            const apiDuration = Date.now() - startTime;
            logger.info(`Groq API call completed in ${apiDuration}ms`);
            // Parse and extract rankings from LLM response
            const rerankScores = this.parseRerankResponse(llmResponse, candidatesToRank);
            // Build final results with re-rank scores
            const results = candidatesToRank.map((candidate, index) => ({
                _id: candidate._id,
                name: candidate.name,
                role: candidate.role,
                company: candidate.company,
                skills: candidate.skills,
                email: candidate.email,
                snippet: candidate.snippet,
                rerankScore: rerankScores[index] ?? 0.5, // Default to 0.5 if parsing failed
                originalScore: candidate.score,
            }));
            // Sort by rerankScore descending
            results.sort((a, b) => b.rerankScore - a.rerankScore);
            logger.info(`Re-ranking completed. Top candidate: ${results[0].name} (score: ${results[0].rerankScore})`);
            return results;
        }
        catch (error) {
            logger.error(`LLM re-ranking error: ${error}`);
            // Fallback: return candidates sorted by original score
            return this.fallbackRanking(candidates);
        }
    }
    /**
     * Build a prompt for LLM to re-rank candidates
     */
    buildRerankPrompt(query, candidates, detailed) {
        const candidatesList = candidates
            .map((c, i) => `${i + 1}. Name: ${c.name}, Role: ${c.role}, Company: ${c.company}, Skills: ${c.skills || 'N/A'}`)
            .join('\n');
        const detailedInstruction = detailed
            ? 'Provide a detailed ranking with scores and reasoning for each candidate.'
            : 'Provide a simple ranking with scores only.';
        return `You are an expert recruiter. Your task is to rank the following candidates based on their relevance to the job search query.

Search Query: "${query}"

Candidates to Rank:
${candidatesList}

${detailedInstruction}

For each candidate, provide:
1. Candidate number (1-${candidates.length})
2. A relevance score from 0.0 to 1.0
3. ${detailed ? 'Brief reasoning for the ranking' : 'Skip reasoning'}

Format your response as JSON array with objects containing:
{
  "index": candidate_number,
  "score": relevance_score,
  ${detailed ? '"reasoning": "brief explanation"' : ''}
}

Respond ONLY with the JSON array. No other text.`;
    }
    /**
     * Call Groq API with the prompt
     */
    async callGroqAPI(prompt, maxTokens, temperature) {
        try {
            const response = await this.axiosClient.post('', {
                model: this.groqModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert recruiter assistant. Respond only with valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature,
                max_tokens: maxTokens,
            });
            if (!response.data || !response.data.choices || response.data.choices.length === 0) {
                throw new Error('Invalid response from Groq API');
            }
            const content = response.data.choices[0].message.content;
            return content;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger.error(`Groq API error: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
            }
            else {
                logger.error(`Groq API call failed: ${error}`);
            }
            throw error;
        }
    }
    /**
     * Parse LLM response and extract re-rank scores
     */
    parseRerankResponse(response, candidates) {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = response.match(/\[\s*{[\s\S]*}\s*\]/);
            if (!jsonMatch) {
                logger.warn('No JSON found in LLM response, using fallback scoring');
                return candidates.map(() => 0.5);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(parsed)) {
                throw new Error('LLM response is not an array');
            }
            // Extract scores in order of candidates
            const scores = new Array(candidates.length).fill(0.5); // Default fallback
            parsed.forEach((item) => {
                if (typeof item.index === 'number' && typeof item.score === 'number') {
                    const idx = item.index - 1; // Convert to 0-based index
                    if (idx >= 0 && idx < candidates.length) {
                        // Normalize score to 0-1 range
                        scores[idx] = Math.min(Math.max(item.score, 0), 1);
                    }
                }
            });
            return scores;
        }
        catch (error) {
            logger.warn(`Failed to parse LLM response: ${error}. Using fallback scoring.`);
            return candidates.map(() => 0.5);
        }
    }
    /**
     * Fallback ranking when LLM fails
     * Returns candidates sorted by their original score
     */
    fallbackRanking(candidates) {
        logger.info('Using fallback ranking (sorted by original score)');
        return candidates
            .map((candidate) => ({
            _id: candidate._id,
            name: candidate.name,
            role: candidate.role,
            company: candidate.company,
            skills: candidate.skills,
            email: candidate.email,
            snippet: candidate.snippet,
            rerankScore: candidate.score ?? 0.5,
            originalScore: candidate.score,
        }))
            .sort((a, b) => (b.originalScore ?? 0) - (a.originalScore ?? 0));
    }
    /**
     * Get LLM service status and configuration
     */
    getStatus() {
        return {
            configured: !!this.groqApiKey,
            model: this.groqModel,
            apiUrl: this.groqApiUrl,
            defaultTopK: this.defaultTopK,
            defaultMaxTokens: this.defaultMaxTokens,
        };
    }
}
exports.LLMRankingService = LLMRankingService;
