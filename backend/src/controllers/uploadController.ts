import { Request, Response } from 'express';
import { Resume } from '../models/resumeSchema';
import { CsvParserService } from '../services/csvParserService';
import { JsonMapperService } from '../services/jsonMapperService';
import { handleError, ValidationError } from '../utils/errorHandler';
import { validateFileType } from '../utils/validators';
import { Logger } from '../utils/logger';

const logger = new Logger('UploadController');
const csvParserService = new CsvParserService();
const jsonMapperService = new JsonMapperService();

export const uploadCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    validateFileType(req.file.mimetype);

    logger.info(`Processing file: ${req.file.originalname}`);

    // Parse CSV from buffer
    const fileStream = require('stream').Readable.from(req.file.buffer.toString());
    const csvRows = await csvParserService.parseCsvStream(fileStream);

    if (csvRows.length === 0) {
      throw new ValidationError('CSV file contains no valid rows');
    }

    // Map CSV rows to resume format
    const mappedResumes = jsonMapperService.mapMultipleCsvRows(csvRows);

    // Save to MongoDB
    const savedResumes = await Resume.insertMany(mappedResumes);

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
  } catch (error) {
    logger.error(`Upload error: ${error}`);
    handleError(error, res);
  }
};

export const getUploadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalResumes = await Resume.countDocuments();
    
    res.status(200).json({
      status: 'success',
      totalResumes: totalResumes,
      message: 'Resumes in database',
    });
  } catch (error) {
    logger.error(`Status check error: ${error}`);
    handleError(error, res);
  }
};

export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      throw new ValidationError('Resume not found');
    }

    res.status(200).json({
      status: 'success',
      data: resume,
    });
  } catch (error) {
    logger.error(`Get resume error: ${error}`);
    handleError(error, res);
  }
};
