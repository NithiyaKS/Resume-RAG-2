"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.NotFoundError = exports.ValidationError = exports.handleError = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const handleError = (error, res) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            status: 'error',
            statusCode: error.statusCode,
            message: error.message,
        });
    }
    else {
        res.status(500).json({
            status: 'error',
            statusCode: 500,
            message: 'Internal server error',
            details: error.message,
        });
    }
};
exports.handleError = handleError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, message);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message) {
        super(404, message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(500, message);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
exports.InternalServerError = InternalServerError;
