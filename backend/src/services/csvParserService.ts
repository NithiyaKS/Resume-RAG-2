import { Readable } from 'stream';
import csv from 'csv-parser';
import { ValidationError } from '../utils/errorHandler';
import { validateCsvRow } from '../utils/validators';
import { Logger } from '../utils/logger';

interface CsvRow {
  [key: string]: string;
}

const logger = new Logger('CsvParserService');

export class CsvParserService {
  async parseCsvStream(fileStream: Readable): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      const errors: string[] = [];

      fileStream
        .pipe(csv())
        .on('data', (row: CsvRow) => {
          try {
            validateCsvRow(row);
            rows.push(row);
          } catch (error) {
            if (error instanceof ValidationError) {
              errors.push(`Row ${rows.length + 1}: ${error.message}`);
            } else {
              errors.push(`Row ${rows.length + 1}: Unknown error`);
            }
          }
        })
        .on('end', () => {
          if (errors.length > 0) {
            logger.warn(`CSV parsing completed with ${errors.length} validation errors`);
          }
          logger.info(`CSV parsing completed: ${rows.length} valid rows`);
          resolve(rows);
        })
        .on('error', (error) => {
          logger.error(`CSV parsing error: ${error.message}`);
          reject(new ValidationError(`CSV parsing error: ${error.message}`));
        });
    });
  }

  parseSkillsString(skillsString: string): string[] {
    if (!skillsString) return [];
    
    try {
      // Attempt to parse as JSON array
      const parsed = JSON.parse(skillsString);
      if (Array.isArray(parsed)) {
        return parsed.map(skill => skill.trim()).filter(skill => skill);
      }
    } catch {
      // If JSON parsing fails, split by comma
      return skillsString
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);
    }
    
    return [];
  }
}
