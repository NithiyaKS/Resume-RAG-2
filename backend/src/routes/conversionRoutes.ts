import { Router } from 'express';
import multer from 'multer';
import { convertCsvToJson, convertAndValidate, previewCsvConversion } from '../controllers/conversionController';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Routes
// Convert CSV file upload to JSON
router.post('/convert-file', upload.single('file'), convertCsvToJson);

// Convert CSV rows from request body to JSON
router.post('/convert', convertAndValidate);

// Preview conversion of CSV file (first 5 records)
router.post('/preview', upload.single('file'), previewCsvConversion);

export default router;
