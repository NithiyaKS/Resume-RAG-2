"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvParserService = void 0;
const csv_parser_1 = __importDefault(require("csv-parser"));
const errorHandler_1 = require("../utils/errorHandler");
const validators_1 = require("../utils/validators");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('CsvParserService');
class CsvParserService {
    async parseCsvStream(fileStream) {
        return new Promise((resolve, reject) => {
            const rows = [];
            const errors = [];
            fileStream
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                try {
                    (0, validators_1.validateCsvRow)(row);
                    rows.push(row);
                }
                catch (error) {
                    if (error instanceof errorHandler_1.ValidationError) {
                        errors.push(`Row ${rows.length + 1}: ${error.message}`);
                    }
                    else {
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
                reject(new errorHandler_1.ValidationError(`CSV parsing error: ${error.message}`));
            });
        });
    }
    parseSkillsString(skillsString) {
        if (!skillsString)
            return [];
        try {
            // Attempt to parse as JSON array
            const parsed = JSON.parse(skillsString);
            if (Array.isArray(parsed)) {
                return parsed.map(skill => skill.trim()).filter(skill => skill);
            }
        }
        catch {
            // If JSON parsing fails, split by comma
            return skillsString
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill);
        }
        return [];
    }
}
exports.CsvParserService = CsvParserService;
