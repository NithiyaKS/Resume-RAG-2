"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectMongoDB = exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('MongoConfig');
const connectMongoDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        const dbName = process.env.DB_NAME || 'db-testcases';
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        logger.info(`Connecting to database: ${dbName}`);
        await mongoose_1.default.connect(mongoUri, { dbName });
        logger.info(`Connected to MongoDB successfully (Database: ${dbName})`);
    }
    catch (error) {
        logger.error(`MongoDB connection failed: ${error}`);
        process.exit(1);
    }
};
exports.connectMongoDB = connectMongoDB;
const disconnectMongoDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        logger.info('Disconnected from MongoDB');
    }
    catch (error) {
        logger.error(`MongoDB disconnection failed: ${error}`);
    }
};
exports.disconnectMongoDB = disconnectMongoDB;
