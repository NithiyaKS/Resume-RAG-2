"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMSummarizationService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('LLMSummarizationService');
class LLMSummarizationService {
    constructor() {
        this.groqApiKey = process.env.GROQ_API_KEY || '';
        this.groqModel = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
        this.groqApiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
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
            logger.warn('GROQ_API_KEY not configured - LLM summarization will not work');
        }
    }
    /**
     * Summarize a candidate's fit for a job query
     * @param query - The job search query or job description
     * @param candidate - The candidate information to summarize
     * @param config - Configuration for summarization
     * @returns Summarization result with generated summary
     */
    async summarizeCandidate(query, candidate, config = {}) {
        try {
            if (!query || query.trim().length === 0) {
                throw new Error('Query cannot be empty');
            }
            if (!candidate || !candidate._id || !candidate.name) {
                throw new Error('Candidate must have _id and name');
            }
            // Set configuration defaults
            const style = (config.style ?? 'short');
            const maxTokens = config.maxTokens ?? this.getDefaultMaxTokens(style);
            const temperature = config.temperature ?? 0.7;
            const includeMatchScore = config.includeMatchScore ?? true;
            const finalConfig = {
                style,
                maxTokens,
                temperature,
                includeMatchScore,
            };
            // Validate configuration
            if (finalConfig.style !== 'short' && finalConfig.style !== 'detailed') {
                throw new Error('Style must be "short" or "detailed"');
            }
            if (finalConfig.maxTokens < 100 || finalConfig.maxTokens > 2000) {
                throw new Error('maxTokens must be between 100 and 2000');
            }
            logger.info(`Summarizing candidate: ${candidate.name} (${candidate.role}) for query: "${query}" (style: ${finalConfig.style})`);
            // Build the prompt for LLM
            const prompt = this.buildSummarizationPrompt(query, candidate, finalConfig);
            // Call Groq API
            const startTime = Date.now();
            const llmResponse = await this.callGroqAPI(prompt, finalConfig.maxTokens, finalConfig.temperature);
            const apiDuration = Date.now() - startTime;
            logger.info(`Groq API call completed in ${apiDuration}ms`);
            // Parse response
            const summary = this.parseSummarizationResponse(llmResponse);
            // Calculate match score if requested
            let matchScore;
            if (finalConfig.includeMatchScore) {
                matchScore = this.calculateMatchScore(query, candidate, summary);
            }
            const result = {
                _id: candidate._id,
                name: candidate.name,
                role: candidate.role,
                company: candidate.company,
                query,
                summary,
                style: finalConfig.style,
                maxTokens: finalConfig.maxTokens,
                matchScore,
            };
            logger.info(`Summarization completed for ${candidate.name}. Summary length: ${summary.length} chars`);
            return result;
        }
        catch (error) {
            logger.error(`LLM summarization error: ${error}`);
            // Return fallback summary
            return this.fallbackSummarization(query, candidate, config);
        }
    }
    /**
     * Get default max tokens based on style
     */
    getDefaultMaxTokens(style) {
        switch (style) {
            case 'short':
                return 150; // 100-200 tokens
            case 'detailed':
                return 400; // 300-500 tokens
            default:
                return 200; // default
        }
    }
    /**
     * Build a prompt for LLM to summarize candidate fit
     */
    buildSummarizationPrompt(query, candidate, config) {
        const resumeText = candidate.text || candidate.snippet || 'No resume text provided';
        const lengthGuidance = config.style === 'short'
            ? '100-150 words, concise and focused'
            : '200-300 words, comprehensive and detailed';
        return `You are an expert recruiter. Analyze the following candidate resume against the job query and provide a fit summary.

Job Query: "${query}"

Candidate Profile:
- Name: ${candidate.name}
- Role: ${candidate.role}
- Company: ${candidate.company}
- Skills: ${candidate.skills || 'Not specified'}

Resume/Background:
${resumeText}

Please provide a ${config.style} summary (${lengthGuidance}) of how well this candidate fits the job query. Focus on:
1. Key matching qualifications
2. Relevant experience and skills
3. Any gaps or concerns
4. Overall fit assessment

Write in a professional recruiting tone. Be objective and specific.
Summary:`;
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
                        content: 'You are an expert recruiter and career analyst. Provide professional, objective candidate summaries.',
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
     * Parse LLM response to extract summary
     */
    parseSummarizationResponse(response) {
        try {
            // Check if response contains structured format
            if (response.includes('Summary:')) {
                const parts = response.split('Summary:');
                return parts[1].trim();
            }
            // Otherwise return the full response
            return response.trim();
        }
        catch (error) {
            logger.warn(`Failed to parse summarization response: ${error}`);
            return response.trim();
        }
    }
    /**
     * Calculate a match score based on query and summary
     */
    calculateMatchScore(query, candidate, summary) {
        try {
            // Simple keyword matching score (0-1)
            const queryKeywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 3);
            const candidateText = `${candidate.role} ${candidate.skills || ''} ${summary}`.toLowerCase();
            let matches = 0;
            queryKeywords.forEach(keyword => {
                if (candidateText.includes(keyword)) {
                    matches++;
                }
            });
            // Normalize to 0-1 range
            const score = queryKeywords.length > 0 ? matches / queryKeywords.length : 0.5;
            return Math.min(Math.max(score, 0), 1);
        }
        catch (error) {
            logger.warn(`Failed to calculate match score: ${error}`);
            return 0.5; // Default to neutral score
        }
    }
    /**
     * Fallback summarization when LLM fails
     */
    fallbackSummarization(query, candidate, config) {
        logger.info(`Using fallback summarization for ${candidate.name}`);
        // Create a basic summary from candidate info
        const summary = `${candidate.name} is a ${candidate.role} at ${candidate.company}. ` +
            `Skills include: ${candidate.skills || 'not specified'}. ` +
            `For the role of "${query}", this candidate`;
        return {
            _id: candidate._id,
            name: candidate.name,
            role: candidate.role,
            company: candidate.company,
            query,
            summary: summary + ' may be a potential match.',
            style: config.style ?? 'short',
            maxTokens: config.maxTokens ?? 150,
            matchScore: 0.5, // Neutral fallback score
        };
    }
    /**
     * Batch summarize multiple candidates
     */
    async summarizeCandidates(query, candidates, config = {}) {
        try {
            if (!candidates || candidates.length === 0) {
                throw new Error('Candidates array cannot be empty');
            }
            if (candidates.length > 10) {
                logger.warn(`Summarizing ${candidates.length} candidates - this may take a while`);
            }
            logger.info(`Batch summarizing ${candidates.length} candidates`);
            // Process candidates sequentially to avoid rate limiting
            const results = [];
            for (const candidate of candidates) {
                try {
                    const result = await this.summarizeCandidate(query, candidate, config);
                    results.push(result);
                    // Small delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                catch (error) {
                    logger.error(`Failed to summarize candidate ${candidate.name}: ${error}`);
                    // Continue with next candidate
                }
            }
            logger.info(`Batch summarization completed. ${results.length}/${candidates.length} successful`);
            return results;
        }
        catch (error) {
            logger.error(`Batch summarization error: ${error}`);
            throw error;
        }
    }
    /**
     * Get service status
     */
    getStatus() {
        return {
            configured: !!this.groqApiKey,
            model: this.groqModel,
            apiUrl: this.groqApiUrl,
            defaultMaxTokens: this.defaultMaxTokens,
        };
    }
}
exports.LLMSummarizationService = LLMSummarizationService;
