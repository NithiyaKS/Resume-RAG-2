"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewCsvConversion = exports.convertAndValidate = exports.convertCsvToJson = void 0;
const csvParserService_1 = require("../services/csvParserService");
const jsonMapperService_1 = require("../services/jsonMapperService");
const errorHandler_1 = require("../utils/errorHandler");
const validators_1 = require("../utils/validators");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('ConversionController');
const csvParserService = new csvParserService_1.CsvParserService();
const jsonMapperService = new jsonMapperService_1.JsonMapperService();
const convertCsvToJson = async (req, res) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.ValidationError('No file uploaded');
        }
        (0, validators_1.validateFileType)(req.file.mimetype);
        logger.info(`Converting file: ${req.file.originalname}`);
        // Parse CSV from buffer
        const fileStream = require('stream').Readable.from(req.file.buffer.toString());
        const csvRows = await csvParserService.parseCsvStream(fileStream);
        if (csvRows.length === 0) {
            throw new errorHandler_1.ValidationError('CSV file contains no valid rows');
        }
        // Map CSV rows to resume JSON format
        const jsonData = jsonMapperService.mapMultipleCsvRows(csvRows);
        logger.info(`Successfully converted ${jsonData.length} CSV rows to JSON`);
        res.status(200).json({
            status: 'success',
            message: 'CSV converted to JSON successfully',
            totalRows: csvRows.length,
            convertedRecords: jsonData.length,
            data: jsonData,
        });
    }
    catch (error) {
        logger.error(`Conversion error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.convertCsvToJson = convertCsvToJson;
const convertAndValidate = async (req, res) => {
    try {
        const { csvRows } = req.body;
        if (!Array.isArray(csvRows) || csvRows.length === 0) {
            throw new errorHandler_1.ValidationError('csvRows must be a non-empty array');
        }
        logger.info(`Converting ${csvRows.length} rows from request body`);
        const jsonData = jsonMapperService.mapMultipleCsvRows(csvRows);
        res.status(200).json({
            status: 'success',
            message: 'CSV data converted to JSON successfully',
            totalRows: csvRows.length,
            convertedRecords: jsonData.length,
            data: jsonData,
        });
    }
    catch (error) {
        logger.error(`Conversion error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.convertAndValidate = convertAndValidate;
const previewCsvConversion = async (req, res) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.ValidationError('No file uploaded');
        }
        (0, validators_1.validateFileType)(req.file.mimetype);
        logger.info(`Preview conversion for file: ${req.file.originalname}`);
        // Parse CSV from buffer
        const fileStream = require('stream').Readable.from(req.file.buffer.toString());
        const csvRows = await csvParserService.parseCsvStream(fileStream);
        if (csvRows.length === 0) {
            throw new errorHandler_1.ValidationError('CSV file contains no valid rows');
        }
        // Show only first 5 records for preview
        const sampleRows = csvRows.slice(0, 5);
        const jsonPreview = jsonMapperService.mapMultipleCsvRows(sampleRows);
        logger.info(`Preview generated: ${jsonPreview.length} sample records`);
        res.status(200).json({
            status: 'success',
            message: 'CSV preview conversion completed',
            totalRowsInFile: csvRows.length,
            previewRecords: jsonPreview.length,
            preview: jsonPreview,
            message_note: 'Showing first 5 records as preview',
        });
    }
    catch (error) {
        logger.error(`Preview conversion error: ${error}`);
        (0, errorHandler_1.handleError)(error, res);
    }
};
exports.previewCsvConversion = previewCsvConversion;
