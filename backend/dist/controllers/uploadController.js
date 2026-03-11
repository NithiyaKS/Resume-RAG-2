"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResumeById = exports.getUploadStatus = exports.uploadCsv = void 0;
const resumeSchema_1 = require("../models/resumeSchema");
const csvParserService_1 = require("../services/csvParserService");
const jsonMapperService_1 = require("../services/jsonMapperService");
const errorHandler_1 = require("../utils/errorHandler");
const validators_1 = require("../utils/validators");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('UploadController');
const csvParserService = new csvParserService_1.CsvParserService();
const jsonMapperService = new jsonMapperService_1.JsonMapperService();
const uploadCsv = async (req, res) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.ValidationError('No file uploaded');
        }
        (0, validators_1.validateFileType)(req.file.mimetype);
        logger.info(`Processing file: ${req.file.originalname}`);
        // Parse CSV from buffer
        const fileStream = require('stream').Readable.from(req.file.buffer.toString());
        const csvRows = await csvParserService.parseCsvStream(fileStream);
        if (csvRows.length === 0) {
            throw new errorHandler_1.ValidationError('CSV file contains no valid rows');
        }
        // Map CSV rows to resume format
        const mappedResumes = jsonMapperService.mapMultipleCsvRows(csvRows);
        // Save to MongoDB
        const savedResumes = await resumeSchema_1.Resume.insertMany(mappedResumes);
        logger.info(`Successfully saved ${savedResumes.length} resumes to database`);
        res.status(200).json({
            status: 'success',
            message: 'CSV uploaded and processed successfully',
            recordsProcessed: csvRows.length,
            recordsSaved: savedResumes.length,
            data: {
                resumeIds: savedResumes.map(resume => resume._id),
            },
        });
    }
    catch (error) {
        logger.error(`Upload error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.uploadCsv = uploadCsv;
const getUploadStatus = async (req, res) => {
    try {
        const totalResumes = await resumeSchema_1.Resume.countDocuments();
        res.status(200).json({
            status: 'success',
            totalResumes: totalResumes,
            message: 'Resumes in database',
        });
    }
    catch (error) {
        logger.error(`Status check error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getUploadStatus = getUploadStatus;
const getResumeById = async (req, res) => {
    try {
        const { id } = req.params;
        const resume = await resumeSchema_1.Resume.findById(id);
        if (!resume) {
            throw new errorHandler_1.ValidationError('Resume not found');
        }
        res.status(200).json({
            status: 'success',
            data: resume,
        });
    }
    catch (error) {
        logger.error(`Get resume error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getResumeById = getResumeById;
