import { Logger } from '../utils/logger';
import { CsvParserService } from './csvParserService';

interface MappedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  role: string;
  education: string;
  totalExperience: number;
  relevantExperience: number;
  skills: string[];
  text: string;
}

const logger = new Logger('JsonMapperService');
const csvParserService = new CsvParserService();

export class JsonMapperService {
  mapCsvRowToResume(csvRow: any): MappedResume {
    try {
      const skills = csvParserService.parseSkillsString(csvRow.skills);
      
      const mappedData: MappedResume = {
        name: csvRow.name?.trim() || '',
        email: csvRow.email?.trim() || '',
        phone: csvRow.phone?.trim() || '',
        location: csvRow.location?.trim() || '',
        company: csvRow.company?.trim() || '',
        role: csvRow.role?.trim() || '',
        education: csvRow.education?.trim() || '',
        totalExperience: parseFloat(csvRow.totalExperience) || 0,
        relevantExperience: parseFloat(csvRow.relevantExperience) || 0,
        skills: skills,
        text: csvRow.text?.trim() || '',
      };

      logger.debug(`Mapped resume: ${mappedData.name}`);
      return mappedData;
    } catch (error) {
      logger.error(`Error mapping CSV row: ${error}`);
      throw error;
    }
  }

  mapMultipleCsvRows(csvRows: any[]): MappedResume[] {
    logger.info(`Mapping ${csvRows.length} CSV rows to resume format`);
    return csvRows.map((row, index) => {
      try {
        return this.mapCsvRowToResume(row);
      } catch (error) {
        logger.error(`Failed to map row ${index}: ${error}`);
        throw error;
      }
    });
  }

  generateEmbeddingText(resume: MappedResume): string {
    const parts = [
      resume.name,
      resume.role,
      resume.company,
      resume.education,
      resume.skills.join(', '),
      `${resume.totalExperience} years experience`,
      resume.text,
    ];

    return parts.filter(part => part && part.length > 0).join(' | ');
  }
}
