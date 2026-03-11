"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables FIRST - before any other imports!
const backendEnv = path_1.default.resolve(__dirname, '../.env');
const rootEnv = path_1.default.resolve(__dirname, '../../.env');
console.log('[DEBUG] Loading .env from backend:', backendEnv);
let result1 = dotenv_1.default.config({ path: backendEnv });
console.log('[DEBUG] Backend .env result:', result1.error ? result1.error.message : 'Loaded');
console.log('[DEBUG] Loading .env from root:', rootEnv);
let result2 = dotenv_1.default.config({ path: rootEnv });
console.log('[DEBUG] Root .env result:', result2.error ? result2.error.message : 'Loaded');
// NOW import everything else
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoConfig_1 = require("./config/mongoConfig");
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const conversionRoutes_1 = __importDefault(require("./routes/conversionRoutes"));
const storeEmbedRoutes_1 = __importDefault(require("./routes/storeEmbedRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const logger = new logger_1.Logger('App');
const PORT = process.env.PORT || 5000;
// Middleware - CORS must be first!
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
};
logger.info(`CORS enabled for origin: ${corsOptions.origin}`);
app.use((0, cors_1.default)(corsOptions));
// Handle OPTIONS requests explicitly
app.options('*', (0, cors_1.default)(corsOptions));
// Increase request size limit to handle large batch uploads (6000+ records)
const payloadLimit = process.env.PAYLOAD_LIMIT || '50mb';
app.use(express_1.default.json({ limit: payloadLimit }));
app.use(express_1.default.urlencoded({ limit: payloadLimit, extended: true }));
logger.info(`Request size limit: ${payloadLimit}`);
// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/embed', uploadRoutes_1.default);
app.use('/api/convert', conversionRoutes_1.default);
app.use('/api/store-embed', storeEmbedRoutes_1.default);
app.use('/v1/search', searchRoutes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});
// Start server
const startServer = async () => {
    try {
        await (0, mongoConfig_1.connectMongoDB)();
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`Convert CSV API: POST http://localhost:${PORT}/api/convert/convert-file`);
            logger.info(`Convert Body API: POST http://localhost:${PORT}/api/convert/convert`);
            logger.info(`Preview API: POST http://localhost:${PORT}/api/convert/preview`);
            logger.info(`Upload CSV API: POST http://localhost:${PORT}/api/embed/upload-csv`);
            logger.info(`Store & Embed API: POST http://localhost:${PORT}/api/store-embed/store-and-embed`);
            logger.info(`Embedding Status API: GET http://localhost:${PORT}/api/store-embed/status`);
            logger.info('--- BM25 Full-Text Search APIs ---');
            logger.info(`BM25 Search API: POST http://localhost:${PORT}/v1/search/bm25`);
            logger.info(`Advanced BM25 Search API: POST http://localhost:${PORT}/v1/search/bm25/advanced`);
            logger.info(`Search Stats API: GET http://localhost:${PORT}/v1/search/stats`);
            logger.info(`Initialize Search Indexes: POST http://localhost:${PORT}/v1/search/init`);
            logger.info('--- Vector Semantic Search APIs ---');
            logger.info(`Vector Search API: POST http://localhost:${PORT}/v1/search/vector`);
            logger.info(`Advanced Vector Search API: POST http://localhost:${PORT}/v1/search/vector/advanced`);
            logger.info(`Vector Search Stats API: GET http://localhost:${PORT}/v1/search/vector/stats`);
            logger.info('--- Hybrid Search APIs (BM25 + Vector) ---');
            logger.info(`Hybrid Search API: POST http://localhost:${PORT}/v1/search/hybrid`);
            logger.info(`Advanced Hybrid Search API: POST http://localhost:${PORT}/v1/search/hybrid/advanced`);
            logger.info(`Hybrid Search Stats API: GET http://localhost:${PORT}/v1/search/hybrid/stats`);
            logger.info(`Recommended Weights API: GET http://localhost:${PORT}/v1/search/hybrid/weights/:intent`);
            logger.info('--- LLM Re-Ranking APIs ---');
            logger.info(`LLM Re-Rank API: POST http://localhost:${PORT}/v1/search/rerank`);
            logger.info(`LLM Re-Rank Status API: GET http://localhost:${PORT}/v1/search/rerank/status`);
            logger.info('--- LLM Summarization APIs ---');
            logger.info(`LLM Summarize API: POST http://localhost:${PORT}/v1/search/summarize`);
            logger.info(`LLM Summarization Status API: GET http://localhost:${PORT}/v1/search/summarize/status`);
        });
    }
    catch (error) {
        logger.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
};
startServer();
exports.default = app;
