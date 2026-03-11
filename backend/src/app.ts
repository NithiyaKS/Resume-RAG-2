import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST - before any other imports!
const backendEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');

console.log('[DEBUG] Loading .env from backend:', backendEnv);
let result1 = dotenv.config({ path: backendEnv });
console.log('[DEBUG] Backend .env result:', result1.error ? result1.error.message : 'Loaded');

console.log('[DEBUG] Loading .env from root:', rootEnv);
let result2 = dotenv.config({ path: rootEnv });
console.log('[DEBUG] Root .env result:', result2.error ? result2.error.message : 'Loaded');

// NOW import everything else
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { connectMongoDB } from './config/mongoConfig';
import uploadRoutes from './routes/uploadRoutes';
import conversionRoutes from './routes/conversionRoutes';
import storeEmbedRoutes from './routes/storeEmbedRoutes';
import searchRoutes from './routes/searchRoutes';
import { Logger } from './utils/logger';

const app: Express = express();
const logger = new Logger('App');

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
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Increase request size limit to handle large batch uploads (6000+ records)
const payloadLimit = process.env.PAYLOAD_LIMIT || '50mb';
app.use(express.json({ limit: payloadLimit }));
app.use(express.urlencoded({ limit: payloadLimit, extended: true }));

logger.info(`Request size limit: ${payloadLimit}`);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/embed', uploadRoutes);
app.use('/api/convert', conversionRoutes);
app.use('/api/store-embed', storeEmbedRoutes);
app.use('/v1/search', searchRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Start server
const startServer = async () => {
  try {
    await connectMongoDB();
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
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();

export default app;
