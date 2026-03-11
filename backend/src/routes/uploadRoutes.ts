import { Router } from 'express';
import multer from 'multer';
import { uploadCsv, getUploadStatus, getResumeById } from '../controllers/uploadController';

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
router.post('/upload-csv', upload.single('file'), uploadCsv);
router.get('/status', getUploadStatus);
router.get('/:id', getResumeById);

export default router;
