import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../controllers/upload.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));
router.post('/upload', upload.single('image'), uploadSingle);
router.post('/upload/multiple', upload.array('images', 10), uploadMultiple);

export default router;
