"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileType = exports.validateCsvRow = exports.validatePhoneNumber = exports.validateEmail = void 0;
const errorHandler_1 = require("./errorHandler");
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
};
exports.validatePhoneNumber = validatePhoneNumber;
const validateCsvRow = (row) => {
    const requiredFields = ['name', 'email', 'phone', 'location'];
    for (const field of requiredFields) {
        if (!row[field] || row[field].toString().trim() === '') {
            throw new errorHandler_1.ValidationError(`Missing required field: ${field}`);
        }
    }
    if (!(0, exports.validateEmail)(row.email)) {
        throw new errorHandler_1.ValidationError(`Invalid email format: ${row.email}`);
    }
    if (!(0, exports.validatePhoneNumber)(row.phone)) {
        throw new errorHandler_1.ValidationError(`Invalid phone format: ${row.phone}`);
    }
};
exports.validateCsvRow = validateCsvRow;
const validateFileType = (mimetype) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(mimetype)) {
        throw new errorHandler_1.ValidationError('File must be a CSV file');
    }
};
exports.validateFileType = validateFileType;
