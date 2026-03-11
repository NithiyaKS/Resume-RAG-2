"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonMapperService = void 0;
const logger_1 = require("../utils/logger");
const csvParserService_1 = require("./csvParserService");
const logger = new logger_1.Logger('JsonMapperService');
const csvParserService = new csvParserService_1.CsvParserService();
class JsonMapperService {
    mapCsvRowToResume(csvRow) {
        try {
            const skills = csvParserService.parseSkillsString(csvRow.skills);
            const mappedData = {
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
        }
        catch (error) {
            logger.error(`Error mapping CSV row: ${error}`);
            throw error;
        }
    }
    mapMultipleCsvRows(csvRows) {
        logger.info(`Mapping ${csvRows.length} CSV rows to resume format`);
        return csvRows.map((row, index) => {
            try {
                return this.mapCsvRowToResume(row);
            }
            catch (error) {
                logger.error(`Failed to map row ${index}: ${error}`);
                throw error;
            }
        });
    }
    generateEmbeddingText(resume) {
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
exports.JsonMapperService = JsonMapperService;
