"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const conversionController_1 = require("../controllers/conversionController");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
});
// Routes
// Convert CSV file upload to JSON
router.post('/convert-file', upload.single('file'), conversionController_1.convertCsvToJson);
// Convert CSV rows from request body to JSON
router.post('/convert', conversionController_1.convertAndValidate);
// Preview conversion of CSV file (first 5 records)
router.post('/preview', upload.single('file'), conversionController_1.previewCsvConversion);
exports.default = router;
