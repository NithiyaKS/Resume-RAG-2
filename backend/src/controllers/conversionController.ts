import { Request, Response } from 'express';
import { CsvParserService } from '../services/csvParserService';
import { JsonMapperService } from '../services/jsonMapperService';
import { handleError, ValidationError } from '../utils/errorHandler';
import { validateFileType } from '../utils/validators';
import { Logger } from '../utils/logger';

const logger = new Logger('ConversionController');
const csvParserService = new CsvParserService();
const jsonMapperService = new JsonMapperService();

export const convertCsvToJson = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    validateFileType(req.file.mimetype);

    logger.info(`Converting file: ${req.file.originalname}`);

    // Parse CSV from buffer
    const fileStream = require('stream').Readable.from(req.file.buffer.toString());
    const csvRows = await csvParserService.parseCsvStream(fileStream);

    if (csvRows.length === 0) {
      throw new ValidationError('CSV file contains no valid rows');
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
  } catch (error) {
    logger.error(`Conversion error: ${error}`);
    handleError(error, res);
  }
};

export const convertAndValidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { csvRows } = req.body;

    if (!Array.isArray(csvRows) || csvRows.length === 0) {
      throw new ValidationError('csvRows must be a non-empty array');
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
  } catch (error) {
    logger.error(`Conversion error: ${error}`);
    handleError(error, res);
  }
};

export const previewCsvConversion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    validateFileType(req.file.mimetype);

    logger.info(`Preview conversion for file: ${req.file.originalname}`);

    // Parse CSV from buffer
    const fileStream = require('stream').Readable.from(req.file.buffer.toString());
    const csvRows = await csvParserService.parseCsvStream(fileStream);

    if (csvRows.length === 0) {
      throw new ValidationError('CSV file contains no valid rows');
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
  } catch (error) {
    logger.error(`Preview conversion error: ${error}`);
    handleError(error, res);
  }
};
