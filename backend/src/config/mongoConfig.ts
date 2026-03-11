import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

const logger = new Logger('MongoConfig');

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'db-testcases';
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    logger.info(`Connecting to database: ${dbName}`);
    
    await mongoose.connect(mongoUri, { dbName });
    logger.info(`Connected to MongoDB successfully (Database: ${dbName})`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error}`);
    process.exit(1);
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error(`MongoDB disconnection failed: ${error}`);
  }
};
